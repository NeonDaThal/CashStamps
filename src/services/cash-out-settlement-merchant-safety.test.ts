import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5a-001';

const CASH_OUT_SERIAL = 'CO-D5A-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '33'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: 0,

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

function createReconciliation(
  status: 'mempool' | 'confirmed' | 'unknown' | 'unavailable',
  overrides: Partial<TreasuryBroadcastReconciliationResult> = {}
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

    checkedAt: '2026-09-25T12:01:00.000Z',

    message: `D5A ${status} evidence.`,

    ...overrides,
  };
}

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
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

    settlementReconciliation: createReconciliation('mempool'),

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

function assertSafe(
  cashOut: CashOutRecord,
  expectedEvidence: 'mempool' | 'confirmed'
): void {
  const result = evaluateCashOutSettlementMerchantSafety(cashOut);

  assertEqual(result.safeToHandCash, true);

  assertEqual(result.settlementEvidence, expectedEvidence);
}

function assertUnsafe(cashOut: CashOutRecord, expectedReason: string): void {
  const result = evaluateCashOutSettlementMerchantSafety(cashOut);

  assertEqual(result.safeToHandCash, false);

  assertEqual(result.reason, expectedReason);
}

function runD5ATests(): void {
  /**
   * Positive exact settlement mempool evidence is the normal zero-confirmation
   * merchant-safe boundary agreed in the threat model.
   */
  {
    assertSafe(createCashOut(), 'mempool');

    console.log(
      'PASS: exact persisted settlement with mempool evidence authorises cash handover'
    );
  }

  /**
   * Confirmation is stronger positive evidence and is likewise safe.
   */
  {
    assertSafe(
      createCashOut({
        settlementReconciliation: createReconciliation('confirmed'),
      }),

      'confirmed'
    );

    console.log('PASS: exact confirmed settlement authorises cash handover');
  }

  /**
   * Customer payment detection alone must never authorise cash.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementIntent: undefined,

        settlementReconciliation: undefined,
      }),

      'missing_settlement_intent'
    );

    console.log(
      'PASS: received customer payment alone cannot authorise cash handover'
    );
  }

  /**
   * awaiting_payment cannot bypass the settlement boundary.
   */
  {
    assertUnsafe(
      createCashOut({
        status: 'awaiting_payment',
      }),

      'cash_out_not_payable'
    );

    console.log(
      'PASS: awaiting-payment Cash-out cannot authorise cash handover'
    );
  }

  /**
   * completed must not permit a second physical payout.
   */
  {
    assertUnsafe(
      createCashOut({
        status: 'completed',
      }),

      'cash_out_already_completed'
    );

    console.log(
      'PASS: completed Cash-out cannot authorise a duplicate cash payout'
    );
  }

  /**
   * Missing durable customer tx identity fails closed.
   */
  {
    assertUnsafe(
      createCashOut({
        receivedTxid: undefined,
      }),

      'missing_customer_payment_txid'
    );

    console.log('PASS: missing customer transaction identity fails closed');
  }

  /**
   * D3 settlement intent may not belong to another Cash-out.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementIntent: {
          ...INTENT,

          cashOutId: 'different-cash-out',
        },
      }),

      'settlement_cash_out_mismatch'
    );

    console.log(
      'PASS: settlement intent belonging to another Cash-out fails closed'
    );
  }

  /**
   * Exact settlement must spend the customer payment recorded by this Cash-out.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementIntent: {
          ...INTENT,

          sourcePaymentTxid: '44'.repeat(32),
        },
      }),

      'settlement_payment_txid_mismatch'
    );

    console.log('PASS: settlement source transaction mismatch fails closed');
  }

  /**
   * Exact txid comparison is canonical rather than case-sensitive.
   */
  {
    assertSafe(
      createCashOut({
        receivedTxid: CUSTOMER_TXID.toUpperCase(),

        settlementIntent: {
          ...INTENT,

          sourcePaymentTxid: CUSTOMER_TXID.toUpperCase(),
        },
      }),

      'mempool'
    );

    console.log(
      'PASS: canonical transaction identity comparison accepts equivalent txid casing'
    );
  }

  /**
   * Selected source output must be concrete.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementIntent: {
          ...INTENT,

          sourceOutpointIndex: -1,
        },
      }),

      'settlement_source_outpoint_invalid'
    );

    console.log('PASS: invalid settlement source outpoint fails closed');
  }

  /**
   * A one-satoshi customer-payment mismatch must never authorise cash.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementIntent: {
          ...INTENT,

          sourceValueSats: REQUIRED_SATS - 1,
        },
      }),

      'settlement_payment_amount_mismatch'
    );

    console.log(
      'PASS: one-satoshi settlement source mismatch blocks cash handover'
    );
  }

  /**
   * Record-level BCH received value must also reconcile exactly.
   */
  {
    assertUnsafe(
      createCashOut({
        bchSatsReceived: REQUIRED_SATS + 1,
      }),

      'settlement_payment_amount_mismatch'
    );

    console.log('PASS: recorded BCH received mismatch blocks cash handover');
  }

  /**
   * Broadcast success by itself is insufficient.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementReconciliation: undefined,

        settlementBroadcast: {
          status: 'broadcasted',

          txid: SETTLEMENT_TXID,

          serverTxid: SETTLEMENT_TXID,

          broadcastEnabled: true,

          requestAttempted: true,

          attemptedAt: '2026-09-25T12:00:30.000Z',
        },
      }),

      'missing_settlement_reconciliation'
    );

    console.log(
      'PASS: broadcast response alone does not authorise cash handover'
    );
  }

  /**
   * Successful network lookup which cannot see the settlement is not positive
   * evidence.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementReconciliation: createReconciliation('unknown'),
      }),

      'settlement_unknown'
    );

    console.log(
      'PASS: unknown settlement visibility does not authorise cash handover'
    );
  }

  /**
   * Network unavailability likewise cannot be interpreted as success.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementReconciliation: createReconciliation('unavailable'),
      }),

      'settlement_unavailable'
    );

    console.log(
      'PASS: unavailable settlement evidence does not authorise cash handover'
    );
  }

  /**
   * Contradictory D4 transaction identity is persisted corruption/invalid state,
   * never cash authorisation.
   */
  {
    assertUnsafe(
      createCashOut({
        settlementReconciliation: createReconciliation('mempool', {
          txid: '55'.repeat(32),
        }),
      }),

      'invalid_settlement_state'
    );

    console.log(
      'PASS: contradictory settlement txid fails closed at the merchant-safe boundary'
    );
  }

  /**
   * A previously uncertain submission may still become safe once the exact
   * persisted settlement receives positive network evidence.
   */
  {
    assertSafe(
      createCashOut({
        settlementBroadcast: {
          status: 'uncertain',

          txid: SETTLEMENT_TXID,

          errorMessage: 'Broadcast response was lost.',

          broadcastEnabled: true,

          requestAttempted: true,

          attemptedAt: '2026-09-25T12:00:30.000Z',
        },

        settlementReconciliation: createReconciliation('mempool'),
      }),

      'mempool'
    );

    console.log(
      'PASS: exact positive reconciliation resolves earlier broadcast ambiguity for cash-handover safety'
    );
  }

  console.log('');

  console.log('Cash-out Settlement D5A merchant-safe decision tests passed.');
}

runD5ATests();
