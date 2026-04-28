import type { LockedPriceQuote, PriceProvider } from 'src/types/pricing';
import { CoinGeckoPriceProvider } from 'src/services/coingecko-price-provider';
import {
  MAX_FALLBACK_QUOTE_AGE_MILLISECONDS,
  PRICE_QUOTE_TTL_MILLISECONDS,
} from 'src/services/pricing-config';
import { getLastGoodQuote, saveLastGoodQuote } from 'src/services/quote-store';

export class PricingUnavailableError extends Error {
  constructor(message = 'Pricing is temporarily unavailable.') {
    super(message);
    this.name = 'PricingUnavailableError';
  }
}

function isQuoteWithinFallbackWindow(quote: LockedPriceQuote): boolean {
  const quoteTimestamp = new Date(quote.marketRateTimestamp).getTime();

  if (!Number.isFinite(quoteTimestamp)) {
    return false;
  }

  const quoteAgeMilliseconds = Date.now() - quoteTimestamp;

  return (
    quoteAgeMilliseconds >= 0 &&
    quoteAgeMilliseconds <= MAX_FALLBACK_QUOTE_AGE_MILLISECONDS
  );
}

function createFallbackLockedQuote(quote: LockedPriceQuote): LockedPriceQuote {
  const now = new Date();

  return {
    ...quote,
    provider: 'cached',
    quoteLockedAt: now.toISOString(),
    quoteExpiresAt: new Date(
      now.getTime() + PRICE_QUOTE_TTL_MILLISECONDS
    ).toISOString(),
    isFallbackQuote: true,
  };
}

export class PricingService {
  constructor(
    private readonly primaryProvider: PriceProvider = new CoinGeckoPriceProvider()
  ) {}

  async getLockedQuote(fiatCurrency: string): Promise<LockedPriceQuote> {
    try {
      const liveQuote = await this.primaryProvider.getLiveQuote(fiatCurrency);

      await saveLastGoodQuote({
        source: liveQuote.provider === 'coingecko' ? 'coingecko' : 'unknown',
        fiatCurrency: liveQuote.fiatCurrency,
        marketRate: liveQuote.marketRate,
        marketRateTimestamp: liveQuote.marketRateTimestamp,
        quoteLockedAt: liveQuote.quoteLockedAt,
        quoteExpiresAt: liveQuote.quoteExpiresAt,
        isFallbackQuote: false,
      });

      return liveQuote;
    } catch (error) {
      console.error(error);

      const cachedQuote = await getLastGoodQuote(fiatCurrency);

      if (!cachedQuote) {
        throw new PricingUnavailableError();
      }

      const lockedCachedQuote: LockedPriceQuote = {
        provider: 'cached',
        fiatCurrency: cachedQuote.fiatCurrency,
        marketRate: cachedQuote.marketRate,
        marketRateTimestamp: cachedQuote.marketRateTimestamp,
        quoteLockedAt: cachedQuote.quoteLockedAt ?? new Date().toISOString(),
        quoteExpiresAt:
          cachedQuote.quoteExpiresAt ??
          new Date(Date.now() + PRICE_QUOTE_TTL_MILLISECONDS).toISOString(),
        isFallbackQuote: true,
      };

      if (!isQuoteWithinFallbackWindow(lockedCachedQuote)) {
        throw new PricingUnavailableError(
          'Pricing is temporarily unavailable and the cached quote is too old.'
        );
      }

      return createFallbackLockedQuote(lockedCachedQuote);
    }
  }
}
