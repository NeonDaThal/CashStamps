import type { LockedPriceQuote, PriceProviderName } from 'src/types/pricing';

export interface FakeVoucherPricingQuote {
  fiatCurrency: string;
  customerPaysMinor: number;
  serviceFeeBasisPoints: number;
  serviceFeeAmountMinor: number;
  voucherValueMinor: number;
  marketRate: number;
  marketBchSats: number;
  finalBchSats: number;
  quoteSource:
    | 'fake_phase_2_quote'
    | 'coingecko'
    | 'cached'
    | 'general_protocols_oracle';
  quoteTimestamp: string;
  quoteLockedAt?: string;
  quoteExpiresAt?: string;
  isFallbackQuote: boolean;
}

const DEFAULT_SERVICE_FEE_BASIS_POINTS = 1000;
const SATS_PER_BCH = 100_000_000;

function mapProviderToPricingQuoteSource(
  provider: PriceProviderName
): FakeVoucherPricingQuote['quoteSource'] {
  if (provider === 'fake_phase_2') {
    return 'fake_phase_2_quote';
  }

  return provider;
}

export function calculateFakeVoucherPricing(
  customerPaysMinor: number,
  fiatCurrency = 'GBP'
): FakeVoucherPricingQuote {
  const serviceFeeAmountMinor = Math.round(
    (customerPaysMinor * DEFAULT_SERVICE_FEE_BASIS_POINTS) / 10_000
  );

  return {
    fiatCurrency,
    customerPaysMinor,
    serviceFeeBasisPoints: DEFAULT_SERVICE_FEE_BASIS_POINTS,
    serviceFeeAmountMinor,
    voucherValueMinor: customerPaysMinor - serviceFeeAmountMinor,
    marketRate: 0,
    marketBchSats: 0,
    finalBchSats: 0,
    quoteSource: 'fake_phase_2_quote',
    quoteTimestamp: new Date().toISOString(),
    isFallbackQuote: false,
  };
}

export function calculateVoucherPricingFromLockedQuote(
  customerPaysMinor: number,
  quote: LockedPriceQuote
): FakeVoucherPricingQuote {
  const serviceFeeAmountMinor = Math.round(
    (customerPaysMinor * DEFAULT_SERVICE_FEE_BASIS_POINTS) / 10_000
  );

  const voucherValueMinor = customerPaysMinor - serviceFeeAmountMinor;
  const voucherValueMajor = voucherValueMinor / 100;

  const finalBchSats = Math.round(
    (voucherValueMajor / quote.marketRate) * SATS_PER_BCH
  );

  const customerPaysMajor = customerPaysMinor / 100;
  const marketBchSats = Math.round(
    (customerPaysMajor / quote.marketRate) * SATS_PER_BCH
  );

  return {
    fiatCurrency: quote.fiatCurrency,
    customerPaysMinor,
    serviceFeeBasisPoints: DEFAULT_SERVICE_FEE_BASIS_POINTS,
    serviceFeeAmountMinor,
    voucherValueMinor,
    marketRate: quote.marketRate,
    marketBchSats,
    finalBchSats,
    quoteSource: mapProviderToPricingQuoteSource(quote.provider),
    quoteTimestamp: quote.marketRateTimestamp,
    quoteLockedAt: quote.quoteLockedAt,
    quoteExpiresAt: quote.quoteExpiresAt,
    isFallbackQuote: quote.isFallbackQuote,
  };
}

export function formatMinorFiatAmount(
  amountMinor: number,
  fiatCurrency = 'GBP'
): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: fiatCurrency,
  }).format(amountMinor / 100);
}

export function formatBasisPointsAsPercent(basisPoints: number): string {
  return `${basisPoints / 100}%`;
}

export function formatBchSats(sats: number): string {
  return `${(sats / SATS_PER_BCH).toFixed(8)} BCH`;
}

export function formatMarketRate(
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
