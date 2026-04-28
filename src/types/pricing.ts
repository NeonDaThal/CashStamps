export type PriceProviderName =
  | 'fake_phase_2'
  | 'coingecko'
  | 'general_protocols_oracle'
  | 'cached';

export interface LockedPriceQuote {
  provider: PriceProviderName;
  fiatCurrency: string;

  /**
   * Fiat value of 1 BCH.
   * Example: if 1 BCH = £420, this is 420.
   */
  marketRate: number;

  /**
   * ISO timestamp from when the price was fetched or produced.
   */
  marketRateTimestamp: string;

  /**
   * ISO timestamp from when this quote was locked for issuing.
   */
  quoteLockedAt: string;

  /**
   * ISO timestamp after which this quote should not be used for issuing.
   */
  quoteExpiresAt: string;

  /**
   * True when this quote came from a stored fallback quote rather than a fresh live quote.
   */
  isFallbackQuote: boolean;
}

export interface PriceProvider {
  name: PriceProviderName;
  getLiveQuote(fiatCurrency: string): Promise<LockedPriceQuote>;
}

export interface PriceProviderOptions {
  quoteTtlMilliseconds: number;
}
