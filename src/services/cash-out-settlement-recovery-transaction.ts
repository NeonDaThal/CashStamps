import { hashTransaction, hexToBin } from '@bitauth/libauth';

import {
  Contract,
  TransactionBuilder,
  type Artifact,
  type NetworkProvider,
  type Utxo,
} from 'cashscript';

import cashOutSettlementArtifactJson from 'src/contracts/artifacts/CashOutSettlement.json';

import type { CashOutSettlementRecoveryInputAuthorization } from './cash-out-settlement-recovery-input-authorization';

import {
  buildCashOutSettlementRecoveryPlan,
  type CashOutSettlementRecoveryPlan,
} from './cash-out-settlement-recovery-plan';

import {
  buildCashOutSettlementRecoverySigningRequest,
  createCashOutSettlementRecoverySignedTransactionArtifact,
  type CashOutSettlementRecoverySignedTransactionArtifact,
  type CashOutSettlementRecoverySigningRequest,
} from './cash-out-settlement-recovery-signing';

import {
  assertCashOutSettlementRecoveryTransactionMatchesPlan,
  type CashOutSettlementRecoveryTransactionSummary,
} from './cash-out-settlement-recovery-transaction-reconciliation';

import type { CashOutSettlementContractPlan } from 'src/types/cash-out-settlement';

const CASH_OUT_SETTLEMENT_ARTIFACT =
  cashOutSettlementArtifactJson as unknown as Artifact;

const HEX_32_PATTERN = /^[0-9a-f]{64}$/;

const HEX_20_PATTERN = /^[0-9a-f]{40}$/;

const RAW_TRANSACTION_HEX_PATTERN = /^[0-9a-f]+$/;

const TXID_PATTERN = /^[0-9a-f]{64}$/;

export const CASH_OUT_SETTLEMENT_RECOVERY_FEE_RATE_SATS_PER_BYTE = 1;

const MAX_RECOVERY_FEE_PLANNING_ITERATIONS = 20;

/**
 * Deliberately infer the unlocker type from TransactionBuilder itself rather
 * than exporting CashScript signing/key types into the recovery architecture.
 */
export type CashOutSettlementRecoveryUnlocker = Parameters<
  TransactionBuilder['addInput']
>[1];

export interface CashOutSettlementRecoveryTransactionDependencies {
  /**
   * D6E.1 Treasury signing boundary.
   *
   * Production will supply createTreasuryCashOutRecoveryUnlocker().
   *
   * Tests may inject a deterministic test-only signer.
   */
  createRecoveryUnlocker(
    contract: Contract,
    recoveryFeeSats: number
  ): Promise<CashOutSettlementRecoveryUnlocker>;
}

export interface CreateCashOutSettlementRecoveryTransactionCandidateInput {
  contractPlan: CashOutSettlementContractPlan;

  recoveryPlan: CashOutSettlementRecoveryPlan;

  authorization: CashOutSettlementRecoveryInputAuthorization;

  provider: NetworkProvider;
}

export interface CashOutSettlementRecoveryTransactionCandidate {
  cashOutId: string;

  contractAddress: string;

  inputSetId: string;

  /**
   * Final signed serialized transaction.
   *
   * D6E.2 deliberately does not yet derive/freeze the final txid or persist
   * these bytes. That belongs to the next D6E boundary.
   */
  rawTransactionHex: string;

  transactionBytes: number;

  transactionSummary: CashOutSettlementRecoveryTransactionSummary;

  signingRequest: CashOutSettlementRecoverySigningRequest;
}

export interface CashOutSettlementRecoveryFeePlanningIteration {
  iteration: number;

  proposedRecoveryFeeSats: number;

  transactionSizeBytes: number;

  requiredRecoveryFeeSats: number;
}

export interface FinalizeCashOutSettlementRecoveryTransactionInput {
  contractPlan: CashOutSettlementContractPlan;

  /**
   * Canonical D6C input set already selected before transaction construction.
   *
   * D6E must never discover or substitute recovery inputs.
   */
  inputSet: Parameters<
    typeof buildCashOutSettlementRecoveryPlan
  >[0]['inputSet'];

  authorization: CashOutSettlementRecoveryInputAuthorization;

  provider: NetworkProvider;

  /**
   * Optional deterministic timestamp for tests/replay.
   *
   * It is metadata only and does not participate in transaction identity.
   */
  preparedAt?: string;
}

export interface CashOutSettlementRecoveryFinalizedTransaction {
  recoveryPlan: CashOutSettlementRecoveryPlan;

