import type { LockedPriceQuote, PriceProviderName } from 'src/types/pricing';
import {
  BUFFER_RESERVE_BASIS_POINTS,
  MERCHANT_RETAINED_BASIS_POINTS,
  PLATFORM_FEE_BASIS_POINTS,
  TOTAL_SERVICE_FEE_BASIS_POINTS,
} from 'src/services/platform-fee-config';
import type {
  CashOutFeeBreakdown,
  CashOutQuoteSource,
} from 'src/types/cash-out';

const SATS_PER_BCH = 100_000_000;

export interface CashOutPricingQuote {
  fiatCurrency: string;

  /**
   * Cash the merchant will give to the customer after BCH is detected.
   */
  fiatAmountMinor: number;

  /**
   * Fiat-equivalent BCH value the customer must send.
   *
   * This is the cash amount plus the total service fee/spread.
   */
  customerSendsFiatEquivalentMinor: number;

  fee: CashOutFeeBreakdown;

  marketRate: number;

  /**
   * BCH value of the cash payout before fees.
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

function calculateFeeAmountMinor(
  amountMinor: number,
  basisPoints: number
): number {
  return Math.round((amountMinor * basisPoints) / 10_000);
}

function createCashOutFeeBreakdown(
  fiatAmountMinor: number
): CashOutFeeBreakdown {
  const platformFeeAmountMinor = calculateFeeAmountMinor(
    fiatAmountMinor,
    PLATFORM_FEE_BASIS_POINTS
  );

  const merchantRetainedAmountMinor = calculateFeeAmountMinor(
    fiatAmountMinor,
    MERCHANT_RETAINED_BASIS_POINTS
  );

  const bufferReserveAmountMinor = calculateFeeAmountMinor(
    fiatAmountMinor,
    BUFFER_RESERVE_BASIS_POINTS
  );

  const totalServiceFeeAmountMinor =
    platformFeeAmountMinor +
    merchantRetainedAmountMinor +
    bufferReserveAmountMinor;

  return {
    totalServiceFeeBasisPoints: TOTAL_SERVICE_FEE_BASIS_POINTS,
    totalServiceFeeAmountMinor,

    platformFeeBasisPoints: PLATFORM_FEE_BASIS_POINTS,
    platformFeeAmountMinor,

    merchantRetainedBasisPoints: MERCHANT_RETAINED_BASIS_POINTS,
    merchantRetainedAmountMinor,

    bufferReserveBasisPoints: BUFFER_RESERVE_BASIS_POINTS,
    bufferReserveAmountMinor,

    settlementMode: 'accounting_only',
  };
}

export function calculateCashOutPricingFromLockedQuote(
  fiatAmountMinor: number,
  quote: LockedPriceQuote
): CashOutPricingQuote {
  const fee = createCashOutFeeBreakdown(fiatAmountMinor);

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
