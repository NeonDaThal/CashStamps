import { getCashOutRecordById } from 'src/services/cash-out-store';

import {
  storeCashOutSettlementBroadcast,
  storeCashOutSettlementReconciliation,
} from 'src/services/cash-out-settlement-network-store';

import { getCashOutSettlementRecoveryAction } from 'src/services/cash-out-settlement-recovery';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

export type CashOutSettlementNetworkLifecycleOutcome =
  | 'confirmed'
  | 'mempool'
  | 'broadcasted_pending_detection'
  | 'uncertain'
  | 'definitely_not_broadcast'
  | 'blocked';

export interface CashOutSettlementNetworkLifecycleResult {
  record: CashOutRecord;

  outcome: CashOutSettlementNetworkLifecycleOutcome;

  broadcast?: TreasuryBroadcastResult;

  reconciliation?: TreasuryBroadcastReconciliationResult;
}

export interface CashOutSettlementNetworkLifecycleDependencies {
  getCashOutRecordById(id: string): Promise<CashOutRecord | undefined>;

  storeBroadcast(
    cashOutId: string,
    broadcast: TreasuryBroadcastResult
  ): Promise<CashOutRecord | undefined>;

  storeReconciliation(
    cashOutId: string,
    reconciliation: TreasuryBroadcastReconciliationResult
  ): Promise<CashOutRecord | undefined>;

  broadcast(intent: CashOutSettlementIntent): Promise<TreasuryBroadcastResult>;

  reconcile(
    intent: CashOutSettlementIntent
  ): Promise<TreasuryBroadcastReconciliationResult>;
}

function requireSettlementIntent(
  record: CashOutRecord
): CashOutSettlementIntent {
  const intent = record.settlementIntent;

  if (!intent) {
    throw new Error(
      'Cash-out settlement lifecycle requires a durable D3 settlement intent.'
    );
  }

  return intent;
}

function getPositiveOutcome(
  reconciliation: TreasuryBroadcastReconciliationResult | undefined
): 'confirmed' | 'mempool' | undefined {
  if (reconciliation?.status === 'confirmed') {
    return 'confirmed';
  }

  if (reconciliation?.status === 'mempool') {
    return 'mempool';
  }

  return undefined;
}

function getUnresolvedOutcome(
  record: CashOutRecord
):
  | 'broadcasted_pending_detection'
  | 'uncertain'
  | 'blocked'
  | 'definitely_not_broadcast' {
  switch (record.settlementBroadcast?.status) {
    case 'broadcasted':
      return 'broadcasted_pending_detection';

    case 'uncertain':
      return 'uncertain';

    case 'blocked':
      return 'blocked';

    case 'definitely_not_broadcast':
      return 'definitely_not_broadcast';

    default:
      throw new Error(
        'Cash-out settlement has no persisted broadcast state from which to determine its unresolved outcome.'
      );
  }
}

async function requireStoredBroadcast(
  recordId: string,
  broadcast: TreasuryBroadcastResult,
  dependencies: CashOutSettlementNetworkLifecycleDependencies
): Promise<CashOutRecord> {
  const stored = await dependencies.storeBroadcast(recordId, broadcast);

  if (!stored) {
    throw new Error(
      'Cash-out disappeared while saving settlement broadcast state.'
    );
  }

  return stored;
}

async function requireStoredReconciliation(
  recordId: string,
  reconciliation: TreasuryBroadcastReconciliationResult,
  dependencies: CashOutSettlementNetworkLifecycleDependencies
): Promise<CashOutRecord> {
  const stored = await dependencies.storeReconciliation(
    recordId,
    reconciliation
  );

  if (!stored) {
    throw new Error(
      'Cash-out disappeared while saving settlement reconciliation state.'
    );
  }

  return stored;
}

/**
 * Advance ONE normal Cash-out settlement operation using only the exact
 * transaction which already crossed the D3 write-ahead boundary.
 *
 * This function never:
 *
 * - builds a transaction;
 * - signs a transaction;
 * - replaces a transaction;
 * - changes the selected source outpoint;
 * - marks the Cash-out completed;
 * - decides that physical cash may be handed to the customer.
 *
 * D5 owns the later merchant-safe lifecycle boundary.
 */
