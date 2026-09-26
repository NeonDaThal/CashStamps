import {
  reconcileCompletedCashOutAccountingWithDependencies,
  type CashOutSettlementAccountingDependencies,
} from 'src/services/cash-out-settlement-accounting';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOnHandMovement,
  CashOnHandState,
} from 'src/types/cash-on-hand';

const CASH_OUT_ID = 'cash-out-d5f2-001';

const CASH_OUT_SERIAL = 'CO-D5F2-001';

const COMPLETED_AT = '2026-09-25T17:00:00.000Z';

const CASH_PAYOUT_MINOR = 10_000;

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T16:30:00.000Z',

    updatedAt: COMPLETED_AT,

    fiatCurrency: 'GBP',

    fiatAmountMinor: CASH_PAYOUT_MINOR,

    customerSendsFiatEquivalentMinor: 10_300,

    marketBchSats: 200_000,

    bchSatsRequired: 206_000,

    quote: {
      source: 'coingecko',

      fiatCurrency: 'GBP',

      marketRate: 500,

      marketRateTimestamp: '2026-09-25T16:30:00.000Z',

      isFallbackQuote: false,
    },

    fee: {
      feeModel: 'cash_out_v1',

      totalServiceFeeBasisPoints: 300,

      totalServiceFeeAmountMinor: 300,

      platformFeeBasisPoints: 150,

      platformFeeAmountMinor: 150,

      merchantFeeBasisPoints: 150,

      merchantFeeAmountMinor: 150,

      settlementMode: 'accounting_only',
    },

    treasuryReceivingAddress: 'bitcoincash:q-test-cash-out-address',

    status: 'completed',

    completedAt: COMPLETED_AT,

    ...overrides,
  } as CashOutRecord;
}

