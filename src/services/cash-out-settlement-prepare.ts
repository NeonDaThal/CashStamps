import type { NetworkProvider } from 'cashscript';

import { applyCashOutSettlementIntent } from 'src/services/cash-out-settlement-intent';

import {
  createCashOutSettlementIntent,
  type CreateCashOutSettlementIntentInput,
} from 'src/services/cash-out-settlement-transaction';

import { getCashOutRecordById } from 'src/services/cash-out-store';

import { storeCashOutSettlementIntent } from 'src/services/cash-out-settlement-store';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutNormalSettlementCandidate } from 'src/types/cash-out-contract-payment';

import type {
  CashOutSettlementContractPlan,
  CashOutSettlementIntent,
} from 'src/types/cash-out-settlement';

export interface PrepareCashOutSettlementInput {
  contractPlan: CashOutSettlementContractPlan;

  candidate: CashOutNormalSettlementCandidate;

  provider: NetworkProvider;

  /**
   * Primarily useful for deterministic tests.
   *
   * Production callers normally omit this.
   */
  preparedAt?: string;
}

export interface CashOutSettlementPreparationDependencies {
  getCashOutRecordById(id: string): Promise<CashOutRecord | undefined>;

  storeCashOutSettlementIntent(
    cashOutId: string,
    intent: CashOutSettlementIntent
  ): Promise<CashOutRecord | undefined>;

  createCashOutSettlementIntent(
    input: CreateCashOutSettlementIntentInput
  ): CashOutSettlementIntent;
}

const DEFAULT_DEPENDENCIES: CashOutSettlementPreparationDependencies = {
  getCashOutRecordById,

  storeCashOutSettlementIntent,

  createCashOutSettlementIntent,
};

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Ensure an already-persisted settlement transaction still belongs to the
 * exact D1 contract plan and D2 payment outpoint currently being recovered.
 *
 * This performs NO transaction reconstruction.
 */
function validatePersistedIntentAgainstPreparationInput(
  intent: CashOutSettlementIntent,
  contractPlan: CashOutSettlementContractPlan,
  candidate: CashOutNormalSettlementCandidate
): void {
  const settlementPlan = contractPlan.settlementPlan;

  if (
    intent.cashOutId !== settlementPlan.cashOutId ||
    intent.cashOutSerial !== settlementPlan.cashOutSerial
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent belongs to a different Cash-out.'
    );
  }

  if (
    normalise(intent.cashOutCommitmentHex) !==
    normalise(contractPlan.cashOutCommitmentHex)
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent belongs to a different contract commitment.'
    );
  }

  if (
    normalise(intent.contractAddress) !==
    normalise(contractPlan.contractAddress)
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent belongs to a different contract address.'
    );
  }

  if (
    normalise(intent.sourcePaymentTxid) !== normalise(candidate.txid) ||
    intent.sourceOutpointIndex !== candidate.vout
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent spends a different customer payment outpoint.'
    );
  }

  if (
    intent.sourceValueSats !== candidate.satoshis ||
    intent.sourceValueSats !== settlementPlan.paymentSats
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent does not match the exact customer payment amount.'
    );
  }

  if (
    normalise(intent.treasuryAddress) !==
      normalise(settlementPlan.treasuryDestination.address) ||
    intent.treasuryOutputSats !== settlementPlan.treasuryOutputSats
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent does not match the frozen Treasury settlement output.'
    );
  }

  if (
    normalise(intent.platformAddress) !==
      normalise(settlementPlan.platformDestination.address) ||
    intent.platformOutputSats !== settlementPlan.platformOutputSats
  ) {
    throw new Error(
      'Persisted Cash-out settlement intent does not match the frozen platform settlement output.'
    );
  }

  if (intent.actualFeeSats !== settlementPlan.settlementFeeSats) {
    throw new Error(
      'Persisted Cash-out settlement intent does not match the frozen settlement miner fee.'
    );
  }
}

/**
 * D3 preparation orchestration.
 *
 * First execution:
 *
 *   received Cash-out
 *     → build exact deterministic transaction
 *     → atomically persist it
 *     → return persisted record
 *
 * Recovery/re-entry:
 *
 *   existing durable settlement intent
 *     → validate persisted transaction
 *     → validate it against D1 + D2
 *     → return SAME persisted record
 *
 * The recovery path deliberately does NOT reconstruct a transaction.
 *
 * This function NEVER broadcasts.
 */
export async function prepareAndStoreCashOutSettlementWithDependencies(
  input: PrepareCashOutSettlementInput,
  dependencies: CashOutSettlementPreparationDependencies
): Promise<CashOutRecord> {
  const { contractPlan, candidate, provider, preparedAt } = input;

  const cashOutId = contractPlan.settlementPlan.cashOutId;

  if (candidate.cashOutId !== cashOutId) {
    throw new Error(
      'Cash-out settlement candidate belongs to a different Cash-out than the contract plan.'
    );
  }

  const current = await dependencies.getCashOutRecordById(cashOutId);

  if (!current) {
    throw new Error(
      'Cash-out record could not be found while preparing settlement.'
    );
  }

  /**
   * Critical restart/re-entry rule:
   *
   * once an exact transaction has crossed the write-ahead boundary, its
   * persisted bytes are authoritative.
   *
   * Do NOT reconstruct another transaction here.
   */
  if (current.settlementIntent) {
    const revalidated = applyCashOutSettlementIntent(
      current,
      current.settlementIntent
    );

    validatePersistedIntentAgainstPreparationInput(
      current.settlementIntent,
      contractPlan,
      candidate
    );

    return revalidated;
  }

  /**
   * No durable intent exists yet, so this is the only path permitted to
   * construct the deterministic settlement transaction.
   */
  const intent = dependencies.createCashOutSettlementIntent({
    contractPlan,

    candidate,

    provider,

    ...(preparedAt !== undefined
      ? {
          preparedAt,
        }
      : {}),
  });

  /**
   * Cross the durable write-ahead boundary BEFORE any future D4 broadcast.
   *
   * The store performs its own serialized mutation and non-replacement check,
   * so a concurrent/re-entrant preparation cannot silently overwrite another
   * transaction.
   */
  const stored = await dependencies.storeCashOutSettlementIntent(
    cashOutId,
    intent
  );

  if (!stored) {
    throw new Error(
      'Cash-out record could not be found while saving its settlement transaction.'
    );
  }

  if (!stored.settlementIntent) {
    throw new Error(
      'Cash-out settlement preparation completed without a durable settlement intent.'
    );
  }

  /**
   * Revalidate what actually came back from durable storage rather than
   * assuming the in-memory transaction is what won a possible serialized
   * persistence race.
   */
  const revalidated = applyCashOutSettlementIntent(
    stored,
    stored.settlementIntent
  );

  validatePersistedIntentAgainstPreparationInput(
    stored.settlementIntent,
    contractPlan,
    candidate
  );

  return revalidated;
}

/**
 * Production D3 entry point.
 *
 * Still preparation only:
 * no Electrum broadcast occurs here.
 */
export async function prepareAndStoreCashOutSettlement(
  input: PrepareCashOutSettlementInput
): Promise<CashOutRecord> {
  return prepareAndStoreCashOutSettlementWithDependencies(
    input,
    DEFAULT_DEPENDENCIES
  );
}
