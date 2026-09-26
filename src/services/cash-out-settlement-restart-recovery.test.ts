import { recoverCashOutSettlementAfterRestartWithDependencies } from 'src/services/cash-out-settlement-restart-recovery';

import type { CashOutSettlementNetworkLifecycleDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementBroadcastResult,
  CashOutSettlementIntent,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5c-001';

const CASH_OUT_SERIAL = 'CO-D5C-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '33'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: 0,

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

function createReconciliation(
  status: 'mempool' | 'confirmed' | 'unknown' | 'unavailable'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_000,
        }
      : {}),

    serverChecks: [],

    checkedAt: '2026-09-25T12:01:00.000Z',

    message: `D5C ${status} evidence.`,
  };
}

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:00:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function simulateRestart<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

async function assertRejects(
  operation: () => Promise<unknown>,
  expectedMessagePart: string
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected rejection containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(
    `Expected operation to reject with "${expectedMessagePart}".`
  );
}

interface TestLifecycleOptions {
  initialRecord: CashOutRecord;

  broadcastResult?: CashOutSettlementBroadcastResult;

  reconciliationResult?: TreasuryBroadcastReconciliationResult;
}

function createLifecycleHarness(options: TestLifecycleOptions): {
  dependencies: CashOutSettlementNetworkLifecycleDependencies;

  getDurableRecord: () => CashOutRecord;

  getBroadcastCalls: () => number;

  getReconciliationCalls: () => number;
} {
  /**
   * This variable represents IndexedDB.
   *
   * Every read/write crosses a JSON serialization boundary so no in-memory
   * object identity from before the simulated restart can help the test pass.
   */
  let durableRecord = simulateRestart(options.initialRecord);

  let broadcastCalls = 0;

  let reconciliationCalls = 0;

  const dependencies: CashOutSettlementNetworkLifecycleDependencies = {
    getCashOutRecordById: async (id) => {
      if (id !== durableRecord.id) {
        return undefined;
      }

      return simulateRestart(durableRecord);
    },

    storeBroadcast: async (id, broadcast) => {
      if (id !== durableRecord.id) {
        return undefined;
      }

      durableRecord = simulateRestart({
        ...durableRecord,

        settlementBroadcast: broadcast,

        updatedAt: '2026-09-25T12:02:00.000Z',
      });

      return simulateRestart(durableRecord);
    },

    storeReconciliation: async (id, reconciliation) => {
      if (id !== durableRecord.id) {
        return undefined;
      }

      durableRecord = simulateRestart({
        ...durableRecord,

        settlementReconciliation: reconciliation,

        updatedAt: '2026-09-25T12:03:00.000Z',
      });

      return simulateRestart(durableRecord);
    },

    broadcast: async (intent) => {
      broadcastCalls += 1;

      /**
       * The restart path must use the exact D3-persisted transaction.
       */
      assertEqual(
        intent.txid,
        INTENT.txid,
        'Restart attempted to broadcast a different settlement txid.'
      );

      assertEqual(
        intent.rawTransactionHex,
        INTENT.rawTransactionHex,
        'Restart attempted to broadcast different settlement bytes.'
      );

      if (!options.broadcastResult) {
        throw new Error(
          'Unexpected settlement broadcast during restart recovery.'
        );
      }

      return simulateRestart(options.broadcastResult);
    },

    reconcile: async (intent) => {
      reconciliationCalls += 1;

      /**
       * Reconciliation must likewise target only the exact persisted D3
       * settlement identity.
       */
      assertEqual(
        intent.txid,
        INTENT.txid,
        'Restart attempted to reconcile a different settlement txid.'
      );

      if (!options.reconciliationResult) {
        throw new Error(
          'Unexpected settlement reconciliation during restart recovery.'
        );
      }

      return simulateRestart(options.reconciliationResult);
    },
  };

  return {
    dependencies,

    getDurableRecord: () => simulateRestart(durableRecord),

    getBroadcastCalls: () => broadcastCalls,

    getReconciliationCalls: () => reconciliationCalls,
  };
}

