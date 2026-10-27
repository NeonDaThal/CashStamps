import type { NetworkProvider } from 'cashscript';

import {
  createCashOutSettlementRecoverySignedTransactionArtifact,
  type CashOutSettlementRecoverySignedTransactionArtifact,
} from './cash-out-settlement-recovery-signing';

import {
  authorizeCashOutSettlementRecoveryInputs,
  type CashOutSettlementRecoveryInputAuthorization,
} from './cash-out-settlement-recovery-input-authorization';

import {
  bindCashOutSettlementRecoveryInputSetToNetworkEvidence,
  type CashOutSettlementRecoveryInputBinding,
  type CashOutSettlementRecoveryNetworkEvidence,
} from './cash-out-settlement-recovery-input-binding';

import { observeCashOutSettlementRecoveryNetworkEvidence } from './cash-out-settlement-recovery-network-evidence';

import type { AddressListUnspent } from './electrum-types';

import { buildCashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

import {
  finalizeCashOutSettlementRecoveryTransaction,
  type CashOutSettlementRecoveryFinalizedTransaction,
  type FinalizeCashOutSettlementRecoveryTransactionInput,
} from './cash-out-settlement-recovery-transaction';

import {
  storeCashOutSettlementRecoveryIntent,
  type CashOutSettlementRecoveryCommitGuard,
} from './cash-out-settlement-recovery-store';

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
   * Retained for API compatibility. NEW preparation obtains its own live
   * binding; durable replay uses the metadata already frozen in its artifact.
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
    intent: CashOutSettlementRecoverySignedTransactionArtifact,
    validateNewIntent: CashOutSettlementRecoveryCommitGuard
  ): Promise<CashOutRecord | undefined>;

  observeRecoveryNetworkEvidence(
    contractAddress: string
  ): Promise<CashOutSettlementRecoveryNetworkEvidence>;

  finalizeCashOutSettlementRecoveryTransaction(
    input: FinalizeCashOutSettlementRecoveryTransactionInput
  ): Promise<CashOutSettlementRecoveryFinalizedTransaction>;
}

const DEFAULT_DEPENDENCIES: CashOutSettlementRecoveryPreparationDependencies = {
  getCashOutRecordById,

  storeCashOutSettlementRecoveryIntent,

  async observeRecoveryNetworkEvidence(contractAddress) {
    // Keep Electrum's runtime out of the durable replay and isolated test paths.
    const { ElectrumService } = await import('src/services/electrum');
    const { ELECTRUM_SERVERS } = await import('src/config');
    const electrum = new ElectrumService(ELECTRUM_SERVERS);

    try {
      await electrum.start();

      return await observeCashOutSettlementRecoveryNetworkEvidence({
        contractAddress,
        electrum: {
          request: (endpoint, ...params) =>
            electrum.request<AddressListUnspent>(endpoint, ...params),
        },
      });
    } catch {
      return {
        source: 'electrum_listunspent',
        available: false,
        contractAddress,
        utxos: [],
      };
    } finally {
      await electrum.stop();
    }
  },

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
  if (current.id !== cashOutId) {
    throw new Error(
      'Cash-out recovery preparation belongs to a different Cash-out.'
    );
  }

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
  if (current.settlementIntent) {
    throw new Error(
      'Cash-out already has a durable normal settlement transaction and cannot prepare an exceptional recovery transaction.'
    );
  }

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
    const intent = current.recoveryIntent;

    const authorization = authorizeCurrentRecoveryPreparation(
      {
        ...input,
        binding: {
          version: 'cash_out_recovery_input_binding_v1',
          cashOutId: intent.cashOutId,
          contractAddress: intent.contractAddress,
          evidenceSource: 'electrum_listunspent',
          inputSetId: intent.inputSetId,
          inputCount: intent.signingRequest.inputCount,
          totalInputSats: intent.signingRequest.totalInputSats,
          inputs: intent.signingRequest.inputs.map((entry) => ({
            ...entry,
            contractAddress: intent.contractAddress,
          })),
        },
      },
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

  // Own the preparation snapshot across all awaits. Caller mutation cannot
  // change the frozen terms, assessment, or selected input set during signing.
  const snapshot = {
    ...input,
    ...structuredClone({
      contractPlan: input.contractPlan,
      inputSet: input.inputSet,
      recoveryAssessment: input.recoveryAssessment,
    }),
  };
  const recordIdentity = { serial: current.serial, createdAt: current.createdAt };

  const networkEvidence = await dependencies.observeRecoveryNetworkEvidence(
    snapshot.contractPlan.contractAddress
  );

  snapshot.binding = bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
    cashOutId,
    expectedContractAddress: snapshot.contractPlan.contractAddress,
    inputSet: snapshot.inputSet,
    networkEvidence,
  });

  const authorizeNewIntent = (record: CashOutRecord) => {
    assertRecoveryPreparationStillAllowed(record);

    if (
      record.serial !== recordIdentity.serial ||
      record.createdAt !== recordIdentity.createdAt
    ) {
      throw new Error('Cash-out recovery preparation record identity changed.');
    }

    if (
      record.bchSatsRequired !== snapshot.contractPlan.settlementPlan.paymentSats
    ) {
      throw new Error(
        'Cash-out recovery required amount differs from the frozen contract.'
      );
    }

    return authorizeCurrentRecoveryPreparation(snapshot, record, cashOutId);
  };

  const beforeSigning = await dependencies.getCashOutRecordById(cashOutId);

  if (!beforeSigning) {
    throw new Error('Cash-out disappeared before recovery signing.');
  }

  // Boundary A: after network observation, immediately before finalization.
  const authorization = authorizeNewIntent(beforeSigning);

  if (beforeSigning.recoveryIntent) {
    validatePersistedRecoveryIntent(
      beforeSigning.recoveryIntent,
      snapshot,
      authorization
    );
    return beforeSigning;
  }

  /**
   * No durable recovery transaction exists yet.
   *
   * This is the only path allowed to invoke D6E.3 and therefore the Treasury
   * recovery signer.
   */
  const finalized =
    await dependencies.finalizeCashOutSettlementRecoveryTransaction({
      contractPlan: structuredClone(snapshot.contractPlan),

      inputSet: structuredClone(snapshot.inputSet),

      authorization: structuredClone(authorization),

      provider: snapshot.provider,

      ...(snapshot.preparedAt !== undefined
        ? {
            preparedAt: snapshot.preparedAt,
          }
        : {}),
    });

  const validateNewIntent: CashOutSettlementRecoveryCommitGuard = (record) => {
    const currentAuthorization = authorizeNewIntent(record);

    if (JSON.stringify(currentAuthorization) !== JSON.stringify(authorization)) {
      throw new Error(
        'Cash-out recovery authorization changed during preparation.'
      );
    }

    validatePersistedRecoveryIntent(
      finalized.artifact,
      snapshot,
      currentAuthorization
    );
  };

  const afterSigning = await dependencies.getCashOutRecordById(cashOutId);

  if (!afterSigning) {
    throw new Error('Cash-out disappeared during recovery signing.');
  }

  // Boundary B: a signing await must not carry stale safety state into storage.
  validateNewIntent(afterSigning);

  /**
   * Cross the durable write-ahead boundary.
   *
   * No future D6F broadcast is permitted before this succeeds.
   */
  const stored = await dependencies.storeCashOutSettlementRecoveryIntent(
    cashOutId,

    finalized.artifact,

    // Boundary C: the SAME rule runs inside the serialized record updater.
    validateNewIntent
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
  validatePersistedRecoveryIntent(stored.recoveryIntent, snapshot, authorization);

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
