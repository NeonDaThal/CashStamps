import { getCashOutSettlementRecoveryAction } from 'src/services/cash-out-settlement-recovery';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const OTHER_TXID = 'cd'.repeat(32);

const INTENT = {
  status: 'prepared',

  txid: SETTLEMENT_TXID,
} as CashOutSettlementIntent;

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: 'cash-out-d4-001',

    serial: 'CO-D4-001',

    status: 'received',

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function createBroadcast(
  status: 'blocked' | 'broadcasted' | 'definitely_not_broadcast' | 'uncertain',
  overrides: Partial<TreasuryBroadcastResult> = {}
): TreasuryBroadcastResult {
  const requestAttempted = status === 'broadcasted' || status === 'uncertain';

  const broadcastEnabled = status !== 'blocked';

  return {
    status,

    txid: SETTLEMENT_TXID,

    ...(status === 'broadcasted'
      ? {
          serverTxid: SETTLEMENT_TXID,
        }
      : {}),

    broadcastEnabled,

    requestAttempted,

    attemptedAt: '2026-09-17T12:00:00.000Z',

    ...overrides,
  };
}

function createReconciliation(
  status: 'confirmed' | 'mempool' | 'unknown' | 'unavailable',
  overrides: Partial<TreasuryBroadcastReconciliationResult> = {}
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_000,
        }
      : {}),

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    serverChecks: [],

    checkedAt: '2026-09-17T12:01:00.000Z',

    message: `Settlement reconciliation: ${status}.`,

    ...overrides,
  };
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

function assertThrows(operation: () => unknown, message?: string): void {
  let didThrow = false;

  try {
    operation();
  } catch {
    didThrow = true;
  }

  if (!didThrow) {
    throw new Error(message ?? 'Expected operation to throw.');
  }
}

/**
 * Fresh durable D3 intent: exact persisted transaction may be submitted.
 */
{
  const action = getCashOutSettlementRecoveryAction(createCashOut());

  assertEqual(action, 'submit_same_transaction');

  console.log(
    'PASS: fresh durable settlement intent permits submission of the same transaction'
  );
}

/**
 * Safety guard blocked before networking: same transaction remains retryable.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('blocked'),
    })
  );

  assertEqual(action, 'submit_same_transaction');

  console.log(
    'PASS: development broadcast guard leaves the same settlement transaction retryable'
  );
}

/**
 * A precondition block while broadcast was enabled must not auto-retry.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('blocked', {
        broadcastEnabled: true,

        requestAttempted: false,
      }),
    })
  );

  assertEqual(action, 'none');

  console.log('PASS: enabled precondition block does not automatically retry');
}

/**
 * Proven pre-request failure is safe to retry with identical raw bytes.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('definitely_not_broadcast'),
    })
  );

  assertEqual(action, 'submit_same_transaction');

  console.log(
    'PASS: definitely-not-broadcast permits only the same transaction submission'
  );
}

/**
 * Accepted broadcast must now be reconciled, not resubmitted.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('broadcasted'),
    })
  );

  assertEqual(action, 'check_same_transaction');

  console.log(
    'PASS: broadcasted settlement requires exact-txid reconciliation'
  );
}

/**
 * Ambiguous request outcome must also reconcile, never submit again.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('uncertain'),
    })
  );

  assertEqual(action, 'check_same_transaction');

  console.log(
    'PASS: uncertain settlement submission requires exact-txid reconciliation'
  );
}

/**
 * Unknown network visibility does not erase an earlier ambiguous submission.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('uncertain'),

      settlementReconciliation: createReconciliation('unknown'),
    })
  );

  assertEqual(action, 'check_same_transaction');

  console.log(
    'PASS: unknown reconciliation cannot turn an uncertain submission into a retry'
  );
}

/**
 * Network unavailability likewise cannot authorize another submission.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('broadcasted'),

      settlementReconciliation: createReconciliation('unavailable'),
    })
  );

  assertEqual(action, 'check_same_transaction');

  console.log('PASS: unavailable reconciliation preserves check-only recovery');
}

/**
 * Positive mempool evidence ends the broadcast/retry decision.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementBroadcast: createBroadcast('broadcasted'),

      settlementReconciliation: createReconciliation('mempool'),
    })
  );

  assertEqual(action, 'none');

  console.log('PASS: mempool evidence forbids another settlement submission');
}

/**
 * Confirmation is also terminal for D4 recovery.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementReconciliation: createReconciliation('confirmed'),
    })
  );

  assertEqual(action, 'none');

  console.log(
    'PASS: confirmed settlement evidence requires no further D4 network action'
  );
}

/**
 * Weak reconciliation before any app-side submission does not prevent
 * submission of the same deterministic transaction.
 */
{
  const action = getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementReconciliation: createReconciliation('unknown'),
    })
  );

  assertEqual(action, 'submit_same_transaction');

  console.log(
    'PASS: unknown pre-broadcast evidence still permits the same deterministic transaction'
  );
}

/**
 * Any txid contradiction fails closed before an action is returned.
 */
assertThrows(() => {
  getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementReconciliation: createReconciliation('mempool', {
        txid: OTHER_TXID,
      }),
    })
  );
});

console.log(
  'PASS: recovery policy rejects contradictory settlement txid evidence'
);

/**
 * D4 recovery requires the durable D3 write-ahead transaction.
 */
assertThrows(() => {
  getCashOutSettlementRecoveryAction(
    createCashOut({
      settlementIntent: undefined,
    })
  );
});

console.log(
  'PASS: recovery action cannot exist without the durable D3 settlement intent'
);

console.log('');

console.log(
  'Cash-out Settlement D4E same-transaction recovery policy tests passed.'
);
