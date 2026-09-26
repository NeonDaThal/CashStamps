import {
  recoverCashOutSettlementConflictAwareAfterRestartWithDependencies,
  type CashOutSettlementConflictAwareRestartDependencies,
  type CashOutSettlementRestartRecoveryResult,
} from 'src/services/cash-out-settlement-restart-recovery';

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

import {
  applyCashOutSettlementSourceConflictEvidence,
  resolveCashOutSettlementSourceConflictWithConfirmedSettlement,
} from 'src/services/cash-out-settlement-conflict-state';

import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutSettlementConflictInspectionResult } from 'src/services/cash-out-settlement-conflict-inspector';

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

const CASH_OUT_ID = 'cash-out-d5g-001';

const CASH_OUT_SERIAL = 'CO-D5G-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const CASH_PAYOUT_MINOR = 10_000;

const COMPLETED_AT = '2026-09-25T19:00:00.000Z';

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

  preparedAt: '2026-09-25T18:30:00.000Z',
};

function reconciliation(
  status: 'mempool' | 'confirmed'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    blockHeight: status === 'confirmed' ? 900_000 : 0,

    serverChecks: [],

    checkedAt: '2026-09-25T18:50:00.000Z',

    message: `D5G settlement ${status}.`,
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

    detectedAt: '2026-09-25T18:55:00.000Z',

    message: 'Different transaction spends exact settlement source.',

    ...overrides,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T18:20:00.000Z',

    updatedAt: '2026-09-25T18:50:00.000Z',

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

      marketRateTimestamp: '2026-09-25T18:20:00.000Z',

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

    settlementReconciliation: reconciliation('mempool'),

    status: 'received',

    ...overrides,
  } as CashOutRecord;
}

function emptyCashOnHand(): CashOnHandState {
  return {
    isSetUp: true,

    currency: 'GBP',

    balanceMinor: 50_000,

    createdAt: '2026-09-25T09:00:00.000Z',

    updatedAt: '2026-09-25T09:00:00.000Z',

    movements: [],
  };
}

function noConflictInspection(): CashOutSettlementConflictInspectionResult {
  return {
    status: 'no_conflict_observed',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    checkedTransactionCount: 1,
  };
}

function unavailableInspection(): CashOutSettlementConflictInspectionResult {
  return {
    status: 'inspection_unavailable',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    checkedTransactionCount: 0,

    errorMessage: 'Simulated Electrum outage.',
  };
}

