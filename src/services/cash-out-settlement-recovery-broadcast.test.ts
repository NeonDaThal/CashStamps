import {
  broadcastCashOutSettlementRecoveryIntentWithDependencies,
  broadcastAndReconcileCashOutSettlementRecoveryWithDependencies,
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
import type { CashOutRecord } from 'src/types/cash-out';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

function equal(actual: unknown, expected: unknown): void {
  if (actual !== expected)
    throw new Error(
      `Expected ${String(expected)}, received ${String(actual)}.`
    );
}
async function rejects(
  action: Promise<unknown>,
  expected: string
): Promise<void> {
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
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
function pass(message: string): void {
  console.log(`PASS: ${message}`);
}

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
    message: `Synthetic current ${status} evidence.`,
  };
}

function createHarness(
  options: {
    initial?: CashOutRecord;
    enabled?: boolean;
    startError?: string;
    requestError?: string;
    response?: string;
    beforeBroadcastPersistence?: () => Promise<void>;
  } = {}
) {
  const store = createRecoveryTestStore(
    options.initial ?? {
      ...seed.record,
      recoveryIntent: structuredClone(intent),
    }
  );
  const calls = {
    transports: 0,
    starts: 0,
    raw: [] as string[],
    reconciled: [] as string[],
  };
  const events: string[] = [];
  let networkStatus: TreasuryBroadcastReconciliationResult['status'] =
    'unknown';
  const broadcastDependencies = {
    getBroadcastSafetyStatus: () => ({
      realBroadcastEnabled: options.enabled !== false,
      message: 'Synthetic broadcast safety switch.',
    }),
    createTransport: () => {
      calls.transports += 1;
      return {
        async start() {
          calls.starts += 1;
          if (options.startError) throw new Error(options.startError);
        },
        async broadcast(raw: string) {
          // Actual transport entry verifies write-ahead, not just a caller flag.
          equal(store.snapshot().recoveryIntent?.rawTransactionHex, raw);
          equal(store.snapshot().recoveryIntent?.txid, intent.txid);
          calls.raw.push(raw);
          events.push('request-attempted');
          if (options.requestError) throw new Error(options.requestError);
          return options.response ?? intent.txid;
        },
      };
    },
  };
  const dependencies: CashOutSettlementRecoverySubmissionDependencies = {
    getCashOutRecordById: store.getCashOutRecordById,
    broadcastRecoveryIntent: (durable) =>
      broadcastCashOutSettlementRecoveryIntentWithDependencies(
        durable,
        broadcastDependencies
      ),
    async storeRecoveryBroadcast(id, result) {
      events.push('broadcast-persistence-entered');
      await options.beforeBroadcastPersistence?.();
      const stored = await store.mutateCashOutRecordAtomically(id, (current) =>
        applyCashOutSettlementRecoveryBroadcast(current, result)
      );
      events.push('broadcast-persisted');
      return stored;
    },
    async reconcileRecoveryTxid(txid) {
      equal(txid, intent.txid);
      equal(store.snapshot().recoveryBroadcast?.requestAttempted, true);
      calls.reconciled.push(txid);
      events.push('reconcile');
      return observation(networkStatus);
    },
    async storeRecoveryReconciliation(id, result) {
      events.push('reconciliation-persisted');
      return store.mutateCashOutRecordAtomically(id, (current) =>
        applyCashOutSettlementRecoveryReconciliation(current, result)
      );
    },
  };
  return {
    store,
    calls,
    events,
    dependencies,
    broadcastDependencies,
    run: () =>
      broadcastAndReconcileCashOutSettlementRecoveryWithDependencies(
        seed.record.id,
        dependencies
      ),
    setNetworkStatus: (
      status: TreasuryBroadcastReconciliationResult['status']
    ) => {
      networkStatus = status;
    },
  };
}

{
  const h = createHarness();
  const result = await h.run();
  equal(h.calls.raw.length, 1);
  equal(h.calls.raw[0], intent.rawTransactionHex);
  equal(result.recoveryBroadcast?.status, 'broadcasted');
  equal(result.recoveryBroadcast?.txid, intent.txid);
  equal(result.recoveryBroadcast?.requestAttempted, true);
  equal(h.calls.reconciled[0], intent.txid);
  equal(JSON.stringify(result.recoveryIntent), frozenArtifact);
  pass(
    'production broadcaster and submission coordinator submit only exact durable bytes and reconcile their deterministic txid'
  );
}

{
  const h = createHarness({ initial: structuredClone(seed.record) });
  await rejects(
    h.run(),
    'before its exact signed transaction is durably stored'
  );
  equal(h.calls.transports, 0);
  equal(h.calls.reconciled.length, 0);
  equal(h.store.calls.writes, 0);
  pass('missing durable recovery intent fails before transport or network use');
}

{
  const h = createHarness({ enabled: false });
  const result = await h.run();
  equal(result.recoveryBroadcast?.status, 'blocked');
  equal(result.recoveryBroadcast?.requestAttempted, false);
  equal(h.calls.transports, 0);
  equal(h.calls.reconciled.length, 0);
  pass(
    'broadcast-disabled guard prevents transport creation and reconciliation'
  );
}

