import { decodeTransaction, hashTransaction, hexToBin } from '@bitauth/libauth';

import { observeCashOutSettlementRecoveryNetworkEvidence } from './cash-out-settlement-recovery-network-evidence';
import {
  createRecoveryTestFixture,
  RECOVERY_TEST_TIME as TIME,
} from './cash-out-settlement-recovery-test-fixtures';
import {
  prepareAndStoreCashOutSettlementRecoveryWithDependencies,
  type CashOutSettlementRecoveryPreparationDependencies,
  type PrepareCashOutSettlementRecoveryInput,
} from './cash-out-settlement-recovery-prepare';
import {
  storeCashOutSettlementRecoveryIntentWithDependencies,
  applyCashOutSettlementRecoveryBroadcast,
  applyCashOutSettlementRecoveryReconciliation,
} from './cash-out-settlement-recovery-store';
import {
  broadcastAndReconcileCashOutSettlementRecoveryWithDependencies,
  broadcastCashOutSettlementRecoveryIntentWithDependencies,
  reconcileAndStoreCashOutSettlementRecoveryWithDependencies,
  type CashOutSettlementRecoverySubmissionDependencies,
} from './cash-out-settlement-recovery-broadcast';
import { resumeCashOutSettlementRecoveryWithDependencies } from './cash-out-settlement-recovery-restart';
import { createRecoveryTestStore } from './cash-out-settlement-recovery-test-fixtures';
import {
  finalizeCashOutSettlementRecoveryTransaction,
  type FinalizeCashOutSettlementRecoveryTransactionInput,
} from './cash-out-settlement-recovery-transaction';
import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';
import type { AddressListUnspent } from './electrum-types';
import type { CashOutRecord } from 'src/types/cash-out';

function equal(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(
      `Expected ${String(expected)}, received ${String(actual)}.`
    );
  }
}

function deepEqual(actual: unknown, expected: unknown): void {
  equal(JSON.stringify(actual), JSON.stringify(expected));
}

async function rejects(
  operation: Promise<unknown>,
  message: string
): Promise<void> {
  try {
    await operation;
  } catch (error) {
    const actual = error instanceof Error ? error.message : String(error);
    if (!actual.includes(message)) {
      throw new Error(
        `Expected rejection containing "${message}", received "${actual}".`
      );
    }
    return;
  }
  throw new Error(`Expected rejection containing "${message}".`);
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

const { unspents } = createRecoveryTestFixture();

function createHarness(inputCount: 1 | 2 | 3 = 2) {
  const fixture = createRecoveryTestFixture(inputCount);
  const { record: BASE_RECORD, contractPlan, unspents } = fixture;
  let record: CashOutRecord = {
    ...structuredClone(BASE_RECORD),
    status: 'received',
  };
  let response = structuredClone(unspents);
  let networkUnavailable = false;
  let beforeFinalize: (() => Promise<void>) | undefined;
  let beforeCommit: (() => Promise<void>) | undefined;
  let afterObservation: (() => void) | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  const calls = {
    network: 0,
    finalize: 0,
    signer: 0,
    store: 0,
    updater: 0,
    writes: 0,
    reads: 0,
  };
  let finalizerInput:
    | FinalizeCashOutSettlementRecoveryTransactionInput
    | undefined;

  // The caller's older binding is valid but reports mempool height. The fresh
  // Electrum-shaped observation reports confirmed height, making its origin
  // observable all the way through the REAL finalizer and signing request.
  const input: PrepareCashOutSettlementRecoveryInput = fixture.input;
  const dependencies: CashOutSettlementRecoveryPreparationDependencies = {
    async getCashOutRecordById(id) {
      equal(id, BASE_RECORD.id);
      calls.reads += 1;
      return structuredClone(record);
    },
    async observeRecoveryNetworkEvidence(contractAddress) {
      calls.network += 1;
      const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
        contractAddress,
        electrum: {
          async request(endpoint, address, tokenMode) {
            equal(endpoint, 'blockchain.address.listunspent');
            equal(address, contractPlan.contractAddress);
            equal(tokenMode, 'include_tokens');
            if (networkUnavailable)
              throw new Error('Synthetic Electrum outage');
            return structuredClone(response);
          },
        },
      });
      afterObservation?.();
      return evidence;
    },
    async finalizeCashOutSettlementRecoveryTransaction(value) {
      calls.finalize += 1;
      finalizerInput = value;
      await beforeFinalize?.();
      return finalizeCashOutSettlementRecoveryTransaction(value, {
        async createRecoveryUnlocker(contract, fee) {
          calls.signer += 1;
          return fixture.createRecoveryUnlocker(contract, fee);
        },
      });
    },
    async storeCashOutSettlementRecoveryIntent(id, intent, validateNewIntent) {
      calls.store += 1;
      return storeCashOutSettlementRecoveryIntentWithDependencies(
        id,
        intent,
        validateNewIntent,
        {
          async mutateCashOutRecordAtomically(recordId, updater) {
            equal(recordId, record.id);
            await beforeCommit?.();
            // Only the persistence primitive is faked. The production store's
            // updater, first-attachment guard and idempotence logic all run.
            const operation = queue.then(() => {
              calls.updater += 1;
              const next = updater(record);
              if (next !== record) calls.writes += 1;
              record = next;
              return record;
            });
            queue = operation.catch(() => undefined);
            return operation;
          },
        }
      );
    },
  };
  return {
    input,
    dependencies,
    calls,
    run: () =>
      prepareAndStoreCashOutSettlementRecoveryWithDependencies(
        input,
        dependencies
      ),
    record: () => record,
    finalizerInput: () => finalizerInput,
    change: (updates: Partial<CashOutRecord>) => {
      record = { ...record, ...updates };
    },
    response: (value: AddressListUnspent['response']) => {
      response = value;
    },
    unavailable: () => {
      networkUnavailable = true;
    },
    pauseFinalize: (hook: () => Promise<void>) => {
      beforeFinalize = hook;
    },
    pauseCommit: (hook: () => Promise<void>) => {
      beforeCommit = hook;
    },
    afterObservation: (hook: () => void) => {
      afterObservation = hook;
    },
  };
}