async function runD5CTests(): Promise<void> {
  /**
   * Crash after D3 persistence but before any network submission.
   *
   * The same persisted transaction may be submitted after restart.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut(),

      broadcastResult: {
        status: 'broadcasted',

        txid: SETTLEMENT_TXID,

        serverTxid: SETTLEMENT_TXID,

        broadcastEnabled: true,

        requestAttempted: true,

        attemptedAt: '2026-09-25T12:01:00.000Z',
      },

      reconciliationResult: createReconciliation('mempool'),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconciliationCalls(), 1);

    assertEqual(result.networkOutcome, 'mempool');

    assertEqual(result.merchantSafety.safeToHandCash, true);

    assertEqual(result.merchantSafety.reason, 'settlement_mempool');

    assertEqual(result.record.settlementIntent?.txid, SETTLEMENT_TXID);

    console.log(
      'PASS: restart after D3 write-ahead resumes only the exact persisted settlement transaction'
    );
  }

  /**
   * Crash after an ambiguous submission.
   *
   * Generic ambiguity must be verification-only on restart.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        settlementBroadcast: {
          status: 'uncertain',

          txid: SETTLEMENT_TXID,

          errorMessage: 'Broadcast response was lost.',

          broadcastEnabled: true,

          requestAttempted: true,

          attemptedAt: '2026-09-25T12:01:00.000Z',
        },

        settlementReconciliation: createReconciliation('unknown'),
      }),

      reconciliationResult: createReconciliation('mempool'),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(
      harness.getBroadcastCalls(),
      0,
      'Generic ambiguous settlement must not be rebroadcast after restart.'
    );

    assertEqual(harness.getReconciliationCalls(), 1);

    assertEqual(result.networkOutcome, 'mempool');

    assertEqual(result.merchantSafety.safeToHandCash, true);

    console.log(
      'PASS: restart after ambiguous broadcast reconciles the same txid without rebroadcast'
    );
  }

  /**
   * The same ambiguous case may remain unresolved.
   *
   * Restart must preserve the unsafe merchant boundary rather than inventing
   * success or creating a replacement.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        settlementBroadcast: {
          status: 'uncertain',

          txid: SETTLEMENT_TXID,

          errorMessage: 'Broadcast response was lost.',

          broadcastEnabled: true,

          requestAttempted: true,

          attemptedAt: '2026-09-25T12:01:00.000Z',
        },

        settlementReconciliation: createReconciliation('unknown'),
      }),

      reconciliationResult: createReconciliation('unknown'),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 1);

    assertEqual(result.networkOutcome, 'uncertain');

    assertEqual(result.merchantSafety.safeToHandCash, false);

    assertEqual(result.merchantSafety.reason, 'settlement_unknown');

    console.log(
      'PASS: unresolved ambiguous settlement remains unsafe and verification-only after restart'
    );
  }

  /**
   * A known pre-request failure proves the transaction was not submitted by
   * that attempt, so D4 may safely submit the same persisted bytes on restart.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        settlementBroadcast: {
          status: 'definitely_not_broadcast',

          txid: SETTLEMENT_TXID,

          errorMessage: 'Electrum connection failed before request submission.',

          broadcastEnabled: true,

          requestAttempted: false,

          attemptedAt: '2026-09-25T12:01:00.000Z',
        },
      }),

      broadcastResult: {
        status: 'broadcasted',

        txid: SETTLEMENT_TXID,

        serverTxid: SETTLEMENT_TXID,

        broadcastEnabled: true,

        requestAttempted: true,

        attemptedAt: '2026-09-25T12:02:00.000Z',
      },

      reconciliationResult: createReconciliation('mempool'),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconciliationCalls(), 1);

    assertEqual(result.merchantSafety.safeToHandCash, true);

    assertEqual(
      result.record.settlementIntent?.rawTransactionHex,
      INTENT.rawTransactionHex
    );

    console.log(
      'PASS: proven pre-request failure may resume the same persisted transaction after restart'
    );
  }

  /**
   * If positive evidence was already durable before the app closed, restart
   * should perform no network operation at all.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        settlementReconciliation: createReconciliation('mempool'),
      }),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 0);

    assertEqual(result.networkOutcome, 'mempool');

    assertEqual(result.merchantSafety.safeToHandCash, true);

    console.log(
      'PASS: already-positive durable settlement evidence requires no network work after restart'
    );
  }

  /**
   * Confirmed evidence is likewise terminal for normal restart recovery.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        settlementReconciliation: createReconciliation('confirmed'),
      }),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 0);

    assertEqual(result.networkOutcome, 'confirmed');

    assertEqual(result.merchantSafety.reason, 'settlement_confirmed');

    console.log(
      'PASS: confirmed durable evidence remains final across restart without network activity'
    );
  }

  /**
   * Even with valid settlement evidence, completed is never a second payout
   * authorisation.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        status: 'completed',

        settlementReconciliation: createReconciliation('mempool'),
      }),
    });

    const result = await recoverCashOutSettlementAfterRestartWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 0);

    assertEqual(result.merchantSafety.safeToHandCash, false);

    assertEqual(result.merchantSafety.reason, 'cash_out_already_completed');

    console.log(
      'PASS: restart cannot turn a completed Cash-out into another cash payout'
    );
  }

  /**
   * Without the D3 write-ahead transaction there is nothing legitimate for
   * restart recovery to broadcast or reconcile.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut({
        settlementIntent: undefined,
      }),
    });

    await assertRejects(
      () =>
        recoverCashOutSettlementAfterRestartWithDependencies(
          CASH_OUT_ID,
          harness.dependencies
        ),

      'settlement intent'
    );

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 0);

    console.log(
      'PASS: missing D3 settlement intent fails closed before restart network activity'
    );
  }

  /**
   * Finally simulate another complete process death after successful recovery.
   *
   * The durable record alone must still reproduce the safe decision and exact
   * settlement identity.
   */
  {
    const harness = createLifecycleHarness({
      initialRecord: createCashOut(),

      broadcastResult: {
        status: 'broadcasted',

        txid: SETTLEMENT_TXID,

        serverTxid: SETTLEMENT_TXID,

        broadcastEnabled: true,

        requestAttempted: true,

        attemptedAt: '2026-09-25T12:01:00.000Z',
      },

      reconciliationResult: createReconciliation('mempool'),
    });

    const firstRecovery =
      await recoverCashOutSettlementAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(firstRecovery.merchantSafety.safeToHandCash, true);

    const durableAfterRecovery = simulateRestart(harness.getDurableRecord());

    assertEqual(durableAfterRecovery.settlementIntent?.txid, SETTLEMENT_TXID);

    assertEqual(
      durableAfterRecovery.settlementReconciliation?.txid,
      SETTLEMENT_TXID
    );

    /**
     * Create a brand-new harness to represent a completely new app process.
     */
    const secondProcess = createLifecycleHarness({
      initialRecord: durableAfterRecovery,
    });

    const secondRecovery =
      await recoverCashOutSettlementAfterRestartWithDependencies(
        CASH_OUT_ID,
        secondProcess.dependencies
      );

    assertEqual(secondProcess.getBroadcastCalls(), 0);

    assertEqual(secondProcess.getReconciliationCalls(), 0);

    assertEqual(secondRecovery.merchantSafety.safeToHandCash, true);

    assertEqual(secondRecovery.record.settlementIntent?.txid, SETTLEMENT_TXID);

    console.log(
      'PASS: successful restart recovery remains durable across a second complete app restart'
    );
  }

  console.log('');

  console.log('Cash-out Settlement D5C active restart recovery tests passed.');
}

runD5CTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