  artifact: CashOutSettlementRecoverySignedTransactionArtifact;

  feePlanningIterations: CashOutSettlementRecoveryFeePlanningIteration[];
}

function fail(message: string): never {
  throw new Error(
    `Invalid Cash-out recovery transaction candidate: ${message}`
  );
}

function isRecoveryFeeTooLowError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TransactionFeePerByteTooLowError' ||
      error.constructor.name === 'TransactionFeePerByteTooLowError')
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function hexToBytes(value: string, expectedBytes: number): Uint8Array {
  const normalized = normalize(value);

  const expectedLength = expectedBytes * 2;

  if (normalized.length !== expectedLength || !/^[0-9a-f]+$/.test(normalized)) {
    fail(
      `expected exactly ${expectedBytes} bytes of hexadecimal transaction data.`
    );
  }

  const bytes = new Uint8Array(expectedBytes);

  for (let index = 0; index < expectedBytes; index += 1) {
    const byteHex = normalized.slice(index * 2, index * 2 + 2);

    bytes[index] = Number.parseInt(byteHex, 16);
  }

  return bytes;
}

function p2pkhLockingBytecode(publicKeyHashHex: string): Uint8Array {
  const normalized = normalize(publicKeyHashHex);

  if (!HEX_20_PATTERN.test(normalized)) {
    fail('P2PKH destination must contain an exact 20-byte public-key hash.');
  }

  const pkh = hexToBytes(normalized, 20);

  return Uint8Array.from([0x76, 0xa9, 0x14, ...pkh, 0x88, 0xac]);
}

function validateContractPlan(
  contractPlan: CashOutSettlementContractPlan
): void {
  if (contractPlan.version !== 'cash_out_settlement_contract_v1') {
    fail('D1 contract plan version is not supported.');
  }

  if (contractPlan.contractType !== 'p2sh32') {
    fail('recovery requires the frozen P2SH32 Cash-out contract.');
  }

  if (contractPlan.settlementPlan.version !== 'cash_out_settlement_v1') {
    fail('D1 settlement economics plan version is not supported.');
  }

  const commitment = normalize(contractPlan.cashOutCommitmentHex);

  if (!HEX_32_PATTERN.test(commitment) || commitment === '0'.repeat(64)) {
    fail('D1 Cash-out commitment is invalid.');
  }

  if (normalize(contractPlan.constructor.cashOutCommitmentHex) !== commitment) {
    fail('D1 commitment differs from its constructor snapshot.');
  }

  if (
    contractPlan.constructor.paymentSats !==
    contractPlan.settlementPlan.paymentSats
  ) {
    fail('D1 payment amount differs from its constructor snapshot.');
  }

  if (
    contractPlan.constructor.platformFeeSats !==
    contractPlan.settlementPlan.platformOutputSats
  ) {
    fail('D1 platform allocation differs from its constructor snapshot.');
  }

  if (
    contractPlan.constructor.settlementFeeSats !==
    contractPlan.settlementPlan.settlementFeeSats
  ) {
    fail('D1 normal settlement fee differs from its constructor snapshot.');
  }
}

function validateRecoveryPlanAgainstContractPlan(
  contractPlan: CashOutSettlementContractPlan,
  recoveryPlan: CashOutSettlementRecoveryPlan
): void {
  const settlementPlan = contractPlan.settlementPlan;

  if (recoveryPlan.cashOutId !== settlementPlan.cashOutId) {
    fail('recovery plan belongs to a different Cash-out.');
  }

  if (
    normalize(recoveryPlan.contractAddress) !==
    normalize(contractPlan.contractAddress)
  ) {
    fail('recovery plan belongs to a different Cash-out contract.');
  }

  /**
   * Recovery never reprices the original customer obligation.
   */
  if (recoveryPlan.requiredSats !== settlementPlan.paymentSats) {
    fail('recovery plan changes the original required customer payment.');
  }

  /**
   * Recovery receives the original platform allocation exactly once.
   */
  if (recoveryPlan.platformFeeSats !== settlementPlan.platformOutputSats) {
    fail('recovery plan changes the original platform allocation.');
  }

  if (
    normalize(recoveryPlan.treasuryDestination.address) !==
      normalize(settlementPlan.treasuryDestination.address) ||
    normalize(recoveryPlan.treasuryDestination.publicKeyHashHex) !==
      normalize(settlementPlan.treasuryDestination.publicKeyHashHex)
  ) {
    fail('recovery Treasury destination differs from the D1 settlement plan.');
  }

  if (
    normalize(recoveryPlan.platformDestination.address) !==
      normalize(settlementPlan.platformDestination.address) ||
    normalize(recoveryPlan.platformDestination.publicKeyHashHex) !==
      normalize(settlementPlan.platformDestination.publicKeyHashHex)
  ) {
    fail('recovery Platform destination differs from the D1 settlement plan.');
  }
}