async function rejectBeforeSigning(
  configure: (harness: ReturnType<typeof createHarness>) => void,
  message: string,
  label: string
) {
  const harness = createHarness();
  configure(harness);
  await rejects(harness.run(), message);
  equal(harness.calls.network, 1);
  equal(harness.calls.finalize, 0);
  equal(harness.calls.signer, 0);
  equal(harness.calls.store, 0);
  equal(harness.record().recoveryIntent, undefined);
  pass(label);
}

await rejectBeforeSigning(
  (h) => h.response(unspents.slice(1)),
  'not currently proven unspent',
  'valid caller binding cannot override a fresh observation missing selected inputs'
);
await rejectBeforeSigning(
  (h) => h.unavailable(),
  'network evidence is unavailable',
  'fresh network unavailability blocks finalization, signing and storage'
);
await rejectBeforeSigning(
  (h) =>
    h.response(
      unspents.map((entry, index) => ({
        ...entry,
        value: entry.value + (index === 0 ? 1 : 0),
      }))
    ),
  'value does not match',
  'fresh selected-value mutation is rejected before signing'
);
await rejectBeforeSigning(
  (h) =>
    h.response(
      unspents.map((entry, index) => ({
        ...entry,
        ...(index === 0
          ? { token_data: { amount: '1', category: 'c'.repeat(64) } }
          : {}),
      }))
    ),
  'contains CashToken data',
  'fresh token-bearing selected input is rejected before signing'
);

const valid = createHarness();
const stored = await valid.run();
const artifact =
  stored.recoveryIntent as CashOutSettlementRecoverySignedTransactionArtifact;
equal(valid.calls.network, 1);
equal(valid.calls.finalize, 1);
equal(valid.calls.store, 1);
equal(valid.calls.updater, 1);
equal(valid.calls.writes, 1);
equal(valid.calls.signer > 0, true);
equal(valid.input.binding.inputs[0].height, 0);
equal(valid.finalizerInput()?.authorization.inputs[0].height, 900_001);
equal(artifact.signingRequest.inputs[0].networkState, 'confirmed');
equal(artifact.transactionBytes, artifact.actualFeeSats);
equal(artifact.txid.length, 64);
equal(hashTransaction(hexToBin(artifact.rawTransactionHex)), artifact.txid);
pass(
  'fresh confirmed authorization flows through real production finalization, signing and guarded storage'
);

