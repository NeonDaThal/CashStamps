import { strict as assert } from 'assert';

import {
  calculateCashOutFeeModelV1,
  calculateTopupFeeModelV1,
} from './fee-model';

interface FeeModelTest {
  name: string;
  run: () => void;
}

const tests: FeeModelTest[] = [
  {
    name: 'Topup £0.01 uses the minimum tier with no commercial minimum',
    run: () => {
      const result = calculateTopupFeeModelV1(1, 'GBP');

      assert.equal(result.feeTier, 'minimum');
      assert.equal(result.serviceFeeMinor, 400);
      assert.equal(result.merchantFeeMinor, 200);
      assert.equal(result.platformFeeMinor, 200);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 401);
    },
  },

  {
    name: 'Topup £39.99 uses the £4 minimum fee',
    run: () => {
      const result = calculateTopupFeeModelV1(3_999, 'GBP');

      assert.equal(result.feeTier, 'minimum');
      assert.equal(result.serviceFeeMinor, 400);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 4_399);
    },
  },

  {
    name: 'Topup £40.00 is the final amount in the minimum tier',
    run: () => {
      const result = calculateTopupFeeModelV1(4_000, 'GBP');

      assert.equal(result.feeTier, 'minimum');
      assert.equal(result.serviceFeeMinor, 400);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 4_400);
    },
  },

  {
    name: 'Topup £40.01 is the first amount in the percentage tier',
    run: () => {
      const result = calculateTopupFeeModelV1(4_001, 'GBP');

      assert.equal(result.feeTier, 'percentage');

      // 10% = 400.1 pence, which rounds to £4.00.
      assert.equal(result.serviceFeeMinor, 400);

      assert.equal(result.merchantFeeMinor, 200);
      assert.equal(result.platformFeeMinor, 200);

      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 4_401);
    },
  },

  {
    name: 'Topup £40.05 percentage fee rounds to £4.01',
    run: () => {
      const result = calculateTopupFeeModelV1(4_005, 'GBP');

      assert.equal(result.feeTier, 'percentage');
      assert.equal(result.serviceFeeMinor, 401);

      // Odd penny goes to the merchant.
      assert.equal(result.merchantFeeMinor, 201);
      assert.equal(result.platformFeeMinor, 200);

      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 4_406);
    },
  },

  {
    name: 'Topup £499.99 remains in percentage tier',
    run: () => {
      const result = calculateTopupFeeModelV1(49_999, 'GBP');

      assert.equal(result.feeTier, 'percentage');
      assert.equal(result.serviceFeeMinor, 5_000);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 54_999);
    },
  },

  {
    name: 'Topup £500.00 is the final amount in percentage tier',
    run: () => {
      const result = calculateTopupFeeModelV1(50_000, 'GBP');

      assert.equal(result.feeTier, 'percentage');
      assert.equal(result.serviceFeeMinor, 5_000);
      assert.equal(result.merchantFeeMinor, 2_500);
      assert.equal(result.platformFeeMinor, 2_500);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 55_000);
    },
  },

  {
    name: 'Topup £500.01 is the first amount in maximum tier',
    run: () => {
      const result = calculateTopupFeeModelV1(50_001, 'GBP');

      assert.equal(result.feeTier, 'maximum');
      assert.equal(result.serviceFeeMinor, 5_000);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 55_001);
    },
  },

  {
    name: 'Topup £1,000.00 remains capped at £50',
    run: () => {
      const result = calculateTopupFeeModelV1(100_000, 'GBP');

      assert.equal(result.feeTier, 'maximum');
      assert.equal(result.serviceFeeMinor, 5_000);
      assert.equal(result.merchantFeeMinor, 2_500);
      assert.equal(result.platformFeeMinor, 2_500);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 105_000);
    },
  },

  {
    name: 'Cash-out £20.00 charges 3% and splits it equally',
    run: () => {
      const result = calculateCashOutFeeModelV1(2_000, 'GBP');

      assert.equal(result.serviceFeeMinor, 60);
      assert.equal(result.merchantFeeMinor, 30);
      assert.equal(result.platformFeeMinor, 30);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 2_060);
    },
  },

  {
    name: 'Cash-out £100.00 charges £3.00',
    run: () => {
      const result = calculateCashOutFeeModelV1(10_000, 'GBP');

      assert.equal(result.serviceFeeMinor, 300);
      assert.equal(result.merchantFeeMinor, 150);
      assert.equal(result.platformFeeMinor, 150);
      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 10_300);
    },
  },

  {
    name: 'Cash-out odd-penny fee gives remainder to merchant',
    run: () => {
      const result = calculateCashOutFeeModelV1(100, 'GBP');

      // £1.00 × 3% = £0.03.
      assert.equal(result.serviceFeeMinor, 3);

      assert.equal(result.merchantFeeMinor, 2);
      assert.equal(result.platformFeeMinor, 1);

      assert.equal(result.customerTotalBeforeNetworkFeeMinor, 103);
    },
  },

  {
    name: 'Topup records the GBP schedule snapshot',
    run: () => {
      const result = calculateTopupFeeModelV1(10_000, 'GBP');

      assert.equal(result.version, 'topup_v1');
      assert.equal(result.currency, 'GBP');

      assert.equal(
        result.scheduleSnapshot.minimumTierMaximumPrincipalMinor,
        4_000
      );

      assert.equal(
        result.scheduleSnapshot.percentageTierMaximumPrincipalMinor,
        50_000
      );

      assert.equal(result.scheduleSnapshot.minimumFeeMinor, 400);
      assert.equal(result.scheduleSnapshot.percentageBasisPoints, 1_000);
      assert.equal(result.scheduleSnapshot.maximumFeeMinor, 5_000);
    },
  },

  {
    name: 'Cash-out records the GBP schedule snapshot',
    run: () => {
      const result = calculateCashOutFeeModelV1(10_000, 'GBP');

      assert.equal(result.version, 'cashout_v1');
      assert.equal(result.currency, 'GBP');
      assert.equal(result.scheduleSnapshot.minorUnitDigits, 2);
      assert.equal(result.scheduleSnapshot.percentageBasisPoints, 300);
    },
  },

  {
    name: 'Zero principal is rejected',
    run: () => {
      assert.throws(
        () => calculateTopupFeeModelV1(0, 'GBP'),
        /Principal amount must be at least/
      );
    },
  },

  {
    name: 'Fractional minor-unit principal is rejected',
    run: () => {
      assert.throws(
        () => calculateCashOutFeeModelV1(100.5, 'GBP'),
        /safe integer/
      );
    },
  },

  {
    name: 'Unsupported currencies fail closed',
    run: () => {
      assert.throws(
        () => calculateTopupFeeModelV1(10_000, 'USD'),
        /No Fee Model v1 schedule is configured/
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
  console.error(`\n${passedTests}/${tests.length} Fee Model v1 tests passed.`);
} else {
  console.log(`\nAll ${passedTests} Fee Model v1 tests passed successfully.`);
}
