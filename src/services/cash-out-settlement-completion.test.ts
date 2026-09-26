import {
  completeCashOutSettlementWithDependencies,
  type CashOutSettlementCompletionDependencies,
} from 'src/services/cash-out-settlement-completion';

import {
  confirmCashOutCashHandoverWithDependencies,
  type CashOutCashHandoverConfirmationDependencies,
} from 'src/services/cash-out-settlement-cash-handover-store';

import {
  reconcileCompletedCashOutAccountingWithDependencies,
  type CashOutSettlementAccountingDependencies,
} from 'src/services/cash-out-settlement-accounting';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type {
  CashOnHandMovement,
  CashOnHandState,
} from 'src/types/cash-on-hand';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5f3-001';

const CASH_OUT_SERIAL = 'CO-D5F3-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const CASH_PAYOUT_MINOR = 10_000;

const COMPLETED_AT = '2026-09-25T18:00:00.000Z';

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

  preparedAt: '2026-09-25T17:30:00.000Z',
};

function reconciliation(): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status: 'mempool',

    blockHeight: 0,

    serverChecks: [],

    checkedAt: '2026-09-25T17:50:00.000Z',

    message: 'D5F.3 settlement is visible in mempool.',
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

    detectedAt: '2026-09-25T17:55:00.000Z',

    message: 'Different transaction spends exact settlement source.',
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T17:20:00.000Z',

    updatedAt: '2026-09-25T17:50:00.000Z',

    fiatCurrency: 'GBP',

    fiatAmountMinor: CASH_PAYOUT_MINOR,

    customerSendsFiatEquivalentMinor: 10_300,

    marketBchSats: 200_000,

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    quote: {
      source: 'coingecko',

      fiatCurrency: 'GBP',

      marketRate: 500,

      marketRateTimestamp: '2026-09-25T17:20:00.000Z',

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

    treasuryReceivingAddress: 'bitcoincash:q-test-customer-contract',

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    settlementReconciliation: reconciliation(),

    status: 'received',

    ...overrides,
  } as CashOutRecord;
}

