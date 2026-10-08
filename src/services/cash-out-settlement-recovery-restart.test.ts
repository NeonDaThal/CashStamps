import { resolveCashOutSettlementRecoveryRestartState } from './cash-out-settlement-recovery-restart';

import type { CashOutRecord } from 'src/types/cash-out';

function assertEqual(
  actual: unknown,
  expected: unknown,
  message = 'Expected values to be equal.'
): void {
  if (actual !== expected) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`
    );
  }
}

function pass(message: string): void {
  console.log(`PASS: ${message}`);
}

const TXID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function createRecord(): CashOutRecord {
  return {
    id: 'cash-out-d6g-test',

    status: 'received',

    recoveryIntent: {
      cashOutId: 'cash-out-d6g-test',

      txid: TXID,
    } as CashOutRecord['recoveryIntent'],
  } as CashOutRecord;
}

/**
 * Durable intent exists but no network request has ever begun.
 */
{
  const state = resolveCashOutSettlementRecoveryRestartState(createRecord());

  assertEqual(state.action, 'resume_same_transaction');

  assertEqual(state.mayConstructNewTransaction, false);

  pass('durable recovery with no prior request resumes the same transaction');
}

/**
 * Crash/restart after a broadcast request began but before reconciliation.
 *
 * Must check — never blindly broadcast again.
 */
{
  const record = {
    ...createRecord(),

    recoveryBroadcast: {
      status: 'uncertain',

      txid: TXID,

      broadcastEnabled: true,

      requestAttempted: true,

      attemptedAt: '2026-10-08T15:00:00.000Z',
    },
  } as CashOutRecord;

  const state = resolveCashOutSettlementRecoveryRestartState(record);

  assertEqual(state.action, 'check_same_transaction');

  pass(
    'restart after an attempted request checks the same txid before any retry'
  );
}

/**
 * Proven pre-request failure may safely resume the same stored transaction.
 */
{
  const record = {
    ...createRecord(),

    recoveryBroadcast: {
      status: 'definitely_not_broadcast',

      txid: TXID,

      broadcastEnabled: true,

      requestAttempted: false,

      attemptedAt: '2026-10-08T15:00:00.000Z',
    },
  } as CashOutRecord;

  const state = resolveCashOutSettlementRecoveryRestartState(record);

  assertEqual(state.action, 'resume_same_transaction');

  pass('proven pre-request failure may resume the same persisted transaction');
}

/**
 * Generic uncertain outcome remains check-only.
 */
{
  const record = {
    ...createRecord(),

    recoveryBroadcast: {
      status: 'uncertain',

      txid: TXID,

      broadcastEnabled: true,

      requestAttempted: true,

      attemptedAt: '2026-10-08T15:00:00.000Z',
    },

    recoveryReconciliation: {
      txid: TXID,

      status: 'unknown',

      serverChecks: [],

      checkedAt: '2026-10-08T15:01:00.000Z',

      message: 'Synthetic unknown result.',
    },
  } as CashOutRecord;

  const state = resolveCashOutSettlementRecoveryRestartState(record);

  assertEqual(state.action, 'check_same_transaction');

  pass('generic uncertain recovery outcome remains check-only');
}

/**
 * Narrow input-unavailable rejection + successful unknown reconciliation
 * permits retrying the SAME persisted bytes.
 */
{
  const record = {
    ...createRecord(),

    recoveryBroadcast: {
      status: 'uncertain',

      txid: TXID,

      broadcastEnabled: true,

      requestAttempted: true,

      attemptedAt: '2026-10-08T15:00:00.000Z',

      explicitRejection: {
        kind: 'input_unavailable',

        retrySameTransaction: true,
      },
    },

    recoveryReconciliation: {
      txid: TXID,

      status: 'unknown',

      serverChecks: [],

      checkedAt: '2026-10-08T15:01:00.000Z',

      message: 'Synthetic unknown result.',
    },
  } as CashOutRecord;

  const state = resolveCashOutSettlementRecoveryRestartState(record);

  assertEqual(state.action, 'retry_same_transaction');

  assertEqual(state.txid, TXID);

  assertEqual(state.mayConstructNewTransaction, false);

  pass(
    'explicit input-unavailable rejection may retry only the same persisted transaction'
  );
}

/**
 * Network unavailable is NOT evidence permitting retry.
 */
{
  const record = {
    ...createRecord(),

    recoveryBroadcast: {
      status: 'uncertain',

      txid: TXID,

      broadcastEnabled: true,

      requestAttempted: true,

      attemptedAt: '2026-10-08T15:00:00.000Z',

      explicitRejection: {
        kind: 'input_unavailable',

        retrySameTransaction: true,
      },
    },

    recoveryReconciliation: {
      txid: TXID,

      status: 'unavailable',

      serverChecks: [],

      checkedAt: '2026-10-08T15:01:00.000Z',

      message: 'Synthetic unavailable result.',
    },
  } as CashOutRecord;

  const state = resolveCashOutSettlementRecoveryRestartState(record);

  assertEqual(state.action, 'check_same_transaction');

  pass('unavailable network state cannot authorize recovery retry');
}

/**
 * Positive evidence ends all broadcast/retry behavior.
 */
{
  const record = {
    ...createRecord(),

    recoveryReconciliation: {
      txid: TXID,

      status: 'mempool',

      blockHeight: 0,

      serverChecks: [],

      checkedAt: '2026-10-08T15:01:00.000Z',

      message: 'Synthetic mempool result.',
    },
  } as CashOutRecord;

  const state = resolveCashOutSettlementRecoveryRestartState(record);

  assertEqual(state.action, 'network_observed');

  pass(
    'positive recovery network evidence prevents further broadcast attempts'
  );
}

console.log('');

console.log('Cash-out Settlement D6G recovery restart-policy tests passed.');
