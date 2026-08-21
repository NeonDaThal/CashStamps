import { broadcastTreasuryFundingIntent } from 'src/services/treasury-broadcast';

import {
  reconcileTreasuryBroadcast,
  reconcileTreasuryBroadcastWithRetry,
} from 'src/services/treasury-broadcast-reconciliation';

import {
  getTopupFundingState,
  type TopupFundingStateResult,
} from 'src/services/topup-funding-state';

import {
  getVoucherRecordById,
  updateVoucherFundingBroadcast,
  updateVoucherFundingReconciliation,
  updateVoucherFundingState,
} from 'src/services/voucher-store';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import type { VoucherFundingIntent, VoucherRecord } from 'src/types/voucher';

export type TopupFundingLifecycleOutcome =
  | 'funded'
  | 'broadcasted_pending_detection'
  | 'uncertain'
  | 'definitely_not_broadcast'
  | 'blocked';

/**
 * Real stages within the durable funding lifecycle.
 *
 * UI callers may observe these phases to display genuine progress without
 * introducing fake timers or simulated state changes.
 */
export type TopupFundingLifecyclePhase =
  | 'pre_broadcast_reconciliation'
  | 'broadcast'
  | 'post_broadcast_reconciliation';

export interface TopupFundingLifecycleResult {
  outcome: TopupFundingLifecycleOutcome;

  record: VoucherRecord;

  /**
   * First reconciliation check performed before any new broadcast attempt.
   */
  preBroadcastReconciliation?: TreasuryBroadcastReconciliationResult;

  broadcastResult?: TreasuryBroadcastResult;

  /**
   * Reconciliation performed after an attempted broadcast.
   */
  postBroadcastReconciliation?: TreasuryBroadcastReconciliationResult;
}

/**
 * Dependency interface primarily exists so the state machine can be tested
 * without IndexedDB or live BCH network access.
 */
export interface TopupFundingLifecycleDependencies {
  getVoucherRecordById: (id: string) => Promise<VoucherRecord | undefined>;

  updateVoucherFundingState: (id: string) => Promise<VoucherRecord | undefined>;

  /**
   * Single read-only reconciliation.
   *
   * Used before broadcasting so retries/resumes first check whether the exact
   * already-persisted transaction is visible.
   */
  reconcileTreasuryBroadcast: (
    txid: string
  ) => Promise<TreasuryBroadcastReconciliationResult>;

  /**
   * Short read-only retry window.
   *
   * Used after broadcast, and by explicit recovery, to tolerate ordinary BCH
   * mempool propagation/indexing delay.
   */
  reconcileTreasuryBroadcastWithRetry: (
    txid: string
  ) => Promise<TreasuryBroadcastReconciliationResult>;

  updateVoucherFundingReconciliation: (
    id: string,
    reconciliation: TreasuryBroadcastReconciliationResult
  ) => Promise<VoucherRecord | undefined>;

  broadcastTreasuryFundingIntent: (
    fundingIntent: VoucherFundingIntent
  ) => Promise<TreasuryBroadcastResult>;

  updateVoucherFundingBroadcast: (
    id: string,
    result: TreasuryBroadcastResult
  ) => Promise<VoucherRecord | undefined>;
}

const defaultDependencies: TopupFundingLifecycleDependencies = {
  getVoucherRecordById,
  updateVoucherFundingState,
  reconcileTreasuryBroadcast,
  reconcileTreasuryBroadcastWithRetry,
  updateVoucherFundingReconciliation,
  broadcastTreasuryFundingIntent,
  updateVoucherFundingBroadcast,
};

function requireFundingIntent(record: VoucherRecord): VoucherFundingIntent {
  if (!record.fundingIntent) {
    throw new Error('Voucher does not contain a durable funding intent.');
  }

  const txid = record.fundingIntent.txid?.trim().toLowerCase();

  if (!txid || !/^[0-9a-f]{64}$/.test(txid)) {
    throw new Error(
      'Voucher durable funding intent does not contain a valid transaction ID.'
    );
  }

  if (!record.fundingIntent.rawTransactionHex.trim()) {
    throw new Error(
      'Voucher durable funding intent does not contain signed transaction hex.'
    );
  }

  return record.fundingIntent;
}

function hasPositiveNetworkEvidence(record: VoucherRecord): boolean {
  return (
    record.fundingReconciliation?.status === 'mempool' ||
    record.fundingReconciliation?.status === 'confirmed'
  );
}

function requireUpdatedVoucher(
  record: VoucherRecord | undefined,
  operation: string
): VoucherRecord {
  if (!record) {
    throw new Error(`Voucher record disappeared while ${operation}.`);
  }

  return record;
}

