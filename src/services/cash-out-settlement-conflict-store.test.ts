import {
  resolveStoredCashOutSettlementSourceConflictWithDependencies,
  storeCashOutSettlementSourceConflictWithDependencies,
  type CashOutSettlementConflictStoreDependencies,
} from 'src/services/cash-out-settlement-conflict-store';

import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5d3b-001';

const CASH_OUT_SERIAL = 'CO-D5D3B-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const DIFFERENT_CONFLICT_TXID = '44'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '55'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: 2,

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

function reconciliation(
  status: 'mempool' | 'confirmed'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    blockHeight: status === 'confirmed' ? 900_000 : 0,

    serverChecks: [],

    checkedAt: '2026-09-25T12:05:00.000Z',

    message: `D5D.3b ${status}.`,
  };
}

function conflict(
  overrides: Partial<CashOutSettlementSourceConflictEvidence> = {}
): CashOutSettlementSourceConflictEvidence {
  return {
    state: 'detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    conflictingTxid: CONFLICT_TXID,

    conflictingTransactionStatus: 'mempool',

    conflictingTransactionBlockHeight: 0,

    detectedAt: '2026-09-25T12:02:00.000Z',

    message: 'Different transaction spends exact settlement source.',

    ...overrides,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:01:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    settlementReconciliation: reconciliation('mempool'),

    ...overrides,
  } as CashOutRecord;
}

function clone<T>(value: T): T {
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

  throw new Error(`Expected rejection containing "${expectedMessagePart}".`);
}

function createStoreHarness(initialRecord: CashOutRecord): {
  dependencies: CashOutSettlementConflictStoreDependencies;

  getDurableRecord: () => CashOutRecord;

  getWriteCount: () => number;
} {
  /**
   * Represents the IndexedDB copy only.
   *
   * Every mutation/read crosses JSON serialization to ensure these tests do
   * not accidentally rely on shared in-memory object identity.
   */
  let durableRecord = clone(initialRecord);

  let writeCount = 0;

  const dependencies: CashOutSettlementConflictStoreDependencies = {
    mutateCashOutRecordAtomically: async (id, updater) => {
      if (id !== durableRecord.id) {
        return undefined;
      }

      const current = clone(durableRecord);

      const next = updater(current);

      /**
       * Mirror the production mutator's no-op behaviour:
       *
       * returning the exact same object means no persistent write.
       */
      if (next !== current) {
        durableRecord = clone(next);

        writeCount += 1;
      }

      return clone(next);
    },
  };

  return {
    dependencies,

    getDurableRecord: () => clone(durableRecord),

    getWriteCount: () => writeCount,
  };
}

