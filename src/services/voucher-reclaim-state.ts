import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { VoucherRecord } from 'src/types/voucher';

import {
  canPrepareVoucherReclaim,
  isReplacementFundingVerifiedForReclaim,
} from 'src/services/voucher-reclaim';

export type VoucherReclaimRecoveryAction =
  | 'none'
  | 'prepare_and_resume'
  | 'resume_same_transaction'
  | 'check_same_transaction';

function normaliseTransactionId(value: string): string {
  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    throw new Error(
      'Voucher reclaim requires a valid deterministic transaction ID.'
    );
  }

  return normalised;
}

function isPositiveReconciliation(
  reconciliation: TreasuryBroadcastReconciliationResult | undefined
): boolean {
  return (
    reconciliation?.status === 'mempool' ||
    reconciliation?.status === 'confirmed'
  );
}

function reconciliationStrength(
  reconciliation: TreasuryBroadcastReconciliationResult
): number {
  if (reconciliation.status === 'confirmed') {
    return 4;
  }

  if (reconciliation.status === 'mempool') {
    return 3;
  }

  if (reconciliation.status === 'unknown') {
    return 2;
  }

  return 1;
}

/**
 * Decide what History may safely offer for one reclaim operation.
 *
 * A persisted reclaim transaction is never replaced.
 */
export function getVoucherReclaimRecoveryAction(
  original: VoucherRecord,
  replacement?: VoucherRecord
): VoucherReclaimRecoveryAction {
  const recovery = original.printedRecovery;

  if (
    !recovery ||
    recovery.resolution !== 'replacement_required' ||
    recovery.reclaimStatus === 'reclaimed'
  ) {
    return 'none';
  }

  if (recovery.reclaimIntent) {
    if (isPositiveReconciliation(recovery.reclaimReconciliation)) {
      return 'none';
    }

    const broadcastStatus = recovery.reclaimBroadcast?.status;

    /**
     * Once submission may have happened, reconciliation only.
     */
    if (broadcastStatus === 'broadcasted' || broadcastStatus === 'uncertain') {
      return 'check_same_transaction';
    }

    /**
     * Before any new submission attempt, ensure the linked replacement is
     * still positively funded.
     */
    if (!replacement || !isReplacementFundingVerifiedForReclaim(replacement)) {
      return 'none';
    }

    return 'resume_same_transaction';
  }

  if (replacement && canPrepareVoucherReclaim(original, replacement)) {
    return 'prepare_and_resume';
  }

  return 'none';
}

/**
 * Persist one broadcast result for the exact reclaim intent.
 */
export function applyVoucherReclaimBroadcast(
  original: VoucherRecord,
  result: TreasuryBroadcastResult
): VoucherRecord {
  const recovery = original.printedRecovery;

  const intent = recovery?.reclaimIntent;

  if (!recovery || !intent) {
    throw new Error(
      'Voucher reclaim broadcast cannot be recorded without a durable reclaim intent.'
    );
  }

  if (recovery.reclaimStatus === 'reclaimed') {
    throw new Error('Voucher reclaim has already completed.');
  }

  const expectedTxid = normaliseTransactionId(intent.txid);

  if (result.txid) {
    const resultTxid = normaliseTransactionId(result.txid);

    if (resultTxid !== expectedTxid) {
      throw new Error(
        'Voucher reclaim broadcast result belongs to a different transaction.'
      );
    }
  }

  return {
    ...original,

    printedRecovery: {
      ...recovery,

      reclaimStatus:
        result.status === 'uncertain' ? 'uncertain' : 'in_progress',

      reclaimBroadcast: result,
    },
  };
}

/**
 * Persist read-only evidence for the exact reclaim txid.
 *
 * Positive evidence is monotonic:
 *
 * confirmed > mempool > unknown > unavailable
 */
export function applyVoucherReclaimReconciliation(
  original: VoucherRecord,
  reconciliation: TreasuryBroadcastReconciliationResult
): VoucherRecord {
  const recovery = original.printedRecovery;

  const intent = recovery?.reclaimIntent;

  if (!recovery || !intent) {
    throw new Error(
      'Voucher reclaim reconciliation requires a durable reclaim intent.'
    );
  }

  const expectedTxid = normaliseTransactionId(intent.txid);

  const reconciliationTxid = normaliseTransactionId(reconciliation.txid);

  if (reconciliationTxid !== expectedTxid) {
    throw new Error(
      'Voucher reclaim reconciliation belongs to a different transaction.'
    );
  }

  const existing = recovery.reclaimReconciliation;

  if (
    existing &&
    reconciliationStrength(existing) > reconciliationStrength(reconciliation)
  ) {
    return original;
  }

  if (
    reconciliation.status === 'mempool' ||
    reconciliation.status === 'confirmed'
  ) {
    return {
      ...original,

      status: 'reclaimed',

      reclaimedAt: original.reclaimedAt ?? reconciliation.checkedAt,

      printedRecovery: {
        ...recovery,

        reclaimStatus: 'reclaimed',

        reclaimTxid: expectedTxid,

        reclaimReconciliation: reconciliation,
      },
    };
  }

  return {
    ...original,

    printedRecovery: {
      ...recovery,

      reclaimStatus:
        recovery.reclaimBroadcast?.status === 'uncertain'
          ? 'uncertain'
          : 'in_progress',

      reclaimReconciliation: reconciliation,
    },
  };
}