function requireFundingLifecycleState(
  record: VoucherRecord
): TopupFundingStateResult {
  const state = getTopupFundingState(record);

  if (state.state === 'terminal_error') {
    throw new Error(
      record.errorMessage ??
        'The persisted Topup funding state is invalid and cannot continue automatically.'
    );
  }

  if (state.state === 'not_applicable') {
    throw new Error('Voucher is not in the durable Topup funding lifecycle.');
  }

  return state;
}

/**
 * Advance one already-persisted Topup through its funding lifecycle.
 *
 * IMPORTANT SAFETY RULES:
 *
 * - this service never creates a new transaction
 * - this service never signs a new transaction
 * - this service only broadcasts fundingIntent.rawTransactionHex
 * - transaction identity is always fundingIntent.txid
 * - reconciliation is attempted BEFORE another broadcast
 * - uncertain results are reconciled using the same txid
 *
 * The optional phase callback is informational only. It cannot alter the
 * financial state machine.
 */
export async function advanceTopupFundingLifecycle(
  voucherId: string,
  dependencies: TopupFundingLifecycleDependencies = defaultDependencies,
  onPhaseChange?: (phase: TopupFundingLifecyclePhase) => void
): Promise<TopupFundingLifecycleResult> {
  const loadedRecord = await dependencies.getVoucherRecordById(voucherId);

  if (!loadedRecord) {
    throw new Error('Voucher record could not be found for funding.');
  }

  /**
   * First make the persisted status/error semantics agree with the B5.7
   * classifier.
   *
   * This is local storage only — no BCH network operation.
   */
  const initialRecord = requireUpdatedVoucher(
    await dependencies.updateVoucherFundingState(loadedRecord.id),
    'synchronising the persisted funding state'
  );

  const initialState = requireFundingLifecycleState(initialRecord);

  const fundingIntent = requireFundingIntent(initialRecord);

  const txid = fundingIntent.txid?.trim().toLowerCase();

  if (!txid) {
    throw new Error('Voucher funding transaction ID is missing.');
  }

  /**
   * ================================================================
   * ALREADY FUNDED
   * ================================================================
   *
   * If persisted positive evidence already proves the exact transaction,
   * there is nothing further to submit or reconcile.
   */
  if (initialState.state === 'funded') {
    return {
      outcome: 'funded',

      record: initialRecord,
    };
  }

  /**
   * ================================================================
   * VERIFICATION-ONLY RECOVERY
   * ================================================================
   *
   * A previous request was either:
   *
   * - accepted by the broadcast server; or
   * - attempted with an uncertain outcome.
   *
   * NEVER submit again from this state.
   *
   * Only check the exact deterministic txid using the read-only,
   * propagation-tolerant reconciliation path.
   */
  if (initialState.state === 'verification_pending') {
    onPhaseChange?.('post_broadcast_reconciliation');

    const postBroadcastReconciliation =
      await dependencies.reconcileTreasuryBroadcastWithRetry(txid);

    const currentRecord = requireUpdatedVoucher(
      await dependencies.updateVoucherFundingReconciliation(
        initialRecord.id,
        postBroadcastReconciliation
      ),
      'saving verification-only funding reconciliation'
    );

    /**
     * This is verification-only recovery of a previously persisted broadcast.
     *
     * No new broadcast occurs here, so do not manufacture a
     * TreasuryBroadcastResult from the historical VoucherFundingBroadcast.
     */
    if (hasPositiveNetworkEvidence(currentRecord)) {
      return {
        outcome: 'funded',

        record: currentRecord,

        postBroadcastReconciliation,
      };
    }

    if (currentRecord.fundingBroadcast?.status === 'broadcasted') {
      return {
        outcome: 'broadcasted_pending_detection',

        record: currentRecord,

        postBroadcastReconciliation,
      };
    }

    return {
      outcome: 'uncertain',

      record: currentRecord,

      postBroadcastReconciliation,
    };
  }

  /**
   * From this point onward the classifier has proved that submitting the
   * SAME persisted transaction is permitted.
   */
  if (initialState.state !== 'ready_to_submit') {
    throw new Error('Voucher funding state cannot be resumed automatically.');
  }

  /**
   * ================================================================
   * PRE-BROADCAST RECONCILIATION
   * ================================================================
   *
   * Even when the persisted evidence says submission is safe, first look for
   * the exact transaction.
   *
   * This handles:
   *
   * - crash after durable save but before recorded broadcast result;
   * - stale local persistence;
   * - prior definitely-not-broadcast retries;
   *
   * without ever constructing another transaction.
   */
  onPhaseChange?.('pre_broadcast_reconciliation');

  const preBroadcastReconciliation =
    await dependencies.reconcileTreasuryBroadcast(txid);

  let currentRecord = requireUpdatedVoucher(
    await dependencies.updateVoucherFundingReconciliation(
      initialRecord.id,
      preBroadcastReconciliation
    ),
    'saving pre-broadcast reconciliation'
  );

  if (hasPositiveNetworkEvidence(currentRecord)) {
    return {
      outcome: 'funded',

      record: currentRecord,

      preBroadcastReconciliation,
    };
  }

  /**
   * ================================================================
   * BROADCAST EXACT PERSISTED TRANSACTION
   * ================================================================
   *
   * No new transaction is created or signed here.
   */
  onPhaseChange?.('broadcast');

  const broadcastResult = await dependencies.broadcastTreasuryFundingIntent(
    fundingIntent
  );

  currentRecord = requireUpdatedVoucher(
    await dependencies.updateVoucherFundingBroadcast(
      initialRecord.id,
      broadcastResult
    ),
    'saving the funding broadcast result'
  );

  if (broadcastResult.status === 'blocked') {
    return {
      outcome: 'blocked',

      record: currentRecord,

      preBroadcastReconciliation,

      broadcastResult,
    };
  }

  if (broadcastResult.status === 'definitely_not_broadcast') {
    return {
      outcome: 'definitely_not_broadcast',

      record: currentRecord,

      preBroadcastReconciliation,

      broadcastResult,
    };
  }

  /**
   * ================================================================
   * POST-BROADCAST RECONCILIATION
   * ================================================================
   */
  onPhaseChange?.('post_broadcast_reconciliation');

  const postBroadcastReconciliation =
    await dependencies.reconcileTreasuryBroadcastWithRetry(txid);

  currentRecord = requireUpdatedVoucher(
    await dependencies.updateVoucherFundingReconciliation(
      initialRecord.id,
      postBroadcastReconciliation
    ),
    'saving post-broadcast reconciliation'
  );

  if (hasPositiveNetworkEvidence(currentRecord)) {
    return {
      outcome: 'funded',

      record: currentRecord,

      preBroadcastReconciliation,

      broadcastResult,

      postBroadcastReconciliation,
    };
  }

  if (broadcastResult.status === 'broadcasted') {
    return {
      outcome: 'broadcasted_pending_detection',

      record: currentRecord,

      preBroadcastReconciliation,

      broadcastResult,

      postBroadcastReconciliation,
    };
  }

  return {
    outcome: 'uncertain',

    record: currentRecord,

    preBroadcastReconciliation,

    broadcastResult,

    postBroadcastReconciliation,
  };
}

