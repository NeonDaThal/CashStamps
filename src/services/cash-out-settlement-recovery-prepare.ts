import type { NetworkProvider } from 'cashscript';

import {
  createCashOutSettlementRecoverySignedTransactionArtifact,
  type CashOutSettlementRecoverySignedTransactionArtifact,
} from './cash-out-settlement-recovery-signing';

import type { CashOutSettlementRecoveryInputAuthorization } from './cash-out-settlement-recovery-input-authorization';

import { buildCashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

import {
  finalizeCashOutSettlementRecoveryTransaction,
  type CashOutSettlementRecoveryFinalizedTransaction,
  type FinalizeCashOutSettlementRecoveryTransactionInput,
} from './cash-out-settlement-recovery-transaction';

import { storeCashOutSettlementRecoveryIntent } from './cash-out-settlement-recovery-store';

import { createTreasuryCashOutRecoveryUnlocker } from './treasury-wallet';

import { getCashOutRecordById } from 'src/services/cash-out-store';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementContractPlan } from 'src/types/cash-out-settlement';

export interface PrepareCashOutSettlementRecoveryInput {
  contractPlan: CashOutSettlementContractPlan;

  inputSet: FinalizeCashOutSettlementRecoveryTransactionInput['inputSet'];

  authorization: CashOutSettlementRecoveryInputAuthorization;

  provider: NetworkProvider;

  /**
   * Primarily useful for deterministic tests.
   *
   * Production callers normally omit this.
   */
  preparedAt?: string;
}

export interface CashOutSettlementRecoveryPreparationDependencies {
  getCashOutRecordById(id: string): Promise<CashOutRecord | undefined>;

  storeCashOutSettlementRecoveryIntent(
    cashOutId: string,
    intent: CashOutSettlementRecoverySignedTransactionArtifact
  ): Promise<CashOutRecord | undefined>;

  finalizeCashOutSettlementRecoveryTransaction(
    input: FinalizeCashOutSettlementRecoveryTransactionInput
  ): Promise<CashOutSettlementRecoveryFinalizedTransaction>;
}

