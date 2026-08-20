import { broadcastTreasuryFundingIntent } from 'src/services/treasury-broadcast';

import { reconcileTreasuryBroadcast } from 'src/services/treasury-broadcast-reconciliation';

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

  reconcileTreasuryBroadcast: (
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
   * CRASH/RETRY RECONCILIATION
   *
   * Always look for the exact persisted transaction before sending anything.
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
   * Broadcast only the exact funding intent that was already persisted.
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
   * Both broadcasted and uncertain results are reconciled using the exact
   * already-persisted txid.
   */
  onPhaseChange?.('post_broadcast_reconciliation');

  const postBroadcastReconciliation =
    await dependencies.reconcileTreasuryBroadcast(txid);

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
