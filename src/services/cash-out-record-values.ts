import type { CashOutFeeModel, CashOutRecord } from 'src/types/cash-out';

export type CashOutRecordFeeModel = CashOutFeeModel | 'legacy';

export interface CashOutRecordValues {
  cashPaidOutMinor: number;

  customerSendsFiatEquivalentMinor: number;

  serviceFeeMinor: number;

  /**
   * Merchant/platform shares are only exposed when the stored Cash-out
   * explicitly identifies Cash-out Fee Model v1 and the split reconciles
   * exactly to the stored total service fee.
   *
   * Legacy placeholder fee structures are deliberately not reinterpreted.
   */
  merchantFeeMinor: number | null;

  platformFeeMinor: number | null;

  feeSplitKnown: boolean;

  feeModel: CashOutRecordFeeModel;

  settlementMode: 'accounting_only' | 'unknown';

  marketBchSats: number;

  bchRequiredSats: number;

  bchReceivedSats: number;
}

function safeNonNegativeInteger(value: number | undefined | null): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    return 0;
  }

  return Number(value);
}

function getKnownCashOutV1FeeSplit(
  cashOut: CashOutRecord,
  serviceFeeMinor: number
): {
  merchantFeeMinor: number | null;
  platformFeeMinor: number | null;
  feeSplitKnown: boolean;
} {
  if (cashOut.fee?.feeModel !== 'cash_out_v1') {
    return {
      merchantFeeMinor: null,
      platformFeeMinor: null,
      feeSplitKnown: false,
    };
  }

  const merchantFeeMinor = cashOut.fee.merchantFeeAmountMinor;

  const platformFeeMinor = cashOut.fee.platformFeeAmountMinor;

  if (
    !Number.isSafeInteger(merchantFeeMinor) ||
    Number(merchantFeeMinor) < 0 ||
    !Number.isSafeInteger(platformFeeMinor) ||
    Number(platformFeeMinor) < 0
  ) {
    return {
      merchantFeeMinor: null,
      platformFeeMinor: null,
      feeSplitKnown: false,
    };
  }

  const normalizedMerchantFeeMinor = Number(merchantFeeMinor);

  const normalizedPlatformFeeMinor = Number(platformFeeMinor);

  if (
    normalizedMerchantFeeMinor + normalizedPlatformFeeMinor !==
    serviceFeeMinor
  ) {
    return {
      merchantFeeMinor: null,
      platformFeeMinor: null,
      feeSplitKnown: false,
    };
  }

  return {
    merchantFeeMinor: normalizedMerchantFeeMinor,

    platformFeeMinor: normalizedPlatformFeeMinor,

    feeSplitKnown: true,
  };
}

export function getCashOutRecordValues(
  cashOut: CashOutRecord
): CashOutRecordValues {
  const cashPaidOutMinor = safeNonNegativeInteger(cashOut.fiatAmountMinor);

  const customerSendsFiatEquivalentMinor = safeNonNegativeInteger(
    cashOut.customerSendsFiatEquivalentMinor
  );

  const serviceFeeMinor = safeNonNegativeInteger(
    cashOut.fee?.totalServiceFeeAmountMinor
  );

  const feeSplit = getKnownCashOutV1FeeSplit(cashOut, serviceFeeMinor);

  return {
    cashPaidOutMinor,

    customerSendsFiatEquivalentMinor,

    serviceFeeMinor,

    merchantFeeMinor: feeSplit.merchantFeeMinor,

    platformFeeMinor: feeSplit.platformFeeMinor,

    feeSplitKnown: feeSplit.feeSplitKnown,

    feeModel: cashOut.fee?.feeModel ?? 'legacy',

    settlementMode:
      cashOut.fee?.settlementMode === 'accounting_only'
        ? 'accounting_only'
        : 'unknown',

    marketBchSats: safeNonNegativeInteger(cashOut.marketBchSats),

    bchRequiredSats: safeNonNegativeInteger(cashOut.bchSatsRequired),

    bchReceivedSats: safeNonNegativeInteger(
      cashOut.bchSatsReceived ?? cashOut.paymentDetection?.receivedSats
    ),
  };
}
