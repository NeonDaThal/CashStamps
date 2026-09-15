import { hashTransaction, hexToBin } from '@bitauth/libauth';

import {
  Contract,
  Network,
  TransactionBuilder,
  type Artifact,
  type NetworkProvider,
  type Utxo,
} from 'cashscript';

import cashOutSettlementArtifactJson from 'src/contracts/artifacts/CashOutSettlement.json';

import type { CashOutNormalSettlementCandidate } from 'src/types/cash-out-contract-payment';

import type {
  CashOutSettlementContractPlan,
  CashOutSettlementIntent,
} from 'src/types/cash-out-settlement';

const CASH_OUT_SETTLEMENT_ARTIFACT =
  cashOutSettlementArtifactJson as unknown as Artifact;

const TXID_PATTERN = /^[0-9a-f]{64}$/;

const COMMITMENT_PATTERN = /^[0-9a-f]{64}$/;

const HEX_PATTERN = /^[0-9a-f]+$/;

function requireCanonicalTxid(value: string, fieldName: string): string {
  const normalized = value.trim().toLowerCase();

  if (!TXID_PATTERN.test(normalized)) {
    throw new Error(
      `${fieldName} must be exactly 32 bytes encoded as hexadecimal.`
    );
  }

  return normalized;
}

function requirePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer.`);
  }

  return value;
}

function requireNonNegativeSafeInteger(
  value: number,
  fieldName: string
): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer.`);
  }

  return value;
}

function validateContractPlan(
  contractPlan: CashOutSettlementContractPlan
): void {
  if (contractPlan.version !== 'cash_out_settlement_contract_v1') {
    throw new Error(
      'Cash-out settlement transaction requires a settlement contract v1 plan.'
    );
  }

  if (contractPlan.settlementPlan.version !== 'cash_out_settlement_v1') {
    throw new Error(
      'Cash-out settlement transaction requires a settlement v1 economics plan.'
    );
  }

  if (contractPlan.contractType !== 'p2sh32') {
    throw new Error(
      'Cash-out settlement transaction requires the frozen P2SH32 contract.'
    );
  }

  const commitment = contractPlan.cashOutCommitmentHex.trim().toLowerCase();

  if (!COMMITMENT_PATTERN.test(commitment) || commitment === '0'.repeat(64)) {
    throw new Error('Cash-out settlement contract commitment is invalid.');
  }

  if (
    contractPlan.constructor.cashOutCommitmentHex.trim().toLowerCase() !==
    commitment
  ) {
    throw new Error(
      'Cash-out settlement commitment does not match its constructor snapshot.'
    );
  }

  if (
    contractPlan.constructor.paymentSats !==
    contractPlan.settlementPlan.paymentSats
  ) {
    throw new Error(
      'Cash-out settlement payment does not match its constructor snapshot.'
    );
  }

  if (
    contractPlan.constructor.platformFeeSats !==
    contractPlan.settlementPlan.platformOutputSats
  ) {
    throw new Error(
      'Cash-out platform allocation does not match its constructor snapshot.'
    );
  }

  if (
    contractPlan.constructor.settlementFeeSats !==
    contractPlan.settlementPlan.settlementFeeSats
  ) {
    throw new Error(
      'Cash-out settlement miner fee does not match its constructor snapshot.'
    );
  }

  if (
    contractPlan.settlementPlan.treasuryOutputSats +
      contractPlan.settlementPlan.platformOutputSats +
      contractPlan.settlementPlan.settlementFeeSats !==
    contractPlan.settlementPlan.paymentSats
  ) {
    throw new Error(
      'Cash-out settlement economics do not reconcile before transaction construction.'
    );
  }
}

