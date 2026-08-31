import { strict as assert } from 'assert';

import type { CashOutQuote } from 'src/types/cash-out';

import {
  CASH_OUT_QUOTE_TTL_MILLISECONDS,
  getCashOutQuoteRemainingMilliseconds,
  isCashOutQuoteExpired,
} from 'src/services/cash-out-quote-policy';

const quote: CashOutQuote = {
  source: 'coingecko',
  fiatCurrency: 'GBP',
  marketRate: 500,
  marketRateTimestamp: '2026-08-26T12:00:00.000Z',
  quoteLockedAt: '2026-08-26T12:00:00.000Z',
  quoteExpiresAt: '2026-08-26T12:05:00.000Z',
  isFallbackQuote: false,
};

{
  assert.equal(CASH_OUT_QUOTE_TTL_MILLISECONDS, 300_000);

  console.log('✓ Cash-out quote lifetime is five minutes');
}

{
  const remaining = getCashOutQuoteRemainingMilliseconds(
    quote,
    new Date('2026-08-26T12:03:00.000Z').getTime()
  );

  assert.equal(remaining, 120_000);

  assert.equal(
    isCashOutQuoteExpired(
      quote,
      new Date('2026-08-26T12:03:00.000Z').getTime()
    ),
    false
  );

  console.log('✓ Active Cash-out quote reports its exact remaining lifetime');
}

{
  assert.equal(
    isCashOutQuoteExpired(
      quote,
      new Date('2026-08-26T12:05:00.000Z').getTime()
    ),
    true
  );

  console.log('✓ Cash-out quote expires exactly at its expiry timestamp');
}

{
  const malformedQuote: CashOutQuote = {
    ...quote,
    quoteExpiresAt: 'not-a-date',
  };

  assert.equal(isCashOutQuoteExpired(malformedQuote), true);

  console.log('✓ Missing or invalid expiry information fails closed');
}

console.log('All Cash-out quote policy tests passed successfully.');
