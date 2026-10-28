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
import * as nodeCrypto from 'crypto';

import {
  createCashOutContractSessionWithDependencies,
  createCashOutContractPaymentSession,
  getCashOutContractPaymentPresentation,
  type CashOutContractSessionDisplay,
  type CashOutPaymentSessionDependencies,
  type CashOutContractSessionCreationDependencies,
} from './cash-out-contract-session';
import { classifyCashOutContractPayment } from './cash-out-contract-payment-classifier';
import { bindCashOutSettlementPaymentInspection } from './cash-out-settlement-payment-inspector';
import type { CashOutPaymentObservation } from './cash-out-contract-network';
import type { CashOutContractUtxo } from 'src/types/cash-out-contract-payment';
import { storeCashOutContractSessionWithDependencies } from './cash-out-store';
import { calculateCashOutPricingFromLockedQuote } from './cash-out-pricing';
import { createCashOutPaymentUri } from './cash-out-payment-uri';
import { getCashOutQuoteRemainingMilliseconds } from './cash-out-quote-policy';
import en from 'src/i18n/messages/en';
import type { LockedPriceQuote } from 'src/types/pricing';

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

// E1 adds only the creation/store composition to this existing production-plan
// suite. Node 18 script mode needs its REAL Web Crypto exposed for this test.
const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: (nodeCrypto as unknown as { webcrypto: Crypto }).webcrypto,
  });
}
const creationQuote: LockedPriceQuote = {
  provider: 'coingecko',
  fiatCurrency: 'GBP',
  marketRate: 500,
  marketRateTimestamp: BASE_CASH_OUT.createdAt,
  quoteLockedAt: BASE_CASH_OUT.createdAt,
  quoteExpiresAt: '2026-09-09T12:05:00.000Z',
  isFallbackQuote: false,
};
function creationHarness(
  options: { fail?: boolean; beforeWrite?: () => Promise<void> } = {}
) {
  let serialized = JSON.stringify([BASE_CASH_OUT]); // Legacy record stays readable.
  const calls = { quotes: 0, treasury: 0, writes: 0, provider: 0 };
  const storage = {
    async getCashOutRecords(): Promise<CashOutRecord[]> {
      return JSON.parse(serialized) as CashOutRecord[];
    },
    async writeCashOutRecords(records: CashOutRecord[]) {
      calls.writes += 1;
      await options.beforeWrite?.();
      if (options.fail) throw new Error('Synthetic durable write failed');
      serialized = JSON.stringify(records);
    },
  };
  const dependencies: CashOutContractSessionCreationDependencies = {
    async getCashOutRecordById(id) {
      return (await storage.getCashOutRecords()).find(
        (record) => record.id === id
      );
    },
    async getLockedQuote(currency, options) {
      calls.quotes += 1;
      assert.equal(currency, 'GBP');
      assert.equal(options?.ttlMilliseconds, 300_000);
      return structuredClone(creationQuote);
    },
    async getTreasuryAddress() {
      calls.treasury += 1;
      return TREASURY_ADDRESS_A;
    },
    storeSession: (record) =>
      storeCashOutContractSessionWithDependencies(record, storage),
    now: () => BASE_CASH_OUT.createdAt,
  };
  const provider = new Proxy(createMainnetMockProvider(), {
    get(target, key, receiver) {
      const value: unknown = Reflect.get(target, key, receiver);
      if (typeof value === 'function')
        return () => {
          calls.provider += 1;
          throw new Error(`E1 must not invoke provider.${String(key)}`);
        };
      return value;
    },
  });
  const input = {
    id: 'cash-out-e1-001',
    serial: 'CO-E1-001',
    fiatAmountMinor: 10_000,
    provider,
  };
  return {
    calls,
    storage,
    input,
    dependencies,
    run: () =>
      createCashOutContractSessionWithDependencies(input, dependencies),
  };
}
async function rejectsCreation(operation: Promise<unknown>): Promise<void> {
  let rejected = false;
  try {
    await operation;
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, 'Expected frozen creation to fail closed.');
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

// E3 tests the new session composition, with network/signing boundaries replaced
// by controlled dependencies. Phase D already proves the transaction internals.
async function paymentSessionHarness() {
  const creation = creationHarness();
  let record = await creation.run();
  const plan = record.settlementContractPlan;
  if (!plan) throw new Error('E3 requires the durable E1 plan.');
  let now = Date.parse(record.createdAt) + 1_000;
  const payment = (values: number[]): CashOutPaymentObservation => ({
    status: 'observed',
    server: 'synthetic',
    observation: bindCashOutSettlementPaymentInspection(plan, {
      observedAt: new Date(now).toISOString(),
      payment: classifyCashOutContractPayment({
        contractAddress: plan.contractAddress,
        requiredSats: record.bchSatsRequired,
        utxos: values.map(
          (satoshis, vout): CashOutContractUtxo => ({
            txid: 'ab'.repeat(32),
            vout,
            satoshis,
            height: 0,
          })
        ),
      }),
    }),
  });
  // Include nuisance outputs: production still selects the one exact output.
  let observation = payment([1, record.bchSatsRequired, 2]);
  let observationGate: Promise<void> | undefined;
  const entered = deferred();
  const displays: CashOutContractSessionDisplay[] = [];
  const calls = {
    observe: 0,
    prepare: 0,
    advance: 0,
    stopPoll: 0,
    stopWatch: 0,
    writes: 0,
  };
  let poll = () => undefined as void;
  let pollScheduled = false;
  const pollIntervals: number[] = [];
  let notification = () => undefined as void;
  let positive = false;
  let settlementUnavailable = false;
  let watchConnected = true;
  const dependencies: CashOutPaymentSessionDependencies = {
    async getCashOutRecordById() {
      return structuredClone(record);
    },
    async mutateCashOutRecordAtomically(id, updater) {
      assert.equal(id, record.id);
      const next = updater(record);
      if (next !== record) {
        calls.writes += 1;
        record = structuredClone(next);
      }
      return structuredClone(record);
    },
    async observePayment(current) {
      assert.deepEqual(current.settlementContractPlan, plan);
      calls.observe += 1;
      entered.resolve();
      await observationGate;
      return observation;
    },
    async prepareSettlement(input) {
      calls.prepare += 1;
      if (observation.status !== 'observed') throw new Error('No candidate.');
      assert.equal(
        input.candidate,
        observation.observation.normalSettlementCandidate
      );
      assert.equal(input.candidate.vout, 1);
      assert.equal(record.status, 'received');
      assert.equal(record.receivedTxid, input.candidate.txid);
      assert.deepEqual(input.contractPlan, plan);
      // Boundary result fixture only; never submitted or accepted as real bytes.
      record = {
        ...record,
        settlementIntent: {
          status: 'prepared',
          cashOutId: record.id,
          cashOutSerial: record.serial,
          cashOutCommitmentHex: plan.cashOutCommitmentHex,
          contractAddress: plan.contractAddress,
          sourcePaymentTxid: input.candidate.txid,
          sourceOutpointIndex: input.candidate.vout,
          sourceValueSats: input.candidate.satoshis,
          rawTransactionHex: '00',
          txid: 'cd'.repeat(32),
          rawTransactionBytesLength: 1,
          treasuryAddress: plan.settlementPlan.treasuryDestination.address,
          treasuryOutputSats: plan.settlementPlan.treasuryOutputSats,
          platformAddress: plan.settlementPlan.platformDestination.address,
          platformOutputSats: plan.settlementPlan.platformOutputSats,
          actualFeeSats: plan.settlementPlan.settlementFeeSats,
          inputCount: 1,
          outputCount: 2,
          broadcastEnabled: false,
          preparedAt: new Date(now).toISOString(),
        },
      };
      return structuredClone(record);
    },
    async advanceSettlement(id) {
      calls.advance += 1;
      assert.equal(id, record.id);
      assert.equal(
        Boolean(record.settlementIntent),
        true,
        'Network advancement requires durable intent.'
      );
      if (settlementUnavailable) {
        const reconciliation = {
          txid: record.settlementIntent?.txid ?? '',
          status: 'unavailable' as const,
          serverChecks: [],
          checkedAt: new Date(now).toISOString(),
          message: 'Synthetic unavailable read',
        };
        record = { ...record, settlementReconciliation: reconciliation };
        return {
          record: structuredClone(record),
          outcome: 'uncertain',
          reconciliation,
        };
      }
      return {
        record: structuredClone(record),
        outcome: positive ? 'mempool' : 'blocked',
      };
    },
    async subscribe(current, notify) {
      assert.equal(
        current.settlementContractPlan?.contractAddress,
        plan.contractAddress
      );
      notification = notify;
      return {
        isConnected: () => watchConnected,
        async stop() {
          calls.stopWatch += 1;
        },
      };
    },
    schedulePoll(notify, milliseconds) {
      poll = notify;
      pollScheduled = true;
      pollIntervals.push(milliseconds);
      return () => {
        pollScheduled = false;
        calls.stopPoll += 1;
      };
    },
    now: () => now,
  };
  const session = createCashOutContractPaymentSession(
    {
      cashOutId: record.id,
      provider: creation.input.provider,
      onUpdate: (display) => displays.push(display),
    },
    dependencies
  );
  return {
    session,
    calls,
    displays,
    entered,
    payment,
    pollIntervals,
    record: () => structuredClone(record),
    poll: () => {
      if (pollScheduled) poll();
    },
    notify: () => notification(),
    setObservation: (value: CashOutPaymentObservation) => {
      observation = value;
    },
    hold: (gate: Promise<void>) => {
      observationGate = gate;
    },
    expire: () => {
      now = Date.parse(record.quote.quoteExpiresAt ?? '');
    },
    elapse: (milliseconds: number) => {
      now += milliseconds;
    },
    remaining: () => getCashOutQuoteRemainingMilliseconds(record.quote, now),
    positive: () => {
      positive = true;
    },
    unavailableSettlement: () => {
      settlementUnavailable = true;
    },
    disconnect: () => {
      watchConnected = false;
    },
  };
}

async function runE3PaymentSessionTests() {
  {
    const h = await paymentSessionHarness();
    const release = deferred();
    h.hold(release.promise);
    const starting = h.session.start();
    await h.entered.promise;
    h.poll();
    h.notify();
    const focused = h.session.requestAdvance();
    assert.equal(h.calls.prepare, 0);
    release.resolve();
    await Promise.all([starting, focused]);
    assert.equal(h.calls.observe, 1);
    assert.equal(h.calls.prepare, 1);
    assert.equal(
      h.displays.some((display) => display.state === 'payment_detected'),
      true
    );
    assert.equal(
      h.displays.some((display) => display.state === 'settlement_blocked'),
      true
    );
    const intent = h.record().settlementIntent;
    h.positive();
    await h.session.requestAdvance();
    assert.equal(
      h.displays[h.displays.length - 1].state,
      'settlement_observed'
    );
    assert.equal(
      h.displays.every(
        (display) =>
          display.cashHandoverAllowed === false &&
          display.record.status !== 'completed' &&
          !display.record.completedAt
      ),
      true
    );
    assert.deepEqual(h.record().settlementIntent, intent);
    assert.equal(h.calls.prepare, 1);
    await h.session.stop();
    assert.equal(h.calls.stopPoll, 1);
    assert.equal(h.calls.stopWatch, 1);
    const count = h.displays.length;
    h.notify();
    h.poll();
    await h.session.requestAdvance();
    assert.equal(h.displays.length, count);
    assert.deepEqual(h.record().settlementIntent, intent);
    console.log(
      'PASS: E3 coalesces watch/poll/focus requests, forwards the exact production-bound candidate once, reuses durable intent and never permits cash handover'
    );
  }
  {
    const h = await paymentSessionHarness();
    const required = h.record().bchSatsRequired;
    for (const values of [
      [],
      [required - 1],
      [required + 1],
      [1, 2],
      [required, required],
      [required, required + 1],
    ]) {
      h.setObservation(h.payment(values));
      await h.session.start();
      assert.equal(
        h.displays[h.displays.length - 1].state,
        values.length ? 'payment_needs_resolution' : 'awaiting_payment'
      );
    }
    h.setObservation({ status: 'unavailable', errors: [] });
    await h.session.requestAdvance();
    assert.equal(
      h.displays[h.displays.length - 1].state,
      'payment_needs_resolution'
    );
    assert.equal(h.calls.prepare, 0);
    assert.equal(h.calls.advance, 0);
    assert.equal(h.record().status, 'awaiting_payment');
    await h.session.stop();
    console.log(
      'PASS: E3 respects production exceptional classifications and unavailable observations without normal preparation or completion'
    );
  }
  for (const closing of [false, true]) {
    const h = await paymentSessionHarness();
    const before = h.record();
    const release = deferred();
    h.hold(release.promise);
    const running = h.session.start();
    await h.entered.promise;
    if (closing) await h.session.stop();
    else h.expire();
    const count = h.displays.length;
    release.resolve();
    await running;
    assert.equal(h.calls.prepare, 0);
    assert.equal(h.calls.advance, 0);
    assert.equal(h.calls.writes, 0);
    assert.deepEqual(h.record(), before);
    if (closing) assert.equal(h.displays.length, count);
    else {
      assert.equal(
        h.displays[h.displays.length - 1].state,
        'payment_needs_resolution'
      );
      await h.session.stop();
    }
    assert.equal(h.calls.stopPoll, 1);
  }
  console.log(
    'PASS: E3 expiry during observation stops preparation; close stops watchers/timers, suppresses late results and preserves the durable record'
  );
  {
    const h = await paymentSessionHarness();
    h.setObservation({ status: 'unavailable', errors: [] });
    await h.session.start();
    assert.deepEqual(h.pollIntervals, [10_000]);
    assert.equal(h.displays[h.displays.length - 1].state, 'awaiting_payment');
    assert.equal(
      h.displays.some((display) => display.isChecking),
      true
    );
    h.elapse(19_999);
    await h.session.requestAdvance();
    assert.equal(h.displays[h.displays.length - 1].state, 'awaiting_payment');
    h.elapse(1);
    h.poll();
    await h.session.requestAdvance();
    assert.equal(h.displays[h.displays.length - 1].state, 'unavailable');
    assert.equal(
      en.cashOutConfirm.contract.states.unavailable.message,
      'Network check delayed — retrying automatically.'
    );
    h.setObservation(h.payment([]));
    await h.session.requestAdvance();
    assert.equal(h.displays[h.displays.length - 1].state, 'awaiting_payment');
    h.elapse(10_000);
    h.setObservation({ status: 'unavailable', errors: [] });
    await h.session.requestAdvance();
    assert.equal(h.displays[h.displays.length - 1].state, 'awaiting_payment');
    assert.equal(h.calls.prepare, 0);
    await h.session.stop();
    console.log(
      'PASS: E3 schedules 10-second fallback checks, suppresses a transient failure, warns neutrally after 20 seconds and resets freshness after success'
    );
  }
  {
    const h = await paymentSessionHarness();
    h.setObservation(h.payment([]));
    await h.session.start();
    const before = h.record();
    const remaining = h.remaining();
    await h.session.setVisible(false);
    const observations = h.calls.observe;
    h.elapse(120_000);
    h.poll();
    assert.equal(h.calls.observe, observations);
    assert.equal(h.remaining(), remaining - 120_000);
    h.setObservation({ status: 'unavailable', errors: [] });
    await h.session.setVisible(true);
    assert.equal(h.calls.observe, observations + 1);
    assert.equal(h.displays[h.displays.length - 1].state, 'awaiting_payment');
    assert.deepEqual(h.pollIntervals, [10_000, 10_000]);
    await h.session.setVisible(false);
    h.expire();
    h.setObservation(h.payment([]));
    await h.session.setVisible(true);
    assert.equal(h.remaining(), 0);
    assert.equal(h.displays[h.displays.length - 1].state, 'quote_expired');
    assert.deepEqual(
      getCashOutContractPaymentPresentation(h.record(), 'awaiting_payment', 0),
      { state: 'quote_expired', showPaymentInstructions: false }
    );
    const presentation = getCashOutContractPaymentPresentation(
      h.record(),
      'quote_expired',
      0
    );
    assert.equal(presentation.showPaymentInstructions, false);
    await h.session.stop(); // The Create-new action stops and discards UI state only.
    assert.deepEqual(h.record(), before);
    assert.equal(h.calls.writes, 0);
    assert.equal(h.calls.prepare, 0);
    console.log(
      'PASS: E3 pauses hidden polling, observes immediately on visibility return, derives countdown from absolute expiry and hides the unpaid expired QR without changing its record'
    );
  }
  {
    const h = await paymentSessionHarness();
    h.unavailableSettlement();
    await h.session.start();
    assert.equal(h.displays[h.displays.length - 1].state, 'settling');
    h.elapse(20_000);
    await h.session.requestAdvance();
    assert.equal(h.displays[h.displays.length - 1].state, 'unavailable');
    assert.equal(h.calls.prepare, 1);
    assert.equal(
      h.displays.every((display) => !display.cashHandoverAllowed),
      true
    );
    await h.session.stop();
    console.log(
      'PASS: E3 reconciliation display uses the same warning grace without changing intent reuse or cash-handover restrictions'
    );
  }
  {
    const h = await paymentSessionHarness();
    h.setObservation(h.payment([1]));
    await h.session.start();
    h.expire();
    h.setObservation(h.payment([]));
    await h.session.requestAdvance();
    assert.equal(
      h.displays[h.displays.length - 1].state,
      'payment_needs_resolution'
    );
    assert.equal(
      getCashOutContractPaymentPresentation(
        h.record(),
        'payment_needs_resolution',
        0
      ).state,
      'payment_needs_resolution'
    );
    await h.session.stop();
    console.log(
      'PASS: E3 preserves observed exceptional payment resolution across expiry even if a later read is empty'
    );
  }
  {
    const h = creationHarness();
    const old = await h.run();
    // A subsequent Review uses a fresh ID. E1 must quote/create again and retain
    // the old contract unchanged, rather than reprice its existing identity.
    h.input.id = 'cash-out-e3-new';
    h.input.serial = 'CO-E3-NEW';
    const next = await h.run();
    assert.equal(h.calls.quotes, 2);
    assert.notEqual(
      next.settlementContractPlan?.cashOutCommitmentHex,
      old.settlementContractPlan?.cashOutCommitmentHex
    );
    assert.notEqual(next.paymentUri, old.paymentUri);
    assert.deepEqual(await h.dependencies.getCashOutRecordById(old.id), old);
    console.log(
      'PASS: a new Review creates a new quote/session identity and preserves the previous frozen contract'
    );
  }
}

try {
  const entered = deferred();
  const release = deferred();
  const h = creationHarness({
    beforeWrite: async () => {
      entered.resolve();
      await release.promise;
    },
  });
  let visible = false;
  const creating = h.run().then((record) => {
    visible = true;
    return record;
  });
  await entered.promise;
  assert.equal(visible, false);
  assert.equal((await h.storage.getCashOutRecords()).length, 1);
  release.resolve();
  const created = await creating;
  const plan = created.settlementContractPlan;
  if (!plan) throw new Error('E1 did not persist a contract plan.');
  assert.equal(visible, true);
  assert.match(plan.cashOutCommitmentHex, /^[0-9a-f]{64}$/);
  assert.notEqual(plan.cashOutCommitmentHex, '0'.repeat(64));
  assert.deepEqual(
    plan,
    buildCashOutSettlementContractPlan({
      cashOut: { ...created, status: 'quote_locked' },
      cashOutCommitmentHex: plan.cashOutCommitmentHex,
      treasuryAddress: TREASURY_ADDRESS_A,
      provider: createMainnetMockProvider(),
    })
  );
  const pricing = calculateCashOutPricingFromLockedQuote(
    h.input.fiatAmountMinor,
    creationQuote
  );
  assert.deepEqual(created.fee, pricing.fee);
  assert.equal(created.bchSatsRequired, pricing.bchSatsRequired);
  assert.equal(created.marketBchSats, pricing.marketBchSats);
  assert.equal(
    created.customerSendsFiatEquivalentMinor,
    pricing.customerSendsFiatEquivalentMinor
  );
  assert.equal(created.status, 'awaiting_payment');
  assert.equal(created.treasuryReceivingAddress, plan.contractAddress);
  assert.equal(created.treasuryMasterAddress, TREASURY_ADDRESS_A);
  assert.equal(created.treasuryReceivingDerivationIndex, undefined);
  assert.equal(
    created.paymentUri,
    createCashOutPaymentUri({
      address: plan.contractAddress,
      requiredSats: pricing.bchSatsRequired,
      label: 'BCH Cash-out',
      message: created.serial,
    }).uri
  );
  assert.equal(created.settlementIntent, undefined);
  assert.equal(created.recoveryIntent, undefined);
  assert.equal(created.completedAt, undefined);
  assert.equal(h.calls.provider, 0);
  console.log(
    'PASS: E1 uses the real planner and frozen production pricing; no payable result escapes the controlled durable write'
  );

  const reloaded = await h.dependencies.getCashOutRecordById(created.id);
  assert.deepEqual(reloaded, created);
  const beforeReplay = { ...h.calls };
  assert.deepEqual(await h.run(), created);
  assert.deepEqual(h.calls, beforeReplay);
  await h.dependencies.storeSession(
    JSON.parse(JSON.stringify(created)) as CashOutRecord
  );
  assert.equal(h.calls.writes, 1);
  const legacy = await h.dependencies.getCashOutRecordById(BASE_CASH_OUT.id);
  assert.deepEqual(legacy, BASE_CASH_OUT);
  assert.equal(legacy?.settlementContractPlan, undefined);
  console.log(
    'PASS: E1 serialization/reload/replay preserves the complete snapshot without requoting, replanning or rewriting; legacy records remain unchanged'
  );

  // One focused group for the NEW store projections, not duplicate covenant tests.
  function requiredPlan(record: CashOutRecord) {
    const plan = record.settlementContractPlan;
    if (!plan) throw new Error('Test mutation requires a frozen plan.');
    return plan;
  }
  const mutations: ((record: CashOutRecord) => void)[] = [
    (record) => {
      record.treasuryReceivingAddress = TREASURY_ADDRESS_A;
    },
    (record) => {
      record.bchSatsRequired += 1;
    },
    (record) => {
      record.treasuryMasterAddress = TREASURY_ADDRESS_B;
    },
    (record) => {
      requiredPlan(record).settlementPlan.platformDestination.address =
        ALTERNATE_PLATFORM_ADDRESS;
    },
    (record) => {
      requiredPlan(record).cashOutCommitmentHex = '00'.repeat(32);
    },
    (record) => {
      requiredPlan(record).contractBytecodeHex = '00';
    },
    (record) => {
      requiredPlan(record).constructor.paymentSats += 1;
    },
    (record) => {
      record.paymentUri = createCashOutPaymentUri({
        address: TREASURY_ADDRESS_A,
        requiredSats: record.bchSatsRequired,
      }).uri;
    },
  ];
  for (const mutate of mutations) {
    const fresh = creationHarness();
    const invalid = structuredClone(created);
    mutate(invalid);
    await rejectsCreation(fresh.dependencies.storeSession(invalid));
    assert.equal(fresh.calls.writes, 0);
  }
  const changed = structuredClone(created);
  changed.settlementContractPlan = buildCashOutSettlementContractPlan({
    cashOut: { ...created, status: 'quote_locked' },
    cashOutCommitmentHex: CASH_OUT_COMMITMENT_B,
    treasuryAddress: TREASURY_ADDRESS_A,
    provider: createMainnetMockProvider(),
  });
  changed.treasuryReceivingAddress =
    changed.settlementContractPlan.contractAddress;
  changed.paymentUri = createCashOutPaymentUri({
    address: changed.treasuryReceivingAddress,
    requiredSats: changed.bchSatsRequired,
    label: 'BCH Cash-out',
    message: changed.serial,
  }).uri;
  await rejectsCreation(h.dependencies.storeSession(changed));
  assert.deepEqual(
    await h.dependencies.getCashOutRecordById(created.id),
    created
  );
  console.log(
    'PASS: E1 rejects inconsistent projections and cannot replace an existing frozen identity with another valid plan'
  );

  const failed = creationHarness({ fail: true });
  let failedResult: CashOutRecord | undefined;
  await rejectsCreation(
    failed.run().then((record) => {
      failedResult = record;
    })
  );
  assert.equal(failedResult, undefined);
  assert.equal((await failed.storage.getCashOutRecords()).length, 1);
  const another = await creationHarness().run();
  assert.notEqual(
    another.settlementContractPlan?.cashOutCommitmentHex,
    plan.cashOutCommitmentHex
  );
  assert.notEqual(
    another.treasuryReceivingAddress,
    created.treasuryReceivingAddress
  );
  console.log(
    'PASS: failed persistence returns no successful session; independent secure commitments produce distinct contracts'
  );
  await runE3PaymentSessionTests();
} finally {
  if (originalCrypto)
    Object.defineProperty(globalThis, 'crypto', originalCrypto);
  else Reflect.deleteProperty(globalThis, 'crypto');
}
