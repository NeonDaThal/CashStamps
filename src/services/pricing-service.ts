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

export interface GetLockedQuoteOptions {
  ttlMilliseconds?: number;
}

function normaliseQuoteTtlMilliseconds(
  ttlMilliseconds: number | undefined
): number {
  const value = ttlMilliseconds ?? PRICE_QUOTE_TTL_MILLISECONDS;

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(
      'Quote lock duration must be a positive whole number of milliseconds.'
    );
  }

  return value;
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

function lockQuoteForDuration(
  quote: LockedPriceQuote,
  ttlMilliseconds: number,
  isFallbackQuote: boolean
): LockedPriceQuote {
  const now = new Date();

  return {
    ...quote,
    quoteLockedAt: now.toISOString(),
    quoteExpiresAt: new Date(now.getTime() + ttlMilliseconds).toISOString(),
    isFallbackQuote,
  };
}

export class PricingService {
  constructor(
    private readonly primaryProvider: PriceProvider = new CoinGeckoPriceProvider()
  ) {}

  async getLockedQuote(
    fiatCurrency: string,
    options?: GetLockedQuoteOptions
  ): Promise<LockedPriceQuote> {
    const ttlMilliseconds = normaliseQuoteTtlMilliseconds(
      options?.ttlMilliseconds
    );

    try {
      const liveQuote = await this.primaryProvider.getLiveQuote(fiatCurrency);

      const lockedLiveQuote = lockQuoteForDuration(
        liveQuote,
        ttlMilliseconds,
        false
      );

      await saveLastGoodQuote({
        source:
          lockedLiveQuote.provider === 'coingecko' ? 'coingecko' : 'unknown',
        fiatCurrency: lockedLiveQuote.fiatCurrency,
        marketRate: lockedLiveQuote.marketRate,
        marketRateTimestamp: lockedLiveQuote.marketRateTimestamp,
        quoteLockedAt: lockedLiveQuote.quoteLockedAt,
        quoteExpiresAt: lockedLiveQuote.quoteExpiresAt,
        isFallbackQuote: false,
      });

      return lockedLiveQuote;
    } catch (error) {
      console.error(error);

      const cachedQuote = await getLastGoodQuote(fiatCurrency);

      if (!cachedQuote) {
        throw new PricingUnavailableError();
      }

      const cachedLockedQuote: LockedPriceQuote = {
        provider: 'cached',
        fiatCurrency: cachedQuote.fiatCurrency,
        marketRate: cachedQuote.marketRate,
        marketRateTimestamp: cachedQuote.marketRateTimestamp,
        quoteLockedAt: new Date().toISOString(),
        quoteExpiresAt: new Date(Date.now() + ttlMilliseconds).toISOString(),
        isFallbackQuote: true,
      };

      if (!isQuoteWithinFallbackWindow(cachedLockedQuote)) {
        throw new PricingUnavailableError(
          'Pricing is temporarily unavailable and the cached quote is too old.'
        );
      }

      return lockQuoteForDuration(cachedLockedQuote, ttlMilliseconds, true);
    }
  }
}
