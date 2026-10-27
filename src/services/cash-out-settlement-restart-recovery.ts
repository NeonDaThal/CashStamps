import {
  advanceCashOutSettlementNetworkLifecycle,
  advanceCashOutSettlementNetworkLifecycleWithDependencies,
  type CashOutSettlementNetworkLifecycleDependencies,
  type CashOutSettlementNetworkLifecycleOutcome,
} from 'src/services/cash-out-settlement-network-lifecycle';

import {
  evaluateCashOutSettlementMerchantSafety,
  type CashOutSettlementMerchantSafety,
  type CashOutSettlementCurrentHandoverContext,
} from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutSettlementConflictInspectionResult } from 'src/services/cash-out-settlement-conflict-inspector';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import { getCashOutRecordById } from './cash-out-store';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutSettlementConflictAwareRestartDependencies {
  recoverNetwork: (
    cashOutId: string
  ) => Promise<CashOutSettlementRestartRecoveryResult>;

  inspectConflict: (
    cashOut: CashOutRecord
  ) => Promise<CashOutSettlementConflictInspectionResult>;

  observeSettlement: (
    intent: CashOutSettlementIntent
  ) => Promise<TreasuryBroadcastReconciliationResult>;

  storeConflict: (
    cashOutId: string,
    evidence: CashOutSettlementSourceConflictEvidence
  ) => Promise<CashOutRecord | undefined>;

  resolveConflict: (
    cashOutId: string,
    resolvedAt: string
  ) => Promise<CashOutRecord | undefined>;

  now: () => string;
}

export interface CashOutSettlementConflictAwareRestartResult
  extends CashOutSettlementRestartRecoveryResult {
  conflictInspection: CashOutSettlementConflictInspectionResult;

  currentHandover?: CashOutSettlementCurrentHandoverContext;
}

export interface CashOutSettlementRestartRecoveryResult {
  /**
   * Latest durable Cash-out record after D4 network recovery/reconciliation.
   */
  record: CashOutRecord;

  /**
   * D4's network-level result.
   *
   * D5 deliberately does not create another competing network-state model.
   */
  networkOutcome: CashOutSettlementNetworkLifecycleOutcome;

  /**
   * D5A's derived answer to the human-facing question:
   *
   * may the merchant physically hand over cash?
   */
  merchantSafety: CashOutSettlementMerchantSafety;
}

function buildRestartRecoveryResult(
  record: CashOutRecord,
  networkOutcome: CashOutSettlementNetworkLifecycleOutcome
): CashOutSettlementRestartRecoveryResult {
  return {
    record,

    networkOutcome,

    merchantSafety: evaluateCashOutSettlementMerchantSafety(record),
  };
}

/**
 * D5C restart recovery with injected dependencies.
 *
 * Used by tests to simulate a complete app/process restart while retaining
 * only the durable Cash-out record.
 *
 * D4 remains responsible for:
 *
 * - deciding whether the exact persisted transaction may be submitted;
 * - deciding whether the exact txid must only be reconciled;
 * - broadcasting only the D3-persisted transaction;
 * - persisting broadcast/reconciliation evidence.
 *
 * D5 preserves the resulting durable evidence. Unconfirmed handover additionally
 * requires the current settlement/conflict checks in the preflight below.
 */
export async function recoverCashOutSettlementAfterRestartWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementNetworkLifecycleDependencies
): Promise<CashOutSettlementRestartRecoveryResult> {
  const lifecycle =
    await advanceCashOutSettlementNetworkLifecycleWithDependencies(
      cashOutId,
      dependencies
    );

  return buildRestartRecoveryResult(lifecycle.record, lifecycle.outcome);
}

/**
 * Production restart-recovery entry point.
 *
 * No settlement transaction is constructed here.
 *
 * The existing D4 lifecycle decides what network action, if any, is safe for
 * the already-persisted D3 settlement transaction.
 */
export async function recoverCashOutSettlementAfterRestart(
  cashOutId: string
): Promise<CashOutSettlementRestartRecoveryResult> {
  const lifecycle = await advanceCashOutSettlementNetworkLifecycle(cashOutId);

  return buildRestartRecoveryResult(lifecycle.record, lifecycle.outcome);
}

/**
 * D5D.3c — full restart safety orchestration.
 *
 * Ordering is security-sensitive:
 *
 * 1. D4 resumes/reconciles the exact persisted settlement transaction.
 * 2. Recheck unconfirmed settlement now, then inspect the exact source outpoint.
 * 3. Proven conflict evidence is persisted before the final merchant decision.
 * 4. Existing conflict evidence is never erased by "no conflict observed".
 * 5. A prior mempool conflict may be explicitly resolved only when:
 *      - the current inspection sees no conflict; AND
 *      - the exact deterministic settlement is confirmed.
 * 6. Merchant safety combines the final durable record and current observations.
 */
