/**
 * Small test-only assertion helper.
 *
 * We deliberately avoid importing node:assert here because the established
 * Quasar TypeScript project does not expose Node typings to application source
 * files, and this isolated Vite test does not justify changing tsconfig or
 * adding project-wide Node types.
 */
const assert = {
  equal(actual: unknown, expected: unknown, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message ?? `Expected ${String(actual)} to equal ${String(expected)}.`
      );
    }
  },

  notEqual(actual: unknown, expected: unknown, message?: string): void {
    if (actual === expected) {
      throw new Error(
        message ??
          `Expected ${String(actual)} to differ from ${String(expected)}.`
      );
    }
  },

  deepEqual(actual: unknown, expected: unknown, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message ?? 'Expected values to be deeply equal.');
    }
  },

  throws(operation: () => unknown, message?: string): void {
    let didThrow = false;

    try {
      operation();
    } catch {
      didThrow = true;
    }

    if (!didThrow) {
      throw new Error(message ?? 'Expected operation to throw.');
    }
  },

  match(actual: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(actual)) {
      throw new Error(
        message ?? `Expected "${actual}" to match ${String(pattern)}.`
      );
    }
  },
};

import { MockNetworkProvider, Network } from 'cashscript';

import { PLATFORM_FEE_ADDRESS } from 'src/services/platform-fee-config';

import {
  buildCashOutSettlementContractPlan,
  CASH_OUT_SETTLEMENT_FEE_RATE_SATS_PER_BYTE,
} from 'src/services/cash-out-settlement-contract-plan';

import type { CashOutRecord } from 'src/types/cash-out';

/**
 * Deterministic mainnet P2PKH test addresses.
 *
 * These correspond to synthetic public-key hashes and contain no private keys.
 */
const TREASURY_ADDRESS_A =
  'bitcoincash:qqqsyqcyq5rqwzqfpg9scrgwpugpzysnzstne440kw';

const TREASURY_ADDRESS_B =
  'bitcoincash:qqpqyqszqgpqyqszqgpqyqszqgpqyqszqgwfhvumgr';

const ALTERNATE_PLATFORM_ADDRESS =
  'bitcoincash:qqsjygeyy5nzw2pf9g4jctfw9ucrzv3nxsxjm5zeuy';

const CASH_OUT_COMMITMENT_A = '01'.repeat(32);

const CASH_OUT_COMMITMENT_B = '02'.repeat(32);

const BASE_CASH_OUT: CashOutRecord = {
  id: 'cash-out-d1c3-001',

  serial: 'CO-D1C3-001',

  createdAt: '2026-09-09T12:00:00.000Z',

  updatedAt: '2026-09-09T12:00:00.000Z',

  fiatCurrency: 'GBP',

  fiatAmountMinor: 10_000,

  customerSendsFiatEquivalentMinor: 10_300,

  marketBchSats: 202_000,

  bchSatsRequired: 206_000,

  quote: {
    source: 'coingecko',

    fiatCurrency: 'GBP',

    marketRate: 400,

    marketRateTimestamp: '2026-09-09T11:59:30.000Z',

    quoteLockedAt: '2026-09-09T12:00:00.000Z',

    quoteExpiresAt: '2026-09-09T12:05:00.000Z',

    isFallbackQuote: false,
  },

  fee: {
    feeModel: 'cash_out_v1',

    totalServiceFeeBasisPoints: 300,

    totalServiceFeeAmountMinor: 300,

    platformFeeBasisPoints: 150,

    platformFeeAmountMinor: 150,

    merchantFeeBasisPoints: 150,

    merchantFeeAmountMinor: 150,

    settlementMode: 'accounting_only',
  },

  treasuryMasterAddress: TREASURY_ADDRESS_A,

  treasuryReceivingAddress: TREASURY_ADDRESS_A,

  status: 'quote_locked',
};

function createMainnetMockProvider(): MockNetworkProvider {
  const provider = new MockNetworkProvider();

  /**
   * MockNetworkProvider performs no external network activity.
   *
   * For D1C.3 we set its public network identity to mainnet so CashScript
   * derives the same P2SH32 CashAddr that production will use.
   */
  provider.network = Network.MAINNET;

  return provider;
}

function buildPlan(input?: {
  cashOut?: CashOutRecord;

  cashOutCommitmentHex?: string;

  treasuryAddress?: string;

  platformAddress?: string;
}) {
  return buildCashOutSettlementContractPlan({
    cashOut: input?.cashOut ?? BASE_CASH_OUT,

    cashOutCommitmentHex: input?.cashOutCommitmentHex ?? CASH_OUT_COMMITMENT_A,

    treasuryAddress: input?.treasuryAddress ?? TREASURY_ADDRESS_A,

    platformAddress: input?.platformAddress,

    provider: createMainnetMockProvider(),
  });
}

/**
 * Same frozen inputs must produce the exact same complete contract plan.
 */
const firstPlan = buildPlan();

const secondPlan = buildPlan();

assert.deepEqual(firstPlan, secondPlan);