function detectedInspection(
  evidence: CashOutSettlementSourceConflictEvidence
): CashOutSettlementConflictInspectionResult {
  return {
    status: 'conflict_detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    checkedTransactionCount: 1,

    evidence,
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

interface Harness {
  restart: () => ReturnType<
    typeof recoverCashOutSettlementConflictAwareAfterRestartWithDependencies
  >;

  complete: (
    confirmedAt?: string
  ) => ReturnType<typeof completeCashOutSettlementWithDependencies>;

  reconcileAccounting: () => ReturnType<
    typeof reconcileCompletedCashOutAccountingWithDependencies
  >;

  setInspection: (
    inspection: CashOutSettlementConflictInspectionResult
  ) => void;

  getCashOut: () => CashOutRecord;

  getCashOnHand: () => CashOnHandState;

  getCashOutWriteCount: () => number;

  getCashMovementWriteCount: () => number;
}

function createHarness(
  initialCashOut: CashOutRecord,
  initialInspection: CashOutSettlementConflictInspectionResult = noConflictInspection(),
  initialCashOnHand: CashOnHandState = emptyCashOnHand()
): Harness {
  let durableCashOut = clone(initialCashOut);

  let durableCashOnHand = clone(initialCashOnHand);

  let currentInspection = clone(initialInspection);

  let cashOutWriteCount = 0;

  let cashMovementWriteCount = durableCashOnHand.movements.filter(
    (movement) =>
      movement.type === 'cash_out_paid' &&
      movement.relatedRecordId === CASH_OUT_ID
  ).length;

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

  const restartDependencies: CashOutSettlementConflictAwareRestartDependencies =
    {
      recoverNetwork: async () => {
        const record = clone(durableCashOut);

        const result: CashOutSettlementRestartRecoveryResult = {
          record,

          networkOutcome:
            record.settlementReconciliation?.status === 'confirmed'
              ? 'confirmed'
              : 'mempool',

          merchantSafety: evaluateCashOutSettlementMerchantSafety(record),
        };

        return result;
      },

      inspectConflict: async () => clone(currentInspection),

      storeConflict: async (id, evidence) => {
        if (id !== durableCashOut.id) {
          return undefined;
        }

        const current = clone(durableCashOut);

        const next = applyCashOutSettlementSourceConflictEvidence(
          current,
          evidence
        );

        if (next !== current) {
          durableCashOut = {
            ...clone(next),

            updatedAt: evidence.detectedAt,
          };

          cashOutWriteCount += 1;
        }

        return clone(durableCashOut);
      },

      resolveConflict: async (id, resolvedAt) => {
        if (id !== durableCashOut.id) {
          return undefined;
        }

        const current = clone(durableCashOut);

        const next =
          resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
            current,
            resolvedAt
          );

        if (next !== current) {
          durableCashOut = {
            ...clone(next),

            updatedAt: resolvedAt,
          };

          cashOutWriteCount += 1;
        }

        return clone(durableCashOut);
      },

      now: () => '2026-09-25T19:05:00.000Z',
    };

  const handoverDependencies: CashOutCashHandoverConfirmationDependencies = {
    mutateCashOutRecordAtomically,

    recoverConflictAware: (id) =>
      recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        id,
        restartDependencies
      ),
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
        id: `movement-${cashMovementWriteCount + 1}`,

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
    restart: () =>
      recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        restartDependencies
      ),

    complete: (confirmedAt = COMPLETED_AT) =>
      completeCashOutSettlementWithDependencies(
        CASH_OUT_ID,

        {
          merchantConfirmedCashHandedOver: true,

          confirmedAt,
        },

        completionDependencies
      ),

    reconcileAccounting: () =>
      reconcileCompletedCashOutAccountingWithDependencies(
        CASH_OUT_ID,
        accountingDependencies
      ),

    setInspection: (inspection) => {
      currentInspection = clone(inspection);
    },

    getCashOut: () => clone(durableCashOut),

    getCashOnHand: () => clone(durableCashOnHand),

    getCashOutWriteCount: () => cashOutWriteCount,

    getCashMovementWriteCount: () => cashMovementWriteCount,
  };
}

