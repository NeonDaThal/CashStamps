import assert from 'assert';

import { calculateCashOutSettlementServiceFeeSplit } from './cash-out-settlement-economics';

/**
 * £1 odd-penny example:
 *
 * total fee = 3p
 * platform = 1p
 * merchant = 2p
 *
 * If the BCH service-fee portion is exactly 6,000 sats, the proportional
 * allocation must be 2,000 / 4,000.
 */
{
  const result = calculateCashOutSettlementServiceFeeSplit({
    marketBchSats: 200_000,
    bchSatsRequired: 206_000,

    totalServiceFeeAmountMinor: 3,
    platformFeeAmountMinor: 1,
    merchantFeeAmountMinor: 2,
  });

  assert.equal(result.serviceFeeSats, 6_000);
  assert.equal(result.platformFeeSats, 2_000);
  assert.equal(result.merchantFeeSats, 4_000);

  assert.equal(
    result.platformFeeSats + result.merchantFeeSats,
    result.serviceFeeSats
  );

  console.log('PASS: £1 odd-penny fiat split converts exactly to sats');
}

/**
 * The BCH service fee itself may contain an indivisible satoshi remainder.
 *
 * Platform rounds downward.
 * Merchant receives the remainder.
 */
{
  const result = calculateCashOutSettlementServiceFeeSplit({
    marketBchSats: 200_000,
    bchSatsRequired: 203_001,

    totalServiceFeeAmountMinor: 3,
    platformFeeAmountMinor: 1,
    merchantFeeAmountMinor: 2,
  });

  assert.equal(result.serviceFeeSats, 3_001);
  assert.equal(result.platformFeeSats, 1_000);
  assert.equal(result.merchantFeeSats, 2_001);

  console.log(
    'PASS: indivisible service-fee satoshi remainder stays merchant-side'
  );
}

/**
 * Normal even fiat split.
 */
{
  const result = calculateCashOutSettlementServiceFeeSplit({
    marketBchSats: 200_000,
    bchSatsRequired: 206_001,

    totalServiceFeeAmountMinor: 300,
    platformFeeAmountMinor: 150,
    merchantFeeAmountMinor: 150,
  });

  assert.equal(result.serviceFeeSats, 6_001);
  assert.equal(result.platformFeeSats, 3_000);
  assert.equal(result.merchantFeeSats, 3_001);

  console.log('PASS: even fiat split preserves exact BCH remainder');
}

/**
 * Never silently accept inconsistent accounting data.
 */
assert.throws(
  () =>
    calculateCashOutSettlementServiceFeeSplit({
      marketBchSats: 200_000,
      bchSatsRequired: 206_000,

      totalServiceFeeAmountMinor: 3,
      platformFeeAmountMinor: 1,
      merchantFeeAmountMinor: 1,
    }),
  /exactly reconcile/
);

console.log('PASS: inconsistent stored fee split is rejected');

/**
 * Required customer BCH must actually contain the service fee.
 */
assert.throws(
  () =>
    calculateCashOutSettlementServiceFeeSplit({
      marketBchSats: 200_000,
      bchSatsRequired: 200_000,

      totalServiceFeeAmountMinor: 3,
      platformFeeAmountMinor: 1,
      merchantFeeAmountMinor: 2,
    }),
  /positive service-fee/
);

console.log('PASS: missing BCH service-fee portion is rejected');

console.log('');
console.log('Cash-out Settlement D1B.1 economics tests passed.');
