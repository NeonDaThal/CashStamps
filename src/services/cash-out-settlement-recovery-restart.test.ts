import {
  resolveCashOutSettlementRecoveryRestartState,
  resumeCashOutSettlementRecoveryWithDependencies,
  type CashOutSettlementRecoveryRestartDependencies,
} from './cash-out-settlement-recovery-restart';

import {
  broadcastAndReconcileCashOutSettlementRecoveryWithDependencies,
  broadcastCashOutSettlementRecoveryIntentWithDependencies,
  reconcileAndStoreCashOutSettlementRecoveryWithDependencies,
  type CashOutSettlementRecoverySubmissionDependencies,
} from './cash-out-settlement-recovery-broadcast';
import {
  applyCashOutSettlementRecoveryBroadcast,
  applyCashOutSettlementRecoveryReconciliation,
} from './cash-out-settlement-recovery-store';
import {
  createRecoveryTestStore,
  finalizeRecoveryTestFixture,
  RECOVERY_TEST_TIME,
} from './cash-out-settlement-recovery-test-fixtures';
import type { CashOutSettlementBroadcastResult } from 'src/types/cash-out-settlement';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

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

// The policy proofs above remain intact. Everything below invokes the actual
// restart executor, wired to the actual submission/reconciliation executors.
const seed = await finalizeRecoveryTestFixture();
const intent = seed.artifact;
const frozenArtifact = JSON.stringify(intent);
const signingCounts = { ...seed.calls };

function observation(
  status: TreasuryBroadcastReconciliationResult['status']
): TreasuryBroadcastReconciliationResult {
  return {
    txid: intent.txid,
    status,
    ...(status === 'mempool'
      ? { blockHeight: 0 }
      : status === 'confirmed'
      ? { blockHeight: 900_002 }
      : {}),
    serverChecks: [],
    checkedAt: RECOVERY_TEST_TIME,
    message: `Restart current ${status} evidence.`,
  };
}

function attemptedRecord(
  status?: TreasuryBroadcastReconciliationResult['status'],
  retry = false
): CashOutRecord {
  const broadcast: CashOutSettlementBroadcastResult = {
    status: 'uncertain',
    txid: intent.txid,
    broadcastEnabled: true,
    requestAttempted: true,
    attemptedAt: RECOVERY_TEST_TIME,
    ...(retry
      ? {
          explicitRejection: {
            kind: 'input_unavailable',
            retrySameTransaction: true,
          },
        }
      : {}),
  };
  const record = applyCashOutSettlementRecoveryBroadcast(
    { ...seed.record, recoveryIntent: intent },
    broadcast
  );
  return status
    ? applyCashOutSettlementRecoveryReconciliation(record, observation(status))
    : record;
}

function createExecutorHarness(
  initial: CashOutRecord,
  currentStatus: TreasuryBroadcastReconciliationResult['status'] = 'unknown'
) {
  const store = createRecoveryTestStore(
    JSON.parse(JSON.stringify(initial)) as CashOutRecord
  );
  const calls = {
    resume: 0,
    check: 0,
    transports: 0,
    raw: [] as string[],
    reconciled: [] as string[],
  };
  const submission: CashOutSettlementRecoverySubmissionDependencies = {
    getCashOutRecordById: store.getCashOutRecordById,
    broadcastRecoveryIntent: (durable) =>
      broadcastCashOutSettlementRecoveryIntentWithDependencies(durable, {
        getBroadcastSafetyStatus: () => ({
          realBroadcastEnabled: true,
          message: 'Synthetic transport only.',
        }),
        createTransport: () => {
          calls.transports += 1;
          return {
            async start() {
              /* fake connection, no real network */
            },
            async broadcast(raw) {
              assertEqual(
                raw,
                store.snapshot().recoveryIntent?.rawTransactionHex
              );
              calls.raw.push(raw);
              return intent.txid;
            },
          };
        },
      }),
    storeRecoveryBroadcast: (id, result) =>
      store.mutateCashOutRecordAtomically(id, (current) =>
        applyCashOutSettlementRecoveryBroadcast(current, result)
      ),
    async reconcileRecoveryTxid(txid) {
      calls.reconciled.push(txid);
      assertEqual(txid, intent.txid);
      return observation(currentStatus);
    },
    storeRecoveryReconciliation: (id, result) =>
      store.mutateCashOutRecordAtomically(id, (current) =>
        applyCashOutSettlementRecoveryReconciliation(current, result)
      ),
  };
  const dependencies: CashOutSettlementRecoveryRestartDependencies = {
    getCashOutRecordById: store.getCashOutRecordById,
    async resumeRecovery(id) {
      calls.resume += 1;
      return broadcastAndReconcileCashOutSettlementRecoveryWithDependencies(
        id,
        submission
      );
    },
    async checkRecovery(id) {
      calls.check += 1;
      return reconcileAndStoreCashOutSettlementRecoveryWithDependencies(
        id,
        submission
      );
    },
    broadcastRecoveryIntent: submission.broadcastRecoveryIntent,
    storeRecoveryBroadcast: submission.storeRecoveryBroadcast,
  };
  return {
    store,
    calls,
    run: () =>
      resumeCashOutSettlementRecoveryWithDependencies(
        seed.record.id,
        dependencies
      ),
  };
}