function instantiateExactCashOutContract(
  contractPlan: CashOutSettlementContractPlan,
  provider: NetworkProvider
): Contract {
  const contract = new Contract(
    CASH_OUT_SETTLEMENT_ARTIFACT,
    [
      hexToBytes(contractPlan.constructor.cashOutCommitmentHex, 32),

      hexToBytes(contractPlan.constructor.treasuryPublicKeyHashHex, 20),

      hexToBytes(contractPlan.constructor.platformPublicKeyHashHex, 20),

      BigInt(contractPlan.constructor.paymentSats),

      BigInt(contractPlan.constructor.platformFeeSats),

      BigInt(contractPlan.constructor.settlementFeeSats),
    ],
    {
      provider,

      contractType: 'p2sh32',
    }
  );

  if (contract.contractType !== 'p2sh32') {
    fail('reconstructed Cash-out contract is not P2SH32.');
  }

  if (normalize(contract.address) !== normalize(contractPlan.contractAddress)) {
    fail('reconstructed Cash-out contract address differs from D1.');
  }

  if (
    normalize(contract.lockingBytecode) !==
    normalize(contractPlan.contractLockingBytecodeHex)
  ) {
    fail('reconstructed Cash-out locking bytecode differs from D1.');
  }

  if (
    normalize(contract.bytecode) !== normalize(contractPlan.contractBytecodeHex)
  ) {
    fail('reconstructed Cash-out redeem bytecode differs from D1.');
  }

  return contract;
}

/**
 * D6E.2 — construct one exact signed exceptional-recovery transaction
 * candidate.
 *
 * Preconditions:
 *
 * - D1 contract identity is frozen;
 * - D6C recovery economics/input set are frozen;
 * - D6D authorization is already positive;
 * - D6E.1 provides the only signing capability.
 *
 * This function deliberately performs no:
 *
 * - UTXO discovery;
 * - input substitution;
 * - recovery eligibility decision;
 * - fee estimation/fixed-point planning;
 * - persistence;
 * - network broadcast.
 *
 * The supplied recovery fee is used exactly as frozen in recoveryPlan.
 */