{
  // Continue the real production preparation above: its artifact crossed the
  // guarded write-ahead updater before any transport was even created.
  const original = JSON.stringify(artifact);
  const signingBeforeSubmission = { ...valid.calls };
  equal(valid.calls.store, 1);
  deepEqual(valid.record().recoveryIntent, artifact);
  const firstStore = createRecoveryTestStore(valid.record());
  const submitted: string[] = [];
  const reconciled: string[] = [];
  let currentStatus: 'unknown' | 'mempool' = 'unknown';
  function submissionDependencies(
    store: ReturnType<typeof createRecoveryTestStore>
  ): CashOutSettlementRecoverySubmissionDependencies {
    return {
      getCashOutRecordById: store.getCashOutRecordById,
      broadcastRecoveryIntent: (durable) =>
        broadcastCashOutSettlementRecoveryIntentWithDependencies(durable, {
          getBroadcastSafetyStatus: () => ({
            realBroadcastEnabled: true,
            message: 'Synthetic transport only.',
          }),
          createTransport: () => ({
            async start() {
              deepEqual(store.snapshot().recoveryIntent, artifact);
            },
            async broadcast(raw) {
              equal(raw, artifact.rawTransactionHex);
              submitted.push(raw);
              throw new Error(
                'Response lost after the network accepted the exact transaction'
              );
            },
          }),
        }),
      storeRecoveryBroadcast: (id, result) =>
        store.mutateCashOutRecordAtomically(id, (current) =>
          applyCashOutSettlementRecoveryBroadcast(current, result)
        ),
      async reconcileRecoveryTxid(txid) {
        equal(store.snapshot().recoveryBroadcast?.requestAttempted, true);
        equal(txid, artifact.txid);
        reconciled.push(txid);
        return {
          txid,
          status: currentStatus,
          ...(currentStatus === 'mempool' ? { blockHeight: 0 } : {}),
          checkedAt: TIME,
          serverChecks: [],
          message: `Current ${currentStatus} observation.`,
        };
      },
      storeRecoveryReconciliation: (id, result) =>
        store.mutateCashOutRecordAtomically(id, (current) =>
          applyCashOutSettlementRecoveryReconciliation(current, result)
        ),
    };
  }
  const afterSubmission =
    await broadcastAndReconcileCashOutSettlementRecoveryWithDependencies(
      valid.input.contractPlan.settlementPlan.cashOutId,
      submissionDependencies(firstStore)
    );
  equal(afterSubmission.recoveryBroadcast?.status, 'uncertain');
  equal(afterSubmission.recoveryBroadcast?.requestAttempted, true);
  equal(afterSubmission.recoveryReconciliation?.status, 'unknown');

  // New record objects, new store and new executor dependencies simulate process
  // restart. Only the durable CashOutRecord crosses this JSON boundary.
  const restartedRecord = JSON.parse(
    JSON.stringify(afterSubmission)
  ) as CashOutRecord;
  const restartStore = createRecoveryTestStore(restartedRecord);
  const restartSubmission = submissionDependencies(restartStore);
  currentStatus = 'mempool';
  const afterRestart = await resumeCashOutSettlementRecoveryWithDependencies(
    restartedRecord.id,
    {
      getCashOutRecordById: restartStore.getCashOutRecordById,
      resumeRecovery: (id) =>
        broadcastAndReconcileCashOutSettlementRecoveryWithDependencies(
          id,
          restartSubmission
        ),
      checkRecovery: (id) =>
        reconcileAndStoreCashOutSettlementRecoveryWithDependencies(
          id,
          restartSubmission
        ),
      broadcastRecoveryIntent: restartSubmission.broadcastRecoveryIntent,
      storeRecoveryBroadcast: restartSubmission.storeRecoveryBroadcast,
    }
  );
  equal(submitted.length, 1);
  equal(submitted[0], artifact.rawTransactionHex);
  equal(reconciled.length, 2);
  equal(reconciled[0], artifact.txid);
  equal(reconciled[1], artifact.txid);
  equal(afterRestart.recoveryReconciliation?.status, 'mempool');
  equal(JSON.stringify(afterRestart.recoveryIntent), original);
  equal(valid.calls.finalize, signingBeforeSubmission.finalize);
  equal(valid.calls.signer, signingBeforeSubmission.signer);
  equal(valid.calls.store, 1);
  equal(firstStore.calls.intentAttachments, 0);
  equal(restartStore.calls.intentAttachments, 0);
  pass(
    'COMPOSED: real preparation -> one ambiguous submission -> serialized restart -> original-txid reconciliation, without resigning or a second intent'
  );
}

