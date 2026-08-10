import { strict as assert } from 'assert';

import {
  calculateTopupPricingV1FromLockedQuote,
  convertFiatMinorToSatsAtRate,
  createTopupFeeModelV1Snapshot,
  type TopupLockedQuoteLike,
} from './topup-pricing-v1';

interface TopupPricingTest {
  name: string;
  run: () => void;
}

function createLockedQuote(marketRate = 100): TopupLockedQuoteLike {
  return {
    provider: 'coingecko',

    fiatCurrency: 'GBP',
    marketRate,

    marketRateTimestamp: '2026-08-10T12:00:00.000Z',

    quoteLockedAt: '2026-08-10T12:00:01.000Z',

    quoteExpiresAt: '2026-08-10T12:02:01.000Z',

    isFallbackQuote: false,
  };
}

const tests: TopupPricingTest[] = [
  {
    name: '£20 Topup preserves £20 principal and adds £4 service fee',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        2_000,
        createLockedQuote(100)
      );

      assert.equal(pricing.feeModelVersion, 'topup_v1');

      assert.equal(pricing.principalMinor, 2_000);
      assert.equal(pricing.voucherValueMinor, 2_000);

      assert.equal(pricing.feeTier, 'minimum');
      assert.equal(pricing.serviceFeeAmountMinor, 400);

      assert.equal(pricing.merchantFeeAmountMinor, 200);
      assert.equal(pricing.platformFeeAmountMinor, 200);

      assert.equal(pricing.customerPaysMinor, 2_400);

      assert.equal(pricing.finalBchSats, 20_000_000);

      assert.equal(pricing.platformFeeSats, 2_000_000);
    },
  },

  {
    name: '£100 Topup charges 10% and splits £10 equally',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote(100)
      );

      assert.equal(pricing.feeTier, 'percentage');

      assert.equal(pricing.principalMinor, 10_000);
      assert.equal(pricing.serviceFeeAmountMinor, 1_000);

      assert.equal(pricing.merchantFeeAmountMinor, 500);
      assert.equal(pricing.platformFeeAmountMinor, 500);

      assert.equal(pricing.customerPaysMinor, 11_000);

      assert.equal(pricing.finalBchSats, 100_000_000);
      assert.equal(pricing.marketBchSats, 100_000_000);

      assert.equal(pricing.platformFeeSats, 5_000_000);

      assert.equal(pricing.merchantFeeEquivalentSats, 5_000_000);
    },
  },

  {
    name: '£1,000 Topup caps fee at £50',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        100_000,
        createLockedQuote(100)
      );

      assert.equal(pricing.feeTier, 'maximum');

      assert.equal(pricing.principalMinor, 100_000);
      assert.equal(pricing.serviceFeeAmountMinor, 5_000);

      assert.equal(pricing.merchantFeeAmountMinor, 2_500);
      assert.equal(pricing.platformFeeAmountMinor, 2_500);

      assert.equal(pricing.customerPaysMinor, 105_000);

      assert.equal(pricing.finalBchSats, 1_000_000_000);
      assert.equal(pricing.platformFeeSats, 25_000_000);
    },
  },

  {
    name: 'principal and platform fee use the same locked quote',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote(500)
      );

      assert.equal(pricing.finalBchSats, 20_000_000);

      assert.equal(pricing.platformFeeSats, 1_000_000);
    },
  },

  {
    name: 'odd-penny service-fee split is preserved before BCH conversion',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        4_005,
        createLockedQuote(100)
      );

      assert.equal(pricing.feeTier, 'percentage');

      assert.equal(pricing.serviceFeeAmountMinor, 401);

      assert.equal(pricing.merchantFeeAmountMinor, 201);
      assert.equal(pricing.platformFeeAmountMinor, 200);

      assert.equal(pricing.customerPaysMinor, 4_406);

      assert.equal(pricing.platformFeeSats, 2_000_000);

      assert.equal(pricing.merchantFeeEquivalentSats, 2_010_000);
    },
  },

  {
    name: 'real LockedPriceQuote metadata is normalised correctly',
    run: () => {
      const quote = createLockedQuote(250);

      const pricing = calculateTopupPricingV1FromLockedQuote(10_000, quote);

      assert.equal(pricing.marketRate, 250);

      assert.equal(pricing.quoteTimestamp, quote.marketRateTimestamp);

      assert.equal(pricing.quoteSource, quote.provider);

      assert.equal(pricing.quoteLockedAt, quote.quoteLockedAt);

      assert.equal(pricing.quoteExpiresAt, quote.quoteExpiresAt);

      assert.equal(pricing.isFallbackQuote, quote.isFallbackQuote);
    },
  },

  {
    name: 'fiat-to-satoshi conversion uses normal nearest-satoshi rounding',
    run: () => {
      const sats = convertFiatMinorToSatsAtRate(1, 500, 2);

      assert.equal(sats, 2_000);
    },
  },

  {
    name: 'invalid market rate is rejected',
    run: () => {
      assert.throws(
        () =>
          calculateTopupPricingV1FromLockedQuote(10_000, createLockedQuote(0)),
        /Market rate must be a positive finite number/
      );
    },
  },

  {
    name: 'unsupported currency fails closed',
    run: () => {
      const quote: TopupLockedQuoteLike = {
        ...createLockedQuote(100),
        fiatCurrency: 'USD',
      };

      assert.throws(
        () => calculateTopupPricingV1FromLockedQuote(10_000, quote),
        /No Fee Model v1 schedule is configured/
      );
    },
  },

  {
    name: 'snapshot stores v1 commercial terms without final network recovery',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote(100)
      );

      const snapshot = createTopupFeeModelV1Snapshot(pricing, {
        estimatedNetworkFeeSats: 500,
        snapshotCreatedAt: '2026-08-10T12:05:00.000Z',
      });

      assert.equal(snapshot.version, 'topup_v1');
      assert.equal(snapshot.principalMinor, 10_000);

      assert.equal(snapshot.serviceFeeMinor, 1_000);
      assert.equal(snapshot.merchantFeeMinor, 500);
      assert.equal(snapshot.platformFeeMinor, 500);

      assert.equal(snapshot.networkFee.status, 'estimated');

      assert.equal(snapshot.networkFee.feeSats, 500);

      assert.equal(snapshot.networkFee.recoveryMinor, undefined);

      assert.equal(snapshot.customerTotalMinor, undefined);

      assert.equal(snapshot.snapshotCreatedAt, '2026-08-10T12:05:00.000Z');
    },
  },

  {
    name: 'snapshot can explicitly record network fee not yet calculated',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote()
      );

      const snapshot = createTopupFeeModelV1Snapshot(pricing, {
        snapshotCreatedAt: '2026-08-10T12:05:00.000Z',
      });

      assert.equal(snapshot.networkFee.status, 'not_calculated');

      assert.equal(snapshot.networkFee.feeSats, undefined);
      assert.equal(snapshot.customerTotalMinor, undefined);
    },
  },

  {
    name: 'negative estimated network fee is rejected',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote()
      );

      assert.throws(
        () =>
          createTopupFeeModelV1Snapshot(pricing, {
            estimatedNetworkFeeSats: -1,
          }),
        /Estimated network fee must be a non-negative safe integer/
      );
    },
  },
];

let passedTests = 0;

for (const test of tests) {
  try {
    test.run();
    passedTests += 1;
    console.log(`✓ ${test.name}`);
  } catch (error) {
    console.error(`✗ ${test.name}`);

    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error(
    `\n${passedTests}/${tests.length} Topup Pricing v1 tests passed.`
  );
} else {
  console.log(
    `\nAll ${passedTests} Topup Pricing v1 tests passed successfully.`
  );
}
