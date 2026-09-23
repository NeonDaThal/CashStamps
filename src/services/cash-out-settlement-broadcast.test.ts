import { hashTransaction, hexToBin } from '@bitauth/libauth';

import { broadcastCashOutSettlementIntentWithDependencies } from 'src/services/cash-out-settlement-broadcast';

import type {
  CashOutSettlementBroadcastDependencies,
  CashOutSettlementBroadcastTransport,
} from 'src/services/cash-out-settlement-broadcast';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

const RAW_TRANSACTION_HEX = '0102030405060708';

const SETTLEMENT_TXID = hashTransaction(hexToBin(RAW_TRANSACTION_HEX))
  .trim()
  .toLowerCase();

const OTHER_TXID = 'cd'.repeat(32);

function createIntent(
  overrides: Partial<CashOutSettlementIntent> = {}
): CashOutSettlementIntent {
  return {
    status: 'prepared',

    cashOutId: 'cash-out-d4-001',

    cashOutSerial: 'CO-D4-001',

    cashOutCommitmentHex: '11'.repeat(32),

    contractAddress: 'bitcoincash:ptestcontract',

    sourcePaymentTxid: '22'.repeat(32),

    sourceOutpointIndex: 0,

    sourceValueSats: 206_000,

    rawTransactionHex: RAW_TRANSACTION_HEX,

    txid: SETTLEMENT_TXID,

    rawTransactionBytesLength: hexToBin(RAW_TRANSACTION_HEX).length,

    treasuryAddress: 'bitcoincash:qtreasury',

    treasuryOutputSats: 203_687,

    platformAddress: 'bitcoincash:qplatform',

    platformOutputSats: 2_000,

    actualFeeSats: 313,

    inputCount: 1,

    outputCount: 2,

    broadcastEnabled: false,

    preparedAt: '2026-09-17T11:00:00.000Z',

    ...overrides,
  };
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

function assertTrue(value: boolean, message?: string): void {
  if (!value) {
    throw new Error(message ?? 'Expected value to be true.');
  }
}

interface FakeTransportState {
  startCalls: number;

  broadcastCalls: number;

  submittedRawTransactionHex?: string;
}

function createDependencies(input: {
  broadcastEnabled: boolean;

  startError?: Error;

  broadcastError?: Error;

  serverTxid?: string;

  state: FakeTransportState;

  onCreateTransport?: () => void;
}): CashOutSettlementBroadcastDependencies {
  return {
    getBroadcastSafetyStatus: () => ({
      realBroadcastEnabled: input.broadcastEnabled,

      message: input.broadcastEnabled
        ? 'Real broadcast enabled for injected D4 test.'
        : 'Real broadcast disabled for D4 test.',
    }),

    createTransport: () => {
      input.onCreateTransport?.();

      const transport: CashOutSettlementBroadcastTransport = {
        async start(): Promise<void> {
          input.state.startCalls += 1;

          if (input.startError) {
            throw input.startError;
          }
        },

        async broadcast(rawTransactionHex: string): Promise<string> {
          input.state.broadcastCalls += 1;

          input.state.submittedRawTransactionHex = rawTransactionHex;

          if (input.broadcastError) {
            throw input.broadcastError;
          }

          return input.serverTxid ?? SETTLEMENT_TXID;
        },
      };

      return transport;
    },
  };
}

async function runD4BBroadcastTests(): Promise<void> {
  /**
   * Global safety guard blocks before any network object is created.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    let transportCreated = false;

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent(),
      createDependencies({
        broadcastEnabled: false,
        state,
        onCreateTransport: () => {
          transportCreated = true;
        },
      })
    );

    assertEqual(result.status, 'blocked');

    assertEqual(result.requestAttempted, false);

    assertEqual(result.broadcastEnabled, false);

    assertEqual(transportCreated, false);

    assertEqual(state.startCalls, 0);

    assertEqual(state.broadcastCalls, 0);

    console.log(
      'PASS: real-broadcast guard blocks Cash-out settlement before network access'
    );
  }

  /**
   * Corrupted raw bytes cannot reach Electrum.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    let transportCreated = false;

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent({
        rawTransactionHex: 'not-transaction-hex',
      }),
      createDependencies({
        broadcastEnabled: true,
        state,
        onCreateTransport: () => {
          transportCreated = true;
        },
      })
    );

    assertEqual(result.status, 'blocked');

    assertEqual(result.requestAttempted, false);

    assertEqual(transportCreated, false);

    console.log(
      'PASS: malformed persisted settlement bytes fail before Electrum access'
    );
  }

  /**
   * Persisted txid must still match the exact stored raw bytes immediately
   * before any network request.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    let transportCreated = false;

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent({
        txid: OTHER_TXID,
      }),
      createDependencies({
        broadcastEnabled: true,
        state,
        onCreateTransport: () => {
          transportCreated = true;
        },
      })
    );

    assertEqual(result.status, 'blocked');

    assertEqual(transportCreated, false);

    console.log(
      'PASS: persisted raw transaction and deterministic txid are rechecked before broadcast'
    );
  }

  /**
   * Connection failure occurs before blockchain.transaction.broadcast begins,
   * so the result is definitely_not_broadcast.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent(),
      createDependencies({
        broadcastEnabled: true,
        startError: new Error('Injected connection failure.'),
        state,
      })
    );

    assertEqual(result.status, 'definitely_not_broadcast');

    assertEqual(result.requestAttempted, false);

    assertEqual(state.startCalls, 1);

    assertEqual(state.broadcastCalls, 0);

    console.log(
      'PASS: pre-request Electrum connection failure is definitely not broadcast'
    );
  }

  /**
   * Happy path submits exactly the persisted bytes and accepts the matching
   * deterministic txid.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const intent = createIntent();

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      intent,
      createDependencies({
        broadcastEnabled: true,
        state,
      })
    );

    assertEqual(result.status, 'broadcasted');

    assertEqual(result.txid, SETTLEMENT_TXID);

    assertEqual(result.serverTxid, SETTLEMENT_TXID);

    assertEqual(result.requestAttempted, true);

    assertEqual(state.startCalls, 1);

    assertEqual(state.broadcastCalls, 1);

    assertEqual(state.submittedRawTransactionHex, intent.rawTransactionHex);

    console.log(
      'PASS: broadcaster submits the exact persisted D3 raw transaction bytes'
    );
  }

  /**
   * Once broadcast() has begun, an exception must never be treated as proof
   * that nothing was submitted.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent(),
      createDependencies({
        broadcastEnabled: true,
        broadcastError: new Error(
          'Injected response loss after submission began.'
        ),
        state,
      })
    );

    assertEqual(result.status, 'uncertain');

    assertEqual(result.requestAttempted, true);

    assertEqual(result.txid, SETTLEMENT_TXID);

    assertEqual(state.broadcastCalls, 1);

    console.log(
      'PASS: post-request failure becomes uncertain and remains bound to the exact txid'
    );
  }

  /**
   * The broadcaster must never silently alter the raw transaction before
   * submitting it.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const intent = createIntent();

    await broadcastCashOutSettlementIntentWithDependencies(
      intent,
      createDependencies({
        broadcastEnabled: true,
        state,
      })
    );

    assertTrue(
      state.submittedRawTransactionHex === RAW_TRANSACTION_HEX,
      'D4 broadcaster modified the persisted raw transaction.'
    );

    console.log(
      'PASS: D4 broadcaster performs no transaction reconstruction or re-encoding'
    );
  }

  /**
   * An explicit input-unavailable server rejection is distinguishable from a
   * lost/ambiguous response.
   *
   * This permits a later retry of the SAME durable transaction.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent(),
      createDependencies({
        broadcastEnabled: true,

        broadcastError: new Error(
          'the transaction was rejected by network rules.\n\nbad-txns-inputs-missingorspent'
        ),

        state,
      })
    );

    assertEqual(result.status, 'uncertain');

    assertEqual(result.requestAttempted, true);

    assertEqual(result.explicitRejection?.kind, 'input_unavailable');

    assertEqual(result.explicitRejection?.retrySameTransaction, true);

    console.log(
      'PASS: explicit input-unavailable rejection is classified for same-transaction retry'
    );
  }

  /**
   * A transport failure remains genuinely ambiguous.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent(),
      createDependencies({
        broadcastEnabled: true,

        broadcastError: new Error(
          'WebSocket connection closed before the broadcast response was received.'
        ),

        state,
      })
    );

    assertEqual(result.status, 'uncertain');

    assertEqual(result.explicitRejection, undefined);

    console.log(
      'PASS: lost broadcast response remains ambiguous and receives no retry authorization'
    );
  }

  /**
   * Other transaction rejections must not accidentally become retryable.
   */
  {
    const state: FakeTransportState = {
      startCalls: 0,
      broadcastCalls: 0,
    };

    const result = await broadcastCashOutSettlementIntentWithDependencies(
      createIntent(),
      createDependencies({
        broadcastEnabled: true,

        broadcastError: new Error(
          'the transaction was rejected by network rules.\n\nmandatory-script-verify-flag-failed'
        ),

        state,
      })
    );

    assertEqual(result.explicitRejection, undefined);

    console.log(
      'PASS: unrelated explicit transaction rejection does not authorize retry'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D4B exact persisted-transaction broadcast tests passed.'
  );
}

await runD4BBroadcastTests();
