import type { CashOutQuote } from 'src/types/cash-out';

/**
 * Cash-out Quote Policy v1
 *
 * Five minutes gives the customer a reasonable real-world window to:
 *
 * - unlock/open their phone;
 * - open their BCH wallet;
 * - scan the merchant QR;
 * - review the payment;
 * - send the BCH.
 *
 * Once this time expires, the Cash-out agreement must no longer be treated as
 * active. The BCH URI itself cannot technically be revoked, so any payment
 * arriving after expiry must be treated as an exceptional recovery case rather
 * than authorising a cash payout automatically.
 */
export const CASH_OUT_QUOTE_TTL_MILLISECONDS = 5 * 60 * 1000;

export function getCashOutQuoteExpiryTimestamp(
  quote: Pick<CashOutQuote, 'quoteExpiresAt'>
): number | null {
  if (!quote.quoteExpiresAt) {
    return null;
  }

  const timestamp = new Date(quote.quoteExpiresAt).getTime();

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}

export function getCashOutQuoteRemainingMilliseconds(
  quote: Pick<CashOutQuote, 'quoteExpiresAt'>,
  nowMilliseconds = Date.now()
): number {
  const expiryTimestamp = getCashOutQuoteExpiryTimestamp(quote);

  if (expiryTimestamp === null) {
    return 0;
  }

  return Math.max(0, expiryTimestamp - nowMilliseconds);
}

export function isCashOutQuoteExpired(
  quote: Pick<CashOutQuote, 'quoteExpiresAt'>,
  nowMilliseconds = Date.now()
): boolean {
  return getCashOutQuoteRemainingMilliseconds(quote, nowMilliseconds) <= 0;
}
