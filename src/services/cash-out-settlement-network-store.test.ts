import {
  storeCashOutSettlementBroadcastWithDependencies,
  storeCashOutSettlementReconciliationWithDependencies,
} from 'src/services/cash-out-settlement-network-store';

import type { CashOutSettlementNetworkStoreDependencies } from 'src/services/cash-out-settlement-network-store';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const OTHER_TXID = 'cd'.repeat(32);

const INTENT = {
  status: 'prepared',

  txid: SETTLEMENT_TXID,
} as CashOutSettlementIntent;

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: 'cash-out-d4-001',

    serial: 'CO-D4-001',

    createdAt: '2026-09-17T10:00:00.000Z',

    updatedAt: '2026-09-17T10:10:00.000Z',

    status: 'received',

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function createBroadcast(
  overrides: Partial<TreasuryBroadcastResult> = {}
): TreasuryBroadcastResult {
  return {
    status: 'broadcasted',

    txid: SETTLEMENT_TXID,

    serverTxid: SETTLEMENT_TXID,

    broadcastEnabled: true,

    requestAttempted: true,

    attemptedAt: '2026-09-17T11:00:00.000Z',

    ...overrides,
  };
}

function createReconciliation(
  status: 'confirmed' | 'mempool' | 'unknown' | 'unavailable',
  overrides: Partial<TreasuryBroadcastReconciliationResult> = {}
): TreasuryBroadcastReconciliationResult {
  if (status === 'confirmed') {
    return {
      txid: SETTLEMENT_TXID,

      status,

      blockHeight: 900_000,

      serverChecks: [],

      checkedAt: '2026-09-17T11:01:00.000Z',

      message: 'Confirmed.',

      ...overrides,
    };
  }

  if (status === 'mempool') {
    return {
      txid: SETTLEMENT_TXID,

      status,

      blockHeight: 0,

      serverChecks: [],

      checkedAt: '2026-09-17T11:01:00.000Z',

      message: 'Mempool.',

      ...overrides,
    };
  }

  return {
    txid: SETTLEMENT_TXID,

    status,

    serverChecks: [],

    checkedAt: '2026-09-17T11:01:00.000Z',

    message: status === 'unknown' ? 'Unknown.' : 'Unavailable.',

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

function createInMemoryStore(initialRecord: CashOutRecord | undefined): {
  dependencies: CashOutSettlementNetworkStoreDependencies;

  getRecord: () => CashOutRecord | undefined;

  getMutationCount: () => number;
} {
  let record = initialRecord;

  let mutationCount = 0;

  return {
    dependencies: {
      async mutateCashOutRecordAtomically(id, updater) {
        mutationCount += 1;

        if (!record || record.id !== id) {
          return undefined;
        }

        const next = updater(record);

        record = next;

        return record;
      },
    },

    getRecord: () => record,

    getMutationCount: () => mutationCount,
  };
}

async function runD4DNetworkStoreTests(): Promise<void> {
  /**
   * Broadcast result is durably attached under one atomic mutation.
   */
  {
    const store = createInMemoryStore(createCashOut());

    const result = await storeCashOutSettlementBroadcastWithDependencies(
      'cash-out-d4-001',
      createBroadcast(),
      store.dependencies
    );

    assertEqual(result?.settlementBroadcast?.status, 'broadcasted');

    assertEqual(result?.settlementBroadcast?.txid, SETTLEMENT_TXID);

    assertEqual(result?.updatedAt, '2026-09-17T11:00:00.000Z');

    assertEqual(store.getMutationCount(), 1);

    console.log('PASS: D4 broadcast state is persisted atomically');
  }

  /**
   * Reconciliation is persisted against the same D3 txid.
   */
  {
    const store = createInMemoryStore(createCashOut());

    const result = await storeCashOutSettlementReconciliationWithDependencies(
      'cash-out-d4-001',
      createReconciliation('mempool'),
      store.dependencies
    );

    assertEqual(result?.settlementReconciliation?.status, 'mempool');

    assertEqual(result?.settlementReconciliation?.txid, SETTLEMENT_TXID);

    assertEqual(result?.updatedAt, '2026-09-17T11:01:00.000Z');

    console.log('PASS: D4 reconciliation evidence is persisted atomically');
  }

  /**
   * Stronger evidence upgrades normally.
   */
  {
    const store = createInMemoryStore(
      createCashOut({
        settlementReconciliation: createReconciliation('mempool'),
      })
    );

    const result = await storeCashOutSettlementReconciliationWithDependencies(
      'cash-out-d4-001',
      createReconciliation('confirmed', {
        checkedAt: '2026-09-17T11:02:00.000Z',
      }),
      store.dependencies
    );

    assertEqual(result?.settlementReconciliation?.status, 'confirmed');

    assertEqual(result?.updatedAt, '2026-09-17T11:02:00.000Z');

    console.log(
      'PASS: persisted settlement evidence upgrades from mempool to confirmed'
    );
  }

  /**
   * Weaker later evidence cannot overwrite stronger positive evidence.
   *
   * updatedAt must also remain unchanged because no durable state changed.
   */
  {
    const originalUpdatedAt = '2026-09-17T11:02:00.000Z';

    const existing = createCashOut({
      updatedAt: originalUpdatedAt,

      settlementReconciliation: createReconciliation('confirmed', {
        checkedAt: originalUpdatedAt,
      }),
    });

    const store = createInMemoryStore(existing);

    const result = await storeCashOutSettlementReconciliationWithDependencies(
      'cash-out-d4-001',
      createReconciliation('unknown', {
        checkedAt: '2026-09-17T11:03:00.000Z',
      }),
      store.dependencies
    );

    assertEqual(result, existing);

    assertEqual(result?.settlementReconciliation?.status, 'confirmed');

    assertEqual(result?.updatedAt, originalUpdatedAt);

    console.log(
      'PASS: weaker reconciliation cannot overwrite positive durable evidence'
    );
  }

  /**
   * Broadcast state for another txid fails closed.
   */
  {
    const store = createInMemoryStore(createCashOut());

    await assertRejects(async () => {
      await storeCashOutSettlementBroadcastWithDependencies(
        'cash-out-d4-001',
        createBroadcast({
          txid: OTHER_TXID,

          serverTxid: OTHER_TXID,
        }),
        store.dependencies
      );
    });

    assertEqual(store.getRecord()?.settlementBroadcast, undefined);

    console.log('PASS: contradictory broadcast txid is never persisted');
  }

  /**
   * Reconciliation for another txid also fails closed.
   */
  {
    const store = createInMemoryStore(createCashOut());

    await assertRejects(async () => {
      await storeCashOutSettlementReconciliationWithDependencies(
        'cash-out-d4-001',
        createReconciliation('mempool', {
          txid: OTHER_TXID,
        }),
        store.dependencies
      );
    });

    assertEqual(store.getRecord()?.settlementReconciliation, undefined);

    console.log('PASS: contradictory reconciliation txid is never persisted');
  }

  /**
   * D4 network state cannot be persisted without the durable D3 intent.
   */
  {
    const store = createInMemoryStore(
      createCashOut({
        settlementIntent: undefined,
      })
    );

    await assertRejects(async () => {
      await storeCashOutSettlementBroadcastWithDependencies(
        'cash-out-d4-001',
        createBroadcast(),
        store.dependencies
      );
    });

    console.log(
      'PASS: durable D3 intent remains mandatory before D4 persistence'
    );
  }

  /**
   * Missing Cash-out record produces no invented state.
   */
  {
    const store = createInMemoryStore(undefined);

    const result = await storeCashOutSettlementBroadcastWithDependencies(
      'missing-cash-out',
      createBroadcast(),
      store.dependencies
    );

    assertEqual(result, undefined);

    console.log(
      'PASS: missing Cash-out record cannot acquire synthetic D4 state'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D4D durable network-state persistence tests passed.'
  );
}

runD4DNetworkStoreTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
