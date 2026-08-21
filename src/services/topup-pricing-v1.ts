import type { LockedPriceQuote } from 'src/types/pricing';

import { calculateTopupFeeModelV1 } from './fee-model';
import type {
  TopupFeeModelV1Calculation,
  TopupFeeModelV1Snapshot,
  TopupFeeTier,
} from '../types/fee-model';

const SATS_PER_BCH = 100_000_000;

/**
 * Use the application's real locked-quote contract directly.
 *
 * This avoids maintaining a second nearly-identical quote type whose
 * property names can drift away from src/types/pricing.
 */
export type TopupLockedQuoteLike = LockedPriceQuote;

/**
 * TopupPricingV1 exposes normalised quote metadata to the rest of the
 * Topup flow.
 *
 * The fake value is retained for compatibility with existing display/factory
 * code, although calculateTopupPricingV1FromLockedQuote receives a real
 * LockedPriceQuote.
 */
export type TopupPricingQuoteSource =
  | LockedPriceQuote['provider']
  | 'fake_phase_2_quote';

export interface TopupPricingV1 {
  feeModelVersion: 'topup_v1';

  fiatCurrency: string;

  /**
   * Fiat value loaded into the customer's Topup.
   *
   * Unlike the legacy model, the service fee is NOT subtracted from this.
   */
  principalMinor: number;

  /**
   * Final customer cash total under the current Topup v1 commercial model.
   *
   * This is:
   *
   * principal + service fee
   *
   * The merchant absorbs the BCH miner fee, so no miner-fee recovery is added
   * to this amount.
   */
  customerPaysMinor: number;

  /**
   * Compatibility alias used by existing Topup components.
   *
   * Under Fee Model v1 this is exactly equal to principalMinor.
   */
  voucherValueMinor: number;

  serviceFeeBasisPoints: number;
  serviceFeeAmountMinor: number;

  merchantFeeAmountMinor: number;
  platformFeeAmountMinor: number;

  feeTier: TopupFeeTier;

  marketRate: number;

  /**
   * Under Fee Model v1 the entered amount is the Topup principal, so
   * marketBchSats and finalBchSats are intentionally identical.
   */
  marketBchSats: number;
  finalBchSats: number;

  /**
   * BCH equivalent of the platform's fiat service-fee share using the same
   * locked quote used for the voucher principal.
   */
  platformFeeSats: number;

  /**
   * Informational BCH equivalent of the merchant's fiat service-fee share.
   *
   * This is NOT a separate blockchain output.
   */
  merchantFeeEquivalentSats: number;

  /**
   * Normalised names retained for compatibility with VoucherRecord and
   * existing confirmation-display code.
   */
  quoteTimestamp: string;
  quoteSource: TopupPricingQuoteSource;

  quoteLockedAt?: string;
  quoteExpiresAt?: string;
  isFallbackQuote: boolean;

  feeModelCalculation: TopupFeeModelV1Calculation;
}

function assertValidMarketRate(marketRate: number): void {
  if (!Number.isFinite(marketRate) || marketRate <= 0) {
    throw new Error('Market rate must be a positive finite number.');
  }
}

function assertValidMinorUnitDigits(minorUnitDigits: number): void {
  if (
    !Number.isSafeInteger(minorUnitDigits) ||
    minorUnitDigits < 0 ||
    minorUnitDigits > 6
  ) {
    throw new Error(
      'Currency minor-unit digits must be an integer between 0 and 6.'
    );
  }
}

/**
 * Convert fiat minor units to satoshis using a locked fiat-per-BCH rate.
 *
 * Example with GBP:
 *
 * amountMinor = 10000 (£100)
 * marketRate = 500 (£500/BCH)
 *
 * £100 / £500 = 0.2 BCH = 20,000,000 sats.
 */
export function convertFiatMinorToSatsAtRate(
  amountMinor: number,
  marketRate: number,
  minorUnitDigits: number
): number {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new Error(
      'Fiat amount must be a non-negative safe integer in minor units.'
    );
  }

  assertValidMarketRate(marketRate);
  assertValidMinorUnitDigits(minorUnitDigits);

  if (amountMinor === 0) {
    return 0;
  }

  const minorUnitsPerMajorUnit = 10 ** minorUnitDigits;
  const fiatMajorAmount = amountMinor / minorUnitsPerMajorUnit;

  const sats = Math.round((fiatMajorAmount / marketRate) * SATS_PER_BCH);

  if (!Number.isSafeInteger(sats) || sats <= 0) {
    throw new Error(
      'Fiat-to-satoshi conversion did not produce a positive safe integer.'
    );
  }

  return sats;
}

