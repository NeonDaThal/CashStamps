import type { VoucherRecord } from 'src/types/voucher';

export type TopupRecordValueModel = 'legacy' | 'topup_v1';

export interface TopupRecordValues {
  model: TopupRecordValueModel;
  principalMinor: number;
  serviceFeeMinor: number;
  customerPaysMinor: number;
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
 *
 * Fee Model v1:
 *   principal       = explicit feeModel principal
 *   customer pays   = principal + service fee
 *
 * This keeps historical records historically accurate without migrating them.
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

    return {
      model: 'topup_v1',
      principalMinor,
      serviceFeeMinor,
      customerPaysMinor: principalMinor + serviceFeeMinor,
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
    bchLoadedSats,
  };
}
