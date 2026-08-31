import { strict as assert } from 'assert';

import type { LockedPriceQuote } from 'src/types/pricing';

import {
  calculateCashOutFeeBreakdown,
  calculateCashOutPricingFromLockedQuote,
  isCashOutAmountAllowed,
} from 'src/services/cash-out-pricing';

function createLockedQuote(marketRate = 500): LockedPriceQuote {
  return {
    provider: 'coingecko',
    fiatCurrency: 'GBP',
    marketRate,
    marketRateTimestamp: '2026-08-26T12:00:00.000Z',
    quoteLockedAt: '2026-08-26T12:00:01.000Z',
    quoteExpiresAt: '2026-08-26T12:05:01.000Z',
    isFallbackQuote: false,
  } as LockedPriceQuote;
}

{
  assert.equal(isCashOutAmountAllowed(99), false);

  assert.equal(isCashOutAmountAllowed(100), true);

  console.log('✓ Cash-out minimum is exactly £1.00');
}

{
  const fee = calculateCashOutFeeBreakdown(100);

  assert.equal(fee.feeModel, 'cash_out_v1');

  assert.equal(fee.totalServiceFeeBasisPoints, 300);

  assert.equal(fee.totalServiceFeeAmountMinor, 3);

  assert.equal(fee.platformFeeAmountMinor, 1);

  assert.equal(fee.merchantFeeAmountMinor, 2);

  assert.equal(fee.bufferReserveAmountMinor, undefined);

  assert.equal(fee.merchantRetainedAmountMinor, undefined);

  console.log(
    '✓ £1 Cash-out charges exactly 3p and splits odd penny deterministically'
  );
}

{
  const fee = calculateCashOutFeeBreakdown(10_000);

  assert.equal(fee.totalServiceFeeAmountMinor, 300);

  assert.equal(fee.platformFeeAmountMinor, 150);

  assert.equal(fee.merchantFeeAmountMinor, 150);

  console.log('✓ £100 Cash-out charges £3.00 split equally');
}

{
  const fee = calculateCashOutFeeBreakdown(100_000);

  assert.equal(fee.totalServiceFeeAmountMinor, 3_000);

  assert.equal(fee.platformFeeAmountMinor, 1_500);

  assert.equal(fee.merchantFeeAmountMinor, 1_500);

  console.log('✓ Cash-out Fee Model v1 has no upper fee cap');
}

{
  const pricing = calculateCashOutPricingFromLockedQuote(
    10_000,
    createLockedQuote(500)
  );

  assert.equal(pricing.fiatAmountMinor, 10_000);

  assert.equal(pricing.customerSendsFiatEquivalentMinor, 10_300);

  assert.equal(pricing.marketBchSats, 20_000_000);

  assert.equal(pricing.bchSatsRequired, 20_600_000);

  console.log(
    '✓ Locked quote prices customer BCH from cash payout plus exact 3% fee'
  );
}

{
  assert.throws(
    () => calculateCashOutPricingFromLockedQuote(99, createLockedQuote()),
    /at least £1\.00/
  );

  console.log('✓ Locked pricing rejects Cash-outs below £1.00');
}

console.log('All Cash-out Fee Model v1 pricing tests passed successfully.');