function validateCandidate(
  contractPlan: CashOutSettlementContractPlan,
  candidate: CashOutNormalSettlementCandidate
): void {
  const settlementPlan = contractPlan.settlementPlan;

  if (candidate.cashOutId !== settlementPlan.cashOutId) {
    throw new Error(
      'Cash-out settlement candidate belongs to a different Cash-out ID.'
    );
  }

  if (candidate.cashOutSerial !== settlementPlan.cashOutSerial) {
    throw new Error(
      'Cash-out settlement candidate belongs to a different Cash-out serial.'
    );
  }

  if (
    candidate.cashOutCommitmentHex.trim().toLowerCase() !==
    contractPlan.cashOutCommitmentHex.trim().toLowerCase()
  ) {
    throw new Error(
      'Cash-out settlement candidate belongs to a different contract commitment.'
    );
  }

  if (
    candidate.contractAddress.trim().toLowerCase() !==
    contractPlan.contractAddress.trim().toLowerCase()
  ) {
    throw new Error(
      'Cash-out settlement candidate belongs to a different contract address.'
    );
  }

  if (
    candidate.paymentSats !== settlementPlan.paymentSats ||
    candidate.satoshis !== settlementPlan.paymentSats
  ) {
    throw new Error(
      'Cash-out settlement candidate does not contain the exact required payment.'
    );
  }

  requireCanonicalTxid(
    candidate.txid,
    'Cash-out settlement source transaction ID'
  );

  requireNonNegativeSafeInteger(
    candidate.vout,
    'Cash-out settlement source output index'
  );
}

function instantiateContract(
  contractPlan: CashOutSettlementContractPlan,
  provider: NetworkProvider
): Contract {
  const contract = new Contract(
    CASH_OUT_SETTLEMENT_ARTIFACT,
    [
      hexToBin(contractPlan.constructor.cashOutCommitmentHex),

      hexToBin(contractPlan.constructor.treasuryPublicKeyHashHex),

      hexToBin(contractPlan.constructor.platformPublicKeyHashHex),

      BigInt(contractPlan.constructor.paymentSats),

      BigInt(contractPlan.constructor.platformFeeSats),

      BigInt(contractPlan.constructor.settlementFeeSats),
    ],
    {
      provider,

      contractType: 'p2sh32',
    }
  );

  /**
   * Reconstructing the contract from the frozen constructor must yield the
   * exact D1 identity.
   */
  if (
    contract.address.toLowerCase() !==
    contractPlan.contractAddress.toLowerCase()
  ) {
    throw new Error(
      'Reconstructed Cash-out settlement contract address does not match the frozen D1 plan.'
    );
  }

  if (
    contract.lockingBytecode.toLowerCase() !==
    contractPlan.contractLockingBytecodeHex.toLowerCase()
  ) {
    throw new Error(
      'Reconstructed Cash-out settlement locking bytecode does not match the frozen D1 plan.'
    );
  }

  if (
    contract.bytecode.toLowerCase() !==
    contractPlan.contractBytecodeHex.toLowerCase()
  ) {
    throw new Error(
      'Reconstructed Cash-out settlement bytecode does not match the frozen D1 plan.'
    );
  }

  return contract;
}

export interface CreateCashOutSettlementIntentInput {
  contractPlan: CashOutSettlementContractPlan;

  candidate: CashOutNormalSettlementCandidate;

  provider: NetworkProvider;

  /**
   * Optional deterministic timestamp for tests.
   *
   * Production callers normally omit this.
   */
  preparedAt?: string;
}

/**
 * Build the ONE exact normal-settlement transaction for the selected D2
 * contract payment.
 *
 * This function NEVER broadcasts.
 */
