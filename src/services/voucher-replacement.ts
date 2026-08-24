import type { VoucherRecord, VoucherReplacement } from 'src/types/voucher';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';

function isVoucherRedeemed(voucher: VoucherRecord): boolean {
  return (
    voucher.status === 'redeemed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  );
}

/**
 * The original Printed Topup may create one replacement only after the
 * merchant has explicitly confirmed that no usable physical voucher exists.
 */
export function canCreatePrintedReplacement(voucher: VoucherRecord): boolean {
  if (
    voucher.delivery?.method !== 'printed' ||
    voucher.status !== 'funded' ||
    isVoucherRedeemed(voucher)
  ) {
    return false;
  }

  const recovery = voucher.printedRecovery;

  if (
    !recovery ||
    recovery.resolution !== 'replacement_required' ||
    recovery.reclaimStatus !== 'required'
  ) {
    return false;
  }

  return !recovery.replacementVoucherId;
}

/**
 * Mark a newly-created voucher as a replacement of the original customer sale.
 *
 * This function does NOT create funding or expose a WIF.
 */
export function applyPrintedReplacementMetadata(
  replacement: VoucherRecord,
  original: VoucherRecord,
  createdAt: string
): VoucherRecord {
  if (!canCreatePrintedReplacement(original)) {
    throw new Error('Original Printed Topup is not eligible for replacement.');
  }

  if (replacement.id === original.id) {
    throw new Error('Replacement voucher must have a new record ID.');
  }

  if (
    replacement.derivationIndex === original.derivationIndex ||
    replacement.address === original.address
  ) {
    throw new Error(
      'Replacement Topup must use a new voucher key and address.'
    );
  }

  if (replacement.delivery?.method !== 'printed') {
    throw new Error('Printed recovery replacement must remain Printed.');
  }

  /**
   * Customer receives the same BCH entitlement as the original sale.
   */
  if (replacement.finalBchSats !== original.finalBchSats) {
    throw new Error(
      'Replacement Topup BCH amount must match the original Topup.'
    );
  }

  const replacementMetadata: VoucherReplacement = {
    originalVoucherId: original.id,

    originalSerial: original.serial,

    reason: 'printed_delivery_failure',

    sequence: 1,

    createdAt,

    customerPaymentAlreadyRecorded: true,

    platformFeeAlreadyPaid: true,
  };

  return {
    ...replacement,

    /**
     * Keep the same customer-facing reference.
     *
     * The internal record ID remains unique.
     */
    serial: original.serial,

    fiatCurrency: original.fiatCurrency,

    fiatAmountMinor: original.fiatAmountMinor,

    marketBchSats: original.marketBchSats,

    fee: {
      ...original.fee,
    },

    finalBchSats: original.finalBchSats,

    quote: {
      ...original.quote,
    },

    feeModel: original.feeModel
      ? {
          ...original.feeModel,

          scheduleSnapshot: {
            ...original.feeModel.scheduleSnapshot,
          },

          networkFee: {
            ...original.feeModel.networkFee,
          },
        }
      : undefined,

    replacement: replacementMetadata,
  };
}

/**
 * Link the original record to its replacement.
 *
 * Same replacement ID is idempotent.
 * A different second replacement is rejected.
 */
export function linkPrintedReplacement(
  original: VoucherRecord,
  replacementVoucherId: string
): VoucherRecord {
  const recovery = original.printedRecovery;

  if (!recovery || recovery.resolution !== 'replacement_required') {
    throw new Error('Original Topup does not require a Printed replacement.');
  }

  if (!replacementVoucherId.trim()) {
    throw new Error('Replacement voucher ID is required.');
  }

  if (recovery.replacementVoucherId) {
    if (recovery.replacementVoucherId === replacementVoucherId) {
      return original;
    }

    throw new Error(
      'Original Topup is already linked to a different replacement voucher.'
    );
  }

  return {
    ...original,

    printedRecovery: {
      ...recovery,

      replacementVoucherId,
    },
  };
}

/**
 * Create the on-chain fee-output plan for a replacement Printed Topup.
 *
 * The platform fee and merchant service fee were already accounted for by the
 * original customer sale.
 *
 * The replacement therefore funds ONLY:
 *
 * - the customer's replacement voucher output; and
 * - normal Treasury change.
 *
 * The merchant still pays the replacement transaction's miner fee.
 */
export function createPrintedReplacementFeeOutputPlan(
  original: VoucherRecord
): VoucherFeeOutputPlan {
  return {
    /**
     * Retain the configured addresses for audit/config compatibility, but no
     * second fee output is created because every corresponding amount is zero.
     */
    platformFeeAddress: original.feeOutputPlan?.platformFeeAddress ?? '',

    platformFeeSats: 0,

    platformFeeBasisPoints: 0,

    merchantRetainedSats: 0,

    merchantRetainedBasisPoints: 0,

    bufferReserveAddress: original.feeOutputPlan?.bufferReserveAddress ?? '',

    bufferReserveSats: 0,

    bufferReserveBasisPoints: 0,

    bufferReserveOutputEnabled: false,

    totalServiceFeeSats: 0,

    totalServiceFeeBasisPoints: 0,
  };
}

export function isReplacementVoucher(voucher: VoucherRecord): boolean {
  return Boolean(voucher.replacement?.originalVoucherId);
}