export async function recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementConflictAwareRestartDependencies
): Promise<CashOutSettlementConflictAwareRestartResult> {
  const networkRecovery = await dependencies.recoverNetwork(cashOutId);

  let record = networkRecovery.record;

  const intent = record.settlementIntent;

  if (!intent || record.id !== cashOutId) {
    throw new Error(
      'Current handover checks require the exact durable Cash-out settlement intent.'
    );
  }

  // Own the checked identity across both awaits and any conflict-store writes.
  const checkedIntent = structuredClone(intent);
  const checkedCashOutId = record.id;

  // Historical mempool evidence is not a current observation. This explicit
  // read runs even if D4 skipped reconciliation because evidence was durable.
  // Confirmed and completed records do not need transient mempool permission.
  const settlementObservation =
    record.status !== 'completed' &&
    record.settlementReconciliation?.status !== 'confirmed'
      ? await dependencies.observeSettlement(checkedIntent)
      : undefined;

  const conflictInspection = await dependencies.inspectConflict(record);

  if (
    conflictInspection.expectedSettlementTxid.trim().toLowerCase() !==
      checkedIntent.txid.trim().toLowerCase() ||
    conflictInspection.sourcePaymentTxid.trim().toLowerCase() !==
      checkedIntent.sourcePaymentTxid.trim().toLowerCase() ||
    conflictInspection.sourceOutpointIndex !== checkedIntent.sourceOutpointIndex
  ) {
    throw new Error(
      'Current conflict inspection belongs to a different settlement or source outpoint.'
    );
  }

  if (conflictInspection.status === 'conflict_detected') {
    const evidence = conflictInspection.evidence;

    if (!evidence) {
      throw new Error(
        'Conflict inspection reported a conflict without durable evidence.'
      );
    }

    const stored = await dependencies.storeConflict(cashOutId, evidence);

    if (!stored) {
      throw new Error(
        'Cash-out disappeared while settlement conflict evidence was being persisted.'
      );
    }

    record = stored;
  } else if (
    conflictInspection.status === 'no_conflict_observed' &&
    record.settlementSourceConflict?.state === 'detected' &&
    record.settlementReconciliation?.status === 'confirmed' &&
    record.settlementSourceConflict.conflictingTransactionStatus === 'mempool'
  ) {
    /**
     * Absence of the old mempool conflict alone is never enough to clear it.
     *
     * Exact settlement confirmation is additionally required.
     */
    const resolved = await dependencies.resolveConflict(
      cashOutId,
      dependencies.now()
    );

    if (!resolved) {
      throw new Error(
        'Cash-out disappeared while settlement conflict resolution was being persisted.'
      );
    }

    record = resolved;
  }

  /**
   * inspection_unavailable intentionally does not invent either:
   *
   * - conflict; or
   * - resolution.
   *
   * Any already-durable conflict therefore remains active.
   */
  const currentHandover: CashOutSettlementCurrentHandoverContext | undefined =
    settlementObservation
      ? {
          cashOutId: checkedCashOutId,
          settlementTxid: checkedIntent.txid,
          sourcePaymentTxid: checkedIntent.sourcePaymentTxid,
          sourceOutpointIndex: checkedIntent.sourceOutpointIndex,
          settlementObservation,
          conflictInspection,
        }
      : undefined;

  return {
    record,

    networkOutcome: networkRecovery.networkOutcome,

    conflictInspection,

    ...(currentHandover ? { currentHandover } : {}),

    merchantSafety: evaluateCashOutSettlementMerchantSafety(
      record,
      currentHandover
    ),
  };
}

/**
 * Production D5D restart entry point.
 *
 * Runtime-heavy network modules are loaded lazily so Node 18/Vite SSR tests do
 * not eagerly evaluate Electrum/libauth.
 */
export async function recoverCashOutSettlementConflictAwareAfterRestart(
  cashOutId: string
): Promise<CashOutSettlementConflictAwareRestartResult> {
  return recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
    cashOutId,
    {
      ...(await createProductionConflictCheckDependencies()),
      recoverNetwork: recoverCashOutSettlementAfterRestart,
    }
  );
}

async function createProductionConflictCheckDependencies(): Promise<
  Omit<CashOutSettlementConflictAwareRestartDependencies, 'recoverNetwork'>
> {
  const [conflictNetwork, conflictStore, reconciliation] = await Promise.all([
    import('src/services/cash-out-settlement-conflict-electrum'),

    import('src/services/cash-out-settlement-conflict-store'),

    import('src/services/cash-out-settlement-reconciliation'),
  ]);

  return {
    observeSettlement: reconciliation.reconcileCashOutSettlementIntent,

    inspectConflict:
      conflictNetwork.inspectCashOutSettlementSourceConflictFromNetwork,

    storeConflict: conflictStore.storeCashOutSettlementSourceConflict,

    resolveConflict: conflictStore.resolveStoredCashOutSettlementSourceConflict,

    now: () => new Date().toISOString(),
  };
}

export interface CashOutSettlementCurrentHandoverDependencies
  extends Omit<
    CashOutSettlementConflictAwareRestartDependencies,
    'recoverNetwork'
  > {
  getCashOutRecordById(id: string): Promise<CashOutRecord | undefined>;
}

/** Read-only preflight has no transaction construction/signing/broadcast capability. */
export async function checkCashOutSettlementCurrentHandoverSafetyWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementCurrentHandoverDependencies
): Promise<CashOutSettlementConflictAwareRestartResult> {
  return recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
    cashOutId,
    {
      ...dependencies,
      recoverNetwork: async (id) => {
        const record = await dependencies.getCashOutRecordById(id);

        if (!record) {
          throw new Error(
            'Cash-out record could not be found during handover preflight.'
          );
        }

        const status = record.settlementReconciliation?.status;
        return buildRestartRecoveryResult(
          record,
          status === 'confirmed' || status === 'mempool' ? status : 'uncertain'
        );
      },
    }
  );
}

/** Production cash handover always performs a new read-only preflight. */
export async function checkCashOutSettlementCurrentHandoverSafety(
  cashOutId: string
): Promise<CashOutSettlementConflictAwareRestartResult> {
  return checkCashOutSettlementCurrentHandoverSafetyWithDependencies(
    cashOutId,
    {
      ...(await createProductionConflictCheckDependencies()),
      getCashOutRecordById,
    }
  );
}