console.log(
  'PASS: same Cash-out inputs produce exactly the same deterministic contract plan'
);

assert.equal(firstPlan.contractType, 'p2sh32');

assert.equal(
  firstPlan.settlementFeeRateSatsPerByte,
  CASH_OUT_SETTLEMENT_FEE_RATE_SATS_PER_BYTE
);

assert.equal(
  firstPlan.settlementPlan.settlementFeeSats,
  firstPlan.settlementTransactionSizeBytes
);

assert.equal(
  firstPlan.settlementPlan.treasuryOutputSats +
    firstPlan.settlementPlan.platformOutputSats +
    firstPlan.settlementPlan.settlementFeeSats,
  firstPlan.settlementPlan.paymentSats
);

assert.equal(
  firstPlan.settlementPlan.platformDestination.address,
  PLATFORM_FEE_ADDRESS
);

assert.equal(
  firstPlan.contractBytecodeHex.length,
  firstPlan.contractBytecodeSize * 2
);

assert.match(firstPlan.contractAddress, /^bitcoincash:/);

console.log(
  'PASS: production contract identity and final settlement economics reconcile'
);

/**
 * A separate Cash-out commitment must create a separate contract even when
 * economics and destinations are identical.
 */
const differentCommitmentPlan = buildPlan({
  cashOutCommitmentHex: CASH_OUT_COMMITMENT_B,
});

assert.notEqual(
  differentCommitmentPlan.contractAddress,
  firstPlan.contractAddress
);

assert.notEqual(
  differentCommitmentPlan.contractBytecodeHex,
  firstPlan.contractBytecodeHex
);

console.log(
  'PASS: different Cash-out commitment produces a different contract'
);

/**
 * One satoshi economic change must alter contract identity because paymentSats
 * is a frozen constructor value.
 */
const oneSatoshiChangedPlan = buildPlan({
  cashOut: {
    ...BASE_CASH_OUT,

    bchSatsRequired: BASE_CASH_OUT.bchSatsRequired + 1,
  },
});

assert.notEqual(
  oneSatoshiChangedPlan.contractAddress,
  firstPlan.contractAddress
);

console.log('PASS: one-satoshi economic change produces a different contract');

/**
 * Treasury identity is contractual.
 */
const differentTreasuryPlan = buildPlan({
  treasuryAddress: TREASURY_ADDRESS_B,
});

assert.notEqual(
  differentTreasuryPlan.contractAddress,
  firstPlan.contractAddress
);

console.log(
  'PASS: different Treasury destination produces a different contract'
);

/**
 * Platform identity is contractual.
 */
const differentPlatformPlan = buildPlan({
  platformAddress: ALTERNATE_PLATFORM_ADDRESS,
});

assert.notEqual(
  differentPlatformPlan.contractAddress,
  firstPlan.contractAddress
);

console.log(
  'PASS: different platform destination produces a different contract'
);

/**
 * Zero/malformed commitments fail closed.
 */
assert.throws(() => {
  buildPlan({
    cashOutCommitmentHex: '00'.repeat(32),
  });
});

assert.throws(() => {
  buildPlan({
    cashOutCommitmentHex: 'abcd',
  });
});

console.log('PASS: malformed or zero Cash-out commitments are rejected');

/**
 * D1C.1 fail-closed record semantics must remain active through the real
 * CashScript planning path.
 */
assert.throws(() => {
  buildPlan({
    cashOut: {
      ...BASE_CASH_OUT,

      status: 'awaiting_payment',
    },
  });
});

assert.throws(() => {
  buildPlan({
    cashOut: {
      ...BASE_CASH_OUT,

      quote: {
        ...BASE_CASH_OUT.quote,

        quoteLockedAt: undefined,
      },
    },
  });
});

console.log('PASS: invalid or no-longer-quote-locked Cash-outs fail closed');

/**
 * Contract identity must never accidentally be planned for another network.
 */
assert.throws(() => {
  buildCashOutSettlementContractPlan({
    cashOut: BASE_CASH_OUT,

    cashOutCommitmentHex: CASH_OUT_COMMITMENT_A,

    treasuryAddress: TREASURY_ADDRESS_A,

    provider: new MockNetworkProvider(),
  });
});

console.log('PASS: non-mainnet contract planning is rejected');

console.log('');
console.log('Cash-out Settlement D1C.3 contract planning tests passed.');

console.log('');
console.log(`Contract address: ${firstPlan.contractAddress}`);
console.log(`Contract type: ${firstPlan.contractType}`);

console.log(`Contract bytecode size: ${firstPlan.contractBytecodeSize} bytes`);

console.log(
  `Settlement transaction size: ${firstPlan.settlementTransactionSizeBytes} bytes`
);

console.log(
  `Frozen settlement fee: ${firstPlan.settlementPlan.settlementFeeSats} sats`
);

console.log(
  `Treasury output: ${firstPlan.settlementPlan.treasuryOutputSats} sats`
);

console.log(
  `Platform output: ${firstPlan.settlementPlan.platformOutputSats} sats`
);
