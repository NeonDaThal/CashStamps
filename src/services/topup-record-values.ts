import type { NetworkFeeSnapshotStatus } from 'src/types/fee-model';
import type { VoucherRecord } from 'src/types/voucher';

export type TopupRecordValueModel = 'legacy' | 'topup_v1';

export type TopupRecordNetworkFeeStatus = NetworkFeeSnapshotStatus | 'unknown';

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

  /**
   * Persisted network-fee state.
   *
   * "unknown" is used for legacy records or malformed/older records which do
   * not expose enough information to classify the miner fee safely.
   */
  networkFeeStatus: TopupRecordNetworkFeeStatus;

  /**
   * Exact miner fee from the final signed funding transaction.
   *
   * Only populated when networkFeeStatus === 'final'.
   */
  actualMinerFeeSats: number | null;

  /**
   * Earlier transaction-size estimate.
   *
   * Only populated when networkFeeStatus === 'estimated'.
   *
   * This must never be silently treated as an actual merchant expense.
   */
  estimatedMinerFeeSats: number | null;

  /**
   * Fiat amount recovered from the customer specifically for the miner fee.
   *
   * Current Topup launch model:
   * 0 for newly-created final snapshots because the merchant absorbs the fee.
   *
   * null means the historical record does not explicitly tell us.
   */
  customerNetworkFeeRecoveryMinor: number | null;
}

function normaliseNonNegativeMinor(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    return 0;
  }

  return value;
}

function normaliseOptionalNonNegativeInteger(
  value: number | undefined
): number | null {
  if (!Number.isSafeInteger(value) || value === undefined || value < 0) {
    return null;
  }

  return value;
}

function getNetworkFeeValues(
  voucher: VoucherRecord
): Pick<
  TopupRecordValues,
  | 'networkFeeStatus'
  | 'actualMinerFeeSats'
  | 'estimatedMinerFeeSats'
  | 'customerNetworkFeeRecoveryMinor'
> {
  if (!isTopupFeeModelV1(voucher) || !voucher.feeModel) {
    return {
      networkFeeStatus: 'unknown',
      actualMinerFeeSats: null,
      estimatedMinerFeeSats: null,
      customerNetworkFeeRecoveryMinor: null,
    };
  }

  const networkFee = voucher.feeModel.networkFee;

  const fundingIntentActualFeeSats = normaliseOptionalNonNegativeInteger(
    voucher.fundingIntent?.actualFeeSats
  );

  /**
   * B5.6A records:
   *
   * Prefer the explicitly-final fee-model snapshot when it contains a valid
   * exact fee.
   */
  if (networkFee?.status === 'final') {
    const finalFeeSats = normaliseOptionalNonNegativeInteger(
      networkFee.feeSats
    );

    if (finalFeeSats !== null) {
      return {
        networkFeeStatus: 'final',
        actualMinerFeeSats: finalFeeSats,
        estimatedMinerFeeSats: null,

        customerNetworkFeeRecoveryMinor: normaliseOptionalNonNegativeInteger(
          networkFee.recoveryMinor
        ),
      };
    }
  }

  /**
   * B5.5 compatibility:
   *
   * B5.5-era records already contain the exact fee from the signed
   * transaction in fundingIntent.actualFeeSats, even though their older
   * fee-model snapshot may still say "estimated".
   *
   * The exact signed fee is stronger evidence than that earlier estimate.
   */
  if (fundingIntentActualFeeSats !== null) {
    return {
      networkFeeStatus: 'final',
      actualMinerFeeSats: fundingIntentActualFeeSats,

      estimatedMinerFeeSats: null,

      /**
       * The current Topup launch model was already merchant-absorbed at B5.5.
       */
      customerNetworkFeeRecoveryMinor: 0,
    };
  }

  if (!networkFee) {
    return {
      networkFeeStatus: 'unknown',
      actualMinerFeeSats: null,
      estimatedMinerFeeSats: null,
      customerNetworkFeeRecoveryMinor: null,
    };
  }

  if (networkFee.status === 'not_calculated') {
    return {
      networkFeeStatus: 'not_calculated',
      actualMinerFeeSats: null,
      estimatedMinerFeeSats: null,
      customerNetworkFeeRecoveryMinor: null,
    };
  }

  const feeSats = normaliseOptionalNonNegativeInteger(networkFee.feeSats);

  /**
   * An estimated/final status without a valid corresponding fee value is not
   * trustworthy enough for accounting, so fail closed to unknown.
   */
  if (feeSats === null) {
    return {
      networkFeeStatus: 'unknown',
      actualMinerFeeSats: null,
      estimatedMinerFeeSats: null,
      customerNetworkFeeRecoveryMinor: null,
    };
  }

  if (networkFee.status === 'estimated') {
    return {
      networkFeeStatus: 'estimated',
      actualMinerFeeSats: null,
      estimatedMinerFeeSats: feeSats,
      customerNetworkFeeRecoveryMinor: null,
    };
  }

  return {
    networkFeeStatus: 'unknown',
    actualMinerFeeSats: null,
    estimatedMinerFeeSats: null,
    customerNetworkFeeRecoveryMinor: null,
  };
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
 *   miner fee       = unknown
 *
 * Fee Model v1:
 *   principal       = explicit feeModel principal
 *   service fee     = explicit feeModel service fee
 *   customer pays   = principal + service fee
 *   merchant fee    = explicit feeModel merchant share
 *   platform fee    = explicit feeModel platform share
 *   miner fee       = persisted estimate/final value when explicitly known
 *
 * This keeps historical records historically accurate without migrating or
 * silently recalculating them using today's fee schedule.
 */
export function getTopupRecordValues(
  voucher: VoucherRecord
): TopupRecordValues {
  const bchLoadedSats = normaliseNonNegativeMinor(voucher.finalBchSats);

  const networkFeeValues = getNetworkFeeValues(voucher);

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
    const explicitCustomerTotalMinor = normaliseOptionalNonNegativeInteger(
      voucher.feeModel.customerTotalMinor
    );

    const customerPaysMinor =
      explicitCustomerTotalMinor ?? principalMinor + serviceFeeMinor;

    return {
      model: 'topup_v1',

      principalMinor,
      serviceFeeMinor,
      customerPaysMinor,

      merchantFeeMinor,
      platformFeeMinor,
      feeSplitKnown: true,

      bchLoadedSats,

      ...networkFeeValues,
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

    ...networkFeeValues,
  };
}
