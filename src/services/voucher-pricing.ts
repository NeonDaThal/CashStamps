export interface FakeVoucherPricingQuote {
  fiatCurrency: string;
  customerPaysMinor: number;
  serviceFeeBasisPoints: number;
  serviceFeeAmountMinor: number;
  voucherValueMinor: number;
  quoteSource: 'fake_phase_2_quote';
  quoteTimestamp: string;
}

const DEFAULT_SERVICE_FEE_BASIS_POINTS = 1000;

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
    quoteSource: 'fake_phase_2_quote',
    quoteTimestamp: new Date().toISOString(),
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
