import type { LockedPriceQuote, PriceProviderName } from 'src/types/pricing';

import {
  CASH_OUT_MERCHANT_FEE_BASIS_POINTS,
  CASH_OUT_MINIMUM_AMOUNT_MINOR,
  CASH_OUT_PLATFORM_FEE_BASIS_POINTS,
  CASH_OUT_TOTAL_SERVICE_FEE_BASIS_POINTS,
} from 'src/services/cash-out-fee-config';

import type {
  CashOutFeeBreakdown,
  CashOutQuoteSource,
} from 'src/types/cash-out';

const SATS_PER_BCH = 100_000_000;

export interface CashOutPricingQuote {
  fiatCurrency: string;

  /**
   * Cash the merchant will physically give to the customer after BCH payment
   * has been accepted.
   */
  fiatAmountMinor: number;

  /**
   * Fiat-equivalent BCH value the customer must send.
   *
   * Cash-out Fee Model v1:
   *
   * cash payout + 3% service fee
   */
  customerSendsFiatEquivalentMinor: number;

  fee: CashOutFeeBreakdown;

  marketRate: number;

  /**
   * BCH market value of the cash payout before the Cash-out service fee.
   */
  marketBchSats: number;

  /**
   * Final BCH sats the customer must send.
   */
  bchSatsRequired: number;

  quoteSource: CashOutQuoteSource;
  quoteTimestamp: string;
  quoteLockedAt?: string;
  quoteExpiresAt?: string;
  isFallbackQuote: boolean;
}

function mapProviderToCashOutQuoteSource(
  provider: PriceProviderName
): CashOutQuoteSource {
  if (provider === 'fake_phase_2') {
    return 'fake_phase_2_quote';
  }

  return provider;
}

function calculatePercentageAmountMinor(
  amountMinor: number,
  basisPoints: number
): number {
  return Math.round((amountMinor * basisPoints) / 10_000);
}

function assertNonNegativeMinorAmount(
  amountMinor: number,
  fieldName: string
): void {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new Error(
      `${fieldName} must be a non-negative integer number of minor currency units.`
    );
  }
}

/**
 * Returns whether an amount is eligible to become a real Cash-out.
 *
 * Preview calculations may still use values below the minimum while the
 * merchant is typing.
 */
export function isCashOutAmountAllowed(fiatAmountMinor: number): boolean {
  return (
    Number.isSafeInteger(fiatAmountMinor) &&
    fiatAmountMinor >= CASH_OUT_MINIMUM_AMOUNT_MINOR
  );
}

/**
 * Canonical Cash-out Fee Model v1 calculation.
 *
 * IMPORTANT:
 *
 * Calculate the complete 3% customer fee first, then split that exact rounded
 * fee between platform and merchant.
 *
 * Do NOT independently round two separate 1.5% calculations because their sum
 * can differ from the customer-facing 3% fee by one minor currency unit.
 */
export function calculateCashOutFeeBreakdown(
  fiatAmountMinor: number
): CashOutFeeBreakdown {
  assertNonNegativeMinorAmount(fiatAmountMinor, 'Cash-out amount');

  const totalServiceFeeAmountMinor = calculatePercentageAmountMinor(
    fiatAmountMinor,
    CASH_OUT_TOTAL_SERVICE_FEE_BASIS_POINTS
  );

  /**
   * Deterministic odd-minor-unit rule:
   *
   * platform gets the lower half;
   * merchant gets the remainder.
   */
  const platformFeeAmountMinor = Math.floor(totalServiceFeeAmountMinor / 2);

  const merchantFeeAmountMinor =
    totalServiceFeeAmountMinor - platformFeeAmountMinor;

  return {
    feeModel: 'cash_out_v1',

    totalServiceFeeBasisPoints: CASH_OUT_TOTAL_SERVICE_FEE_BASIS_POINTS,

    totalServiceFeeAmountMinor,

    platformFeeBasisPoints: CASH_OUT_PLATFORM_FEE_BASIS_POINTS,

    platformFeeAmountMinor,

    merchantFeeBasisPoints: CASH_OUT_MERCHANT_FEE_BASIS_POINTS,

    merchantFeeAmountMinor,

    settlementMode: 'accounting_only',
  };
}

export function calculateCashOutPricingFromLockedQuote(
  fiatAmountMinor: number,
  quote: LockedPriceQuote
): CashOutPricingQuote {
  if (!isCashOutAmountAllowed(fiatAmountMinor)) {
    throw new Error('Cash-out amount must be at least £1.00.');
  }

  if (!Number.isFinite(quote.marketRate) || quote.marketRate <= 0) {
    throw new Error('Cash-out pricing requires a valid positive market rate.');
  }

  const fee = calculateCashOutFeeBreakdown(fiatAmountMinor);

  const customerSendsFiatEquivalentMinor =
    fiatAmountMinor + fee.totalServiceFeeAmountMinor;

  const fiatAmountMajor = fiatAmountMinor / 100;

  const customerSendsFiatEquivalentMajor =
    customerSendsFiatEquivalentMinor / 100;

  const marketBchSats = Math.round(
    (fiatAmountMajor / quote.marketRate) * SATS_PER_BCH
  );

  const bchSatsRequired = Math.round(
    (customerSendsFiatEquivalentMajor / quote.marketRate) * SATS_PER_BCH
  );

  return {
    fiatCurrency: quote.fiatCurrency,

    fiatAmountMinor,

    customerSendsFiatEquivalentMinor,

    fee,

    marketRate: quote.marketRate,

    marketBchSats,

    bchSatsRequired,

    quoteSource: mapProviderToCashOutQuoteSource(quote.provider),

    quoteTimestamp: quote.marketRateTimestamp,

    quoteLockedAt: quote.quoteLockedAt,

    quoteExpiresAt: quote.quoteExpiresAt,

    isFallbackQuote: quote.isFallbackQuote,
  };
}

export function formatCashOutMinorFiatAmount(
  amountMinor: number,
  fiatCurrency = 'GBP'
): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: fiatCurrency,
  }).format(amountMinor / 100);
}

export function formatCashOutBasisPointsAsPercent(basisPoints: number): string {
  return `${basisPoints / 100}%`;
}

export function formatCashOutBchSats(sats: number): string {
  return `${(sats / SATS_PER_BCH).toFixed(8)} BCH`;
}

export function formatCashOutMarketRate(
  marketRate: number,
  fiatCurrency = 'GBP'
): string {
  if (!marketRate || !Number.isFinite(marketRate)) {
    return 'Not available';
  }

  const formattedRate = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: fiatCurrency,
  }).format(marketRate);

  return `${formattedRate} per BCH`;
}