for (const inputCount of [1, 3] as const) {
  const h = createHarness(inputCount);
  const prepared = await h.run();
  const intent = prepared.recoveryIntent;
  if (!intent)
    throw new Error('Production preparation did not attach an intent.');
  const raw = hexToBin(intent.rawTransactionHex);
  const decoded = decodeTransaction(raw);
  if (typeof decoded === 'string') throw new Error(decoded);
  equal(h.calls.finalize, 1);
  equal(h.calls.store, 1);
  equal(h.calls.writes, 1);
  equal(decoded.inputs.length, inputCount);
  equal(decoded.outputs.length, 2);
  equal(raw.length, intent.transactionBytes);
  equal(hashTransaction(raw), intent.txid);
  equal(intent.actualFeeSats, raw.length);
  equal(
    BigInt(h.input.inputSet.totalInputSats) -
      decoded.outputs.reduce(
        (total, output) => total + output.valueSatoshis,
        0n
      ),
    BigInt(intent.actualFeeSats)
  );
  const beforeReplay = { ...h.calls };
  const replay = await h.run();
  deepEqual(replay.recoveryIntent, intent);
  equal(h.calls.finalize, beforeReplay.finalize);
  equal(h.calls.signer, beforeReplay.signer);
  equal(h.calls.network, beforeReplay.network);
  equal(h.calls.store, beforeReplay.store);
  pass(
    `${inputCount}-input production preparation proves raw bytes, txid, exact fee and durable idempotent replay`
  );
}

{
  const h = createHarness();
  h.change({ recoveryIntent: structuredClone(artifact), status: 'completed' });
  // Caller metadata is older than the durable artifact. Replay must use the
  // artifact's frozen authorization metadata and ignore this caller binding.
  equal(h.input.binding.inputs[0].height, 0);
  h.unavailable();
  const before = JSON.stringify(h.record());
  const replayed = await h.run();
  equal(JSON.stringify(replayed), before);
  equal(replayed.recoveryIntent?.rawTransactionHex, artifact.rawTransactionHex);
  equal(replayed.recoveryIntent?.txid, artifact.txid);
  equal(h.calls.network, 0);
  equal(h.calls.finalize, 0);
  equal(h.calls.signer, 0);
  equal(h.calls.store, 0);
  pass(
    'already durable recovery survives unavailable network and completion without observation or resigning'
  );
}

const changes: Array<{
  label: string;
  updates: Partial<CashOutRecord>;
  message: string;
}> = [
  {
    label: 'completed status',
    updates: { status: 'completed' },
    message: 'Completed Cash-outs',
  },
  {
    label: 'active source conflict',
    updates: {
      settlementSourceConflict: {
        state: 'detected',
      } as CashOutRecord['settlementSourceConflict'],
    },
    message: 'conflicting-spender evidence',
  },
  {
    label: 'positive normal mempool evidence',
    updates: {
      settlementReconciliation: {
        status: 'mempool',
      } as CashOutRecord['settlementReconciliation'],
    },
    message: 'positive network evidence',
  },
  {
    label: 'positive normal confirmed evidence',
    updates: {
      settlementReconciliation: {
        status: 'confirmed',
      } as CashOutRecord['settlementReconciliation'],
    },
    message: 'positive network evidence',
  },
  {
    label: 'changed required amount',
    updates: { bchSatsRequired: 206_001 },
    message: 'required amount',
  },
  {
    label: 'normal settlement intent',
    updates: {
      settlementIntent: {} as CashOutRecord['settlementIntent'],
    },
    message: 'durable normal settlement transaction',
  },
  {
    label: 'changed Cash-out identity',
    updates: { id: 'another-cash-out' },
    message: 'different Cash-out',
  },
  {
    label: 'changed Cash-out serial',
    updates: { serial: 'CO-REPLACED' },
    message: 'record identity changed',
  },
];

