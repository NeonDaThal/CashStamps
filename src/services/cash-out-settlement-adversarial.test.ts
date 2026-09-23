import { advanceCashOutSettlementNetworkLifecycleWithDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import {
  applyCashOutSettlementBroadcast,
  applyCashOutSettlementReconciliation,
} from 'src/services/cash-out-settlement-broadcast-state';

import { getCashOutSettlementRecoveryAction } from 'src/services/cash-out-settlement-recovery';

import type { CashOutSettlementNetworkLifecycleDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d4g-001';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const OTHER_TXID = 'cd'.repeat(32);

const INTENT = {
  status: 'prepared',

  txid: SETTLEMENT_TXID,
} as CashOutSettlementIntent;

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: 'CO-D4G-001',

    createdAt: '2026-09-17T12:00:00.000Z',

    updatedAt: '2026-09-17T12:00:00.000Z',

    status: 'received',

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function createBroadcast(
  status: 'blocked' | 'broadcasted' | 'definitely_not_broadcast' | 'uncertain',
  overrides: Partial<TreasuryBroadcastResult> = {}
): TreasuryBroadcastResult {
  const requestAttempted = status === 'broadcasted' || status === 'uncertain';

  return {
    status,

    txid: SETTLEMENT_TXID,

    ...(status === 'broadcasted'
      ? {
          serverTxid: SETTLEMENT_TXID,
        }
      : {}),

    broadcastEnabled: status !== 'blocked',

    requestAttempted,

    attemptedAt: '2026-09-17T12:05:00.000Z',

    ...overrides,
  };
}

function createReconciliation(
  status: 'confirmed' | 'mempool' | 'unknown' | 'unavailable',
  overrides: Partial<TreasuryBroadcastReconciliationResult> = {}
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_000,
        }
      : {}),

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    serverChecks: [],

    checkedAt: '2026-09-17T12:06:00.000Z',

    message: `D4G reconciliation: ${status}.`,

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

function assertSame(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual !== expected) {
    throw new Error(message ?? 'Expected both values to be the same object.');
  }
}

async function assertRejects(
  operation: () => Promise<unknown>,
  message?: string
): Promise<void> {
  let rejected = false;

  try {
    await operation();
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error(message ?? 'Expected asynchronous operation to reject.');
  }
}

interface Harness {
  dependencies: CashOutSettlementNetworkLifecycleDependencies;

  getRecord(): CashOutRecord | undefined;

  setRecord(record: CashOutRecord): void;

  getBroadcastCalls(): number;

  getReconciliationCalls(): number;
}

function createHarness(input: {
  record: CashOutRecord | undefined;

  broadcastResults?: TreasuryBroadcastResult[];

  reconciliationResults?: TreasuryBroadcastReconciliationResult[];
}): Harness {
  let record = input.record;

  const broadcastResults = [...(input.broadcastResults ?? [])];

  const reconciliationResults = [...(input.reconciliationResults ?? [])];

  let broadcastCalls = 0;

  let reconciliationCalls = 0;

  return {
    dependencies: {
      async getCashOutRecordById(id) {
        if (!record || record.id !== id) {
          return undefined;
        }

        return record;
      },

      async storeBroadcast(id, broadcast) {
        if (!record || record.id !== id) {
          return undefined;
        }

        record = applyCashOutSettlementBroadcast(record, broadcast);

        return record;
      },

      async storeReconciliation(id, reconciliation) {
        if (!record || record.id !== id) {
          return undefined;
        }

        record = applyCashOutSettlementReconciliation(record, reconciliation);

        return record;
      },

      async broadcast(intent) {
        broadcastCalls += 1;

        assertSame(
          intent,
          INTENT,
          'D4G broadcast did not receive the exact persisted D3 intent.'
        );

        const next = broadcastResults.shift();

        if (!next) {
          throw new Error('Unexpected D4G broadcast call.');
        }

        return next;
      },

      async reconcile(intent) {
        reconciliationCalls += 1;

        assertSame(
          intent,
          INTENT,
          'D4G reconciliation did not receive the exact persisted D3 intent.'
        );

        const next = reconciliationResults.shift();

        if (!next) {
          throw new Error('Unexpected D4G reconciliation call.');
        }

        return next;
      },
    },

    getRecord: () => record,

    setRecord(nextRecord) {
      record = nextRecord;
    },

    getBroadcastCalls: () => broadcastCalls,

    getReconciliationCalls: () => reconciliationCalls,
  };
}