export interface ExistingTopupFundingReconciliationResult {
  record: VoucherRecord;

  reconciliation: TreasuryBroadcastReconciliationResult;
}

/**
 * READ-ONLY recovery operation for an existing persisted Topup.
 *
 * This is intended for rare cases where:
 *
 * - broadcast succeeded but immediate verification did not;
 * - the app closed during funding;
 * - the network was temporarily unavailable;
 * - the merchant later needs to continue checking the SAME transaction.
 *
 * IMPORTANT:
 *
 * This function never broadcasts.
 * This function never signs.
 * This function never creates a replacement transaction.
 *
 * It only asks:
 *
 * "Can the BCH network now see the exact deterministic txid we already
 * persisted?"
 */
export async function reconcileExistingTopupFunding(
  voucherId: string,
  dependencies: TopupFundingLifecycleDependencies = defaultDependencies
): Promise<ExistingTopupFundingReconciliationResult> {
  const existingRecord = await dependencies.getVoucherRecordById(voucherId);

  if (!existingRecord) {
    throw new Error(
      'Voucher record could not be found for funding reconciliation.'
    );
  }

  const fundingIntent = requireFundingIntent(existingRecord);

  const txid = fundingIntent.txid?.trim().toLowerCase();

  if (!txid) {
    throw new Error('Voucher funding transaction ID is missing.');
  }

  /**
   * Use the same short propagation-tolerant retry window.
   *
   * This operation remains completely read-only with respect to the BCH
   * network.
   */
  const reconciliation = await dependencies.reconcileTreasuryBroadcastWithRetry(
    txid
  );

  const updatedRecord = requireUpdatedVoucher(
    await dependencies.updateVoucherFundingReconciliation(
      existingRecord.id,
      reconciliation
    ),
    'saving existing Topup funding reconciliation'
  );

  return {
    record: updatedRecord,

    reconciliation,
  };
}
