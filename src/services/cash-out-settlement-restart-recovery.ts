import {
  advanceCashOutSettlementNetworkLifecycle,
  advanceCashOutSettlementNetworkLifecycleWithDependencies,
  type CashOutSettlementNetworkLifecycleDependencies,
  type CashOutSettlementNetworkLifecycleOutcome,
} from 'src/services/cash-out-settlement-network-lifecycle';

import {
  evaluateCashOutSettlementMerchantSafety,
  type CashOutSettlementMerchantSafety,
} from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutSettlementConflictInspectionResult } from 'src/services/cash-out-settlement-conflict-inspector';

import type { CashOutSettlementSourceConflictEvidence } from 'src/types/cash-out-settlement';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutSettlementConflictAwareRestartDependencies {
  recoverNetwork: (
    cashOutId: string
  ) => Promise<CashOutSettlementRestartRecoveryResult>;

  inspectConflict: (
    cashOut: CashOutRecord
  ) => Promise<CashOutSettlementConflictInspectionResult>;

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
 * D5 then derives the merchant cash-handover decision from the resulting
 * durable record.
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
 * 2. D5D inspects the exact customer source outpoint for a different spender.
 * 3. Proven conflict evidence is persisted before the final merchant decision.
 * 4. Existing conflict evidence is never erased by "no conflict observed".
 * 5. A prior mempool conflict may be explicitly resolved only when:
 *      - the current inspection sees no conflict; AND
 *      - the exact deterministic settlement is confirmed.
 * 6. Merchant safety is derived from the final durable record.
 */
export async function recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementConflictAwareRestartDependencies
): Promise<CashOutSettlementConflictAwareRestartResult> {
  const networkRecovery = await dependencies.recoverNetwork(cashOutId);

  let record = networkRecovery.record;

  const conflictInspection = await dependencies.inspectConflict(record);

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
  return {
    record,

    networkOutcome: networkRecovery.networkOutcome,

    conflictInspection,

    merchantSafety: evaluateCashOutSettlementMerchantSafety(record),
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
  const [conflictNetwork, conflictStore] = await Promise.all([
    import('src/services/cash-out-settlement-conflict-electrum'),

    import('src/services/cash-out-settlement-conflict-store'),
  ]);

  return recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
    cashOutId,

    {
      recoverNetwork: recoverCashOutSettlementAfterRestart,

      inspectConflict:
        conflictNetwork.inspectCashOutSettlementSourceConflictFromNetwork,

      storeConflict: conflictStore.storeCashOutSettlementSourceConflict,

      resolveConflict:
        conflictStore.resolveStoredCashOutSettlementSourceConflict,

      now: () => new Date().toISOString(),
    }
  );
}
