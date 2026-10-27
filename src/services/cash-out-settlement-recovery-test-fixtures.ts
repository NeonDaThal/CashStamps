/** Test-only data, synthetic signer and storage primitive shared by D6J suites. */
import { encodeCashAddress, hexToBin } from '@bitauth/libauth';
import { MockNetworkProvider, Network, SignatureTemplate } from 'cashscript';
import type { Contract } from 'cashscript';
import { buildCashOutSettlementContractPlan } from './cash-out-settlement-contract-plan';
import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';
import { bindCashOutSettlementRecoveryInputSetToNetworkEvidence } from './cash-out-settlement-recovery-input-binding';
import { authorizeCashOutSettlementRecoveryInputs } from './cash-out-settlement-recovery-input-authorization';
import { evaluateCashOutSettlementRecoveryEligibility } from './cash-out-settlement-recovery-eligibility';
import { finalizeCashOutSettlementRecoveryTransaction } from './cash-out-settlement-recovery-transaction';
import type { PrepareCashOutSettlementRecoveryInput } from './cash-out-settlement-recovery-prepare';
import type { AddressListUnspent } from './electrum-types';
import type { CashOutRecord } from 'src/types/cash-out';

export const RECOVERY_TEST_TIME = '2026-10-27T12:00:00.000Z';
const PRIVATE_KEY = hexToBin('00'.repeat(31) + '01');
const PUBLIC_KEY = hexToBin(
  '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
);
const TREASURY_ADDRESS = encodeCashAddress({
  prefix: 'bitcoincash',
  type: 'p2pkh',
  payload: hexToBin('751e76e8199196d454941c45d1b3a323f1433bd6'),
}).address;

export function createRecoveryTestFixture(inputCount: 1 | 2 | 3 = 2) {
  const record: CashOutRecord = {
    id: 'cash-out-d6j-prepare-001',
    serial: 'CO-D6J-001',
    createdAt: RECOVERY_TEST_TIME,
    updatedAt: RECOVERY_TEST_TIME,
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
      marketRateTimestamp: RECOVERY_TEST_TIME,
      quoteLockedAt: RECOVERY_TEST_TIME,
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
    cashOut: record,
    cashOutCommitmentHex: '01'.repeat(32),
    treasuryAddress: TREASURY_ADDRESS,
    provider,
  });
  const values =
    inputCount === 1
      ? [180_000]
      : inputCount === 2
      ? [100_000, 106_000]
      : [50_000, 70_000, 86_000];
  const inputSet = buildCashOutSettlementRecoveryInputSet(
    values.map((satoshis, index) => ({
      txid: String.fromCharCode(97 + index).repeat(64),
      vout: index,
      satoshis,
      contractAddress: contractPlan.contractAddress,
    }))
  );
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
  record.status = 'received';
  const input: PrepareCashOutSettlementRecoveryInput = {
    contractPlan,
    inputSet,
    provider,
    preparedAt: RECOVERY_TEST_TIME,
    recoveryAssessment: evaluateCashOutSettlementRecoveryEligibility(record, {
      exceptionalCase: inputCount === 1 ? 'underpayment' : 'fragmented_payment',
      observedSats: inputSet.totalInputSats,
      observedOutpointCount: inputSet.inputCount,
      networkEvidenceAvailable: true,
    }),
    binding: bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
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
    }),
  };
  const calls = { signings: 0, finalizations: 0 };
  async function createRecoveryUnlocker(contract: Contract, fee: number) {
    calls.signings += 1;
    return contract.unlock.recover(
      PUBLIC_KEY,
      new SignatureTemplate(PRIVATE_KEY),
      BigInt(fee)
    );
  }
  return {
    record,
    input,
    provider,
    contractPlan,
    inputSet,
    unspents,
    createRecoveryUnlocker,
    calls,
  };
}

/** Seed valid durable bytes using the production finalizer, never a test builder. */
export async function finalizeRecoveryTestFixture(inputCount: 1 | 2 | 3 = 2) {
  const fixture = createRecoveryTestFixture(inputCount);
  fixture.calls.finalizations += 1;
  const finalized = await finalizeCashOutSettlementRecoveryTransaction(
    {
      ...fixture.input,
      authorization: authorizeCashOutSettlementRecoveryInputs({
        cashOutId: fixture.record.id,
        recoveryAssessment: fixture.input.recoveryAssessment,
        inputSet: fixture.inputSet,
        binding: fixture.input.binding,
      }),
    },
    { createRecoveryUnlocker: fixture.createRecoveryUnlocker }
  );
  return { ...fixture, artifact: finalized.artifact };
}

/** Only persistence is faked. Callers supply production record transitions. */
export function createRecoveryTestStore(initial: CashOutRecord) {
  let record = structuredClone(initial);
  let queue: Promise<unknown> = Promise.resolve();
  const calls = { writes: 0, intentAttachments: 0 };
  return {
    calls,
    snapshot: () => structuredClone(record),
    async getCashOutRecordById(id: string) {
      return id === record.id ? structuredClone(record) : undefined;
    },
    async mutateCashOutRecordAtomically(
      id: string,
      updater: (current: CashOutRecord) => CashOutRecord
    ) {
      const operation = queue.then(() => {
        if (id !== record.id) return undefined;
        const current = structuredClone(record);
        const next = updater(current);
        if (next !== current) {
          calls.writes += 1;
          if (!current.recoveryIntent && next.recoveryIntent)
            calls.intentAttachments += 1;
          record = structuredClone(next);
        }
        return structuredClone(record);
      });
      queue = operation.catch(() => undefined);
      return operation;
    },
  };
}
