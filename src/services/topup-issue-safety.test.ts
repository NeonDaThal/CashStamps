import { strict as assert } from 'assert';

import { TOPUP_PRICE_QUOTE_TTL_MILLISECONDS } from './pricing-config';
import { getTopupQuoteIssueSafety } from './topup-issue-safety';

assert.equal(TOPUP_PRICE_QUOTE_TTL_MILLISECONDS, 5 * 60_000);

{
  const result = getTopupQuoteIssueSafety(
    {
      quoteLockedAt: '2026-08-18T12:00:00.000Z',
      quoteExpiresAt: '2026-08-18T12:05:00.000Z',
    },
    new Date('2026-08-18T12:04:59.999Z')
  );

  assert.equal(result.status, 'valid');
  assert.equal(result.remainingMilliseconds, 1);
}

{
  const result = getTopupQuoteIssueSafety(
    {
      quoteLockedAt: '2026-08-18T12:00:00.000Z',
      quoteExpiresAt: '2026-08-18T12:05:00.000Z',
    },
    new Date('2026-08-18T12:05:00.000Z')
  );

  assert.equal(result.status, 'expired');
}

{
  const result = getTopupQuoteIssueSafety(
    {
      quoteLockedAt: 'invalid',
      quoteExpiresAt: '2026-08-18T12:05:00.000Z',
    },
    new Date('2026-08-18T12:01:00.000Z')
  );

  assert.equal(result.status, 'invalid');
}

{
  const result = getTopupQuoteIssueSafety(
    {
      quoteLockedAt: '2026-08-18T12:05:00.000Z',
      quoteExpiresAt: '2026-08-18T12:04:00.000Z',
    },
    new Date('2026-08-18T12:03:00.000Z')
  );

  assert.equal(result.status, 'invalid');
}

console.log('✓ Topup quote lock is five minutes');
console.log('✓ Topup quote remains valid until expiry');
console.log('✓ Topup quote expires exactly at expiry time');
console.log('✓ malformed/reversed quote timing fails closed');
console.log('\nAll 4 Topup issue safety tests passed successfully.');
