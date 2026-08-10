import { strict as assert } from 'assert';

import { createTreasuryFundingPreview } from './treasury-funding';
import type { TreasuryUtxo } from '../types/treasury';

interface TreasuryFundingTest {
  name: string;
  run: () => void;
}

function createUtxo(valueSats: number, index = 0): TreasuryUtxo {
  return {
    outpointTransactionHash: `${valueSats}`.padStart(64, '0'),
    outpointIndex: index,
    valueSats,
  } as TreasuryUtxo;
}

const tests: TreasuryFundingTest[] = [
  {
    name: 'legacy-style preview defaults fee outputs to zero',
    run: () => {
      const preview = createTreasuryFundingPreview({
        treasuryAddress: 'treasury-address',
        voucherAddress: 'voucher-address',
        amountSats: 5_000,
        treasuryBalanceSats: 6_000,
        treasuryUtxoCount: 1,
        treasuryUtxos: [createUtxo(6_000)],
      });

      assert.equal(preview.platformFeeSats, 0);
      assert.equal(preview.bufferReserveSats, 0);
      assert.equal(preview.estimatedFeeSats, 500);
      assert.equal(preview.estimatedTotalRequiredSats, 5_500);
      assert.equal(preview.estimatedChangeSats, 500);
      assert.equal(preview.isAffordable, true);
    },
  },

  {
    name: 'platform fee is included in treasury affordability',
    run: () => {
      const preview = createTreasuryFundingPreview({
        treasuryAddress: 'treasury-address',
        voucherAddress: 'voucher-address',
        amountSats: 5_000,
        platformFeeSats: 1_000,
        treasuryBalanceSats: 6_000,
        treasuryUtxoCount: 1,
        treasuryUtxos: [createUtxo(6_000)],
      });

      assert.equal(preview.platformFeeSats, 1_000);
      assert.equal(preview.estimatedFeeSats, 500);
      assert.equal(preview.estimatedTotalRequiredSats, 6_500);
      assert.equal(preview.estimatedChangeSats, -500);
      assert.equal(preview.isAffordable, false);
    },
  },

  {
    name: 'UTXO selection continues until platform fee is covered',
    run: () => {
      const preview = createTreasuryFundingPreview({
        treasuryAddress: 'treasury-address',
        voucherAddress: 'voucher-address',
        amountSats: 5_000,
        platformFeeSats: 1_000,
        treasuryBalanceSats: 7_000,
        treasuryUtxoCount: 2,
        treasuryUtxos: [createUtxo(6_000, 0), createUtxo(1_000, 1)],
      });

      assert.equal(preview.selectedUtxos.length, 2);
      assert.equal(preview.selectedInputSats, 7_000);
      assert.equal(preview.estimatedTotalRequiredSats, 6_500);
      assert.equal(preview.estimatedChangeSats, 500);
      assert.equal(preview.isAffordable, true);
    },
  },

  {
    name: 'buffer output is also included when explicitly provided',
    run: () => {
      const preview = createTreasuryFundingPreview({
        treasuryAddress: 'treasury-address',
        voucherAddress: 'voucher-address',
        amountSats: 5_000,
        platformFeeSats: 1_000,
        bufferReserveSats: 500,
        treasuryBalanceSats: 7_000,
        treasuryUtxoCount: 1,
        treasuryUtxos: [createUtxo(7_000)],
      });

      assert.equal(preview.platformFeeSats, 1_000);
      assert.equal(preview.bufferReserveSats, 500);
      assert.equal(preview.estimatedFeeSats, 500);
      assert.equal(preview.estimatedTotalRequiredSats, 7_000);
      assert.equal(preview.estimatedChangeSats, 0);
      assert.equal(preview.isAffordable, true);
    },
  },

  {
    name: 'negative platform fee is rejected',
    run: () => {
      assert.throws(
        () =>
          createTreasuryFundingPreview({
            treasuryAddress: 'treasury-address',
            voucherAddress: 'voucher-address',
            amountSats: 5_000,
            platformFeeSats: -1,
            treasuryBalanceSats: 10_000,
            treasuryUtxoCount: 1,
            treasuryUtxos: [createUtxo(10_000)],
          }),
        /Platform fee must be a non-negative safe integer/
      );
    },
  },

  {
    name: 'fractional voucher satoshi amount is rejected',
    run: () => {
      assert.throws(
        () =>
          createTreasuryFundingPreview({
            treasuryAddress: 'treasury-address',
            voucherAddress: 'voucher-address',
            amountSats: 5_000.5,
            treasuryBalanceSats: 10_000,
            treasuryUtxoCount: 1,
            treasuryUtxos: [createUtxo(10_000)],
          }),
        /Voucher amount must be a positive safe integer/
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
    `\n${passedTests}/${tests.length} Treasury Funding tests passed.`
  );
} else {
  console.log(
    `\nAll ${passedTests} Treasury Funding tests passed successfully.`
  );
}