export function calculateTopupPricingV1FromLockedQuote(
  principalMinor: number,
  lockedQuote: LockedPriceQuote
): TopupPricingV1 {
  const feeModelCalculation = calculateTopupFeeModelV1(
    principalMinor,
    lockedQuote.fiatCurrency
  );

  assertValidMarketRate(lockedQuote.marketRate);

  const minorUnitDigits = feeModelCalculation.scheduleSnapshot.minorUnitDigits;

  const principalSats = convertFiatMinorToSatsAtRate(
    feeModelCalculation.principalMinor,
    lockedQuote.marketRate,
    minorUnitDigits
  );

  const platformFeeSats = convertFiatMinorToSatsAtRate(
    feeModelCalculation.platformFeeMinor,
    lockedQuote.marketRate,
    minorUnitDigits
  );

  const merchantFeeEquivalentSats = convertFiatMinorToSatsAtRate(
    feeModelCalculation.merchantFeeMinor,
    lockedQuote.marketRate,
    minorUnitDigits
  );

  return {
    feeModelVersion: 'topup_v1',

    fiatCurrency: feeModelCalculation.currency,

    principalMinor: feeModelCalculation.principalMinor,

    customerPaysMinor: feeModelCalculation.customerTotalBeforeNetworkFeeMinor,

    voucherValueMinor: feeModelCalculation.principalMinor,

    serviceFeeBasisPoints: feeModelCalculation.percentageBasisPoints,

    serviceFeeAmountMinor: feeModelCalculation.serviceFeeMinor,

    merchantFeeAmountMinor: feeModelCalculation.merchantFeeMinor,

    platformFeeAmountMinor: feeModelCalculation.platformFeeMinor,

    feeTier: feeModelCalculation.feeTier,

    marketRate: lockedQuote.marketRate,

    marketBchSats: principalSats,
    finalBchSats: principalSats,

    platformFeeSats,
    merchantFeeEquivalentSats,

    /**
     * LockedPriceQuote uses marketRateTimestamp/provider.
     * TopupPricingV1 normalises these to the historical pricing names used
     * elsewhere in the voucher code.
     */
    quoteTimestamp: lockedQuote.marketRateTimestamp,
    quoteSource: lockedQuote.provider,

    quoteLockedAt: lockedQuote.quoteLockedAt,
    quoteExpiresAt: lockedQuote.quoteExpiresAt,
    isFallbackQuote: lockedQuote.isFallbackQuote,

    feeModelCalculation,
  };
}

export function createTopupFeeModelV1Snapshot(
  pricing: TopupPricingV1,
  options?: {
    /**
     * Compatibility path for older/development callers which only know a
     * transaction-size estimate.
     *
     * New issued Topups should use actualNetworkFeeSats after signing.
     */
    estimatedNetworkFeeSats?: number;

    /**
     * Exact miner fee from the final signed transaction.
     *
     * New Topups should persist this value from
     * VoucherFundingIntent.actualFeeSats.
     */
    actualNetworkFeeSats?: number;

    snapshotCreatedAt?: string;
  }
): TopupFeeModelV1Snapshot {
  const estimatedNetworkFeeSats = options?.estimatedNetworkFeeSats;

  const actualNetworkFeeSats = options?.actualNetworkFeeSats;

  if (
    estimatedNetworkFeeSats !== undefined &&
    (!Number.isSafeInteger(estimatedNetworkFeeSats) ||
      estimatedNetworkFeeSats < 0)
  ) {
    throw new Error(
      'Estimated network fee must be a non-negative safe integer in satoshis.'
    );
  }

  if (
    actualNetworkFeeSats !== undefined &&
    (!Number.isSafeInteger(actualNetworkFeeSats) || actualNetworkFeeSats < 0)
  ) {
    throw new Error(
      'Actual network fee must be a non-negative safe integer in satoshis.'
    );
  }

  /**
   * A snapshot must never ambiguously claim that the same miner fee is both
   * estimated and final.
   */
  if (
    estimatedNetworkFeeSats !== undefined &&
    actualNetworkFeeSats !== undefined
  ) {
    throw new Error(
      'Network fee snapshot cannot contain both estimated and actual miner fees.'
    );
  }

  const networkFee =
    actualNetworkFeeSats !== undefined
      ? {
          status: 'final' as const,

          feeSats: actualNetworkFeeSats,

          /**
           * Launch Topup model:
           *
           * merchant treasury absorbs the miner fee;
           * customer is not charged an additional recovery amount.
           */
          recoveryMinor: 0,
        }
      : estimatedNetworkFeeSats !== undefined
      ? {
          status: 'estimated' as const,

          feeSats: estimatedNetworkFeeSats,
        }
      : {
          status: 'not_calculated' as const,
        };

  return {
    ...pricing.feeModelCalculation,

    snapshotCreatedAt: options?.snapshotCreatedAt ?? new Date().toISOString(),

    networkFee,

    /**
     * Once the actual signed transaction fee is known, the commercial terms
     * are final.
     *
     * The customer's physical cash total remains principal + service fee
     * because the merchant absorbs the BCH miner fee.
     *
     * Older estimated/not-calculated snapshot paths remain undefined for
     * backward compatibility with existing development records.
     */
    customerTotalMinor:
      actualNetworkFeeSats !== undefined
        ? pricing.customerPaysMinor
        : undefined,
  };
}