async function runD4GAdversarialTests(): Promise<void> {
  /**
   * Scenario 1:
   *
   * Broadcast response disappears, first reconciliation cannot see the tx,
   * later reconciliation sees it in the mempool.
   *
   * There must be ONE broadcast request total.
   */
  {
    const harness = createHarness({
      record: createCashOut(),

      broadcastResults: [createBroadcast('uncertain')],

      reconciliationResults: [
        createReconciliation('unknown'),

        createReconciliation('mempool', {
          checkedAt: '2026-09-17T12:07:00.000Z',
        }),
      ],
    });

    const first =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(first.outcome, 'uncertain');

    const second =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(second.outcome, 'mempool');

    assertEqual(
      harness.getBroadcastCalls(),
      1,
      'Ambiguous settlement was broadcast more than once.'
    );

    assertEqual(harness.getReconciliationCalls(), 2);

    console.log(
      'PASS: delayed propagation after uncertain submission resolves by exact-txid checking without duplicate broadcast'
    );
  }

  /**
   * Scenario 2:
   *
   * A successful broadcast is initially unavailable to reconciliation, then
   * later becomes confirmed.
   */
  {
    const harness = createHarness({
      record: createCashOut(),

      broadcastResults: [createBroadcast('broadcasted')],

      reconciliationResults: [
        createReconciliation('unavailable'),

        createReconciliation('confirmed', {
          checkedAt: '2026-09-17T12:08:00.000Z',
        }),
      ],
    });

    const first =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(first.outcome, 'broadcasted_pending_detection');

    const second =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(second.outcome, 'confirmed');

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconciliationCalls(), 2);

    console.log(
      'PASS: unavailable propagation evidence later upgrades to confirmation without resubmission'
    );
  }

  /**
   * Scenario 3:
   *
   * Simulate an app process closing after uncertain state has already been
   * durably persisted.
   *
   * A new lifecycle invocation must begin with reconciliation, not broadcast.
   */
  {
    const persistedBeforeClose = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('uncertain')
    );

    const restartedHarness = createHarness({
      record: persistedBeforeClose,

      reconciliationResults: [createReconciliation('mempool')],
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        restartedHarness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(restartedHarness.getBroadcastCalls(), 0);

    assertEqual(restartedHarness.getReconciliationCalls(), 1);

    console.log(
      'PASS: app restart after ambiguous submission cannot trigger another broadcast'
    );
  }

  /**
   * Scenario 4:
   *
   * Positive mempool evidence is already durable before restart.
   *
   * D4 must perform no further network action.
   */
  {
    const positive = applyCashOutSettlementReconciliation(
      createCashOut(),
      createReconciliation('mempool')
    );

    const harness = createHarness({
      record: positive,
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 0);

    console.log(
      'PASS: persisted mempool evidence suppresses all further D4 network activity'
    );
  }

  /**
   * Scenario 5:
   *
   * Confirmation is also terminal from D4's network perspective.
   */
  {
    const positive = applyCashOutSettlementReconciliation(
      createCashOut(),
      createReconciliation('confirmed')
    );

    const harness = createHarness({
      record: positive,
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.outcome, 'confirmed');

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 0);

    console.log(
      'PASS: persisted confirmation is terminal for D4 network activity'
    );
  }

  /**
   * Scenario 6:
   *
   * Development safety guard blocked a submission before networking.
   *
   * Later invocation may submit the SAME persisted transaction once the
   * broadcaster is available.
   */
  {
    const blocked = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('blocked')
    );

    const harness = createHarness({
      record: blocked,

      broadcastResults: [
        createBroadcast('broadcasted', {
          attemptedAt: '2026-09-17T12:10:00.000Z',
        }),
      ],

      reconciliationResults: [createReconciliation('mempool')],
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconciliationCalls(), 1);

    console.log(
      'PASS: pre-network safety block can later submit only the same persisted transaction'
    );
  }

  /**
   * Scenario 7:
   *
   * A proven pre-request connection failure may likewise retry the SAME
   * transaction.
   */
  {
    const definitelyNotBroadcast = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('definitely_not_broadcast')
    );

    const harness = createHarness({
      record: definitelyNotBroadcast,

      broadcastResults: [
        createBroadcast('broadcasted', {
          attemptedAt: '2026-09-17T12:11:00.000Z',
        }),
      ],

      reconciliationResults: [createReconciliation('mempool')],
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(harness.getBroadcastCalls(), 1);

    console.log(
      'PASS: proven pre-request failure can retry only the identical persisted settlement'
    );
  }

  /**
   * Scenario 8:
   *
   * Contradictory reconciliation evidence for another txid must fail closed.
   */
  {
    const uncertain = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('uncertain')
    );

    const harness = createHarness({
      record: uncertain,

      reconciliationResults: [
        createReconciliation('mempool', {
          txid: OTHER_TXID,
        }),
      ],
    });

    await assertRejects(async () => {
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );
    });

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconciliationCalls(), 1);

    assertEqual(harness.getRecord()?.settlementReconciliation, undefined);

    console.log(
      'PASS: contradictory network evidence cannot contaminate the persisted settlement record'
    );
  }

  /**
   * Scenario 9:
   *
   * D4 positive settlement evidence must NOT silently complete the Cash-out.
   *
   * received still means customer BCH was received.
   * completed remains the later merchant cash-handover boundary.
   */
  {
    const harness = createHarness({
      record: createCashOut(),

      broadcastResults: [createBroadcast('broadcasted')],

      reconciliationResults: [createReconciliation('confirmed')],
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.outcome, 'confirmed');

    assertEqual(result.record.status, 'received');

    console.log(
      'PASS: settlement confirmation does not redefine the Cash-out completed lifecycle state'
    );
  }

  /**
   * Scenario 10:
   *
   * Explicitly document the current conservative ambiguity policy.
   *
   * uncertain + successful "unknown" reconciliation remains CHECK SAME TX.
   *
   * D4G.2 will decide the bounded same-transaction retry rule for the separate
   * parent-not-propagated case. We do not silently turn generic ambiguity into
   * another broadcast attempt here.
   */
  {
    const uncertain = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('uncertain')
    );

    const unknown = applyCashOutSettlementReconciliation(
      uncertain,
      createReconciliation('unknown')
    );

    const action = getCashOutSettlementRecoveryAction(unknown);

    assertEqual(action, 'check_same_transaction');

    console.log(
      'PASS: generic ambiguous submission remains check-only after unknown reconciliation'
    );
  }

  console.log('');

  console.log('Cash-out Settlement D4G.1 adversarial lifecycle matrix passed.');
}

runD4GAdversarialTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
