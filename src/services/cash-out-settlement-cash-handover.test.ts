import {
  applyCashOutCashHandoverConfirmation,
  evaluateCashOutCashHandover,
} from 'src/services/cash-out-settlement-cash-handover';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5e-001';

const CASH_OUT_SERIAL = 'CO-D5E-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const CONFIRMED_AT = '2026-09-25T15:30:00.000Z';

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

  preparedAt: '2026-09-25T15:00:00.000Z',
};

function reconciliation(
  status: 'mempool' | 'confirmed' | 'unknown' | 'unavailable'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_000,
        }
      : {}),

    serverChecks: [],

    checkedAt: '2026-09-25T15:20:00.000Z',

    message: `D5E ${status}.`,
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

    detectedAt: '2026-09-25T15:25:00.000Z',

    message: 'Different transaction spends exact settlement source.',
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T14:55:00.000Z',

    updatedAt: '2026-09-25T15:20:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    settlementReconciliation: reconciliation('mempool'),

    ...overrides,
  } as CashOutRecord;
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

function assertThrows(
  operation: () => unknown,
  expectedMessagePart: string
): void {
  try {
    operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected error containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(`Expected operation to throw "${expectedMessagePart}".`);
}

function runD5E1Tests(): void {
  /**
   * Positive settlement mempool evidence authorises the physical handover
   * under the frozen zero-conf merchant-risk policy.
   */
  {
    const decision = evaluateCashOutCashHandover(cashOut());

    assertEqual(decision.allowed, true);

    assertEqual(decision.reason, 'ready');

    console.log(
      'PASS: received Cash-out with positive mempool settlement evidence reaches cash-handover boundary'
    );
  }

  /**
   * Confirmation is a distinct merchant action.
   */
  {
    const original = cashOut();

    const completed = applyCashOutCashHandoverConfirmation(
      original,

      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: CONFIRMED_AT,
      }
    );

    assertEqual(
      original.status,
      'received',
      'Pure transition mutated the original Cash-out.'
    );

    assertEqual(completed.status, 'completed');

    assertEqual(completed.completedAt, CONFIRMED_AT);

    assertEqual(completed.updatedAt, CONFIRMED_AT);

    console.log(
      'PASS: explicit merchant confirmation performs received -> completed transition'
    );
  }

  /**
   * Confirmed settlement evidence also permits handover.
   */
  {
    const completed = applyCashOutCashHandoverConfirmation(
      cashOut({
        settlementReconciliation: reconciliation('confirmed'),
      }),

      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: CONFIRMED_AT,
      }
    );

    assertEqual(completed.status, 'completed');

    console.log(
      'PASS: confirmed settlement evidence permits explicit cash handover'
    );
  }

  /**
   * Merely detecting customer BCH is NOT the cash-handover boundary.
   */
  {
    const record = cashOut({
      settlementReconciliation: undefined,
    });

    const decision = evaluateCashOutCashHandover(record);

    assertEqual(decision.allowed, false);

    assertEqual(decision.reason, 'settlement_not_safe');

    assertThrows(
      () =>
        applyCashOutCashHandoverConfirmation(
          record,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          }
        ),

      'settlement_not_safe'
    );

    console.log('PASS: received status alone never authorises merchant cash');
  }

  /**
   * Unknown settlement visibility remains unsafe.
   */
  {
    const record = cashOut({
      settlementReconciliation: reconciliation('unknown'),
    });

    const decision = evaluateCashOutCashHandover(record);

    assertEqual(decision.allowed, false);

    assertThrows(
      () =>
        applyCashOutCashHandoverConfirmation(
          record,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          }
        ),

      'settlement_not_safe'
    );

    console.log('PASS: unknown settlement evidence blocks cash handover');
  }

  /**
   * Durable conflict overrides otherwise-positive mempool settlement evidence.
   */
  {
    const record = cashOut({
      settlementSourceConflict: conflict(),
    });

    const decision = evaluateCashOutCashHandover(record);

    assertEqual(decision.allowed, false);

    assertEqual(decision.reason, 'settlement_not_safe');

    assertEqual(decision.merchantSafety.reason, 'settlement_source_conflict');

    assertThrows(
      () =>
        applyCashOutCashHandoverConfirmation(
          record,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          }
        ),

      'settlement_not_safe'
    );

    console.log(
      'PASS: source conflict prevents cash handover despite positive settlement visibility'
    );
  }

  /**
   * awaiting_payment cannot jump directly to completed even if malformed test
   * data happens to contain settlement evidence.
   */
  {
    const record = cashOut({
      status: 'awaiting_payment',
    });

    const decision = evaluateCashOutCashHandover(record);

    assertEqual(decision.allowed, false);

    assertEqual(decision.reason, 'cash_out_not_received');

    assertThrows(
      () =>
        applyCashOutCashHandoverConfirmation(
          record,

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: CONFIRMED_AT,
          }
        ),

      'cash_out_not_received'
    );

    console.log('PASS: Cash-out cannot skip received lifecycle state');
  }

  /**
   * Cancelled Cash-out may not enter the normal handover path.
   */
  {
    const record = cashOut({
      status: 'cancelled',
    });

    const decision = evaluateCashOutCashHandover(record);

    assertEqual(decision.allowed, false);

    assertEqual(decision.reason, 'cash_out_not_received');

    console.log(
      'PASS: cancelled Cash-out cannot use normal cash-handover path'
    );
  }

  /**
   * Duplicate confirmation after successful completion is idempotent.
   *
   * Most importantly, completedAt is never replaced with a later timestamp.
   */
  {
    const alreadyCompleted = cashOut({
      status: 'completed',

      completedAt: '2026-09-25T15:30:00.000Z',

      updatedAt: '2026-09-25T15:30:00.000Z',
    });

    const decision = evaluateCashOutCashHandover(alreadyCompleted);

    assertEqual(decision.allowed, false);

    assertEqual(decision.reason, 'already_completed');

    const replay = applyCashOutCashHandoverConfirmation(
      alreadyCompleted,

      {
        merchantConfirmedCashHandedOver: true,

        confirmedAt: '2026-09-25T15:40:00.000Z',
      }
    );

    assertEqual(replay, alreadyCompleted);

    assertEqual(replay.completedAt, '2026-09-25T15:30:00.000Z');

    console.log(
      'PASS: duplicate merchant confirmation cannot create a second completion event'
    );
  }

  /**
   * Invalid confirmation timestamp cannot create completion.
   */
  {
    assertThrows(
      () =>
        applyCashOutCashHandoverConfirmation(
          cashOut(),

          {
            merchantConfirmedCashHandedOver: true,

            confirmedAt: 'not-a-date',
          }
        ),

      'must be a valid timestamp'
    );

    console.log('PASS: malformed cash-handover timestamp fails closed');
  }

  /**
   * Explicit confirmation is mandatory even at the service boundary.
   *
   * Cast is intentional: it proves runtime validation protects JavaScript and
   * malformed persisted/caller data, not just TypeScript callers.
   */
  {
    assertThrows(
      () =>
        applyCashOutCashHandoverConfirmation(
          cashOut(),

          {
            merchantConfirmedCashHandedOver: false,

            confirmedAt: CONFIRMED_AT,
          } as unknown as {
            merchantConfirmedCashHandedOver: true;

            confirmedAt: string;
          }
        ),

      'Explicit merchant confirmation'
    );

    console.log(
      'PASS: settlement evidence cannot auto-complete without explicit merchant handover confirmation'
    );
  }

  console.log('');

  console.log('Cash-out Settlement D5E.1 cash-handover boundary tests passed.');
}

runD5E1Tests();