function cashOnHand(balanceMinor = 50_000, enabled = true): CashOnHandState {
  return {
    isSetUp: enabled,

    currency: 'GBP',

    balanceMinor: enabled ? balanceMinor : 0,

    createdAt: '2026-09-25T09:00:00.000Z',

    updatedAt: '2026-09-25T09:00:00.000Z',

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
  initialCashOut: CashOutRecord,
  initialCashOnHand: CashOnHandState = cashOnHand()
): {
  completionDependencies: CashOutSettlementCompletionDependencies;

  handoverDependencies: CashOutCashHandoverConfirmationDependencies;

  accountingDependencies: CashOutSettlementAccountingDependencies;

  getCashOut: () => CashOutRecord;

  getCashOnHand: () => CashOnHandState;

  getCashOutWriteCount: () => number;

  getCashMovementWriteCount: () => number;
} {
  let durableCashOut = clone(initialCashOut);

  let durableCashOnHand = clone(initialCashOnHand);

  let cashOutWriteCount = 0;

  let cashMovementWriteCount = 0;

  let cashOutQueue: Promise<void> = Promise.resolve();

  const mutateCashOutRecordAtomically: CashOutCashHandoverConfirmationDependencies['mutateCashOutRecordAtomically'] =
    (id, updater) => {
      const operation = cashOutQueue.then(async () => {
        if (id !== durableCashOut.id) {
          return undefined;
        }

        const current = clone(durableCashOut);

        const next = updater(current);

        if (next !== current) {
          durableCashOut = clone(next);

          cashOutWriteCount += 1;
        }

        return clone(next);
      });

      cashOutQueue = operation.then(
        () => undefined,
        () => undefined
      );

      return operation;
    };

  const handoverDependencies: CashOutCashHandoverConfirmationDependencies = {
    mutateCashOutRecordAtomically,

    recoverConflictAware: async () => {
      const snapshot = clone(durableCashOut);

      const activeConflict =
        snapshot.settlementSourceConflict?.state === 'detected';

      const completed = snapshot.status === 'completed';

      return {
        record: snapshot,

        merchantSafety: {
          safeToHandCash:
            !completed &&
            !activeConflict &&
            snapshot.status === 'received' &&
            (snapshot.settlementReconciliation?.status === 'mempool' ||
              snapshot.settlementReconciliation?.status === 'confirmed'),

          reason: completed
            ? 'cash_out_already_completed'
            : activeConflict
            ? 'settlement_source_conflict'
            : snapshot.settlementReconciliation?.status === 'confirmed'
            ? 'settlement_confirmed'
            : 'settlement_mempool',
        },
      };
    },
  };

  const accountingDependencies: CashOutSettlementAccountingDependencies = {
    getCashOutRecordById: async (id) => {
      if (id !== durableCashOut.id) {
        return undefined;
      }

      return clone(durableCashOut);
    },

    recordCashOutPaid: async (input) => {
      if (!durableCashOnHand.isSetUp) {
        return undefined;
      }

      const existing = durableCashOnHand.movements.find(
        (movement) =>
          movement.type === 'cash_out_paid' &&
          movement.relatedRecordId === input.relatedRecordId
      );

      if (existing) {
        return clone(durableCashOnHand);
      }

      const nextBalanceMinor =
        durableCashOnHand.balanceMinor - input.amountMinor;

      const movement: CashOnHandMovement = {
        id: `cash-movement-${cashMovementWriteCount + 1}`,

        type: 'cash_out_paid',

        amountMinor: input.amountMinor,

        balanceAfterMinor: nextBalanceMinor,

        currency: input.currency,

        relatedRecordId: input.relatedRecordId,

        relatedRecordType: 'cash_out',

        note: input.note,

        createdAt: input.createdAt ?? 'unexpected',
      };

      durableCashOnHand = {
        ...durableCashOnHand,

        balanceMinor: nextBalanceMinor,

        updatedAt: movement.createdAt,

        movements: [movement, ...durableCashOnHand.movements],
      };

      cashMovementWriteCount += 1;

      return clone(durableCashOnHand);
    },
  };

  const completionDependencies: CashOutSettlementCompletionDependencies = {
    confirmCashHandover: (id, confirmation) =>
      confirmCashOutCashHandoverWithDependencies(
        id,
        confirmation,
        handoverDependencies
      ),

    reconcileAccounting: (id) =>
      reconcileCompletedCashOutAccountingWithDependencies(
        id,
        accountingDependencies
      ),
  };

  return {
    completionDependencies,

    handoverDependencies,

    accountingDependencies,

    getCashOut: () => clone(durableCashOut),

    getCashOnHand: () => clone(durableCashOnHand),

    getCashOutWriteCount: () => cashOutWriteCount,

    getCashMovementWriteCount: () => cashMovementWriteCount,
  };
}

const CONFIRMATION = {
  merchantConfirmedCashHandedOver: true as const,

  confirmedAt: COMPLETED_AT,
};

async function runD5F3Tests(): Promise<void> {
  /**
   * Normal path:
   *
   * completion persists first, then one Cash-on-Hand movement is reconciled.
   */
  {
    const harness = createHarness(cashOut());

    const result = await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.completionDependencies
    );

    assertEqual(result.handover.record.status, 'completed');

    assertEqual(result.handover.completedNow, true);

    assertEqual(result.accounting.status, 'reconciled');

    assertEqual(harness.getCashOut().status, 'completed');

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    assertEqual(harness.getCashOnHand().movements.length, 1);

    console.log(
      'PASS: normal completion persists business event before one Cash-on-Hand payout'
    );
  }

  /**
   * Crash window A:
   *
   * completed persisted, process dies BEFORE accounting.
   */
  {
    const harness = createHarness(cashOut());

    await confirmCashOutCashHandoverWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.handoverDependencies
    );

    assertEqual(harness.getCashOut().status, 'completed');

    assertEqual(harness.getCashOnHand().movements.length, 0);

    /**
     * Full restart/retry of the combined operation.
     */
    const repaired = await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.completionDependencies
    );

    assertEqual(repaired.handover.completedNow, false);

    assertEqual(repaired.accounting.status, 'reconciled');

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    console.log(
      'PASS: restart repairs crash after completed persisted but before accounting'
    );
  }

  /**
   * Crash window B:
   *
   * completed and accounting both persisted, but process dies before the UI
   * receives success.
   */
  {
    const harness = createHarness(cashOut());

    await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.completionDependencies
    );

    /**
     * Simulated app death here.
     *
     * User/recovery path repeats the same operation after restart.
     */
    const replay = await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: '2026-09-25T18:10:00.000Z',
      },
      harness.completionDependencies
    );

    assertEqual(replay.handover.completedNow, false);

    assertEqual(harness.getCashOut().completedAt, COMPLETED_AT);

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    assertEqual(harness.getCashMovementWriteCount(), 1);

    console.log(
      'PASS: post-accounting crash replay cannot duplicate completion or cash deduction'
    );
  }

  /**
   * Repeated merchant presses converge to one completed record and one
   * accounting movement.
   */
  {
    const harness = createHarness(cashOut());

    await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.completionDependencies
    );

    await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: '2026-09-25T18:01:00.000Z',
      },
      harness.completionDependencies
    );

    await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: '2026-09-25T18:02:00.000Z',
      },
      harness.completionDependencies
    );

    assertEqual(harness.getCashOut().status, 'completed');

    assertEqual(harness.getCashOut().completedAt, COMPLETED_AT);

    assertEqual(harness.getCashOutWriteCount(), 1);

    assertEqual(harness.getCashMovementWriteCount(), 1);

    assertEqual(harness.getCashOnHand().movements.length, 1);

    console.log(
      'PASS: repeated merchant confirmation converges to one business event and one accounting movement'
    );
  }

  /**
   * Conflict before the merchant completion boundary:
   *
   * no completion and therefore no accounting.
   */
  {
    const harness = createHarness(
      cashOut({
        settlementSourceConflict: conflict(),
      })
    );

    await assertRejects(
      () =>
        completeCashOutSettlementWithDependencies(
          CASH_OUT_ID,
          CONFIRMATION,
          harness.completionDependencies
        ),

      'preflight is unsafe'
    );

    assertEqual(harness.getCashOut().status, 'received');

    assertEqual(harness.getCashOutWriteCount(), 0);

    assertEqual(harness.getCashMovementWriteCount(), 0);

    console.log(
      'PASS: conflict hard stop prevents both completion and cash accounting'
    );
  }

  /**
   * Cash on Hand is optional.
   *
   * The physical/business Cash-out is still completed even when the merchant
   * has not enabled the local cash tracker.
   */
  {
    const harness = createHarness(cashOut(), cashOnHand(0, false));

    const result = await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.completionDependencies
    );

    assertEqual(result.handover.record.status, 'completed');

    assertEqual(result.accounting.status, 'cash_on_hand_not_set_up');

    assertEqual(harness.getCashOut().status, 'completed');

    assertEqual(harness.getCashMovementWriteCount(), 0);

    console.log(
      'PASS: optional Cash-on-Hand tracker cannot invalidate a completed physical Cash-out'
    );
  }

  /**
   * Cash on Hand may go negative and must not block payout accounting.
   */
  {
    const harness = createHarness(
      cashOut(),

      cashOnHand(5_000)
    );

    const result = await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      harness.completionDependencies
    );

    assertEqual(result.accounting.status, 'reconciled');

    assertEqual(harness.getCashOnHand().balanceMinor, -5_000);

    assertEqual(harness.getCashOnHand().movements.length, 1);

    console.log(
      'PASS: Cash-on-Hand may become negative without blocking completed Cash-out accounting'
    );
  }

  /**
   * Accounting failure AFTER completion:
   *
   * never roll the completed business event back to received.
   */
  {
    const harness = createHarness(cashOut());

    let failFirstAccounting = true;

    const dependencies: CashOutSettlementCompletionDependencies = {
      ...harness.completionDependencies,

      reconcileAccounting: async (id) => {
        if (failFirstAccounting) {
          failFirstAccounting = false;

          throw new Error('simulated accounting persistence failure');
        }

        return reconcileCompletedCashOutAccountingWithDependencies(
          id,
          harness.accountingDependencies
        );
      },
    };

    await assertRejects(
      () =>
        completeCashOutSettlementWithDependencies(
          CASH_OUT_ID,
          CONFIRMATION,
          dependencies
        ),

      'simulated accounting persistence failure'
    );

    /**
     * The physical cash event is still durable and must never be rolled back.
     */
    assertEqual(harness.getCashOut().status, 'completed');

    assertEqual(harness.getCashOnHand().movements.length, 0);

    /**
     * Restart/retry repairs accounting.
     */
    const repaired = await completeCashOutSettlementWithDependencies(
      CASH_OUT_ID,
      CONFIRMATION,
      dependencies
    );

    assertEqual(repaired.handover.completedNow, false);

    assertEqual(repaired.accounting.status, 'reconciled');

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    console.log(
      'PASS: accounting failure never rolls back completed business event and is repaired on retry'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5F.3 combined completion/accounting crash tests passed.'
  );
}

runD5F3Tests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
