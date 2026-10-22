import type { NetworkProvider } from 'cashscript';

import {
  createCashOutSettlementRecoverySignedTransactionArtifact,
  type CashOutSettlementRecoverySignedTransactionArtifact,
} from './cash-out-settlement-recovery-signing';

import {
  authorizeCashOutSettlementRecoveryInputs,
  type CashOutSettlementRecoveryInputAuthorization,
} from './cash-out-settlement-recovery-input-authorization';

import type { CashOutSettlementRecoveryInputBinding } from './cash-out-settlement-recovery-input-binding';

import { buildCashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

import {
  finalizeCashOutSettlementRecoveryTransaction,
  type CashOutSettlementRecoveryFinalizedTransaction,
  type FinalizeCashOutSettlementRecoveryTransactionInput,
} from './cash-out-settlement-recovery-transaction';

import { storeCashOutSettlementRecoveryIntent } from './cash-out-settlement-recovery-store';

import { getCashOutRecordById } from 'src/services/cash-out-store';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementContractPlan,
  CashOutSettlementRecoveryAssessment,
} from 'src/types/cash-out-settlement';

export interface PrepareCashOutSettlementRecoveryInput {
  contractPlan: CashOutSettlementContractPlan;

  inputSet: FinalizeCashOutSettlementRecoveryTransactionInput['inputSet'];

  /**
   * Current exceptional-recovery assessment.
   *
   * Preparation re-authorizes this assessment against the exact bound input set
   * immediately before the only path that may invoke the Treasury signer.
   */
  recoveryAssessment: CashOutSettlementRecoveryAssessment;

  /**
   * Current positive network binding for the exact canonical recovery inputs.
   */
  binding: CashOutSettlementRecoveryInputBinding;

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

  async finalizeCashOutSettlementRecoveryTransaction(input) {
    /**
     * Keep the isolated recovery preparation/test path free from the Treasury
     * wallet → Electrum module graph under Node 18.
     *
     * Production loads the real narrow signer only when signing is actually
     * required.
     */
    const { createTreasuryCashOutRecoveryUnlocker } = await import(
      './treasury-wallet'
    );

    return finalizeCashOutSettlementRecoveryTransaction(input, {
      createRecoveryUnlocker: createTreasuryCashOutRecoveryUnlocker,
    });
  },
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function authorizeCurrentRecoveryPreparation(
  input: PrepareCashOutSettlementRecoveryInput,
  current: CashOutRecord,
  cashOutId: string
): CashOutSettlementRecoveryInputAuthorization {
  /**
   * The exceptional assessment must still describe the frozen amount belonging
   * to the current Cash-out record.
   *
   * This prevents an otherwise internally-consistent stale assessment from
   * being reused after the Cash-out's required amount differs.
   */
  if (input.recoveryAssessment.requiredSats !== current.bchSatsRequired) {
    throw new Error(
      'Cash-out recovery assessment no longer matches the current Cash-out required amount.'
    );
  }

  /**
   * D6I.1C — preparation itself crosses the final authorization boundary.
   *
   * Do not trust a previously-created authorization object supplied by a
   * caller. Re-prove that the assessment, canonical input set and current
   * network binding all describe the same exceptional payment.
   */
  return authorizeCashOutSettlementRecoveryInputs({
    cashOutId,

    recoveryAssessment: input.recoveryAssessment,

    inputSet: input.inputSet,

    binding: input.binding,
  });
}

function assertRecoveryPreparationStillAllowed(current: CashOutRecord): void {
  /**
   * An authorization may have been valid when originally assessed but become
   * stale before Treasury signing.
   *
   * Re-check durable current state immediately before the signing path.
   */
  if (current.status === 'completed') {
    throw new Error(
      'Completed Cash-outs cannot prepare an exceptional recovery transaction.'
    );
  }

  const conflict = current.settlementSourceConflict;

  if (conflict?.state === 'detected') {
    throw new Error(
      'Cash-out exceptional recovery cannot be prepared while conflicting-spender evidence is active.'
    );
  }

  if (
    current.settlementReconciliation?.status === 'mempool' ||
    current.settlementReconciliation?.status === 'confirmed'
  ) {
    throw new Error(
      'Cash-out normal settlement already has positive network evidence and exceptional recovery cannot be prepared.'
    );
  }
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
  input: PrepareCashOutSettlementRecoveryInput,
  authorization: CashOutSettlementRecoveryInputAuthorization
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

    authorization,

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

  const current = await dependencies.getCashOutRecordById(cashOutId);

  if (!current) {
    throw new Error(
      'Cash-out record could not be found while preparing exceptional recovery.'
    );
  }

  /**
   * D6I.1B — normal settlement and recovery are mutually exclusive
   * fee-paying paths.
   *
   * Once a normal signed transaction has crossed the durable write-ahead
   * boundary, the automated MVP recovery path must not sign another transaction
   * carrying the platform allocation.
   *
   * Any later exceptional BCH requires manual operational resolution rather than
   * a second automatic fee-paying transaction.
   */
  if (current.settlementIntent) {
    throw new Error(
      'Cash-out already has a durable normal settlement transaction and cannot prepare an exceptional recovery transaction.'
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
    const authorization = authorizeCurrentRecoveryPreparation(
      input,
      current,
      cashOutId
    );

    validatePersistedRecoveryIntent(
      current.recoveryIntent,
      input,
      authorization
    );

    return current;
  }

  /**
   * No durable recovery transaction exists yet.
   *
   * Before entering the only branch that may invoke the Treasury recovery
   * signer, re-check current durable Cash-out state.
   */
  assertRecoveryPreparationStillAllowed(current);

  const authorization = authorizeCurrentRecoveryPreparation(
    input,
    current,
    cashOutId
  );

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

      authorization,

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
  validatePersistedRecoveryIntent(stored.recoveryIntent, input, authorization);

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
