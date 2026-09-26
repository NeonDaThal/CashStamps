import {
  confirmCashOutCashHandoverAtomicallyWithDependencies,
  confirmCashOutCashHandoverWithDependencies,
  type CashOutCashHandoverConfirmationDependencies,
  type CashOutCashHandoverStoreDependencies,
} from 'src/services/cash-out-settlement-cash-handover-store';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5e2-001';

const CASH_OUT_SERIAL = 'CO-D5E2-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const CONFIRMED_AT = '2026-09-25T16:30:00.000Z';

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '44'.repeat(32),

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

  preparedAt: '2026-09-25T16:00:00.000Z',
};

function reconciliation(
  status: 'mempool' | 'confirmed'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    blockHeight: status === 'confirmed' ? 900_000 : 0,

    serverChecks: [],

    checkedAt: '2026-09-25T16:20:00.000Z',

    message: `D5E.2 ${status}.`,
  };
}

function conflict(): CashOutSettlementSourceConflictEvidence {
  return {
    state: 'detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    conflictingTxid: CONFLICT_TXID,

    conflictingTransactionStatus: 'mempool',

    conflictingTransactionBlockHeight: 0,

    detectedAt: '2026-09-25T16:25:00.000Z',

    message: 'Different transaction spends exact settlement source.',
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T15:55:00.000Z',

    updatedAt: '2026-09-25T16:20:00.000Z',

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

function createAtomicHarness(initialRecord: CashOutRecord): {
  dependencies: CashOutCashHandoverStoreDependencies;

  getRecord: () => CashOutRecord;

  replaceRecord: (record: CashOutRecord) => void;

  getWriteCount: () => number;
} {
  let durableRecord = clone(initialRecord);

  let writeCount = 0;

  const dependencies: CashOutCashHandoverStoreDependencies = {
    mutateCashOutRecordAtomically: async (id, updater) => {
      if (id !== durableRecord.id) {
        return undefined;
      }

      const current = clone(durableRecord);

      const next = updater(current);

      if (next !== current) {
        durableRecord = clone(next);

        writeCount += 1;
      }

      return clone(next);
    },
  };

  return {
    dependencies,

    getRecord: () => clone(durableRecord),

    replaceRecord: (record) => {
      durableRecord = clone(record);
    },

    getWriteCount: () => writeCount,
  };
}

async function runD5E2Tests(): Promise<void> {
  /**
   * Ordinary safe received Cash-out completes atomically.
   */
  {
    const harness = createAtomicHarness(cashOut());

    const completed =
      await confirmCashOutCashHandoverAtomicallyWithDependencies(
        CASH_OUT_ID,

        {
          merchantConfirmedCashHandedOver: true,

          confirmedAt: CONFIRMED_AT,
        },

        harness.dependencies
      );

    assertEqual(completed?.status, 'completed');

    assertEqual(completed?.completedAt, CONFIRMED_AT);

    assertEqual(harness.getWriteCount(), 1);

    console.log(
      'PASS: safe received Cash-out completes through atomic handover mutation'
    );
  }

  /**
   * Atomic mutation reads newest durable conflict evidence.
   */
  {
    const harness = createAtomicHarness(
      cashOut({
        settlementSourceConflict: conflict(),
      })
    );

    await assertRejects(
      () =>
        confirmCashOutCashHandoverAtomicallyWithDependencies(
          CASH_OUT_ID,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          },

          harness.dependencies
        ),

      'settlement_not_safe'
    );

    assertEqual(harness.getRecord().status, 'received');

    assertEqual(harness.getWriteCount(), 0);

    console.log(
      'PASS: latest durable conflict evidence blocks atomic completion'
    );
  }

  /**
   * Critical race:
   *
   * preflight saw a safe record, but conflict becomes durable before the final
   * atomic completion mutation.
   *
   * The latest durable state must win.
   */
  {
    const harness = createAtomicHarness(cashOut());

    const dependencies: CashOutCashHandoverConfirmationDependencies = {
      ...harness.dependencies,

      recoverConflictAware: async () => {
        const safeSnapshot = harness.getRecord();

        /**
         * Simulate conflict evidence being persisted immediately AFTER
         * preflight but BEFORE the merchant completion mutation.
         */
        harness.replaceRecord({
          ...safeSnapshot,

          settlementSourceConflict: conflict(),

          updatedAt: '2026-09-25T16:25:00.000Z',
        });

        return {
          record: safeSnapshot,

          merchantSafety: {
            safeToHandCash: true,

            reason: 'settlement_mempool',
          },
        };
      },
    };

    await assertRejects(
      () =>
        confirmCashOutCashHandoverWithDependencies(
          CASH_OUT_ID,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          },

          dependencies
        ),

      'settlement_not_safe'
    );

    assertEqual(harness.getRecord().status, 'received');

    assertEqual(
      harness.getRecord().settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    assertEqual(harness.getWriteCount(), 0);

    console.log(
      'PASS: stale safe preflight cannot override newer durable conflict evidence'
    );
  }

  /**
   * Unsafe preflight must not even attempt the completion mutation.
   */
  {
    const harness = createAtomicHarness(cashOut());

    let mutationCalls = 0;

    const dependencies: CashOutCashHandoverConfirmationDependencies = {
      mutateCashOutRecordAtomically: async (id, updater) => {
        mutationCalls += 1;

        return harness.dependencies.mutateCashOutRecordAtomically(id, updater);
      },

      recoverConflictAware: async () => ({
        record: harness.getRecord(),

        merchantSafety: {
          safeToHandCash: false,

          reason: 'settlement_source_conflict',
        },
      }),
    };

    await assertRejects(
      () =>
        confirmCashOutCashHandoverWithDependencies(
          CASH_OUT_ID,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          },

          dependencies
        ),

      'preflight is unsafe'
    );

    assertEqual(mutationCalls, 0);

    assertEqual(harness.getRecord().status, 'received');

    console.log(
      'PASS: unsafe conflict-aware preflight performs no completion mutation'
    );
  }

  /**
   * Successful preflight + still-safe atomic state completes normally.
   */
  {
    const harness = createAtomicHarness(cashOut());

    const dependencies: CashOutCashHandoverConfirmationDependencies = {
      ...harness.dependencies,

      recoverConflictAware: async () => ({
        record: harness.getRecord(),

        merchantSafety: {
          safeToHandCash: true,

          reason: 'settlement_mempool',
        },
      }),
    };

    const result = await confirmCashOutCashHandoverWithDependencies(
      CASH_OUT_ID,

      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: CONFIRMED_AT,
      },

      dependencies
    );

    assertEqual(result.record.status, 'completed');

    assertEqual(result.completedNow, true);

    assertEqual(harness.getWriteCount(), 1);

    console.log(
      'PASS: safe preflight plus safe latest durable state completes once'
    );
  }

  /**
   * Repeated merchant confirmation is idempotent.
   */
  {
    const originalCompletedAt = '2026-09-25T16:20:00.000Z';

    const harness = createAtomicHarness(
      cashOut({
        status: 'completed',

        completedAt: originalCompletedAt,

        updatedAt: originalCompletedAt,
      })
    );

    const dependencies: CashOutCashHandoverConfirmationDependencies = {
      ...harness.dependencies,

      recoverConflictAware: async () => ({
        record: harness.getRecord(),

        merchantSafety: {
          safeToHandCash: false,

          reason: 'cash_out_already_completed',
        },
      }),
    };

    const result = await confirmCashOutCashHandoverWithDependencies(
      CASH_OUT_ID,

      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: CONFIRMED_AT,
      },

      dependencies
    );

    assertEqual(result.record.status, 'completed');

    assertEqual(result.record.completedAt, originalCompletedAt);

    assertEqual(result.completedNow, false);

    assertEqual(harness.getWriteCount(), 0);

    console.log(
      'PASS: repeated merchant confirmation cannot create a second completion'
    );
  }

  /**
   * Missing record must fail instead of pretending completion succeeded.
   */
  {
    const harness = createAtomicHarness(cashOut());

    const missing = await confirmCashOutCashHandoverAtomicallyWithDependencies(
      'missing-cash-out',

      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: CONFIRMED_AT,
      },

      harness.dependencies
    );

    assertEqual(missing, undefined);

    assertEqual(harness.getWriteCount(), 0);

    console.log('PASS: missing Cash-out cannot produce phantom completion');
  }

  console.log('');

  console.log('Cash-out Settlement D5E.2 atomic cash-handover tests passed.');
}

runD5E2Tests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
