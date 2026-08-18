export const DEFAULT_FIAT_CURRENCY = 'GBP';

/**
 * Default quote lock used by existing flows unless they deliberately request
 * a different duration.
 */
export const PRICE_QUOTE_TTL_MILLISECONDS = 60_000;

/**
 * Topups happen in a physical shop environment.
 *
 * Five minutes gives the customer time to review the amount and hand cash to
 * the merchant without forcing an unnecessarily rushed transaction.
 */
export const TOPUP_PRICE_QUOTE_TTL_MILLISECONDS = 5 * 60_000;

export const MAX_FALLBACK_QUOTE_AGE_MILLISECONDS = 2 * 60_000;

export const COINGECKO_BCH_COIN_ID = 'bitcoin-cash';

export const COINGECKO_SIMPLE_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price';
