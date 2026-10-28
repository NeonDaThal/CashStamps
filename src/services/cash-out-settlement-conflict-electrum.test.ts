import {
  binToHex,
  encodeTransaction,
  hashTransaction,
  hexToBin,
} from '@bitauth/libauth';

import {
  decodeCashOutSettlementConflictTransactionInputs,
  inspectCashOutSettlementSourceConflictFromNetworkWithDependencies,
  type CashOutSettlementConflictNetworkDependencies,
} from 'src/services/cash-out-settlement-conflict-electrum';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';
import type { CashOutSettlementContractPlan } from 'src/types/cash-out-settlement';
import type { ElectrumRequest } from './electrum-types';
import {
  createCashOutContractNetwork,
  type CashOutContractNetworkOptions,
  type CashOutContractNetworkDependencies,
} from './cash-out-contract-network';

const CASH_OUT_ID = 'cash-out-d5d2b-001';

const CASH_OUT_SERIAL = 'CO-D5D2B-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const OTHER_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const SOURCE_OUTPOINT_INDEX = 2;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '44'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: SOURCE_OUTPOINT_INDEX,

  sourceValueSats: REQUIRED_SATS,

  rawTransactionHex: '00',

  txid: SETTLEMENT_TXID,

  rawTransactionBytesLength: 1,

  treasuryAddress: 'bitcoincash:q-test-treasury',

  treasuryOutputSats: 203_687,

  platformAddress: 'bitcoincash:q-test-platform',

  platformOutputSats: 2_000,

  actualFeeSats: 313,

  inputCount: 1,

  outputCount: 2,

  broadcastEnabled: false,

  preparedAt: '2026-09-25T12:00:00.000Z',
};

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:05:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(actual)} to equal ${String(expected)}.`
    );
  }
}

function assertThrows(
  operation: () => unknown,
  expectedMessagePart: string
): void {
  try {
    operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected error containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(`Expected operation to throw "${expectedMessagePart}".`);
}

/**
 * Build a minimal serializable BCH transaction spending one chosen outpoint.
 *
 * The previous transaction hash supplied to libauth is in serialized/internal
 * byte order, so the normal display txid is reversed before being placed into
 * the input.
 */
function createRawSpenderTransaction(
  previousTxid: string,
  previousOutputIndex: number
): {
  rawTransactionHex: string;

  txid: string;
} {
  const previousHashBytes = Uint8Array.from(hexToBin(previousTxid));

  previousHashBytes.reverse();

  const encoded = encodeTransaction({
    version: 2,

    inputs: [
      {
        outpointTransactionHash: previousHashBytes,

        outpointIndex: previousOutputIndex,

        unlockingBytecode: new Uint8Array(),

        sequenceNumber: 0xffffffff,
      },
    ],

    outputs: [
      {
        lockingBytecode: new Uint8Array(),

        valueSatoshis: 1_000n,
      },
    ],

    locktime: 0,
  });

  return {
    rawTransactionHex: binToHex(encoded),

    txid: hashTransaction(encoded).trim().toLowerCase(),
  };
}

async function runD5D2BTests(): Promise<void> {
  /**
   * First prove the byte-order conversion explicitly.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    const inputs = decodeCashOutSettlementConflictTransactionInputs(
      spender.rawTransactionHex,
      spender.txid
    );

    assertEqual(inputs.length, 1);

    assertEqual(
      inputs[0]?.previousTxid,
      CUSTOMER_TXID,
      'Decoded BCH input previous hash was not converted back to display txid byte order.'
    );

    assertEqual(inputs[0]?.previousOutputIndex, SOURCE_OUTPOINT_INDEX);

    console.log(
      'PASS: decoded BCH previous-output hash is converted to Electrum/display txid byte order'
    );
  }

  /**
   * Never trust transaction contents unless their raw bytes hash back to the
   * exact txid requested from Electrum.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    assertThrows(
      () =>
        decodeCashOutSettlementConflictTransactionInputs(
          spender.rawTransactionHex,

          OTHER_TXID
        ),

      'does not match the requested transaction ID'
    );

    console.log(
      'PASS: raw transaction txid mismatch is rejected before input evidence is trusted'
    );
  }

  /**
   * Real network adapter semantics:
   *
   * contract history says candidate transaction exists;
   * raw transaction proves it spends exact customer txid:vout;
   * inspector produces positive conflict evidence.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    let historyCalls = 0;

    let rawTransactionCalls = 0;

    const dependencies: CashOutSettlementConflictNetworkDependencies = {
      getContractHistory: async (address) => {
        historyCalls += 1;

        assertEqual(address, INTENT.contractAddress);

        return [
          {
            txid: CUSTOMER_TXID,

            height: 0,
          },

          {
            txid: spender.txid,

            height: 0,
          },
        ];
      },

      getRawTransaction: async (txid) => {
        rawTransactionCalls += 1;

        assertEqual(txid, spender.txid);

        return spender.rawTransactionHex;
      },

      now: () => '2026-09-25T12:06:00.000Z',
    };

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),
        dependencies
      );

    assertEqual(historyCalls, 1);

    assertEqual(rawTransactionCalls, 1);

    assertEqual(result.status, 'conflict_detected');

    assertEqual(result.evidence?.conflictingTxid, spender.txid);

    assertEqual(result.evidence?.sourcePaymentTxid, CUSTOMER_TXID);

    assertEqual(result.evidence?.sourceOutpointIndex, SOURCE_OUTPOINT_INDEX);

    console.log(
      'PASS: Electrum/raw-transaction adapter proves exact different spender conflict'
    );
  }

  /**
   * A raw transaction spending another output of the same customer transaction
   * must not be classified as a conflict.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,

      SOURCE_OUTPOINT_INDEX + 1
    );

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => [
            {
              txid: spender.txid,

              height: 0,
            },
          ],

          getRawTransaction: async () => spender.rawTransactionHex,

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'no_conflict_observed');

    console.log('PASS: real transaction decoder preserves exact vout matching');
  }

  /**
   * The deterministic settlement is filtered before raw transaction lookup.
   *
   * This protects the normal settlement from ever being mistaken for a
   * double-spend conflict.
   */
  {
    let rawTransactionCalls = 0;

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => [
            {
              txid: CUSTOMER_TXID,

              height: 0,
            },

            {
              txid: SETTLEMENT_TXID,

              height: 0,
            },
          ],

          getRawTransaction: async () => {
            rawTransactionCalls += 1;

            throw new Error(
              'Settlement raw transaction should not have been requested.'
            );
          },

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'no_conflict_observed');

    assertEqual(rawTransactionCalls, 0);

    console.log(
      'PASS: exact deterministic settlement is excluded before raw transaction decoding'
    );
  }

  /**
   * A bad/mismatching Electrum raw transaction makes the inspection
   * unavailable. It must not produce either positive conflict evidence or a
   * false "no conflict" answer.
   */
  {
    const realTransaction = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => [
            {
              txid: OTHER_TXID,

              height: 0,
            },
          ],

          getRawTransaction: async () => realTransaction.rawTransactionHex,

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'inspection_unavailable');

    assertEqual(result.evidence, undefined);

    console.log(
      'PASS: mismatching Electrum raw transaction fails closed as inspection unavailable'
    );
  }

  /**
   * Ordinary network failure also remains unavailable rather than being
   * interpreted as absence of a conflict.
   */
  {
    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => {
            throw new Error('Electrum unavailable.');
          },

          getRawTransaction: async () => {
            throw new Error('Unexpected raw transaction request.');
          },

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'inspection_unavailable');

    assertEqual(result.evidence, undefined);

    console.log(
      'PASS: Electrum history failure cannot become false no-conflict evidence'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5D.2b Electrum conflict adapter tests passed.'
  );
}

// E2 extends this existing Electrum adapter suite, reusing its exact-outpoint
// record/raw-spender fixtures and the REAL production observation functions.
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

function observationRecord(): CashOutRecord {
  const record = createCashOut();
  // Only the D2 fields inspected by production are relevant to this network
  // fixture. Contract construction itself remains covered by D1/E1.
  record.settlementContractPlan = {
    version: 'cash_out_settlement_contract_v1',
    contractType: 'p2sh32',
    cashOutCommitmentHex: INTENT.cashOutCommitmentHex,
    contractAddress: INTENT.contractAddress,
    constructor: {
      cashOutCommitmentHex: INTENT.cashOutCommitmentHex,
      paymentSats: REQUIRED_SATS,
    },
    settlementPlan: {
      version: 'cash_out_settlement_v1',
      cashOutId: CASH_OUT_ID,
      cashOutSerial: CASH_OUT_SERIAL,
      paymentSats: REQUIRED_SATS,
      treasuryOutputSats: INTENT.treasuryOutputSats,
      platformOutputSats: INTENT.platformOutputSats,
      settlementFeeSats: INTENT.actualFeeSats,
    },
  } as CashOutSettlementContractPlan;
  return record;
}

function networkHarness(
  behavior: Record<
    string,
    {
      connectError?: boolean;
      subscribeError?: boolean;
      requestError?: boolean;
      rawError?: boolean;
      connecting?: Promise<void>;
      reading?: Promise<void>;
      stopping?: Promise<void>;
      height?: number | null;
      history?: { tx_hash: string; height: number }[];
      raw?: string;
    }
  > = {},
  options: CashOutContractNetworkOptions = {},
  overrides: Partial<CashOutContractNetworkDependencies> = {}
) {
  const events: string[] = [];
  const requested: string[] = [];
  const closed: Record<string, number> = {};
  const notifications: Record<string, () => void> = {};
  const lateClosed = gate();
  const network = createCashOutContractNetwork(
    { servers: ['a', 'b', 'c'], ...options },
    {
      async createConnection(server) {
        const settings = behavior[server] ?? {};
        events.push(`create:${server}`);
        return {
          isConnected: () => !closed[server],
          async subscribeAddress(address, notify) {
            events.push(`subscribe:${server}`);
            assertEqual(address, INTENT.contractAddress);
            if (settings.subscribeError)
              throw new Error('Synthetic subscription unavailable');
            notifications[server] = notify;
          },
          async start() {
            events.push(`start:${server}`);
            await settings.connecting;
            if (settings.connectError)
              throw new Error('Synthetic connection unavailable');
          },
          async stop() {
            events.push(`stop:${server}`);
            closed[server] = (closed[server] ?? 0) + 1;
            if (closed[server] === 2) lateClosed.release();
            await settings.stopping;
          },
          reader: {
            connectedServer: server,
            async request<T extends ElectrumRequest>(
              endpoint: T['method'],
              ...params: T['params']
            ): Promise<T['response']> {
              requested.push(`${server}:${endpoint}`);
              await settings.reading;
              if (settings.requestError)
                throw new Error('Synthetic request unavailable');
              let response: unknown;
              switch (endpoint) {
                case 'blockchain.address.listunspent':
                  assertEqual(params[0], INTENT.contractAddress);
                  assertEqual(params[1], 'exclude_tokens');
                  response = [
                    {
                      tx_hash: CUSTOMER_TXID,
                      tx_pos: SOURCE_OUTPOINT_INDEX,
                      value: REQUIRED_SATS,
                      height: 0,
                    },
                  ];
                  break;
                case 'blockchain.transaction.get_height':
                  assertEqual(params[0], SETTLEMENT_TXID);
                  response =
                    settings.height === undefined ? 0 : settings.height;
                  break;
                case 'blockchain.address.get_history':
                  assertEqual(params[0], INTENT.contractAddress);
                  response = settings.history ?? [];
                  break;
                case 'blockchain.transaction.get':
                  if (settings.rawError)
                    throw new Error('Synthetic raw transaction unavailable');
                  response = settings.raw;
                  break;
                default:
                  throw new Error(`Unexpected non-observation RPC ${endpoint}`);
              }
              return response as T['response'];
            },
          },
        };
      },
      ...overrides,
    }
  );
  return { network, events, requested, closed, lateClosed, notifications };
}

async function runE2NetworkTests() {
  const record = observationRecord();
  const unchanged = JSON.stringify(record);
  {
    const h = networkHarness();
    const one = h.network.observePayment(record);
    const two = h.network.observePayment(structuredClone(record));
    assertEqual(
      one,
      two,
      'Overlapping identical reads should share one operation.'
    );
    const result = await one;
    assertEqual(result.status, 'observed');
    if (result.status !== 'observed')
      throw new Error('Expected production D2 inspection');
    assertEqual(
      result.observation.normalSettlementCandidate?.txid,
      CUSTOMER_TXID
    );
    assertEqual(
      result.observation.normalSettlementCandidate?.vout,
      SOURCE_OUTPOINT_INDEX
    );
    assertEqual(h.events.join(','), 'create:a,start:a,stop:a');
    await h.network.observePayment(record);
    assertEqual(
      h.requested.length,
      2,
      'Later reads must be fresh, not cached.'
    );
    console.log(
      'PASS: E2 first-server success uses production D2 classification, coalesces overlap, closes once and refreshes later'
    );
  }
  for (const failure of ['connectError', 'requestError'] as const) {
    const h = networkHarness(
      { a: { [failure]: true } },
      { servers: [' a ', 'b', 'a', 'c'] }
    );
    const result = await h.network.observePayment(record);
    assertEqual(result.status, 'observed');
    if (result.status === 'observed') assertEqual(result.server, 'b');
    assertEqual(
      h.events.join(','),
      'create:a,start:a,stop:a,create:b,start:b,stop:b'
    );
    await h.network.observePayment(record);
    assertEqual(h.events.slice(-3).join(','), 'create:b,start:b,stop:b');
    console.log(
      `PASS: E2 ${failure} closes the failed host before fallback; stable configuration order and successful-server preference are preserved`
    );
  }
  {
    const h = networkHarness({}, { preferredServer: 'c' });
    await h.network.observePayment(record);
    assertEqual(h.events.join(','), 'create:c,start:c,stop:c');
    const result = await h.network.observeSettlement(INTENT);
    assertEqual(result.status, 'mempool');
    assertEqual(result.txid, SETTLEMENT_TXID);
    assertEqual(result.serverChecks[0]?.server, 'c');
    console.log(
      'PASS: E2 preferred host and production settlement mempool evidence return immediately without consensus'
    );
  }
  {
    const h = networkHarness({ a: { height: null } });
    assertEqual((await h.network.observeSettlement(INTENT)).status, 'unknown');
    assertEqual(h.events.join(','), 'create:a,start:a,stop:a');
    const fallback = networkHarness({
      a: { height: -999 },
      b: { height: 900_001 },
    });
    assertEqual(
      (await fallback.network.observeSettlement(INTENT)).status,
      'confirmed'
    );
    assertEqual(
      fallback.events.join(','),
      'create:a,start:a,stop:a,create:b,start:b,stop:b'
    );
    console.log(
      'PASS: usable unknown evidence is authoritative; production-unavailable height evidence falls through to a confirmed observation'
    );
  }
  {
    const h = networkHarness({
      a: { connectError: true },
      b: { requestError: true },
      c: { connectError: true },
    });
    const payment = await h.network.observePayment(record);
    assertEqual(payment.status, 'unavailable');
    if (payment.status === 'unavailable') assertEqual(payment.errors.length, 3);
    const settlement = await h.network.observeSettlement(INTENT);
    assertEqual(settlement.status, 'unavailable');
    assertEqual(settlement.serverChecks.length, 3);
    assertEqual(
      (await h.network.inspectConflict(record)).status,
      'inspection_unavailable'
    );
    assertEqual(h.closed.a, 3);
    assertEqual(h.closed.b, 3);
    assertEqual(h.closed.c, 3);
    console.log(
      'PASS: E2 exhaustion is explicit for all three observation seams and every temporary connection is stopped'
    );
  }
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );
    const h = networkHarness({
      a: {
        history: [{ tx_hash: spender.txid, height: 0 }],
        raw: spender.rawTransactionHex,
      },
    });
    const result = await h.network.inspectConflict(record);
    assertEqual(result.status, 'conflict_detected');
    assertEqual(result.evidence?.conflictingTxid, spender.txid);
    assertEqual(h.events.join(','), 'create:a,start:a,stop:a');
    const unavailable = networkHarness({
      a: { history: [{ tx_hash: spender.txid, height: 0 }], rawError: true },
    });
    assertEqual(
      (await unavailable.network.inspectConflict(record)).status,
      'no_conflict_observed'
    );
    assertEqual(
      unavailable.events.join(','),
      'create:a,start:a,stop:a,create:b,start:b,stop:b'
    );
    console.log(
      'PASS: E2 preserves a real decoded exact-outpoint conflict immediately; unavailable raw evidence can fail over'
    );
  }
  for (const phase of ['connecting', 'reading'] as const) {
    const delayed = gate();
    const h = networkHarness(
      { a: { [phase]: delayed.promise } },
      { timeoutMilliseconds: 40 }
    );
    const result = await h.network.observePayment(record);
    assertEqual(result.status, 'observed');
    if (result.status === 'observed') assertEqual(result.server, 'b');
    assertEqual(h.events.indexOf('stop:a') < h.events.indexOf('start:b'), true);
    delayed.release();
    if (phase === 'connecting') await h.lateClosed.promise;
    assertEqual(
      h.requested.some((request) => request.startsWith('a:')),
      phase === 'reading'
    );
    console.log(
      `PASS: E2 bounds dead ${phase}, cleans up before failover and ignores late results`
    );
  }
  {
    const h = networkHarness(
      {
        a: { requestError: true, stopping: new Promise<void>(() => undefined) },
      },
      { cleanupTimeoutMilliseconds: 20 }
    );
    assertEqual((await h.network.observePayment(record)).status, 'observed');
    const forbidden = networkHarness(
      {},
      {},
      {
        async observePayment(reader) {
          await reader.request('blockchain.transaction.broadcast', '00');
          throw new Error('Non-read RPC escaped the adapter.');
        },
      }
    );
    assertEqual(
      (await forbidden.network.observePayment(record)).status,
      'unavailable'
    );
    assertEqual(forbidden.requested.length, 0);
    assertEqual(JSON.stringify(record), unchanged);
    console.log(
      'PASS: E2 bounds cleanup, blocks broadcast RPCs before transport, and never mutates the Cash-out record'
    );
  }
}

await runD5D2BTests();
await runE2NetworkTests();

// E3 owns only notification hints. The existing E2 tests above continue to prove
// that authoritative reads fail over and cannot submit or mutate records.
{
  const h = networkHarness({ a: { subscribeError: true } });
  const abort = new AbortController();
  let triggered = 0;
  const watch = await h.network.subscribePaymentNotifications(
    observationRecord(),
    () => {
      triggered += 1;
    },
    abort.signal
  );
  assertEqual(Boolean(watch?.isConnected()), true);
  assertEqual(
    h.events.join(','),
    'create:a,start:a,subscribe:a,stop:a,create:b,start:b,subscribe:b'
  );
  h.notifications.b();
  assertEqual(triggered, 1);
  assertEqual(h.requested.length, 0);
  abort.abort();
  await watch?.stop();
  h.notifications.b();
  assertEqual(triggered, 1);
  assertEqual(watch?.isConnected(), false);
  assertEqual(h.closed.b >= 1, true);
  console.log(
    'PASS: E3 subscribes to the frozen contract, cleans failed subscription hosts, emits hints only and ignores notifications after close'
  );
}
{
  const h = networkHarness();
  const abort = new AbortController();
  abort.abort();
  assertEqual(
    await h.network.subscribePaymentNotifications(
      observationRecord(),
      () => undefined,
      abort.signal
    ),
    undefined
  );
  assertEqual(h.events.length, 0);
  console.log(
    'PASS: E3 does not open a subscription for an already closed session'
  );
}