export async function createCashOutSettlementRecoveryTransactionCandidate(
  input: CreateCashOutSettlementRecoveryTransactionCandidateInput,
  dependencies: CashOutSettlementRecoveryTransactionDependencies
): Promise<CashOutSettlementRecoveryTransactionCandidate> {
  const { contractPlan, recoveryPlan, authorization, provider } = input;

  validateContractPlan(contractPlan);

  validateRecoveryPlanAgainstContractPlan(contractPlan, recoveryPlan);

  /**
   * Reuse the D6E.1 validation boundary before constructing anything.
   *
   * This proves that the D6C plan and D6D authorization still describe the
   * same ordered 1–3 selected inputs and exact recovery economics.
   */
  const signingRequest = buildCashOutSettlementRecoverySigningRequest(
    recoveryPlan,
    authorization
  );

  const contract = instantiateExactCashOutContract(contractPlan, provider);

  const transactionBuilder = new TransactionBuilder({
    provider,

    /**
     * Safety ceilings only.
     *
     * Recovery economics themselves define the exact transaction fee.
     */
    maximumFeeSatoshis: 10_000n,

    maximumFeeSatsPerByte: 10,
  });

  /**
   * Add only the exact D6D-authorized canonical input sequence.
   *
   * No network discovery or substitution is permitted here.
   */
  for (const selectedInput of signingRequest.inputs) {
    const sourceUtxo: Utxo = {
      txid: normalize(selectedInput.txid),

      vout: selectedInput.vout,

      satoshis: BigInt(selectedInput.satoshis),
    };

    const recoveryUnlocker = await dependencies.createRecoveryUnlocker(
      contract,
      signingRequest.recoveryFeeSats
    );

    transactionBuilder.addInput(sourceUtxo, recoveryUnlocker);
  }

  /**
   * Output positions are covenant-significant:
   *
   * 0 = Treasury
   * 1 = Platform
   */
  transactionBuilder
    .addOutput({
      to: p2pkhLockingBytecode(
        signingRequest.treasuryDestination.publicKeyHashHex
      ),

      amount: BigInt(signingRequest.treasuryOutputSats),
    })
    .addOutput({
      to: p2pkhLockingBytecode(
        signingRequest.platformDestination.publicKeyHashHex
      ),

      amount: BigInt(signingRequest.platformOutputSats),
    });

  const calculatedFee = transactionBuilder.calculateTransactionFee();

  if (calculatedFee.feeSats !== BigInt(signingRequest.recoveryFeeSats)) {
    fail(
      'constructed transaction miner fee differs from the frozen recovery fee.'
    );
  }

  /**
   * Execute the exact transaction locally against recover() before accepting
   * its serialized bytes.
   */
  transactionBuilder.debug();

  const rawTransactionHex = transactionBuilder.build().trim().toLowerCase();

  if (
    rawTransactionHex.length === 0 ||
    rawTransactionHex.length % 2 !== 0 ||
    !RAW_TRANSACTION_HEX_PATTERN.test(rawTransactionHex)
  ) {
    fail(
      'CashScript did not produce valid signed recovery transaction hexadecimal.'
    );
  }

  const transactionBytes = rawTransactionHex.length / 2;

  const builderTransactionSize = transactionBuilder.getTransactionSize();

  if (builderTransactionSize !== BigInt(transactionBytes)) {
    fail(
      'serialized recovery transaction size differs from CashScript builder size.'
    );
  }

  /**
   * This summary is derived from the exact immutable construction values used
   * above — the same ordered inputs and the same two outputs supplied to the
   * TransactionBuilder.
   */
  const transactionSummary: CashOutSettlementRecoveryTransactionSummary = {
    cashOutId: signingRequest.cashOutId,

    contractAddress: signingRequest.contractAddress,

    inputCount: signingRequest.inputCount,

    inputs: signingRequest.inputs.map((selectedInput) => ({
      txid: normalize(selectedInput.txid),

      vout: selectedInput.vout,

      satoshis: selectedInput.satoshis,
    })),

    outputCount: 2,

    outputs: [
      {
        index: 0,

        publicKeyHashHex: signingRequest.treasuryDestination.publicKeyHashHex,

        satoshis: signingRequest.treasuryOutputSats,
      },

      {
        index: 1,

        publicKeyHashHex: signingRequest.platformDestination.publicKeyHashHex,

        satoshis: signingRequest.platformOutputSats,
      },
    ],

    feeSats: signingRequest.recoveryFeeSats,
  };

  /**
   * D6C.5 remains the independent final construction guard.
   */
  assertCashOutSettlementRecoveryTransactionMatchesPlan(
    recoveryPlan,
    transactionSummary
  );

  return {
    cashOutId: signingRequest.cashOutId,

    contractAddress: signingRequest.contractAddress,

    inputSetId: signingRequest.inputSetId,

    rawTransactionHex,

    transactionBytes,

    transactionSummary,

    signingRequest,
  };
}

/**
 * D6E.3 — finalize one exact exceptional-recovery transaction.
 *
 * This is the production fixed-point boundary.
 *
 * Starting from the already-authorized D6C/D6D input set, it repeatedly:
 *
 * 1. freezes a recovery plan using the proposed miner fee;
 * 2. constructs and signs the exact CashScript recovery transaction;
 * 3. measures the actual final serialized transaction;
 * 4. calculates the required miner fee at the frozen 1 sat/byte policy;
 * 5. repeats until proposed fee === required fee.
 *
 * Only after reaching that exact fixed point does it:
 *
 * - calculate the deterministic txid from the exact signed raw bytes;
 * - pass the transaction through the D6E.1/D6C.5 signed-artifact boundary.
 *
 * This function performs no persistence and no broadcast.
 */
