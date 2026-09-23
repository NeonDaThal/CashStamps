import { advanceCashOutSettlementNetworkLifecycleWithDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import {
  applyCashOutSettlementBroadcast,
  applyCashOutSettlementReconciliation,
} from 'src/services/cash-out-settlement-broadcast-state';

import type { CashOutSettlementNetworkLifecycleDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const INTENT = {
  status: 'prepared',

  txid: SETTLEMENT_TXID,
} as CashOutSettlementIntent;

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: 'cash-out-d4f-001',

    serial: 'CO-D4F-001',

    createdAt: '2026-09-17T10:00:00.000Z',

    updatedAt: '2026-09-17T10:10:00.000Z',

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

    attemptedAt: '2026-09-17T12:00:00.000Z',

    ...overrides,
  };
}

function createReconciliation(
  status: 'confirmed' | 'mempool' | 'unknown' | 'unavailable'
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

    checkedAt: '2026-09-17T12:01:00.000Z',

    message: `Settlement reconciliation: ${status}.`,
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

async function assertRejects(operation: () => Promise<unknown>): Promise<void> {
  let rejected = false;

  try {
    await operation();
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error('Expected operation to reject.');
  }
}

function createHarness(input: {
  record: CashOutRecord | undefined;

  broadcastResult?: TreasuryBroadcastResult;

  reconciliationResult?: TreasuryBroadcastReconciliationResult;

  storeBroadcastMissing?: boolean;

  storeReconciliationMissing?: boolean;
}): {
  dependencies: CashOutSettlementNetworkLifecycleDependencies;

  getBroadcastCalls: () => number;

  getReconcileCalls: () => number;

  getRecord: () => CashOutRecord | undefined;
} {
  let record = input.record;

  let broadcastCalls = 0;

  let reconcileCalls = 0;

  return {
    dependencies: {
      async getCashOutRecordById(id) {
        if (!record || record.id !== id) {
          return undefined;
        }

        return record;
      },

      async storeBroadcast(id, broadcast) {
        if (input.storeBroadcastMissing || !record || record.id !== id) {
          return undefined;
        }

        record = applyCashOutSettlementBroadcast(record, broadcast);

        return record;
      },

      async storeReconciliation(id, reconciliation) {
        if (input.storeReconciliationMissing || !record || record.id !== id) {
          return undefined;
        }

        record = applyCashOutSettlementReconciliation(record, reconciliation);

        return record;
      },

      async broadcast(intent) {
        broadcastCalls += 1;

        assertEqual(
          intent,
          INTENT,
          'D4F did not use the exact persisted settlement intent.'
        );

        if (!input.broadcastResult) {
          throw new Error('Unexpected broadcast call.');
        }

        return input.broadcastResult;
      },

      async reconcile(intent) {
        reconcileCalls += 1;

        assertEqual(
          intent,
          INTENT,
          'D4F did not reconcile the exact persisted settlement intent.'
        );

        if (!input.reconciliationResult) {
          throw new Error('Unexpected reconciliation call.');
        }

        return input.reconciliationResult;
      },
    },

    getBroadcastCalls: () => broadcastCalls,

    getReconcileCalls: () => reconcileCalls,

    getRecord: () => record,
  };
}

async function runD4FTests(): Promise<void> {
  /**
   * Fresh D3 intent:
   *
   * submit exact transaction -> persist -> reconcile -> mempool.
   */
  {
    const harness = createHarness({
      record: createCashOut(),

      broadcastResult: createBroadcast('broadcasted'),

      reconciliationResult: createReconciliation('mempool'),
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconcileCalls(), 1);

    assertEqual(result.record.settlementBroadcast?.status, 'broadcasted');

    assertEqual(result.record.settlementReconciliation?.status, 'mempool');

    console.log(
      'PASS: fresh settlement broadcasts exact persisted transaction then reconciles it'
    );
  }

  /**
   * Ambiguous response:
   *
   * persist uncertain -> reconcile -> still unknown -> remain uncertain.
   */
  {
    const harness = createHarness({
      record: createCashOut(),

      broadcastResult: createBroadcast('uncertain'),

      reconciliationResult: createReconciliation('unknown'),
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'uncertain');

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconcileCalls(), 1);

    console.log(
      'PASS: ambiguous submission is persisted and reconciled without replacement'
    );
  }

  /**
   * Restart after uncertain submission:
   *
   * broadcast MUST NOT run again.
   */
  {
    const uncertainRecord = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('uncertain')
    );

    const harness = createHarness({
      record: uncertainRecord,

      reconciliationResult: createReconciliation('unknown'),
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'uncertain');

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 1);

    console.log(
      'PASS: restart after uncertain submission performs check-only recovery'
    );
  }

  /**
   * Previously broadcast settlement may later become confirmed.
   */
  {
    const broadcastRecord = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('broadcasted')
    );

    const harness = createHarness({
      record: broadcastRecord,

      reconciliationResult: createReconciliation('confirmed'),
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'confirmed');

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 1);

    console.log(
      'PASS: existing broadcast state reconciles to confirmation without resubmission'
    );
  }

  /**
   * Proven pre-request failure allows submission of the SAME persisted
   * transaction.
   */
  {
    const previous = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('definitely_not_broadcast')
    );

    const harness = createHarness({
      record: previous,

      broadcastResult: createBroadcast('broadcasted', {
        attemptedAt: '2026-09-17T12:02:00.000Z',
      }),

      reconciliationResult: createReconciliation('mempool'),
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconcileCalls(), 1);

    console.log(
      'PASS: definitely-not-broadcast recovery resubmits only the same durable transaction'
    );
  }

  /**
   * Positive evidence already persisted:
   *
   * no broadcast and no further reconciliation required.
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
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'mempool');

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 0);

    console.log(
      'PASS: positive settlement evidence causes no further D4 network action'
    );
  }

  /**
   * Enabled precondition block remains stopped.
   */
  {
    const blocked = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('blocked', {
        broadcastEnabled: true,

        requestAttempted: false,
      })
    );

    const harness = createHarness({
      record: blocked,
    });

    const result =
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );

    assertEqual(result.outcome, 'blocked');

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 0);

    console.log(
      'PASS: failed enabled precondition does not automatically retry'
    );
  }

  /**
   * Failed durable broadcast persistence must stop before reconciliation.
   */
  {
    const harness = createHarness({
      record: createCashOut(),

      broadcastResult: createBroadcast('broadcasted'),

      reconciliationResult: createReconciliation('mempool'),

      storeBroadcastMissing: true,
    });

    await assertRejects(async () => {
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );
    });

    assertEqual(harness.getBroadcastCalls(), 1);

    assertEqual(harness.getReconcileCalls(), 0);

    console.log(
      'PASS: failed broadcast-state persistence stops lifecycle before reconciliation'
    );
  }

  /**
   * Failed reconciliation persistence also fails closed.
   */
  {
    const uncertain = applyCashOutSettlementBroadcast(
      createCashOut(),
      createBroadcast('uncertain')
    );

    const harness = createHarness({
      record: uncertain,

      reconciliationResult: createReconciliation('unknown'),

      storeReconciliationMissing: true,
    });

    await assertRejects(async () => {
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );
    });

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 1);

    console.log('PASS: failed reconciliation persistence fails closed');
  }

  /**
   * Missing record fails before any network operation.
   */
  {
    const harness = createHarness({
      record: undefined,
    });

    await assertRejects(async () => {
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );
    });

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 0);

    console.log('PASS: missing Cash-out fails before D4 network activity');
  }

  /**
   * D3 write-ahead intent remains mandatory.
   */
  {
    const harness = createHarness({
      record: createCashOut({
        settlementIntent: undefined,
      }),
    });

    await assertRejects(async () => {
      await advanceCashOutSettlementNetworkLifecycleWithDependencies(
        'cash-out-d4f-001',
        harness.dependencies
      );
    });

    assertEqual(harness.getBroadcastCalls(), 0);

    assertEqual(harness.getReconcileCalls(), 0);

    console.log(
      'PASS: D4F cannot operate without the durable D3 write-ahead transaction'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D4F network lifecycle orchestration tests passed.'
  );
}

runD4FTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