async function runD5D3BTests(): Promise<void> {
  /**
   * First positive conflict is atomically persisted.
   */
  {
    const harness = createStoreHarness(cashOut());

    const stored = await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,
      conflict(),
      harness.dependencies
    );

    assertEqual(harness.getWriteCount(), 1);

    assertEqual(
      stored?.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    assertEqual(stored?.updatedAt, '2026-09-25T12:02:00.000Z');

    assertEqual(stored?.status, 'received');

    console.log(
      'PASS: first positive conflict is persisted atomically without changing Cash-out business status'
    );
  }

  /**
   * Simulate complete app process death and reload from durable storage.
   */
  {
    const harness = createStoreHarness(cashOut());

    await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,
      conflict(),
      harness.dependencies
    );

    const restartedRecord = clone(harness.getDurableRecord());

    const safety = evaluateCashOutSettlementMerchantSafety(restartedRecord);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'settlement_source_conflict');

    assertEqual(
      restartedRecord.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    console.log(
      'PASS: persisted source conflict survives complete restart and recreates merchant hard stop'
    );
  }

  /**
   * Same mempool observation is truly idempotent at the persistence layer.
   */
  {
    const harness = createStoreHarness(cashOut());

    await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,
      conflict(),
      harness.dependencies
    );

    const beforeReplay = harness.getDurableRecord();

    await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,

      conflict({
        detectedAt: '2026-09-25T12:10:00.000Z',
      }),

      harness.dependencies
    );

    const afterReplay = harness.getDurableRecord();

    assertEqual(
      harness.getWriteCount(),
      1,
      'Idempotent conflict replay caused another durable write.'
    );

    assertEqual(afterReplay.updatedAt, beforeReplay.updatedAt);

    assertEqual(
      afterReplay.settlementSourceConflict?.detectedAt,
      '2026-09-25T12:02:00.000Z'
    );

    console.log(
      'PASS: repeated conflict observation causes no duplicate write or updatedAt churn'
    );
  }

  /**
   * Same spender strengthening to confirmed creates exactly one new write.
   */
  {
    const harness = createStoreHarness(cashOut());

    await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,
      conflict(),
      harness.dependencies
    );

    const strengthenedAt = '2026-09-25T12:10:00.000Z';

    await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,

      conflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 899_999,

        detectedAt: strengthenedAt,

        message: 'Conflicting transaction is now confirmed.',
      }),

      harness.dependencies
    );

    const durable = harness.getDurableRecord();

    assertEqual(harness.getWriteCount(), 2);

    assertEqual(
      durable.settlementSourceConflict?.conflictingTransactionStatus,
      'confirmed'
    );

    assertEqual(
      durable.settlementSourceConflict?.conflictingTransactionBlockHeight,
      899_999
    );

    assertEqual(
      durable.settlementSourceConflict?.detectedAt,
      '2026-09-25T12:02:00.000Z'
    );

    assertEqual(durable.updatedAt, strengthenedAt);

    console.log(
      'PASS: stronger confirmed evidence persists monotonically while preserving first detection time'
    );
  }

  /**
   * Different conflicting transaction must fail without rewriting durable
   * evidence.
   */
  {
    const harness = createStoreHarness(cashOut());

    await storeCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,
      conflict(),
      harness.dependencies
    );

    await assertRejects(
      () =>
        storeCashOutSettlementSourceConflictWithDependencies(
          CASH_OUT_ID,

          conflict({
            conflictingTxid: DIFFERENT_CONFLICT_TXID,

            detectedAt: '2026-09-25T12:10:00.000Z',
          }),

          harness.dependencies
        ),

      'different conflicting transaction'
    );

    const durable = harness.getDurableRecord();

    assertEqual(harness.getWriteCount(), 1);

    assertEqual(
      durable.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    console.log(
      'PASS: rejected replacement conflict cannot corrupt durable audit evidence'
    );
  }

  /**
   * Mempool settlement evidence may not clear durable conflict state.
   */
  {
    const harness = createStoreHarness(
      cashOut({
        settlementSourceConflict: conflict(),
      })
    );

    await assertRejects(
      () =>
        resolveStoredCashOutSettlementSourceConflictWithDependencies(
          CASH_OUT_ID,

          '2026-09-25T12:20:00.000Z',

          harness.dependencies
        ),

      'only be resolved after confirmed evidence'
    );

    assertEqual(harness.getWriteCount(), 0);

    assertEqual(
      harness.getDurableRecord().settlementSourceConflict?.state,
      'detected'
    );

    console.log(
      'PASS: persistence layer cannot clear conflict while settlement is only in mempool'
    );
  }

  /**
   * Exact confirmed settlement allows the explicit durable resolution.
   */
  {
    const harness = createStoreHarness(
      cashOut({
        settlementReconciliation: reconciliation('confirmed'),

        settlementSourceConflict: conflict(),
      })
    );

    const resolvedAt = '2026-09-25T12:20:00.000Z';

    const resolved =
      await resolveStoredCashOutSettlementSourceConflictWithDependencies(
        CASH_OUT_ID,
        resolvedAt,
        harness.dependencies
      );

    assertEqual(harness.getWriteCount(), 1);

    assertEqual(resolved?.settlementSourceConflict?.state, 'resolved');

    assertEqual(
      resolved?.settlementSourceConflict?.resolution,
      'exact_settlement_confirmed'
    );

    assertEqual(resolved?.updatedAt, resolvedAt);

    /**
     * Now simulate another total process death.
     */
    const restarted = clone(harness.getDurableRecord());

    const safety = evaluateCashOutSettlementMerchantSafety(restarted);

    assertEqual(safety.safeToHandCash, true);

    assertEqual(safety.reason, 'settlement_confirmed');

    console.log(
      'PASS: confirmed exact settlement resolution persists and remains resolved after restart'
    );
  }

  /**
   * Repeating resolution is persistence-idempotent.
   */
  {
    const harness = createStoreHarness(
      cashOut({
        settlementReconciliation: reconciliation('confirmed'),

        settlementSourceConflict: {
          ...conflict(),

          state: 'resolved',

          resolvedAt: '2026-09-25T12:20:00.000Z',

          resolution: 'exact_settlement_confirmed',
        },

        updatedAt: '2026-09-25T12:20:00.000Z',
      })
    );

    await resolveStoredCashOutSettlementSourceConflictWithDependencies(
      CASH_OUT_ID,
      '2026-09-25T12:30:00.000Z',
      harness.dependencies
    );

    assertEqual(harness.getWriteCount(), 0);

    assertEqual(
      harness.getDurableRecord().settlementSourceConflict?.resolvedAt,
      '2026-09-25T12:20:00.000Z'
    );

    console.log(
      'PASS: already-resolved durable conflict does not rewrite storage'
    );
  }

  /**
   * Missing Cash-out behaves like every other atomic Cash-out store operation.
   */
  {
    const harness = createStoreHarness(cashOut());

    const missing = await storeCashOutSettlementSourceConflictWithDependencies(
      'missing-cash-out',
      conflict(),
      harness.dependencies
    );

    assertEqual(missing, undefined);

    assertEqual(harness.getWriteCount(), 0);

    console.log(
      'PASS: missing Cash-out returns undefined without durable mutation'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5D.3b atomic conflict persistence tests passed.'
  );
}

runD5D3BTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