for (const change of changes) {
  const h = createHarness();
  const entered = gate();
  const release = gate();
  h.pauseFinalize(async () => {
    entered.release();
    await release.promise;
  });
  const result = h.run();
  // Attach the rejection handler before releasing a controlled async failure.
  const rejected = rejects(result, change.message);
  await entered.promise;
  h.change(change.updates);
  release.release();
  await rejected;
  equal(h.calls.finalize, 1);
  equal(h.calls.store, 0);
  equal(h.calls.writes, 0);
  equal(h.record().recoveryIntent, undefined);
  pass(
    `${change.label} during awaited real finalization blocks new durable intent`
  );
}

// Exercise every state condition again AFTER the post-finalization read. These
// would incorrectly persist if validation lived only in the preparation caller.
for (const change of changes) {
  const h = createHarness();
  const entered = gate();
  const release = gate();
  h.pauseCommit(async () => {
    entered.release();
    await release.promise;
  });
  const rejected = rejects(h.run(), change.message);
  await entered.promise;
  equal(h.calls.reads, 3);
  h.change(change.updates);
  release.release();
  await rejected;
  equal(h.calls.store, 1);
  equal(h.calls.updater, 1);
  equal(h.calls.writes, 0);
  equal(h.record().recoveryIntent, undefined);
  pass(
    `atomic updater rejects ${change.label} introduced after the post-signing reread`
  );
}

await rejectBeforeSigning(
  (h) => h.afterObservation(() => h.change({ status: 'completed' })),
  'Completed Cash-outs',
  'state changes during network observation are rechecked before signing'
);

{
  const h = createHarness();
  h.pauseFinalize(async () => {
    h.input.inputSet.inputs[0].satoshis += 1;
    h.input.inputSet.totalInputSats += 1;
    h.input.recoveryAssessment.observedSats += 1;
    h.input.contractPlan.settlementPlan.paymentSats += 1;
  });
  const result = await h.run();
  equal(result.recoveryIntent?.rawTransactionHex, artifact.rawTransactionHex);
  equal(result.recoveryIntent?.txid, artifact.txid);
  deepEqual(result.recoveryIntent?.signingRequest, artifact.signingRequest);
  pass(
    'caller mutation during finalization cannot change the owned preparation snapshot'
  );
}

{
  const h = createHarness();
  h.pauseCommit(async () => {
    h.change({
      status: 'completed',
      recoveryIntent: {
        ...structuredClone(artifact),
        preparedAt: '2026-10-27T12:00:01.000Z',
      },
    });
  });
  const result = await h.run();
  equal(h.calls.updater, 1);
  equal(h.calls.writes, 0);
  equal(result.status, 'completed');
  equal(result.recoveryIntent?.preparedAt, '2026-10-27T12:00:01.000Z');
  equal(result.recoveryIntent?.rawTransactionHex, artifact.rawTransactionHex);
  equal(result.recoveryIntent?.txid, artifact.txid);
  pass(
    'identical intent winning the commit race remains an unchanged durable replay'
  );
}

{
  const h = createHarness();
  const different = { ...structuredClone(artifact), txid: 'd'.repeat(64) };
  h.pauseCommit(async () => {
    h.change({ recoveryIntent: different });
  });
  await rejects(h.run(), 'different durable recovery transaction');
  equal(h.calls.writes, 0);
  deepEqual(h.record().recoveryIntent, different);
  pass(
    'different second intent cannot replace the transaction that won durable storage'
  );
}

console.log('\nCash-out D6J J2 recovery preparation tests passed.');
