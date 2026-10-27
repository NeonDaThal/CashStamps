import { encodeCashAddress, hexToBin } from '@bitauth/libauth';
import { MockNetworkProvider, Network, SignatureTemplate } from 'cashscript';

import { buildCashOutSettlementContractPlan } from './cash-out-settlement-contract-plan';
import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';
import { bindCashOutSettlementRecoveryInputSetToNetworkEvidence } from './cash-out-settlement-recovery-input-binding';
import { observeCashOutSettlementRecoveryNetworkEvidence } from './cash-out-settlement-recovery-network-evidence';
import { evaluateCashOutSettlementRecoveryEligibility } from './cash-out-settlement-recovery-eligibility';
import {
  prepareAndStoreCashOutSettlementRecoveryWithDependencies,
  type CashOutSettlementRecoveryPreparationDependencies,
  type PrepareCashOutSettlementRecoveryInput,
} from './cash-out-settlement-recovery-prepare';
import { storeCashOutSettlementRecoveryIntentWithDependencies } from './cash-out-settlement-recovery-store';
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

// Synthetic scalar 1 only. No Treasury wallet, live network, or broadcast.
const PRIVATE_KEY = hexToBin('00'.repeat(31) + '01');
const PUBLIC_KEY = hexToBin(
  '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
);
const TREASURY_ADDRESS = encodeCashAddress({
  prefix: 'bitcoincash',
  type: 'p2pkh',
  payload: hexToBin('751e76e8199196d454941c45d1b3a323f1433bd6'),
}).address;
const TIME = '2026-10-27T12:00:00.000Z';
const BASE_RECORD: CashOutRecord = {
  id: 'cash-out-d6j-prepare-001',
  serial: 'CO-D6J-001',
  createdAt: TIME,
  updatedAt: TIME,
  fiatCurrency: 'GBP',
  fiatAmountMinor: 10_000,
  customerSendsFiatEquivalentMinor: 10_300,
  marketBchSats: 200_000,
  bchSatsRequired: 206_000,
  treasuryReceivingAddress: TREASURY_ADDRESS,
  quote: {
    source: 'manual',
    fiatCurrency: 'GBP',
    marketRate: 500,
    marketRateTimestamp: TIME,
    quoteLockedAt: TIME,
    quoteExpiresAt: '2026-10-27T12:05:00.000Z',
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
  status: 'quote_locked',
};
const provider = new MockNetworkProvider();
provider.network = Network.MAINNET;
const contractPlan = buildCashOutSettlementContractPlan({
  cashOut: BASE_RECORD,
  cashOutCommitmentHex: '01'.repeat(32),
  treasuryAddress: TREASURY_ADDRESS,
  provider,
});
const inputSet = buildCashOutSettlementRecoveryInputSet([
  {
    txid: 'a'.repeat(64),
    vout: 0,
    satoshis: 100_000,
    contractAddress: contractPlan.contractAddress,
  },
  {
    txid: 'b'.repeat(64),
    vout: 1,
    satoshis: 106_000,
    contractAddress: contractPlan.contractAddress,
  },
]);
const unspents: AddressListUnspent['response'] = inputSet.inputs.map(
  (entry) => ({
    tx_hash: entry.txid,
    tx_pos: entry.vout,
    value: entry.satoshis,
    height: 900_001,
  })
);
for (const entry of inputSet.inputs) {
  provider.addUtxo(contractPlan.contractAddress, {
    txid: entry.txid,
    vout: entry.vout,
    satoshis: BigInt(entry.satoshis),
  });
}

function createHarness() {
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
  const binding = bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
    cashOutId: record.id,
    expectedContractAddress: contractPlan.contractAddress,
    inputSet,
    networkEvidence: {
      source: 'electrum_listunspent',
      available: true,
      contractAddress: contractPlan.contractAddress,
      utxos: inputSet.inputs.map((entry) => ({
        ...entry,
        height: 0,
        tokenDataPresent: false,
      })),
    },
  });
  const input: PrepareCashOutSettlementRecoveryInput = {
    contractPlan: structuredClone(contractPlan),
    inputSet: structuredClone(inputSet),
    recoveryAssessment: evaluateCashOutSettlementRecoveryEligibility(record, {
      exceptionalCase: 'fragmented_payment',
      observedSats: inputSet.totalInputSats,
      observedOutpointCount: inputSet.inputCount,
      networkEvidenceAvailable: true,
    }),
    binding,
    provider,
    preparedAt: TIME,
  };
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
          return contract.unlock.recover(
            PUBLIC_KEY,
            new SignatureTemplate(PRIVATE_KEY),
            BigInt(fee)
          );
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
pass(
  'fresh confirmed authorization flows through real production finalization, signing and guarded storage'
);

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
