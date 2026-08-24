import { broadcastVoucherReclaimIntent } from 'src/services/voucher-reclaim-broadcast';

import { reconcileTreasuryBroadcastWithRetry } from 'src/services/treasury-broadcast-reconciliation';

import { prepareAndStoreVoucherReclaim } from 'src/services/voucher-reclaim-prepare';

import { getVoucherReclaimRecoveryAction } from 'src/services/voucher-reclaim-state';

import { isReplacementFundingVerifiedForReclaim } from 'src/services/voucher-reclaim';

import {
  getVoucherRecordById,
  updateVoucherReclaimBroadcast,
  updateVoucherReclaimReconciliation,
} from 'src/services/voucher-store';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { VoucherRecord } from 'src/types/voucher';

export type VoucherReclaimLifecycleOutcome =
  | 'reclaimed'
  | 'broadcasted_pending_detection'
  | 'uncertain'
  | 'definitely_not_broadcast'
  | 'blocked'
  | 'verification_pending';

export interface VoucherReclaimLifecycleResult {
  record: VoucherRecord;

  outcome: VoucherReclaimLifecycleOutcome;

  broadcast?: TreasuryBroadcastResult;

  reconciliation?: TreasuryBroadcastReconciliationResult;
}

function isPositive(
  reconciliation: TreasuryBroadcastReconciliationResult
): boolean {
  return (
    reconciliation.status === 'mempool' || reconciliation.status === 'confirmed'
  );
}

async function requireOriginal(id: string): Promise<VoucherRecord> {
  const record = await getVoucherRecordById(id);

  if (!record) {
    throw new Error('Original Topup record could not be found.');
  }

  return record;
}

async function getLinkedReplacement(
  original: VoucherRecord
): Promise<VoucherRecord | undefined> {
  const replacementVoucherId = original.printedRecovery?.replacementVoucherId;

  if (!replacementVoucherId) {
    return undefined;
  }

  return getVoucherRecordById(replacementVoucherId);
}

async function persistReconciliation(
  id: string,
  reconciliation: TreasuryBroadcastReconciliationResult
): Promise<VoucherRecord> {
  const updated = await updateVoucherReclaimReconciliation(id, reconciliation);

  if (!updated) {
    throw new Error(
      'Original Topup disappeared while saving reclaim reconciliation.'
    );
  }

  return updated;
}

/**
 * Read-only check of the exact reclaim txid already stored on the original.
 *
 * Never signs or broadcasts.
 */
export async function reconcileExistingVoucherReclaim(
  originalVoucherId: string
): Promise<{
  record: VoucherRecord;

  reconciliation: TreasuryBroadcastReconciliationResult;
}> {
  const original = await requireOriginal(originalVoucherId);

  const intent = original.printedRecovery?.reclaimIntent;

  if (!intent) {
    throw new Error('No durable reclaim transaction exists for this Topup.');
  }

  const reconciliation = await reconcileTreasuryBroadcastWithRetry(intent.txid);

  const updated = await persistReconciliation(original.id, reconciliation);

  return {
    record: updated,

    reconciliation,
  };
}

/**
 * Advance ONE reclaim operation using only its exact persisted transaction.
 *
 * This may prepare the transaction once if none exists.
 *
 * It never creates a second reclaim transaction after the write-ahead boundary
 * has been crossed.
 */
export async function advanceVoucherReclaimLifecycle(
  originalVoucherId: string
): Promise<VoucherReclaimLifecycleResult> {
  let original = await requireOriginal(originalVoucherId);

  let replacement = await getLinkedReplacement(original);

  /**
   * First call may prepare and persist the one exact reclaim transaction.
   */
  if (!original.printedRecovery?.reclaimIntent) {
    original = await prepareAndStoreVoucherReclaim(original.id);

    replacement = await getLinkedReplacement(original);
  }

  const intent = original.printedRecovery?.reclaimIntent;

  if (!intent) {
    throw new Error(
      'Voucher reclaim preparation completed without a durable reclaim intent.'
    );
  }

  /**
   * Always reconcile the exact txid before considering another submission.
   */
  const preBroadcastReconciliation = await reconcileTreasuryBroadcastWithRetry(
    intent.txid
  );

  original = await persistReconciliation(
    original.id,
    preBroadcastReconciliation
  );

  if (isPositive(preBroadcastReconciliation)) {
    return {
      record: original,

      outcome: 'reclaimed',

      reconciliation: preBroadcastReconciliation,
    };
  }

  replacement = await getLinkedReplacement(original);

  const action = getVoucherReclaimRecoveryAction(original, replacement);

  /**
   * If submission may already have happened, stop here.
   *
   * Another transaction request is forbidden.
   */
  if (action === 'check_same_transaction') {
    return {
      record: original,

      outcome:
        original.printedRecovery?.reclaimBroadcast?.status === 'uncertain'
          ? 'uncertain'
          : 'broadcasted_pending_detection',

      reconciliation: preBroadcastReconciliation,
    };
  }

  if (action !== 'resume_same_transaction') {
    if (original.printedRecovery?.reclaimStatus === 'reclaimed') {
      return {
        record: original,

        outcome: 'reclaimed',

        reconciliation: preBroadcastReconciliation,
      };
    }

    throw new Error(
      'Voucher reclaim cannot be submitted safely from its current persisted state.'
    );
  }

  /**
   * Before a request which we positively know has not yet succeeded, re-check
   * that the customer replacement remains funded.
   */
  if (!replacement || !isReplacementFundingVerifiedForReclaim(replacement)) {
    throw new Error(
      'Linked replacement Topup is no longer positively funded. Reclaim broadcast is blocked.'
    );
  }

  const broadcast = await broadcastVoucherReclaimIntent(intent);

  const broadcastRecord = await updateVoucherReclaimBroadcast(
    original.id,
    broadcast
  );

  if (!broadcastRecord) {
    throw new Error(
      'Original Topup disappeared while saving reclaim broadcast state.'
    );
  }

  original = broadcastRecord;

  if (broadcast.status === 'blocked') {
    return {
      record: original,

      outcome: 'blocked',

      broadcast,
    };
  }

  if (broadcast.status === 'definitely_not_broadcast') {
    return {
      record: original,

      outcome: 'definitely_not_broadcast',

      broadcast,
    };
  }

  /**
   * broadcasted and uncertain both require reconciliation of the SAME txid.
   */
  const postBroadcastReconciliation = await reconcileTreasuryBroadcastWithRetry(
    intent.txid
  );

  original = await persistReconciliation(
    original.id,
    postBroadcastReconciliation
  );

  if (isPositive(postBroadcastReconciliation)) {
    return {
      record: original,

      outcome: 'reclaimed',

      broadcast,

      reconciliation: postBroadcastReconciliation,
    };
  }

  return {
    record: original,

    outcome:
      broadcast.status === 'uncertain'
        ? 'uncertain'
        : 'broadcasted_pending_detection',

    broadcast,

    reconciliation: postBroadcastReconciliation,
  };
}