for (const corrupted of [
  { ...intent, txid: 'f'.repeat(64) },
  { ...intent, rawTransactionHex: '00' + intent.rawTransactionHex.slice(2) },
]) {
  const h = createHarness();
  const result = await broadcastCashOutSettlementRecoveryIntentWithDependencies(
    corrupted,
    h.broadcastDependencies
  );
  equal(result.status, 'blocked');
  equal(result.requestAttempted, false);
  equal(
    result.errorMessage?.includes(
      'does not match its persisted deterministic transaction ID'
    ),
    true
  );
  equal(h.calls.transports, 0);
  equal(h.calls.raw.length, 0);
}
pass('raw-byte/deterministic-txid mismatch fails before transport use');

{
  const h = createHarness({ requestError: 'bad-txns-inputs-missingorspent' });
  const result = await h.run();
  equal(result.recoveryBroadcast?.status, 'uncertain');
  equal(result.recoveryBroadcast?.requestAttempted, true);
  equal(result.recoveryBroadcast?.explicitRejection?.kind, 'input_unavailable');
  equal(
    result.recoveryBroadcast?.explicitRejection?.retrySameTransaction,
    true
  );
  equal(result.recoveryReconciliation?.status, 'unknown');
  await h.run();
  equal(h.calls.raw.length, 1);
  equal(h.calls.reconciled.length, 2);
  pass(
    'production broadcaster classifies explicit input rejection; coordinator re-entry remains check-only'
  );
}

{
  const h = createHarness({ startError: 'Connection failed before request' });
  const result = await h.run();
  equal(result.recoveryBroadcast?.status, 'definitely_not_broadcast');
  equal(result.recoveryBroadcast?.requestAttempted, false);
  equal(h.calls.starts, 1);
  equal(h.calls.raw.length, 0);
  equal(h.calls.reconciled.length, 0);
  pass(
    'transport-start failure is durably distinguished from an attempted request'
  );
}

{
  const h = createHarness({
    requestError: 'Response lost after accepting exact bytes',
  });
  const result = await h.run();
  equal(result.recoveryBroadcast?.status, 'uncertain');
  equal(result.recoveryBroadcast?.requestAttempted, true);
  equal(result.recoveryBroadcast?.explicitRejection, undefined);
  equal(h.calls.raw.length, 1);
  equal(h.calls.reconciled.length, 1);
  h.setNetworkStatus('mempool');
  const reentered = await h.run();
  equal(h.calls.raw.length, 1);
  equal(h.calls.reconciled.length, 2);
  equal(reentered.recoveryReconciliation?.status, 'mempool');
  equal(JSON.stringify(reentered.recoveryIntent), frozenArtifact);
  pass(
    'lost response persists uncertainty; re-entry checks the same txid without another submission'
  );
}

{
  const h = createHarness({ response: 'e'.repeat(64) });
  const result = await h.run();
  equal(result.recoveryBroadcast?.status, 'uncertain');
  equal(result.recoveryBroadcast?.serverTxid, 'e'.repeat(64));
  equal(result.recoveryBroadcast?.txid, intent.txid);
  equal(result.recoveryReconciliation?.status, 'unknown');
  equal(h.calls.reconciled[0], intent.txid);
  pass(
    'a foreign transport response never becomes positive evidence for the recovery transaction'
  );
}

{
  const entered = gate();
  const release = gate();
  const h = createHarness({
    beforeBroadcastPersistence: async () => {
      entered.release();
      await release.promise;
    },
  });
  const running = h.run();
  await entered.promise;
  equal(h.calls.raw.length, 1);
  equal(h.store.snapshot().recoveryBroadcast, undefined);
  equal(h.calls.reconciled.length, 0);
  release.release();
  await running;
  equal(
    h.events.indexOf('broadcast-persisted') < h.events.indexOf('reconcile'),
    true
  );
  equal(
    h.events.indexOf('reconcile') <
      h.events.indexOf('reconciliation-persisted'),
    true
  );
  pass(
    'controlled persistence await proves submission state is durable before reconciliation advancement'
  );
}

for (const failure of ['throw', 'missing-record'] as const) {
  const h = createHarness({ requestError: 'Response lost' });
  h.dependencies.storeRecoveryBroadcast = async () => {
    if (failure === 'throw')
      throw new Error('Synthetic broadcast persistence failure');
    return undefined;
  };
  await rejects(
    h.run(),
    failure === 'throw'
      ? 'persistence failure'
      : 'saving recovery broadcast state'
  );
  equal(h.calls.raw.length, 1);
  equal(h.calls.raw[0], intent.rawTransactionHex);
  equal(h.calls.reconciled.length, 0);
  equal(h.store.snapshot().recoveryBroadcast, undefined);
  equal(JSON.stringify(h.store.snapshot().recoveryIntent), frozenArtifact);
  pass(
    `${failure} after a request attempt propagates failure and stops advancement without replacement or resubmission`
  );
}

for (const status of ['mempool', 'confirmed'] as const) {
  const h = createHarness({
    initial: {
      ...seed.record,
      recoveryIntent: intent,
      recoveryReconciliation: observation(status),
    },
  });
  const before = JSON.stringify(h.store.snapshot());
  const result = await h.run();
  equal(h.calls.transports, 0);
  equal(h.calls.reconciled.length, 0);
  equal(h.store.calls.writes, 0);
  equal(JSON.stringify(result), before);
  pass(`existing ${status} recovery evidence suppresses all submission work`);
}

equal(seed.calls.finalizations, signingCounts.finalizations);
equal(seed.calls.signings, signingCounts.signings);
console.log(
  '\nCash-out D6J recovery broadcast/submission executor tests passed.'
);