async function runD5GTests(): Promise<void> {
  /**
   * Matrix 1:
   *
   * Clean zero-conf restart.
   *
   * Exact deterministic settlement remains visible in mempool and no concrete
   * conflicting spender exists.
   */
  {
    const harness = createHarness(cashOut());

    const recovered = await harness.restart();

    assertEqual(recovered.merchantSafety.safeToHandCash, true);

    assertEqual(recovered.merchantSafety.reason, 'settlement_mempool');

    const completed = await harness.complete();

    assertEqual(completed.handover.record.status, 'completed');

    assertEqual(harness.getCashOnHand().movements.length, 1);

    console.log(
      'PASS: clean zero-conf restart remains eligible for one explicit merchant cash handover'
    );
  }

  /**
   * Matrix 2:
   *
   * Auxiliary conflict inspection temporarily unavailable, but no positive
   * conflict has ever been stored.
   *
   * Do not fabricate a double-spend.
   */
  {
    const harness = createHarness(cashOut(), unavailableInspection());

    const recovered = await harness.restart();

    assertEqual(recovered.conflictInspection.status, 'inspection_unavailable');

    assertEqual(recovered.merchantSafety.safeToHandCash, true);

    assertEqual(recovered.merchantSafety.reason, 'settlement_mempool');

    console.log(
      'PASS: unavailable auxiliary conflict scan does not invent a conflict'
    );
  }

  /**
   * Matrix 3:
   *
   * Restart positively discovers a different transaction spending the exact
   * selected customer outpoint.
   */
  {
    const evidence = conflict();

    const harness = createHarness(cashOut(), detectedInspection(evidence));

    const recovered = await harness.restart();

    assertEqual(
      recovered.record.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    assertEqual(recovered.merchantSafety.safeToHandCash, false);

    assertEqual(recovered.merchantSafety.reason, 'settlement_source_conflict');

    await assertRejects(
      () => harness.complete(),

      'preflight is unsafe'
    );

    assertEqual(harness.getCashOut().status, 'received');

    assertEqual(harness.getCashOnHand().movements.length, 0);

    console.log(
      'PASS: newly proven exact-outpoint conflict survives restart and blocks physical cash'
    );
  }

  /**
   * Matrix 4:
   *
   * A conflict was already durably observed before process death.
   *
   * The next Electrum scan is unavailable.
   *
   * Network uncertainty must never erase positive conflict evidence.
   */
  {
    const harness = createHarness(
      cashOut({
        settlementSourceConflict: conflict(),
      }),

      unavailableInspection()
    );

    const recovered = await harness.restart();

    assertEqual(recovered.merchantSafety.safeToHandCash, false);

    assertEqual(recovered.merchantSafety.reason, 'settlement_source_conflict');

    assertEqual(recovered.record.settlementSourceConflict?.state, 'detected');

    assertEqual(harness.getCashOutWriteCount(), 0);

    console.log(
      'PASS: restart plus Electrum outage cannot erase durable positive conflict evidence'
    );
  }

  /**
   * Matrix 5:
   *
   * A previous mempool conflict disappears, and the exact deterministic
   * settlement later confirms.
   *
   * This is the narrow permitted normal resolution path.
   */
  {
    const harness = createHarness(
      cashOut({
        settlementReconciliation: reconciliation('confirmed'),

        settlementSourceConflict: conflict(),
      }),

      noConflictInspection()
    );

    const recovered = await harness.restart();

    assertEqual(recovered.record.settlementSourceConflict?.state, 'resolved');

    assertEqual(
      recovered.record.settlementSourceConflict?.resolution,
      'exact_settlement_confirmed'
    );

    assertEqual(recovered.merchantSafety.safeToHandCash, true);

    assertEqual(recovered.merchantSafety.reason, 'settlement_confirmed');

    const completed = await harness.complete();

    assertEqual(completed.handover.record.status, 'completed');

    assertEqual(harness.getCashOnHand().movements.length, 1);

    console.log(
      'PASS: exact confirmed settlement safely resolves disappeared mempool conflict after restart'
    );
  }

  /**
   * Matrix 6:
   *
   * A concrete conflicting spender itself became confirmed, while another
   * observation claims our exact settlement confirmed.
   *
   * Those claims cannot both represent one valid BCH chain.
   *
   * Fail closed.
   */
  {
    const harness = createHarness(
      cashOut({
        settlementReconciliation: reconciliation('confirmed'),

        settlementSourceConflict: conflict({
          conflictingTransactionStatus: 'confirmed',

          conflictingTransactionBlockHeight: 899_999,
        }),
      }),

      noConflictInspection()
    );

    const recovered = await harness.restart();

    assertEqual(recovered.record.settlementSourceConflict?.state, 'detected');

    assertEqual(recovered.merchantSafety.safeToHandCash, false);

    assertEqual(recovered.merchantSafety.reason, 'settlement_source_conflict');

    await assertRejects(
      () => harness.complete(),

      'preflight is unsafe'
    );

    assertEqual(harness.getCashOnHand().movements.length, 0);

    console.log(
      'PASS: contradictory confirmed-spender evidence remains a merchant hard stop'
    );
  }

  /**
   * Matrix 7:
   *
   * Process dies immediately after physical handover completion was persisted,
   * before Cash-on-Hand accounting.
   */
  {
    const harness = createHarness(
      cashOut({
        status: 'completed',

        completedAt: COMPLETED_AT,

        updatedAt: COMPLETED_AT,
      })
    );

    assertEqual(harness.getCashOnHand().movements.length, 0);

    const repaired = await harness.complete('2026-09-25T19:10:00.000Z');

    assertEqual(repaired.handover.completedNow, false);

    assertEqual(harness.getCashOut().completedAt, COMPLETED_AT);

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    console.log(
      'PASS: restart repairs accounting when process died after completed but before cash movement'
    );
  }

  /**
   * Matrix 8:
   *
   * Process dies after both completion and accounting were persisted, but
   * before the UI received success.
   *
   * Restart/replay must produce neither a second business event nor a second
   * cash deduction.
   */
  {
    const existingMovement: CashOnHandMovement = {
      id: 'existing-d5g-movement',

      type: 'cash_out_paid',

      amountMinor: CASH_PAYOUT_MINOR,

      balanceAfterMinor: 40_000,

      currency: 'GBP',

      relatedRecordId: CASH_OUT_ID,

      relatedRecordType: 'cash_out',

      note: `Cash-out ${CASH_OUT_SERIAL} completed`,

      createdAt: COMPLETED_AT,
    };

    const existingCashOnHand: CashOnHandState = {
      ...emptyCashOnHand(),

      balanceMinor: 40_000,

      updatedAt: COMPLETED_AT,

      movements: [existingMovement],
    };

    const harness = createHarness(
      cashOut({
        status: 'completed',

        completedAt: COMPLETED_AT,

        updatedAt: COMPLETED_AT,
      }),

      noConflictInspection(),

      existingCashOnHand
    );

    const replay = await harness.complete('2026-09-25T19:15:00.000Z');

    assertEqual(replay.handover.completedNow, false);

    assertEqual(harness.getCashOut().completedAt, COMPLETED_AT);

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    assertEqual(harness.getCashMovementWriteCount(), 1);

    console.log(
      'PASS: restart after fully persisted completion cannot duplicate Cash-on-Hand payout'
    );
  }

  /**
   * Matrix 9:
   *
   * Repeated clean restart checks before the merchant acts must remain
   * read-only and stable.
   */
  {
    const harness = createHarness(cashOut());

    const first = await harness.restart();

    const second = await harness.restart();

    const third = await harness.restart();

    assertEqual(first.merchantSafety.safeToHandCash, true);

    assertEqual(second.merchantSafety.safeToHandCash, true);

    assertEqual(third.merchantSafety.safeToHandCash, true);

    assertEqual(harness.getCashOut().status, 'received');

    assertEqual(harness.getCashOutWriteCount(), 0);

    assertEqual(harness.getCashMovementWriteCount(), 0);

    console.log(
      'PASS: repeated clean restart checks do not mutate business or accounting state'
    );
  }

  /**
   * Matrix 10:
   *
   * Even after completion, repeated accounting reconciliation must converge on
   * the same single movement.
   */
  {
    const harness = createHarness(
      cashOut({
        status: 'completed',

        completedAt: COMPLETED_AT,

        updatedAt: COMPLETED_AT,
      })
    );

    await harness.reconcileAccounting();
    await harness.reconcileAccounting();
    await harness.reconcileAccounting();

    assertEqual(harness.getCashOnHand().movements.length, 1);

    assertEqual(harness.getCashOnHand().balanceMinor, 40_000);

    assertEqual(harness.getCashMovementWriteCount(), 1);

    console.log(
      'PASS: repeated post-restart accounting reconciliation converges to one durable payout'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5G adversarial restart matrix tests passed.'
  );
}

runD5GTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