export async function advanceCashOutSettlementNetworkLifecycleWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementNetworkLifecycleDependencies
): Promise<CashOutSettlementNetworkLifecycleResult> {
  let record = await dependencies.getCashOutRecordById(cashOutId);

  if (!record) {
    throw new Error('Cash-out record could not be found.');
  }

  const intent = requireSettlementIntent(record);

  const action = getCashOutSettlementRecoveryAction(record);

  /**
   * Positive network evidence already exists, or a persisted blocked
   * precondition explicitly forbids automatic retry.
   */
  if (action === 'none') {
    const positiveOutcome = getPositiveOutcome(record.settlementReconciliation);

    if (positiveOutcome) {
      return {
        record,

        outcome: positiveOutcome,

        ...(record.settlementReconciliation
          ? {
              reconciliation: record.settlementReconciliation,
            }
          : {}),
      };
    }

    if (record.settlementBroadcast?.status === 'blocked') {
      return {
        record,

        outcome: 'blocked',

        broadcast: record.settlementBroadcast,
      };
    }

    throw new Error(
      'Cash-out settlement recovery policy returned no action without positive network evidence or a blocking precondition.'
    );
  }

  /**
   * Submission definitely happened or may have happened.
   *
   * Read-only reconciliation of the SAME deterministic txid is now the only
   * permitted network operation.
   */
  if (action === 'check_same_transaction') {
    const reconciliation = await dependencies.reconcile(intent);

    record = await requireStoredReconciliation(
      record.id,
      reconciliation,
      dependencies
    );

    const persistedReconciliation = record.settlementReconciliation;

    const positiveOutcome = getPositiveOutcome(persistedReconciliation);

    if (positiveOutcome) {
      return {
        record,

        outcome: positiveOutcome,

        ...(record.settlementBroadcast
          ? {
              broadcast: record.settlementBroadcast,
            }
          : {}),

        ...(persistedReconciliation
          ? {
              reconciliation: persistedReconciliation,
            }
          : {}),
      };
    }

    return {
      record,

      outcome: getUnresolvedOutcome(record),

      ...(record.settlementBroadcast
        ? {
            broadcast: record.settlementBroadcast,
          }
        : {}),

      ...(persistedReconciliation
        ? {
            reconciliation: persistedReconciliation,
          }
        : {}),
    };
  }

  /**
   * The recovery policy has positively determined that submission of the SAME
   * persisted D3 transaction is permitted.
   */
  const broadcast = await dependencies.broadcast(intent);

  record = await requireStoredBroadcast(record.id, broadcast, dependencies);

  if (broadcast.status === 'blocked') {
    return {
      record,

      outcome: 'blocked',

      broadcast,
    };
  }

  if (broadcast.status === 'definitely_not_broadcast') {
    return {
      record,

      outcome: 'definitely_not_broadcast',

      broadcast,
    };
  }

  /**
   * Both broadcasted and uncertain require immediate reconciliation of the
   * SAME deterministic transaction.
   */
  const reconciliation = await dependencies.reconcile(intent);

  record = await requireStoredReconciliation(
    record.id,
    reconciliation,
    dependencies
  );

  const persistedReconciliation = record.settlementReconciliation;

  const positiveOutcome = getPositiveOutcome(persistedReconciliation);

  if (positiveOutcome) {
    return {
      record,

      outcome: positiveOutcome,

      broadcast,

      ...(persistedReconciliation
        ? {
            reconciliation: persistedReconciliation,
          }
        : {}),
    };
  }

  return {
    record,

    outcome: getUnresolvedOutcome(record),

    broadcast,

    ...(persistedReconciliation
      ? {
          reconciliation: persistedReconciliation,
        }
      : {}),
  };
}

/**
 * Production entry point.
 *
 * Heavy BCH/network modules are deliberately loaded only when this lifecycle
 * is actually invoked. This also keeps injected D4F tests independent from
 * the project's current Node 18 Electrum/libauth loader limitations.
 */
export async function advanceCashOutSettlementNetworkLifecycle(
  cashOutId: string
): Promise<CashOutSettlementNetworkLifecycleResult> {
  const [broadcastModule, reconciliationModule] = await Promise.all([
    import('src/services/cash-out-settlement-broadcast'),

    import('src/services/cash-out-settlement-reconciliation'),
  ]);

  return advanceCashOutSettlementNetworkLifecycleWithDependencies(cashOutId, {
    getCashOutRecordById,

    storeBroadcast: storeCashOutSettlementBroadcast,

    storeReconciliation: storeCashOutSettlementReconciliation,

    broadcast: broadcastModule.broadcastCashOutSettlementIntent,

    reconcile: reconciliationModule.reconcileCashOutSettlementIntent,
  });
}