function emptyCashOnHand(): CashOnHandState {
  return {
    isSetUp: true,

    currency: 'GBP',

    balanceMinor: 50_000,

    createdAt: '2026-09-25T10:00:00.000Z',

    updatedAt: '2026-09-25T10:00:00.000Z',

    movements: [],
  };
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

function createHarness(
  initialCashOut: CashOutRecord | undefined,
  cashOnHandEnabled = true
): {
  dependencies: CashOutSettlementAccountingDependencies;

  getCashOnHand: () => CashOnHandState;

  getRecordCalls: () => number;

  getAccountingCalls: () => number;
} {
  const storedCashOut = initialCashOut ? clone(initialCashOut) : undefined;

  let cashOnHand = emptyCashOnHand();

  if (!cashOnHandEnabled) {
    cashOnHand = {
      ...cashOnHand,

      isSetUp: false,

      balanceMinor: 0,
    };
  }

  let recordCalls = 0;

  let accountingCalls = 0;

  const dependencies: CashOutSettlementAccountingDependencies = {
    getCashOutRecordById: async (id) => {
      recordCalls += 1;

      if (!storedCashOut || storedCashOut.id !== id) {
        return undefined;
      }

      return clone(storedCashOut);
    },

    recordCashOutPaid: async (input) => {
      accountingCalls += 1;

      if (!cashOnHand.isSetUp) {
        return undefined;
      }

      /**
       * Mirror the production idempotency rule.
       */
      const existing = cashOnHand.movements.find(
        (movement) =>
          movement.type === 'cash_out_paid' &&
          movement.relatedRecordId === input.relatedRecordId
      );

      if (existing) {
        return clone(cashOnHand);
      }

      const nextBalanceMinor = cashOnHand.balanceMinor - input.amountMinor;

      const movement: CashOnHandMovement = {
        id: `movement-${accountingCalls}`,

        type: 'cash_out_paid',

        amountMinor: input.amountMinor,

        balanceAfterMinor: nextBalanceMinor,

        currency: input.currency,

        relatedRecordId: input.relatedRecordId,

        relatedRecordType: 'cash_out',

        note: input.note,

        createdAt: input.createdAt ?? 'unexpected',
      };

      cashOnHand = {
        ...cashOnHand,

        balanceMinor: nextBalanceMinor,

        updatedAt: movement.createdAt,

        movements: [movement, ...cashOnHand.movements],
      };

      return clone(cashOnHand);
    },
  };

  return {
    dependencies,

    getCashOnHand: () => clone(cashOnHand),

    getRecordCalls: () => recordCalls,

    getAccountingCalls: () => accountingCalls,
  };
}

async function runD5F2Tests(): Promise<void> {
  /**
   * Ordinary completed Cash-out produces exactly one payout movement.
   */
  {
    const harness = createHarness(cashOut());

    const result = await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(result.status, 'reconciled');

    const state = harness.getCashOnHand();

    assertEqual(state.balanceMinor, 40_000);

    assertEqual(state.movements.length, 1);

    assertEqual(state.movements[0]?.type, 'cash_out_paid');

    assertEqual(state.movements[0]?.amountMinor, CASH_PAYOUT_MINOR);

    assertEqual(state.movements[0]?.relatedRecordId, CASH_OUT_ID);

    assertEqual(state.movements[0]?.createdAt, COMPLETED_AT);

    console.log(
      'PASS: completed Cash-out reconciles fiat payout into Cash on Hand'
    );
  }

  /**
   * Critical amount rule:
   *
   * cash payout uses fiatAmountMinor, NOT customerSendsFiatEquivalentMinor.
   */
  {
    const harness = createHarness(
      cashOut({
        fiatAmountMinor: 10_000,

        customerSendsFiatEquivalentMinor: 99_999,
      })
    );

    await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getCashOnHand().movements[0]?.amountMinor, 10_000);

    console.log(
      'PASS: accounting uses physical cash payout amount, not BCH-side fiat equivalent'
    );
  }

  /**
   * received is never an accounting event.
   */
  {
    const harness = createHarness(
      cashOut({
        status: 'received',

        completedAt: undefined,
      })
    );

    const result = await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(result.status, 'not_completed');

    assertEqual(harness.getAccountingCalls(), 0);

    assertEqual(harness.getCashOnHand().balanceMinor, 50_000);

    console.log('PASS: received Cash-out does not deduct Cash on Hand');
  }

  /**
   * Crash case A:
   *
   * Cash-out completion was persisted, then app died BEFORE accounting.
   *
   * Restart reconciliation fills the missing movement.
   */
  {
    const harness = createHarness(cashOut());

    assertEqual(harness.getCashOnHand().movements.length, 0);

    await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    console.log(
      'PASS: restart repairs crash after completion persisted but before cash accounting'
    );
  }

  /**
   * Crash case B:
   *
   * movement was persisted, then app died BEFORE caller received success.
   *
   * Replaying reconciliation must not deduct twice.
   */
  {
    const harness = createHarness(cashOut());

    await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    /**
     * Simulated total app restart: call the reconciler again using only
     * durable state.
     */
    await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    const state = harness.getCashOnHand();

    assertEqual(state.movements.length, 1);

    assertEqual(state.balanceMinor, 40_000);

    console.log(
      'PASS: replay after post-accounting crash cannot double-deduct Cash on Hand'
    );
  }

  /**
   * Multiple retries remain idempotent.
   */
  {
    const harness = createHarness(cashOut());

    await Promise.all([
      reconcileCompletedCashOutAccountingWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      ),

      reconcileCompletedCashOutAccountingWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      ),

      reconcileCompletedCashOutAccountingWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      ),
    ]);

    /**
     * The harness mirrors record-level idempotency. D5F.1 separately proves
     * the real Cash-on-Hand implementation serializes overlapping calls.
     */
    const state = harness.getCashOnHand();

    assertEqual(state.movements.length, 1);

    assertEqual(state.balanceMinor, 40_000);

    console.log(
      'PASS: repeated accounting reconciliation converges to one payout movement'
    );
  }

  /**
   * Cash on Hand is optional.
   */
  {
    const harness = createHarness(cashOut(), false);

    const result = await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(result.status, 'cash_on_hand_not_set_up');

    assertEqual(harness.getCashOnHand().movements.length, 0);

    console.log(
      'PASS: completed Cash-out remains valid when optional Cash on Hand is not configured'
    );
  }

  /**
   * Missing record must not produce phantom accounting.
   */
  {
    const harness = createHarness(undefined);

    const result = await reconcileCompletedCashOutAccountingWithDependencies(
      CASH_OUT_ID,
      harness.dependencies
    );

    assertEqual(result.status, 'missing_cash_out');

    assertEqual(harness.getAccountingCalls(), 0);

    console.log(
      'PASS: missing Cash-out cannot create phantom Cash-on-Hand movement'
    );
  }

  /**
   * Corrupt completed business event fails closed.
   */
  {
    const harness = createHarness(
      cashOut({
        fiatAmountMinor: 0,
      })
    );

    await assertRejects(
      () =>
        reconcileCompletedCashOutAccountingWithDependencies(
          CASH_OUT_ID,
          harness.dependencies
        ),

      'invalid fiat cash payout amount'
    );

    assertEqual(harness.getAccountingCalls(), 0);

    console.log('PASS: invalid completed payout amount fails closed');
  }

  /**
   * Completed record must contain the actual completion time.
   */
  {
    const harness = createHarness(
      cashOut({
        completedAt: undefined,
      })
    );

    await assertRejects(
      () =>
        reconcileCompletedCashOutAccountingWithDependencies(
          CASH_OUT_ID,
          harness.dependencies
        ),

      'valid completedAt timestamp'
    );

    assertEqual(harness.getAccountingCalls(), 0);

    console.log(
      'PASS: completed Cash-out without durable completion timestamp fails closed'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5F.2 completion accounting reconciliation tests passed.'
  );
}

runD5F2Tests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
