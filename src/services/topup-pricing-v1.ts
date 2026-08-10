import { calculateTopupFeeModelV1 } from './fee-model';
import type {
  TopupFeeModelV1Calculation,
  TopupFeeModelV1Snapshot,
  TopupFeeTier,
} from '../types/fee-model';

const SATS_PER_BCH = 100_000_000;

export type TopupPricingQuoteSource =
  | 'fake_phase_2_quote'
  | 'general_protocols_oracle'
  | 'coingecko'
  | 'cached'
  | 'manual';

export interface TopupLockedQuoteLike {
  fiatCurrency: string;
  marketRate: number;

  quoteTimestamp: string;
  quoteSource: TopupPricingQuoteSource;

  quoteLockedAt?: string;
  quoteExpiresAt?: string;

  isFallbackQuote: boolean;
}

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
   * Compatibility alias used by the current UI until B3.
   *
   * This is the principal plus service fee, but does not yet include
   * customer network-fee recovery.
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
  lockedQuote: TopupLockedQuoteLike
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

    quoteTimestamp: lockedQuote.quoteTimestamp,
    quoteSource: lockedQuote.quoteSource,
    quoteLockedAt: lockedQuote.quoteLockedAt,
    quoteExpiresAt: lockedQuote.quoteExpiresAt,
    isFallbackQuote: lockedQuote.isFallbackQuote,

    feeModelCalculation,
  };
}

export function createTopupFeeModelV1Snapshot(
  pricing: TopupPricingV1,
  options?: {
    estimatedNetworkFeeSats?: number;
    snapshotCreatedAt?: string;
  }
): TopupFeeModelV1Snapshot {
  const estimatedNetworkFeeSats = options?.estimatedNetworkFeeSats;

  if (
    estimatedNetworkFeeSats !== undefined &&
    (!Number.isSafeInteger(estimatedNetworkFeeSats) ||
      estimatedNetworkFeeSats < 0)
  ) {
    throw new Error(
      'Estimated network fee must be a non-negative safe integer in satoshis.'
    );
  }

  const networkFee =
    estimatedNetworkFeeSats === undefined
      ? {
          status: 'not_calculated' as const,
        }
      : {
          status: 'estimated' as const,
          feeSats: estimatedNetworkFeeSats,
        };

  return {
    ...pricing.feeModelCalculation,

    snapshotCreatedAt: options?.snapshotCreatedAt ?? new Date().toISOString(),

    networkFee,

    /**
     * Deliberately not populated yet.
     *
     * B5 will add the customer's network-fee recovery and therefore the final
     * customer cash total.
     */
    customerTotalMinor: undefined,
  };
}
