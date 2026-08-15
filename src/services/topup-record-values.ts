import type { VoucherRecord } from 'src/types/voucher';

export type TopupRecordValueModel = 'legacy' | 'topup_v1';

export interface TopupRecordValues {
  model: TopupRecordValueModel;

  /**
   * Fiat value of BCH loaded for the customer.
   */
  principalMinor: number;

  /**
   * Total service fee charged for the Topup.
   */
  serviceFeeMinor: number;

  /**
   * Total physical cash collected from the customer.
   */
  customerPaysMinor: number;

  /**
   * Merchant share of the service fee.
   *
   * Legacy records do not always contain enough information to reconstruct
   * the historical merchant/platform fee split safely, so this is null when
   * the split is not explicitly known.
   */
  merchantFeeMinor: number | null;

  /**
   * Platform share of the service fee.
   *
   * Legacy records do not always contain enough information to reconstruct
   * the historical merchant/platform fee split safely, so this is null when
   * the split is not explicitly known.
   */
  platformFeeMinor: number | null;

  /**
   * True when the persisted record explicitly tells us the merchant/platform
   * split and the report can therefore account for both shares safely.
   */
  feeSplitKnown: boolean;

  /**
   * BCH actually loaded into the voucher.
   */
  bchLoadedSats: number;
}

function normaliseNonNegativeMinor(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    return 0;
  }

  return value;
}

export function isTopupFeeModelV1(voucher: VoucherRecord): boolean {
  return voucher.feeModel?.version === 'topup_v1';
}

/**
 * Normalises persisted Topup records into one display/accounting shape.
 *
 * Legacy records:
 *   fiatAmountMinor = customer cash paid
 *   principal       = customer paid - service fee
 *   fee split       = unknown unless explicitly stored by a later model
 *
 * Fee Model v1:
 *   principal       = explicit feeModel principal
 *   service fee     = explicit feeModel service fee
 *   customer pays   = principal + service fee
 *   merchant fee    = explicit feeModel merchant share
 *   platform fee    = explicit feeModel platform share
 *
 * This keeps historical records historically accurate without migrating or
 * silently recalculating them using today's fee schedule.
 */
export function getTopupRecordValues(
  voucher: VoucherRecord
): TopupRecordValues {
  const bchLoadedSats = normaliseNonNegativeMinor(voucher.finalBchSats);

  if (isTopupFeeModelV1(voucher) && voucher.feeModel) {
    const principalMinor = normaliseNonNegativeMinor(
      voucher.feeModel.principalMinor
    );

    const serviceFeeMinor = normaliseNonNegativeMinor(
      voucher.feeModel.serviceFeeMinor
    );

    const merchantFeeMinor = normaliseNonNegativeMinor(
      voucher.feeModel.merchantFeeMinor
    );

    const platformFeeMinor = normaliseNonNegativeMinor(
      voucher.feeModel.platformFeeMinor
    );

    return {
      model: 'topup_v1',
      principalMinor,
      serviceFeeMinor,
      customerPaysMinor: principalMinor + serviceFeeMinor,
      merchantFeeMinor,
      platformFeeMinor,
      feeSplitKnown: true,
      bchLoadedSats,
    };
  }

  const customerPaysMinor = normaliseNonNegativeMinor(voucher.fiatAmountMinor);

  const serviceFeeMinor =
    voucher.fee.type === 'none'
      ? 0
      : normaliseNonNegativeMinor(voucher.fee.amountMinor);

  return {
    model: 'legacy',
    principalMinor: Math.max(0, customerPaysMinor - serviceFeeMinor),
    serviceFeeMinor,
    customerPaysMinor,
    merchantFeeMinor: null,
    platformFeeMinor: null,
    feeSplitKnown: false,
    bchLoadedSats,
  };
}