async function assertExecutorRejects(
  action: Promise<unknown>,
  expected: string
) {
  try {
    await action;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(expected))
      throw new Error(`Expected "${expected}", received "${message}".`);
    return;
  }
  throw new Error(`Expected rejection containing "${expected}".`);
}

function assertUnchangedArtifact(record: CashOutRecord) {
  assertEqual(JSON.stringify(record.recoveryIntent), frozenArtifact);
  assertEqual(seed.calls.finalizations, signingCounts.finalizations);
  assertEqual(seed.calls.signings, signingCounts.signings);
}

{
  const h = createExecutorHarness(seed.record);
  await assertExecutorRejects(
    h.run(),
    'no durable recovery transaction exists'
  );
  assertEqual(h.calls.resume, 0);
  assertEqual(h.calls.check, 0);
  assertEqual(h.calls.transports, 0);
  assertEqual(h.store.calls.writes, 0);
  pass(
    'production restart executor rejects a missing recovery intent before network work'
  );
}

{
  const h = createExecutorHarness({ ...seed.record, recoveryIntent: intent });
  const result = await h.run();
  assertEqual(h.calls.resume, 1);
  assertEqual(h.calls.raw.length, 1);
  assertEqual(h.calls.raw[0], intent.rawTransactionHex);
  assertEqual(h.calls.reconciled[0], intent.txid);
  assertUnchangedArtifact(result);
  pass(
    'production restart resumes an unsubmitted durable intent through the real coordinator using identical bytes'
  );
}

{
  const h = createExecutorHarness(attemptedRecord(), 'mempool');
  const result = await h.run();
  assertEqual(h.calls.resume, 0);
  assertEqual(h.calls.check, 1);
  assertEqual(h.calls.transports, 0);
  assertEqual(h.calls.reconciled.length, 1);
  assertEqual(result.recoveryReconciliation?.status, 'mempool');
  assertUnchangedArtifact(result);
  pass(
    'production restart after an ambiguous attempt checks the original txid without blind resubmission'
  );
}

{
  const h = createExecutorHarness(attemptedRecord('unknown', true));
  const result = await h.run();
  assertEqual(h.calls.resume, 0);
  assertEqual(h.calls.check, 1);
  assertEqual(h.calls.raw.length, 1);
  assertEqual(h.calls.raw[0], intent.rawTransactionHex);
  assertEqual(result.recoveryBroadcast?.requestAttempted, true);
  assertEqual(h.calls.reconciled[0], intent.txid);
  assertUnchangedArtifact(result);
  pass(
    'production explicit-rejection retry resubmits identical stored bytes then checks the same deterministic txid'
  );
}

{
  const h = createExecutorHarness(
    attemptedRecord('unavailable', true),
    'unavailable'
  );
  const result = await h.run();
  assertEqual(h.calls.resume, 0);
  assertEqual(h.calls.check, 1);
  assertEqual(h.calls.transports, 0);
  assertEqual(result.recoveryReconciliation?.status, 'unavailable');
  assertUnchangedArtifact(result);
  pass(
    'unavailable current network state keeps production restart check-only and preserves the whole artifact'
  );
}

{
  const initial = applyCashOutSettlementRecoveryBroadcast(
    { ...seed.record, recoveryIntent: intent },
    {
      status: 'definitely_not_broadcast',
      txid: intent.txid,
      broadcastEnabled: true,
      requestAttempted: false,
      attemptedAt: RECOVERY_TEST_TIME,
    }
  );
  const h = createExecutorHarness(initial);
  const result = await h.run();
  assertEqual(h.calls.resume, 1);
  assertEqual(h.calls.raw.length, 1);
  assertEqual(h.calls.raw[0], intent.rawTransactionHex);
  assertUnchangedArtifact(result);
  pass(
    'production restart resumes a proven pre-request failure using only the stored transaction'
  );
}

for (const status of ['mempool', 'confirmed'] as const) {
  const initial = applyCashOutSettlementRecoveryReconciliation(
    { ...seed.record, recoveryIntent: intent },
    observation(status)
  );
  const h = createExecutorHarness(initial);
  const result = await h.run();
  assertEqual(h.calls.resume, 0);
  assertEqual(h.calls.check, 0);
  assertEqual(h.calls.transports, 0);
  assertEqual(h.calls.reconciled.length, 0);
  assertEqual(h.store.calls.writes, 0);
  assertUnchangedArtifact(result);
  pass(
    `production restart with ${status} evidence performs no submission or reconstruction`
  );
}

console.log(
  '\nCash-out D6J production recovery restart/resume executor tests passed.'
);
