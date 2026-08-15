import { strict as assert } from 'assert';

import {
  calculateTopupPricingV1FromLockedQuote,
  createTopupFeeModelV1Snapshot,
  type TopupLockedQuoteLike,
} from './topup-pricing-v1';
import { createVoucherFeeOutputPlanV1Core } from './voucher-fee-plan-v1-core';
import { createDraftVoucherRecord } from './voucher-factory';

interface IntegrationTest {
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

const tests: IntegrationTest[] = [
  {
    name: '£2 minimum-tier Topup routes half of the 50p fee to platform',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        200,
        createLockedQuote()
      );

      const plan = createVoucherFeeOutputPlanV1Core(
        pricing,
        'bitcoincash:test-platform-address'
      );

      assert.equal(pricing.principalMinor, 200);
      assert.equal(pricing.serviceFeeAmountMinor, 50);
      assert.equal(pricing.customerPaysMinor, 250);

      assert.equal(pricing.finalBchSats, 2_000_000);

      assert.equal(plan.platformFeeSats, 250_000);
      assert.equal(plan.merchantRetainedSats, 250_000);

      assert.equal(plan.bufferReserveSats, 0);
      assert.equal(plan.bufferReserveOutputEnabled, false);

      // 25p is 12.5% of the £2 principal.
      assert.equal(plan.platformFeeBasisPoints, 1_250);
      assert.equal(plan.merchantRetainedBasisPoints, 1_250);

      // 50p is an effective 25% fee on a £2 Topup.
      assert.equal(plan.totalServiceFeeBasisPoints, 2_500);
    },
  },

  {
    name: '£100 percentage-tier Topup produces a 5% platform share',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote()
      );

      const plan = createVoucherFeeOutputPlanV1Core(
        pricing,
        'bitcoincash:test-platform-address'
      );

      assert.equal(pricing.serviceFeeAmountMinor, 1_000);

      assert.equal(plan.platformFeeSats, 5_000_000);
      assert.equal(plan.merchantRetainedSats, 5_000_000);

      assert.equal(plan.platformFeeBasisPoints, 500);
      assert.equal(plan.merchantRetainedBasisPoints, 500);
      assert.equal(plan.totalServiceFeeBasisPoints, 1_000);

      assert.equal(plan.bufferReserveSats, 0);
    },
  },

  {
    name: '£1000 capped Topup routes £25 platform share without buffer',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        100_000,
        createLockedQuote()
      );

      const plan = createVoucherFeeOutputPlanV1Core(
        pricing,
        'bitcoincash:test-platform-address'
      );

      assert.equal(pricing.serviceFeeAmountMinor, 5_000);

      assert.equal(plan.platformFeeSats, 25_000_000);
      assert.equal(plan.merchantRetainedSats, 25_000_000);

      // £25 is 2.5% of £1000.
      assert.equal(plan.platformFeeBasisPoints, 250);
      assert.equal(plan.merchantRetainedBasisPoints, 250);

      // £50 is an effective 5%.
      assert.equal(plan.totalServiceFeeBasisPoints, 500);

      assert.equal(plan.bufferReserveSats, 0);
    },
  },

  {
    name: 'v1 voucher record stores customer cash and separate principal snapshot',
    run: () => {
      const pricing = calculateTopupPricingV1FromLockedQuote(
        10_000,
        createLockedQuote()
      );

      const feeOutputPlan = createVoucherFeeOutputPlanV1Core(
        pricing,
        'bitcoincash:test-platform-address'
      );

      const feeModel = createTopupFeeModelV1Snapshot(pricing, {
        estimatedNetworkFeeSats: 500,
        snapshotCreatedAt: '2026-08-10T12:05:00.000Z',
      });

      const voucher = createDraftVoucherRecord(
        pricing.customerPaysMinor,
        pricing.fiatCurrency,
        pricing,
        {
          addressData: {
            derivationIndex: 123,
            address: 'bitcoincash:test-voucher-address',
          },
          feeModel,
          feeOutputPlan,
        }
      );

      // Compatibility field continues to mean customer cash collected.
      assert.equal(voucher.fiatAmountMinor, 11_000);

      // V1 snapshot records the true Topup principal separately.
      assert.equal(voucher.feeModel?.principalMinor, 10_000);

      assert.equal(voucher.feeModel?.serviceFeeMinor, 1_000);
      assert.equal(voucher.feeModel?.merchantFeeMinor, 500);
      assert.equal(voucher.feeModel?.platformFeeMinor, 500);

      assert.equal(voucher.finalBchSats, 100_000_000);

      assert.equal(voucher.fee.type, 'percentage');
      assert.equal(voucher.fee.basisPoints, 1_000);
      assert.equal(voucher.fee.amountMinor, 1_000);

      assert.equal(voucher.feeOutputPlan?.platformFeeSats, 5_000_000);

      assert.equal(voucher.feeOutputPlan?.bufferReserveSats, 0);
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
    `\n${passedTests}/${tests.length} Topup v1 integration tests passed.`
  );
} else {
  console.log(
    `\nAll ${passedTests} Topup v1 integration tests passed successfully.`
  );
}
