import {
  completeRecoveredCashOutSettlementWithDependencies,
  type CashOutSettlementRecoveryCompletionDependencies,
} from './cash-out-settlement-recovery-completion';

import { reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies } from './cash-out-settlement-recovery-lifecycle-store';

import type { CashOutRecord } from 'src/types/cash-out';

const CASH_OUT_ID = 'cash-out-d6h2b-001';

const RECOVERY_TXID =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const INPUT_TXID =
  '1111111111111111111111111111111111111111111111111111111111111111';

const RECOVERY_INPUT_SATS = 180_000;

const FIAT_PAYOUT_MINOR = 10_000;

const CONFIRMED_AT = '2026-10-16T14:00:00.000Z';

const HANDED_OVER_AT = '2026-10-16T14:05:00.000Z';

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

    contractAddress: 'bitcoincash:p-d6h2b-recovery-contract',

    inputSetId: 'd6h2b-input-set',

    rawTransactionHex: '00',

    txid: RECOVERY_TXID,

    transactionBytes: 1,

    actualFeeSats: 608,

    preparedAt: '2026-10-16T13:30:00.000Z',

    signingRequest: {
      version: 'cash_out_recovery_signing_request_v1',

      cashOutId: CASH_OUT_ID,

      contractAddress: 'bitcoincash:p-d6h2b-recovery-contract',

      inputSetId: 'd6h2b-input-set',

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
        address: 'bitcoincash:q-d6h2b-treasury',

        publicKeyHashHex: '11'.repeat(20),
      },

      treasuryOutputSats: 178_392,

      platformDestination: {
        address: 'bitcoincash:q-d6h2b-platform',

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

    blockHeight: status === 'confirmed' ? 900_001 : 0,

    serverChecks: [],

    checkedAt: CONFIRMED_AT,

    message: `Synthetic D6H.2B ${status} recovery evidence.`,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: 'CO-D6H2B-001',

    createdAt: '2026-10-16T13:00:00.000Z',

    updatedAt: '2026-10-16T13:30:00.000Z',

    fiatCurrency: 'GBP',

    /**
     * This remains the physical cash payout even though the customer
     * underpaid BCH.
     */
    fiatAmountMinor: FIAT_PAYOUT_MINOR,

    customerSendsFiatEquivalentMinor: 10_300,

    bchSatsRequired: 206_000,

    status: 'cancelled',

    cancelledAt: '2026-10-16T13:20:00.000Z',

    recoveryIntent: recoveryIntent(),

    recoveryReconciliation: recoveryReconciliation('confirmed'),

    ...overrides,
  } as CashOutRecord;
}

function createHarness(initial: CashOutRecord): {
  dependencies: CashOutSettlementRecoveryCompletionDependencies;

  getRecord: () => CashOutRecord;

  getCashOutWriteCount: () => number;

  getAccountingCalls: () => number;

  getLastAccountedFiatAmount: () => number | undefined;
} {
  let durableRecord = clone(initial);

  let cashOutWriteCount = 0;

  let accountingCalls = 0;

  let lastAccountedFiatAmount: number | undefined;

  let queue: Promise<void> = Promise.resolve();

  const mutateCashOutRecordAtomically: CashOutSettlementRecoveryCompletionDependencies['mutateCashOutRecordAtomically'] =
    (id, updater) => {
      const operation = queue.then(async () => {
        if (id !== durableRecord.id) {
          return undefined;
        }

        const current = clone(durableRecord);

        const next = updater(current);

        if (next !== current) {
          durableRecord = clone(next);

          cashOutWriteCount += 1;
        }

        return clone(next);
      });

      queue = operation.then(
        () => undefined,
        () => undefined
      );

      return operation;
    };

  const dependencies: CashOutSettlementRecoveryCompletionDependencies = {
    mutateCashOutRecordAtomically,

    reconcileRecoveryLifecycle: (id) =>
      reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(id, {
        mutateCashOutRecordAtomically,
      }),

    reconcileAccounting: async (id) => {
      accountingCalls += 1;

      if (id !== durableRecord.id) {
        return {
          status: 'missing_cash_out',
        };
      }

      if (durableRecord.status !== 'completed') {
        return {
          status: 'not_completed',

          cashOut: clone(durableRecord),
        };
      }

      lastAccountedFiatAmount = durableRecord.fiatAmountMinor;

      return {
        status: 'reconciled',

        cashOut: clone(durableRecord),
      };
    },
  };

  return {
    dependencies,

    getRecord: () => clone(durableRecord),

    getCashOutWriteCount: () => cashOutWriteCount,

    getAccountingCalls: () => accountingCalls,

    getLastAccountedFiatAmount: () => lastAccountedFiatAmount,
  };
}

const CONFIRMATION = {
  merchantConfirmedCashHandedOver: true as const,

  confirmedAt: HANDED_OVER_AT,
};

