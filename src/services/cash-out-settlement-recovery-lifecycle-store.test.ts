import {
  reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies,
  type CashOutSettlementRecoveryLifecycleStoreDependencies,
} from './cash-out-settlement-recovery-lifecycle-store';

import type { CashOutRecord } from 'src/types/cash-out';

const CASH_OUT_ID = 'cash-out-d6h2a-001';

const RECOVERY_TXID =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const INPUT_TXID =
  '1111111111111111111111111111111111111111111111111111111111111111';

const RECOVERY_INPUT_SATS = 180_000;

const CONFIRMED_AT = '2026-10-08T17:00:00.000Z';

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
        `Expected error containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(
    `Expected operation to reject with "${expectedMessagePart}".`
  );
}

function recoveryIntent(): NonNullable<CashOutRecord['recoveryIntent']> {
  return {
    version: 'cash_out_recovery_signed_transaction_v1',

    cashOutId: CASH_OUT_ID,

    contractAddress: 'bitcoincash:p-d6h2a-recovery-contract',

    inputSetId: 'd6h2a-input-set',

    rawTransactionHex: '00',

    txid: RECOVERY_TXID,

    transactionBytes: 1,

    actualFeeSats: 608,

    preparedAt: '2026-10-08T16:30:00.000Z',

    signingRequest: {
      version: 'cash_out_recovery_signing_request_v1',

      cashOutId: CASH_OUT_ID,

      contractAddress: 'bitcoincash:p-d6h2a-recovery-contract',

      inputSetId: 'd6h2a-input-set',

      inputCount: 1,

      totalInputSats: RECOVERY_INPUT_SATS,

      inputs: [
        {
          outpoint: `${INPUT_TXID}:0`,

          txid: INPUT_TXID,

          vout: 0,

          satoshis: RECOVERY_INPUT_SATS,

          height: 900_000,

          networkState: 'confirmed',
        },
      ],

      exceptionalCase: 'underpayment',

      recoveryFeeSats: 608,

      treasuryDestination: {
        address: 'bitcoincash:q-d6h2a-treasury',

        publicKeyHashHex: '11'.repeat(20),
      },

      treasuryOutputSats: 178_392,

      platformDestination: {
        address: 'bitcoincash:q-d6h2a-platform',

        publicKeyHashHex: '22'.repeat(20),
      },

      platformOutputSats: 1_000,

      outputCount: 2,
    },

    transactionSummary: {} as NonNullable<
      CashOutRecord['recoveryIntent']
    >['transactionSummary'],
  };
}

function recoveryReconciliation(
  status: 'mempool' | 'confirmed'
): NonNullable<CashOutRecord['recoveryReconciliation']> {
  return {
    txid: RECOVERY_TXID,

    status,

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_001,
        }
      : {
          blockHeight: 0,
        }),

    serverChecks: [],

    checkedAt: CONFIRMED_AT,

    message: `Synthetic D6H.2A ${status} evidence.`,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: 'CO-D6H2A-001',

    createdAt: '2026-10-08T15:00:00.000Z',

    updatedAt: '2026-10-08T16:30:00.000Z',

    fiatCurrency: 'GBP',

    fiatAmountMinor: 10_000,

    bchSatsRequired: 206_000,

    status: 'cancelled',

    cancelledAt: '2026-10-08T16:00:00.000Z',

    recoveryIntent: recoveryIntent(),

    recoveryReconciliation: recoveryReconciliation('confirmed'),

    ...overrides,
  } as CashOutRecord;
}

function createHarness(initial: CashOutRecord): {
  dependencies: CashOutSettlementRecoveryLifecycleStoreDependencies;

  getRecord: () => CashOutRecord;

  getWriteCount: () => number;
} {
  let durableRecord = clone(initial);

  let writeCount = 0;

  let queue: Promise<void> = Promise.resolve();

  const mutateCashOutRecordAtomically: CashOutSettlementRecoveryLifecycleStoreDependencies['mutateCashOutRecordAtomically'] =
    (id, updater) => {
      const operation = queue.then(async () => {
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
      });

      queue = operation.then(
        () => undefined,
        () => undefined
      );

      return operation;
    };

  return {
    dependencies: {
      mutateCashOutRecordAtomically,
    },

    getRecord: () => clone(durableRecord),

    getWriteCount: () => writeCount,
  };
}

async function run(): Promise<void> {
  /**
   * Confirmed late-payment recovery durably restores cancelled -> received.
   */
  {
    const harness = createHarness(cashOut());

    const result =
      await reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.record.status, 'received');

    assertEqual(result.record.bchSatsReceived, RECOVERY_INPUT_SATS);

    assertEqual(result.record.completedAt, undefined);

    assertEqual(result.record.cancelledAt, '2026-10-08T16:00:00.000Z');

    assertEqual(result.advancedToReceivedNow, true);

    assertEqual(harness.getWriteCount(), 1);

    console.log(
      'PASS: confirmed recovery atomically restores cancelled Cash-out to received'
    );
  }

  /**
   * Restart/replay is idempotent.
   */
  {
    const harness = createHarness(cashOut());

    await reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    const replay =
      await reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(replay.record.status, 'received');

    assertEqual(replay.advancedToReceivedNow, false);

    assertEqual(harness.getWriteCount(), 1);

    console.log(
      'PASS: recovery lifecycle replay cannot create a second received transition'
    );
  }

  /**
   * Mempool-only recovery must not mutate durable lifecycle state.
   */
  {
    const harness = createHarness(
      cashOut({
        recoveryReconciliation: recoveryReconciliation('mempool'),
      })
    );

    await assertRejects(
      () =>
        reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
          CASH_OUT_ID,
          harness.dependencies
        ),

      'recovery_mempool_wait_for_confirmation'
    );

    assertEqual(harness.getRecord().status, 'cancelled');

    assertEqual(harness.getWriteCount(), 0);

    console.log(
      'PASS: mempool-only recovery cannot persist received lifecycle state'
    );
  }

  /**
   * completed is terminal.
   */
  {
    const completedAt = '2026-10-08T17:15:00.000Z';

    const harness = createHarness(
      cashOut({
        status: 'completed',

        completedAt,

        updatedAt: completedAt,
      })
    );

    const result =
      await reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.record.status, 'completed');

    assertEqual(result.record.completedAt, completedAt);

    assertEqual(result.advancedToReceivedNow, false);

    assertEqual(harness.getWriteCount(), 0);

    console.log(
      'PASS: exceptional recovery lifecycle never reopens completed Cash-out'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D6H.2A recovery lifecycle persistence tests passed.'
  );
}

run().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