export function createCashOutSettlementIntent(
  input: CreateCashOutSettlementIntentInput
): CashOutSettlementIntent {
  const { contractPlan, candidate, provider } = input;

  if (provider.network !== Network.MAINNET) {
    throw new Error(
      'Cash-out settlement transaction construction requires a Bitcoin Cash mainnet provider.'
    );
  }

  validateContractPlan(contractPlan);

  validateCandidate(contractPlan, candidate);

  const settlementPlan = contractPlan.settlementPlan;

  const contract = instantiateContract(contractPlan, provider);

  const sourcePaymentTxid = requireCanonicalTxid(
    candidate.txid,
    'Cash-out settlement source transaction ID'
  );

  const sourceOutpointIndex = requireNonNegativeSafeInteger(
    candidate.vout,
    'Cash-out settlement source output index'
  );

  const sourceValueSats = requirePositiveSafeInteger(
    candidate.satoshis,
    'Cash-out settlement source value'
  );

  const sourceUtxo: Utxo = {
    txid: sourcePaymentTxid,

    vout: sourceOutpointIndex,

    satoshis: BigInt(sourceValueSats),
  };

  const settleUnlockerFactory = contract.unlock['settle'];

  if (typeof settleUnlockerFactory !== 'function') {
    throw new Error('Cash-out settlement artifact does not expose settle().');
  }

  const transactionBuilder = new TransactionBuilder({
    provider,

    maximumFeeSatoshis: 10_000n,

    maximumFeeSatsPerByte: 10,
  })
    .addInput(sourceUtxo, settleUnlockerFactory())
    .addOutput({
      to: settlementPlan.treasuryDestination.address,

      amount: BigInt(settlementPlan.treasuryOutputSats),
    })
    .addOutput({
      to: settlementPlan.platformDestination.address,

      amount: BigInt(settlementPlan.platformOutputSats),
    });

  const transactionSize = transactionBuilder.getTransactionSize();

  if (transactionSize !== BigInt(contractPlan.settlementTransactionSizeBytes)) {
    throw new Error(
      'Cash-out settlement transaction size no longer matches the frozen D1 fee plan.'
    );
  }

  const calculatedFee = transactionBuilder.calculateTransactionFee();

  if (calculatedFee.feeSats !== BigInt(settlementPlan.settlementFeeSats)) {
    throw new Error(
      'Cash-out settlement transaction fee does not match the frozen D1 miner fee.'
    );
  }

  /**
   * Evaluate the exact real-outpoint transaction locally against the covenant
   * before allowing it to become a write-ahead intent.
   */
  transactionBuilder.debug();

  /**
   * build() constructs the final raw transaction locally.
   *
   * It does NOT broadcast.
   */
  const rawTransactionHex = transactionBuilder.build().trim().toLowerCase();

  if (
    rawTransactionHex.length === 0 ||
    rawTransactionHex.length % 2 !== 0 ||
    !HEX_PATTERN.test(rawTransactionHex)
  ) {
    throw new Error(
      'Cash-out settlement transaction did not produce valid raw transaction hexadecimal.'
    );
  }

  const rawTransactionBytes = hexToBin(rawTransactionHex);

  const txid = hashTransaction(rawTransactionBytes).trim().toLowerCase();

  if (!TXID_PATTERN.test(txid)) {
    throw new Error(
      'Could not calculate a valid deterministic Cash-out settlement transaction ID.'
    );
  }

  const rawTransactionBytesLength = rawTransactionBytes.length;

  if (
    rawTransactionBytesLength !== contractPlan.settlementTransactionSizeBytes
  ) {
    throw new Error(
      'Final Cash-out settlement raw transaction size does not match the frozen D1 fee plan.'
    );
  }

  const preparedAt = input.preparedAt ?? new Date().toISOString();

  if (!preparedAt.trim()) {
    throw new Error('Cash-out settlement prepared timestamp is required.');
  }

  return {
    status: 'prepared',

    cashOutId: settlementPlan.cashOutId,

    cashOutSerial: settlementPlan.cashOutSerial,

    cashOutCommitmentHex: contractPlan.cashOutCommitmentHex
      .trim()
      .toLowerCase(),

    contractAddress: contractPlan.contractAddress.trim().toLowerCase(),

    sourcePaymentTxid,

    sourceOutpointIndex,

    sourceValueSats,

    rawTransactionHex,

    txid,

    rawTransactionBytesLength,

    treasuryAddress: settlementPlan.treasuryDestination.address,

    treasuryOutputSats: settlementPlan.treasuryOutputSats,

    platformAddress: settlementPlan.platformDestination.address,

    platformOutputSats: settlementPlan.platformOutputSats,

    actualFeeSats: settlementPlan.settlementFeeSats,

    inputCount: 1,

    outputCount: 2,

    broadcastEnabled: false,

    preparedAt,
  };
}