async function run(): Promise<void> {
  /**
   * Full recovery completion:
   *
   * cancelled -> received -> completed
   *
   * The recovery BCH amount is an underpayment but the original fiat payout
   * remains authoritative.
   */
  {
    const harness = createHarness(cashOut());

    const result = await completeRecoveredCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.dependencies
    );

    assertEqual(result.recoveryLifecycle.advancedToReceivedNow, true);

    assertEqual(result.handover.completedNow, true);

    assertEqual(result.handover.record.status, 'completed');

    assertEqual(result.handover.record.completedAt, HANDED_OVER_AT);

    assertEqual(result.handover.record.bchSatsReceived, RECOVERY_INPUT_SATS);

    assertEqual(result.handover.record.fiatAmountMinor, FIAT_PAYOUT_MINOR);

    assertEqual(result.accounting.status, 'reconciled');

    assertEqual(harness.getLastAccountedFiatAmount(), FIAT_PAYOUT_MINOR);

    assertEqual(harness.getAccountingCalls(), 1);

    console.log(
      'PASS: confirmed recovery reaches explicit cash completion using original fiat payout'
    );
  }

  /**
   * Recovery must never auto-complete merely because BCH recovery confirmed.
   *
   * D6H.2A alone leaves it received.
   */
  {
    const harness = createHarness(cashOut());

    const recovered = await harness.dependencies.reconcileRecoveryLifecycle(
      CASH_OUT_ID
    );

    assertEqual(recovered.record.status, 'received');

    assertEqual(recovered.record.completedAt, undefined);

    assertEqual(harness.getAccountingCalls(), 0);

    console.log(
      'PASS: confirmed recovery alone does not complete physical cash payout'
    );
  }

  /**
   * Mempool-only recovery cannot reach either received/completed accounting.
   */
  {
    const harness = createHarness(
      cashOut({
        recoveryReconciliation: recoveryReconciliation('mempool'),
      })
    );

    await assertRejects(
      () =>
        completeRecoveredCashOutSettlementWithDependencies(
          CASH_OUT_ID,
          CONFIRMATION,
          harness.dependencies
        ),

      'recovery_mempool_wait_for_confirmation'
    );

    assertEqual(harness.getRecord().status, 'cancelled');

    assertEqual(harness.getAccountingCalls(), 0);

    console.log(
      'PASS: mempool-only recovery cannot reach cash handover or accounting'
    );
  }

  /**
   * Crash/restart replay:
   *
   * Once physical completion is durable, another merchant action cannot create
   * a second completion or rewrite completedAt.
   */
  {
    const harness = createHarness(cashOut());

    await completeRecoveredCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.dependencies
    );

    const writesAfterFirstCompletion = harness.getCashOutWriteCount();

    const replay = await completeRecoveredCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: '2026-10-16T14:20:00.000Z',
      },
      harness.dependencies
    );

    assertEqual(replay.handover.completedNow, false);

    assertEqual(harness.getRecord().completedAt, HANDED_OVER_AT);

    assertEqual(harness.getCashOutWriteCount(), writesAfterFirstCompletion);

    console.log(
      'PASS: recovery completion replay cannot create another physical payout event'
    );
  }

  /**
   * Corruption introduced AFTER recovery lifecycle reconciliation but BEFORE
   * the final atomic physical-cash boundary must fail closed.
   *
   * D6H.2A is allowed to repair an already-inconsistent received amount from the
   * stronger exact confirmed-recovery evidence. What matters here is that the
   * final handover boundary independently revalidates durable state rather than
   * trusting an earlier preflight result.
   */
  {
    const harness = createHarness(cashOut());

    const dependencies: CashOutSettlementRecoveryCompletionDependencies = {
      ...harness.dependencies,

      reconcileRecoveryLifecycle: async (id) => {
        const result = await harness.dependencies.reconcileRecoveryLifecycle(
          id
        );

        /**
         * Simulate corruption/race after D6H.2A successfully persisted the
         * authoritative received state but before physical cash confirmation
         * reaches its own atomic mutation.
         */
        await harness.dependencies.mutateCashOutRecordAtomically(
          id,

          (current) => ({
            ...current,

            bchSatsReceived: RECOVERY_INPUT_SATS + 1,
          })
        );

        return result;
      },
    };

    await assertRejects(
      () =>
        completeRecoveredCashOutSettlementWithDependencies(
          CASH_OUT_ID,
          CONFIRMATION,
          dependencies
        ),

      'durable BCH received amount does not match'
    );

    assertEqual(harness.getRecord().status, 'received');

    assertEqual(harness.getRecord().completedAt, undefined);

    assertEqual(harness.getAccountingCalls(), 0);

    console.log(
      'PASS: post-reconciliation BCH received corruption cannot cross physical-cash boundary'
    );
  }

  console.log('');

  console.log('Cash-out Settlement D6H.2B recovery completion tests passed.');
}

run().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