const DEFAULT_DEPENDENCIES: CashOutSettlementRecoveryPreparationDependencies = {
  getCashOutRecordById,

  storeCashOutSettlementRecoveryIntent,

  finalizeCashOutSettlementRecoveryTransaction: (input) =>
    finalizeCashOutSettlementRecoveryTransaction(input, {
      createRecoveryUnlocker: createTreasuryCashOutRecoveryUnlocker,
    }),
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Revalidate an already-durable recovery transaction without constructing or
 * signing another transaction.
 *
 * The persisted recovery fee is used only to reconstruct the pure D6C recovery
 * economics plan. No CashScript transaction is rebuilt here.
 */
function validatePersistedRecoveryIntent(
  intent: CashOutSettlementRecoverySignedTransactionArtifact,
  input: PrepareCashOutSettlementRecoveryInput
): void {
  const settlementPlan = input.contractPlan.settlementPlan;

  if (intent.cashOutId !== settlementPlan.cashOutId) {
    throw new Error(
      'Persisted Cash-out recovery intent belongs to a different Cash-out.'
    );
  }

  if (
    normalize(intent.contractAddress) !==
    normalize(input.contractPlan.contractAddress)
  ) {
    throw new Error(
      'Persisted Cash-out recovery intent belongs to a different contract.'
    );
  }

  if (intent.inputSetId !== input.inputSet.inputSetId) {
    throw new Error(
      'Persisted Cash-out recovery intent belongs to a different recovery input set.'
    );
  }

  if (
    !Number.isSafeInteger(intent.actualFeeSats) ||
    intent.actualFeeSats <= 0
  ) {
    throw new Error(
      'Persisted Cash-out recovery intent has an invalid miner fee.'
    );
  }

  /**
   * Rebuild only the pure deterministic D6C plan using the fee already frozen
   * in the persisted transaction.
   *
   * This does NOT reconstruct or sign a CashScript transaction.
   */
  const recoveryPlan = buildCashOutSettlementRecoveryPlan({
    cashOutId: settlementPlan.cashOutId,

    requiredSats: settlementPlan.paymentSats,

    platformFeeSats: settlementPlan.platformOutputSats,

    recoveryFeeSats: intent.actualFeeSats,

    inputSet: input.inputSet,

    treasuryDestination: settlementPlan.treasuryDestination,

    platformDestination: settlementPlan.platformDestination,
  });

  /**
   * Reuse the existing D6E.1 + D6C.5 validation boundary against the durable
   * signed transaction material.
   */
  const revalidated = createCashOutSettlementRecoverySignedTransactionArtifact({
    plan: recoveryPlan,

    authorization: input.authorization,

    signed: {
      rawTransactionHex: intent.rawTransactionHex,

      txid: intent.txid,

      transactionBytes: intent.transactionBytes,

      transactionSummary: intent.transactionSummary,
    },

    preparedAt: intent.preparedAt,
  });

  if (
    normalize(revalidated.rawTransactionHex) !==
      normalize(intent.rawTransactionHex) ||
    normalize(revalidated.txid) !== normalize(intent.txid) ||
    revalidated.inputSetId !== intent.inputSetId ||
    revalidated.actualFeeSats !== intent.actualFeeSats
  ) {
    throw new Error(
      'Persisted Cash-out recovery transaction failed durable identity validation.'
    );
  }

  /**
   * The signing request is audit-significant too.
   *
   * Rebuilding D6E.1 from the frozen D6C/D6D inputs must produce exactly the
   * same request that was durably stored.
   */
  if (
    JSON.stringify(revalidated.signingRequest) !==
    JSON.stringify(intent.signingRequest)
  ) {
    throw new Error(
      'Persisted Cash-out recovery signing request differs from the authorized recovery inputs.'
    );
  }
}

/**
 * D6E.4 recovery preparation orchestration.
 *
 * First execution:
 *
 *   authorized exceptional recovery
 *     → D6E.3 finalize exact signed transaction
 *     → atomically persist exact artifact
 *     → validate what durable storage actually contains
 *     → return stored record
 *
 * Restart/re-entry:
 *
 *   existing recoveryIntent
 *     → validate existing artifact
 *     → return SAME stored record
 *
 * The restart path deliberately does NOT sign or reconstruct another recovery
 * transaction.
 *
 * This function NEVER broadcasts.
 */
export async function prepareAndStoreCashOutSettlementRecoveryWithDependencies(
  input: PrepareCashOutSettlementRecoveryInput,
  dependencies: CashOutSettlementRecoveryPreparationDependencies
): Promise<CashOutRecord> {
  const cashOutId = input.contractPlan.settlementPlan.cashOutId;

  if (input.authorization.cashOutId !== cashOutId) {
    throw new Error(
      'Cash-out recovery authorization belongs to a different Cash-out than the contract plan.'
    );
  }

  const current = await dependencies.getCashOutRecordById(cashOutId);

  if (!current) {
    throw new Error(
      'Cash-out record could not be found while preparing exceptional recovery.'
    );
  }

  /**
   * Critical restart/re-entry rule:
   *
   * once the exact signed recovery transaction has crossed the durable
   * write-ahead boundary, those bytes are authoritative.
   *
   * Do NOT call the signer again.
   */
  if (current.recoveryIntent) {
    validatePersistedRecoveryIntent(current.recoveryIntent, input);

    return current;
  }

  /**
   * No durable recovery transaction exists yet.
   *
   * This is the only path allowed to invoke D6E.3 and therefore the Treasury
   * recovery signer.
   */
  const finalized =
    await dependencies.finalizeCashOutSettlementRecoveryTransaction({
      contractPlan: input.contractPlan,

      inputSet: input.inputSet,

      authorization: input.authorization,

      provider: input.provider,

      ...(input.preparedAt !== undefined
        ? {
            preparedAt: input.preparedAt,
          }
        : {}),
    });

  /**
   * Cross the durable write-ahead boundary.
   *
   * No future D6F broadcast is permitted before this succeeds.
   */
  const stored = await dependencies.storeCashOutSettlementRecoveryIntent(
    cashOutId,

    finalized.artifact
  );

  if (!stored) {
    throw new Error(
      'Cash-out record could not be found while saving its recovery transaction.'
    );
  }

  if (!stored.recoveryIntent) {
    throw new Error(
      'Cash-out recovery preparation completed without a durable recovery intent.'
    );
  }

  /**
   * Validate what actually won durable storage.
   *
   * This matters for a concurrent/re-entrant preparation race: storage, not
   * the caller's in-memory artifact, is authoritative.
   */
  validatePersistedRecoveryIntent(stored.recoveryIntent, input);

  return stored;
}

/**
 * Production D6E.4 entry point.
 *
 * Preparation/persistence only.
 *
 * No recovery broadcast occurs here.
 */
export async function prepareAndStoreCashOutSettlementRecovery(
  input: PrepareCashOutSettlementRecoveryInput
): Promise<CashOutRecord> {
  return prepareAndStoreCashOutSettlementRecoveryWithDependencies(
    input,

    DEFAULT_DEPENDENCIES
  );
}
