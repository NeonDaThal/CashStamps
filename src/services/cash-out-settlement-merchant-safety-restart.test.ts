import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5b-001';

const CASH_OUT_SERIAL = 'CO-D5B-001';

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

    message: `D5B ${status} evidence.`,

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

/**
 * Simulate the important part of an app restart:
 *
 * the original in-memory object disappears and the Cash-out must be
 * reconstructed only from serializable durable data.
 */
function simulateRestart(cashOut: CashOutRecord): CashOutRecord {
  return JSON.parse(JSON.stringify(cashOut)) as CashOutRecord;
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

function assertRestartSafety(
  cashOut: CashOutRecord,
  expectedSafe: boolean,
  expectedReason: string
): void {
  const beforeRestart = evaluateCashOutSettlementMerchantSafety(cashOut);

  const restartedRecord = simulateRestart(cashOut);

  const afterRestart = evaluateCashOutSettlementMerchantSafety(restartedRecord);

  assertEqual(beforeRestart.safeToHandCash, expectedSafe);

  assertEqual(beforeRestart.reason, expectedReason);

  assertEqual(afterRestart.safeToHandCash, expectedSafe);

  assertEqual(afterRestart.reason, expectedReason);

  assertEqual(
    afterRestart.safeToHandCash,
    beforeRestart.safeToHandCash,
    'Restart changed the merchant-safe decision.'
  );

  assertEqual(
    afterRestart.reason,
    beforeRestart.reason,
    'Restart changed the merchant-safe reason.'
  );
}

function runD5BTests(): void {
  /**
   * Positive mempool evidence is durable merchant-safe evidence.
   */
  {
    assertRestartSafety(
      createCashOut(),

      true,

      'settlement_mempool'
    );

    console.log(
      'PASS: mempool merchant-safe evidence survives a full record restart round-trip'
    );
  }

  /**
   * Confirmed evidence is likewise reconstructible from durable state.
   */
  {
    assertRestartSafety(
      createCashOut({
        settlementReconciliation: createReconciliation('confirmed'),
      }),

      true,

      'settlement_confirmed'
    );

    console.log(
      'PASS: confirmed merchant-safe evidence survives a full record restart round-trip'
    );
  }

  /**
   * Unknown evidence must remain unsafe after restart.
   */
  {
    assertRestartSafety(
      createCashOut({
        settlementReconciliation: createReconciliation('unknown'),
      }),

      false,

      'settlement_unknown'
    );

    console.log(
      'PASS: unknown settlement visibility remains unsafe after restart'
    );
  }

  /**
   * Network unavailability must not magically become safe after restart.
   */
  {
    assertRestartSafety(
      createCashOut({
        settlementReconciliation: createReconciliation('unavailable'),
      }),

      false,

      'settlement_unavailable'
    );

    console.log(
      'PASS: unavailable settlement evidence remains unsafe after restart'
    );
  }

  /**
   * The D3 write-ahead boundary is still required after restart.
   */
  {
    assertRestartSafety(
      createCashOut({
        settlementIntent: undefined,

        settlementReconciliation: undefined,
      }),

      false,

      'missing_settlement_intent'
    );

    console.log(
      'PASS: missing durable settlement intent remains unsafe after restart'
    );
  }

  /**
   * Contradictory persisted settlement identity must still fail closed after
   * all in-memory state has disappeared.
   */
  {
    assertRestartSafety(
      createCashOut({
        settlementReconciliation: createReconciliation('mempool', {
          txid: '44'.repeat(32),
        }),
      }),

      false,

      'invalid_settlement_state'
    );

    console.log(
      'PASS: contradictory persisted settlement identity remains fail-closed after restart'
    );
  }

  /**
   * A completed Cash-out with perfectly valid settlement evidence must never
   * authorise another cash payout after reopening the app.
   */
  {
    assertRestartSafety(
      createCashOut({
        status: 'completed',
      }),

      false,

      'cash_out_already_completed'
    );

    console.log(
      'PASS: completed Cash-out remains protected against duplicate payout after restart'
    );
  }

  /**
   * Generic uncertain broadcast history does not prevent later positive
   * reconciliation from being reconstructed as safe.
   */
  {
    assertRestartSafety(
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

      true,

      'settlement_mempool'
    );

    console.log(
      'PASS: positive reconciliation remains authoritative after restart despite earlier broadcast ambiguity'
    );
  }

  /**
   * Prove that merchant safety is DERIVED, not trusted from a persisted boolean.
   *
   * This deliberately simulates a future/legacy/corrupt record containing a
   * stale safeToHandCash=true property even though the authoritative settlement
   * evidence is unknown.
   */
  {
    const recordWithStaleFlag = {
      ...createCashOut({
        settlementReconciliation: createReconciliation('unknown'),
      }),

      safeToHandCash: true,
    } as CashOutRecord & {
      safeToHandCash: boolean;
    };

    const restartedRecord = simulateRestart(recordWithStaleFlag);

    const result = evaluateCashOutSettlementMerchantSafety(restartedRecord);

    assertEqual(result.safeToHandCash, false);

    assertEqual(result.reason, 'settlement_unknown');

    console.log(
      'PASS: stale persisted safe flag cannot override authoritative settlement evidence'
    );
  }

  /**
   * Ensure all critical transaction identity survives serialization exactly.
   */
  {
    const restartedRecord = simulateRestart(createCashOut());

    assertEqual(restartedRecord.receivedTxid, CUSTOMER_TXID);

    assertEqual(
      restartedRecord.settlementIntent?.sourcePaymentTxid,
      CUSTOMER_TXID
    );

    assertEqual(restartedRecord.settlementIntent?.txid, SETTLEMENT_TXID);

    assertEqual(
      restartedRecord.settlementReconciliation?.txid,
      SETTLEMENT_TXID
    );

    console.log(
      'PASS: restart preserves customer and settlement transaction identity'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5B durable merchant-safety restart tests passed.'
  );
}

runD5BTests();
