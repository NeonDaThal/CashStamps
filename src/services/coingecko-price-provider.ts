import type {
  LockedPriceQuote,
  PriceProvider,
  PriceProviderOptions,
} from 'src/types/pricing';
import {
  COINGECKO_BCH_COIN_ID,
  COINGECKO_SIMPLE_PRICE_URL,
  PRICE_QUOTE_TTL_MILLISECONDS,
} from 'src/services/pricing-config';

interface CoinGeckoSimplePriceResponse {
  [coinId: string]:
    | {
        [currency: string]: number | undefined;
      }
    | undefined;
}

function buildQuoteTimestamps(options?: Partial<PriceProviderOptions>): {
  marketRateTimestamp: string;
  quoteLockedAt: string;
  quoteExpiresAt: string;
} {
  const now = new Date();
  const quoteTtlMilliseconds =
    options?.quoteTtlMilliseconds ?? PRICE_QUOTE_TTL_MILLISECONDS;

  return {
    marketRateTimestamp: now.toISOString(),
    quoteLockedAt: now.toISOString(),
    quoteExpiresAt: new Date(
      now.getTime() + quoteTtlMilliseconds
    ).toISOString(),
  };
}

export class CoinGeckoPriceProvider implements PriceProvider {
  name = 'coingecko' as const;

  async getLiveQuote(
    fiatCurrency: string,
    options?: Partial<PriceProviderOptions>
  ): Promise<LockedPriceQuote> {
    const normalizedCurrency = fiatCurrency.toLowerCase();

    const params = new URLSearchParams({
      ids: COINGECKO_BCH_COIN_ID,
      vs_currencies: normalizedCurrency,
    });

    const response = await fetch(`${COINGECKO_SIMPLE_PRICE_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`CoinGecko price request failed: ${response.status}`);
    }

    const data = (await response.json()) as CoinGeckoSimplePriceResponse;
    const marketRate = data[COINGECKO_BCH_COIN_ID]?.[normalizedCurrency];

    if (!marketRate || !Number.isFinite(marketRate) || marketRate <= 0) {
      throw new Error(
        `CoinGecko did not return a valid BCH/${fiatCurrency} rate`
      );
    }

    const timestamps = buildQuoteTimestamps(options);

    return {
      provider: this.name,
      fiatCurrency: fiatCurrency.toUpperCase(),
      marketRate,
      ...timestamps,
      isFallbackQuote: false,
    };
  }
}