export async function finalizeCashOutSettlementRecoveryTransaction(
  input: FinalizeCashOutSettlementRecoveryTransactionInput,
  dependencies: CashOutSettlementRecoveryTransactionDependencies
): Promise<CashOutSettlementRecoveryFinalizedTransaction> {
  const feePlanningIterations: CashOutSettlementRecoveryFeePlanningIteration[] =
    [];

  /**
   * Start from the minimum valid positive recovery fee.
   *
   * This is only the first proposal — never the final fee unless the actual
   * signed transaction independently proves it.
   */
  let proposedRecoveryFeeSats = 1;

  for (
    let iteration = 1;
    iteration <= MAX_RECOVERY_FEE_PLANNING_ITERATIONS;
    iteration += 1
  ) {
    /**
     * Recovery economics always reuse the original frozen Cash-out terms.
     *
     * Exceptional customer payment shapes never cause repricing or a larger
     * platform allocation.
     */
    const recoveryPlan = buildCashOutSettlementRecoveryPlan({
      cashOutId: input.contractPlan.settlementPlan.cashOutId,

      requiredSats: input.contractPlan.settlementPlan.paymentSats,

      platformFeeSats: input.contractPlan.settlementPlan.platformOutputSats,

      recoveryFeeSats: proposedRecoveryFeeSats,

      inputSet: input.inputSet,

      treasuryDestination:
        input.contractPlan.settlementPlan.treasuryDestination,

      platformDestination:
        input.contractPlan.settlementPlan.platformDestination,
    });

    let candidate: CashOutSettlementRecoveryTransactionCandidate;

    try {
      candidate = await createCashOutSettlementRecoveryTransactionCandidate(
        {
          contractPlan: input.contractPlan,

          recoveryPlan,

          authorization: input.authorization,

          provider: input.provider,
        },

        dependencies
      );
    } catch (error: unknown) {
      /**
       * A very small bootstrap fee may be below CashScript's standard minimum
       * relay-fee policy before we have been able to measure the final signed
       * transaction.
       *
       * Increase only that proposed fee and try the exact same authorized
       * transaction again.
       *
       * No input, destination or original Cash-out economics are changed.
       */
      if (isRecoveryFeeTooLowError(error)) {
        const increasedProposal = proposedRecoveryFeeSats * 2;

        if (
          !Number.isSafeInteger(increasedProposal) ||
          increasedProposal <= proposedRecoveryFeeSats
        ) {
          fail(
            'could not safely increase the recovery fee bootstrap proposal.'
          );
        }

        feePlanningIterations.push({
          iteration,

          proposedRecoveryFeeSats,

          transactionSizeBytes: 0,

          requiredRecoveryFeeSats: increasedProposal,
        });

        proposedRecoveryFeeSats = increasedProposal;

        continue;
      }

      throw error;
    }

    const requiredRecoveryFeeSats =
      candidate.transactionBytes *
      CASH_OUT_SETTLEMENT_RECOVERY_FEE_RATE_SATS_PER_BYTE;

    if (
      !Number.isSafeInteger(requiredRecoveryFeeSats) ||
      requiredRecoveryFeeSats <= 0
    ) {
      fail(
        'calculated fixed-point recovery miner fee is not a positive safe integer.'
      );
    }

    feePlanningIterations.push({
      iteration,

      proposedRecoveryFeeSats,

      transactionSizeBytes: candidate.transactionBytes,

      requiredRecoveryFeeSats,
    });

    if (proposedRecoveryFeeSats === requiredRecoveryFeeSats) {
      /**
       * The exact signed transaction has reached its fee/size fixed point.
       *
       * Nothing may reconstruct or alter it after this point.
       */
      const rawTransactionBytes = hexToBin(candidate.rawTransactionHex);

      if (rawTransactionBytes.length !== candidate.transactionBytes) {
        fail(
          'final recovery raw transaction byte length changed during txid calculation.'
        );
      }

      const txid = hashTransaction(rawTransactionBytes).trim().toLowerCase();

      if (!TXID_PATTERN.test(txid)) {
        fail(
          'could not calculate a valid deterministic recovery transaction ID.'
        );
      }

      const preparedAt = input.preparedAt ?? new Date().toISOString();

      const artifact = createCashOutSettlementRecoverySignedTransactionArtifact(
        {
          plan: recoveryPlan,

          authorization: input.authorization,

          signed: {
            rawTransactionHex: candidate.rawTransactionHex,

            txid,

            transactionBytes: candidate.transactionBytes,

            transactionSummary: candidate.transactionSummary,
          },

          preparedAt,
        }
      );

      return {
        recoveryPlan,

        artifact,

        feePlanningIterations,
      };
    }

    /**
     * Rebuild the complete signed transaction with the newly measured fee.
     *
     * We do not mutate the previous candidate because the recovery fee is
     * covenant-significant and changes the Treasury output.
     */
    proposedRecoveryFeeSats = requiredRecoveryFeeSats;
  }

  fail(
    'recovery miner-fee planning did not converge within the maximum iteration count.'
  );
}
