import { broadcastTreasuryFundingIntent } from 'src/services/treasury-broadcast';

import {
  reconcileTreasuryBroadcast,
  reconcileTreasuryBroadcastWithRetry,
} from 'src/services/treasury-broadcast-reconciliation';

import {
  getVoucherRecordById,
  updateVoucherFundingBroadcast,
  updateVoucherFundingReconciliation,
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
  preBroadcastReconciliation: TreasuryBroadcastReconciliationResult;

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
  const initialRecord = await dependencies.getVoucherRecordById(voucherId);

  if (!initialRecord) {
    throw new Error('Voucher record could not be found for funding.');
  }

  const fundingIntent = requireFundingIntent(initialRecord);

  const txid = fundingIntent.txid?.trim().toLowerCase();

  if (!txid) {
    throw new Error('Voucher funding transaction ID is missing.');
  }

  /**
   * ================================================================
   * PRE-BROADCAST RECONCILIATION
   * ================================================================
   *
   * This is the crash/retry safety check.
   *
   * Before another broadcast request is made, look for the exact transaction
   * that was already signed and persisted.
   *
   * This check is deliberately a single quick read. If the transaction is
   * already visible, there is no reason to broadcast it again.
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

  /**
   * If the exact transaction is already observed, there is nothing to
   * broadcast.
   */
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
   * Only fundingIntent.rawTransactionHex may be submitted.
   *
   * No new transaction is constructed here.
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
   *
   * Both:
   *
   * - broadcasted
   * - uncertain
   *
   * are reconciled using the SAME deterministic txid.
   *
   * Unlike the pre-broadcast check, this stage uses a short retry/backoff
   * window because transaction propagation and indexing are not instantaneous.
   *
   * These retries are READ-ONLY.
   *
   * Nothing is rebuilt.
   * Nothing is re-signed.
   * Nothing is re-broadcast.
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

  /**
   * Zero-confirmation success.
   *
   * Either mempool or confirmed evidence is sufficient to establish that the
   * exact persisted Topup funding transaction is visible on the BCH network.
   */
  if (hasPositiveNetworkEvidence(currentRecord)) {
    return {
      outcome: 'funded',

      record: currentRecord,

      preBroadcastReconciliation,

      broadcastResult,

      postBroadcastReconciliation,
    };
  }

  /**
   * The broadcast server returned our exact expected txid, but the retry
   * window still did not obtain independent positive network evidence.
   *
   * Do not reveal the customer WIF in the production path yet.
   *
   * The persisted transaction can be checked again later using the read-only
   * recovery operation below.
   */
  if (broadcastResult.status === 'broadcasted') {
    return {
      outcome: 'broadcasted_pending_detection',

      record: currentRecord,

      preBroadcastReconciliation,

      broadcastResult,

      postBroadcastReconciliation,
    };
  }

  /**
   * A request was attempted, its result could not be proven, and the exact
   * transaction is still not visible.
   *
   * This remains uncertain.
   *
   * Never create a replacement transaction from this state.
   */
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
