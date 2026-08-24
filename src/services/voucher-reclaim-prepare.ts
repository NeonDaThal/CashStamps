import { getTreasuryWalletPublicInfo } from 'src/services/treasury-wallet';

import { canPrepareVoucherReclaim } from 'src/services/voucher-reclaim';

import { createVoucherReclaimIntent } from 'src/services/voucher-reclaim-transaction';

import {
  getVoucherRecordById,
  storeVoucherReclaimIntent,
} from 'src/services/voucher-store';

import type { VoucherRecord } from 'src/types/voucher';

/**
 * Prepare and durably store the exact original-voucher reclaim transaction.
 *
 * This function signs, but NEVER broadcasts.
 */
export async function prepareAndStoreVoucherReclaim(
  originalVoucherId: string
): Promise<VoucherRecord> {
  const original = await getVoucherRecordById(originalVoucherId);

  if (!original) {
    throw new Error('Original Topup record could not be found.');
  }

  const replacementVoucherId = original.printedRecovery?.replacementVoucherId;

  if (!replacementVoucherId) {
    throw new Error(
      'A funded replacement Topup is required before reclaim can be prepared.'
    );
  }

  const replacement = await getVoucherRecordById(replacementVoucherId);

  if (!replacement) {
    throw new Error('Linked replacement Topup record could not be found.');
  }

  if (!canPrepareVoucherReclaim(original, replacement)) {
    throw new Error('This Topup is not currently eligible for reclaim.');
  }

  const treasuryBefore = await getTreasuryWalletPublicInfo();

  if (!treasuryBefore.isSetup || !treasuryBefore.address) {
    throw new Error(
      'Treasury Wallet must be set up before reclaiming the original Topup.'
    );
  }

  /**
   * Signs the exact voucher-funding output → Treasury transaction.
   *
   * Nothing is broadcast.
   */
  const reclaimIntent = await createVoucherReclaimIntent(
    original,
    treasuryBefore.address
  );

  /**
   * Re-check Treasury identity before persistence.
   *
   * If the merchant replaced/imported a different Treasury Wallet during
   * preparation, fail closed. The in-memory transaction was never broadcast
   * and is deliberately not persisted.
   */
  const treasuryAfter = await getTreasuryWalletPublicInfo();

  if (
    !treasuryAfter.isSetup ||
    treasuryAfter.address !== treasuryBefore.address
  ) {
    throw new Error(
      'Treasury Wallet changed while the reclaim transaction was being prepared. No reclaim transaction was saved or sent.'
    );
  }

  const stored = await storeVoucherReclaimIntent(original.id, reclaimIntent);

  if (!stored) {
    throw new Error(
      'Original Topup record could not be found while saving its reclaim transaction.'
    );
  }

  return stored;
}
