import { createTreasuryFundingPreview } from 'src/services/treasury-funding';

import {
  getTreasuryWalletBalance,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';

import {
  deriveNextVoucherAddress,
  exportVoucherKeyAtIndex,
} from 'src/services/voucher-wallet';

import {
  createTopupIssueOperationId,
  prepareTopupFundingIntent,
} from 'src/services/topup-issue-operation';

import { createDraftVoucherRecord } from 'src/services/voucher-factory';

import {
  canCreatePrintedReplacement,
  createPrintedReplacementFeeOutputPlan,
} from 'src/services/voucher-replacement';

import { buildPreparedPrintedReplacementRecord } from 'src/services/printed-replacement-record';

import {
  getVoucherRecordById,
  insertPrintedReplacementVoucher,
  type InsertPrintedReplacementResult,
} from 'src/services/voucher-store';

/**
 * Prepare and durably store ONE replacement Printed voucher.
 *
 * CRITICAL:
 *
 * This function SIGNS a transaction but NEVER broadcasts it.
 *
 * Ordering:
 *
 * 1. re-read and validate original
 * 2. fetch fresh Treasury UTXOs
 * 3. derive new voucher key/address
 * 4. create zero-second-fee funding preview
 * 5. sign exact replacement transaction
 * 6. build replacement record
 * 7. atomically insert replacement + link original
 *
 * Only after this returns may the existing B5.7 lifecycle ever submit the
 * exact persisted transaction.
 */
export async function prepareAndStorePrintedReplacement(
  originalVoucherId: string
): Promise<InsertPrintedReplacementResult> {
  const originalVoucher = await getVoucherRecordById(originalVoucherId);

  if (!originalVoucher) {
    throw new Error('Original Printed Topup record could not be found.');
  }

  if (!canCreatePrintedReplacement(originalVoucher)) {
    throw new Error('This Printed Topup is not eligible for a replacement.');
  }

  const treasuryWallet = await getTreasuryWalletPublicInfo();

  if (!treasuryWallet.isSetup || !treasuryWallet.address) {
    throw new Error(
      'Treasury Wallet must be set up before a replacement Topup can be issued.'
    );
  }

  /**
   * Always use fresh balance/UTXO data for the replacement.
   *
   * We do not reuse the original funding preview because Treasury state may
   * have changed since the original customer sale.
   */
  const treasuryBalance = await getTreasuryWalletBalance();

  const replacementAddress = await deriveNextVoucherAddress();

  /**
   * Verify that the newly reserved derivation really has a usable WIF and that
   * the exported key corresponds to the same address.
   *
   * The WIF itself is not stored here.
   */
  const replacementKey = await exportVoucherKeyAtIndex(
    replacementAddress.derivationIndex
  );

  if (!replacementKey.wif) {
    throw new Error('Replacement voucher WIF could not be derived.');
  }

  if (replacementKey.address !== replacementAddress.address) {
    throw new Error(
      'Replacement voucher key does not match the newly derived address.'
    );
  }

  const feeOutputPlan = createPrintedReplacementFeeOutputPlan(originalVoucher);

  const treasuryFundingPreview = createTreasuryFundingPreview({
    treasuryAddress: treasuryWallet.address,

    voucherAddress: replacementAddress.address,

    /**
     * Exact customer BCH entitlement from the original sale.
     */
    amountSats: originalVoucher.finalBchSats,

    /**
     * B5.8 replacement contract:
     *
     * no second platform fee,
     * no second service fee,
     * no buffer output.
     */
    platformFeeSats: feeOutputPlan.platformFeeSats,

    bufferReserveSats: 0,

    treasuryBalanceSats: treasuryBalance.balanceSats,

    treasuryUtxoCount: treasuryBalance.utxoCount,

    treasuryUtxos: treasuryBalance.utxos,
  });

  if (!treasuryFundingPreview.isAffordable) {
    throw new Error(
      'Treasury Wallet does not have enough BCH to fund the replacement Topup and its miner fee.'
    );
  }

  const operationId = createTopupIssueOperationId();

  /**
   * This signs the exact replacement funding transaction.
   *
   * prepareTopupFundingIntent() does NOT broadcast.
   */
  const fundingIntent = await prepareTopupFundingIntent({
    operationId,

    treasuryFundingPreview,

    feeOutputPlan,
  });

  const now = new Date().toISOString();

  const draftVoucher = createDraftVoucherRecord(
    originalVoucher.fiatAmountMinor,
    originalVoucher.fiatCurrency,
    undefined,
    {
      addressData: {
        derivationIndex: replacementAddress.derivationIndex,

        address: replacementAddress.address,
      },

      keyMetadata: {
        hasWif: true,

        checkedAt: now,
      },

      feeOutputPlan,

      treasuryFundingPreview,

      issueOperationId: operationId,

      fundingIntent,
    }
  );

  const replacementVoucher = buildPreparedPrintedReplacementRecord(
    originalVoucher,
    draftVoucher,
    now
  );

  /**
   * ================================================================
   * CRITICAL WRITE-AHEAD BOUNDARY
   * ================================================================
   *
   * The signed replacement transaction and original↔replacement relationship
   * become durable together.
   *
   * No BCH has been broadcast before this succeeds.
   */
  return insertPrintedReplacementVoucher(
    originalVoucher.id,
    replacementVoucher
  );
}
