import { storeCashOutSettlementRecoveryBroadcast } from './cash-out-settlement-recovery-store';

import { getCashOutRecordById } from 'src/services/cash-out-store';

import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';

import type { CashOutSettlementBroadcastResult } from 'src/types/cash-out-settlement';

import type { CashOutRecord } from 'src/types/cash-out';

export type CashOutSettlementRecoveryRestartAction =
  | 'not_prepared'
  | 'resume_same_transaction'
  | 'check_same_transaction'
  | 'retry_same_transaction'
  | 'network_observed';

export interface CashOutSettlementRecoveryRestartState {
  action: CashOutSettlementRecoveryRestartAction;

  /**
   * Exact durable transaction ID when a recovery transaction has already
   * crossed the D6E write-ahead boundary.
   */
  txid?: string;

  /**
   * Recovery restart logic may never construct or sign another transaction.
   */
  mayConstructNewTransaction: false;

  message: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function validateRecoveryNetworkIdentity(record: CashOutRecord): void {
  const intent = record.recoveryIntent;

  if (!intent) {
    return;
  }

  const expectedTxid = normalize(intent.txid);

  if (
    record.recoveryBroadcast?.txid &&
    normalize(record.recoveryBroadcast.txid) !== expectedTxid
  ) {
    throw new Error(
      'Cash-out recovery broadcast state belongs to a different transaction.'
    );
  }

  if (
    record.recoveryReconciliation &&
    normalize(record.recoveryReconciliation.txid) !== expectedTxid
  ) {
    throw new Error(
      'Cash-out recovery reconciliation state belongs to a different transaction.'
    );
  }
}

/**
 * Pure D6G restart/re-entry policy.
 *
 * This decides what may safely happen after an app restart or merchant
 * re-entry.
 *
 * It performs no network access and no persistence.
 */
export function resolveCashOutSettlementRecoveryRestartState(
  record: CashOutRecord
): CashOutSettlementRecoveryRestartState {
  validateRecoveryNetworkIdentity(record);

  const intent = record.recoveryIntent;

  if (!intent) {
    return {
      action: 'not_prepared',

      mayConstructNewTransaction: false,

      message: 'No durable Cash-out recovery transaction has been prepared.',
    };
  }

  const txid = normalize(intent.txid);

  const reconciliation = record.recoveryReconciliation;

  /**
   * Positive evidence wins permanently for broadcast/restart purposes.
   */
  if (
    reconciliation?.status === 'mempool' ||
    reconciliation?.status === 'confirmed'
  ) {
    return {
      action: 'network_observed',

      txid,

      mayConstructNewTransaction: false,

      message:
        'The exact recovery transaction already has positive BCH network evidence.',
    };
  }

  const broadcast = record.recoveryBroadcast;

  /**
   * No submission result exists.
   *
   * The exact transaction is durable, but no request is known to have begun.
   */
  if (!broadcast) {
    return {
      action: 'resume_same_transaction',

      txid,

      mayConstructNewTransaction: false,

      message: 'The exact durable recovery transaction may be submitted.',
    };
  }

  /**
   * A blocked attempt or transport-start failure proves that the BCH
   * transaction submission request did not begin.
   *
   * Retrying means submitting the SAME persisted raw transaction.
   */
  if (broadcast.requestAttempted === false) {
    return {
      action: 'resume_same_transaction',

      txid,

      mayConstructNewTransaction: false,

      message:
        'The previous attempt did not submit the transaction. The same durable recovery transaction may be resumed.',
    };
  }

  /**
   * A request began.
   *
   * If the app crashed before reconciliation was durably written, always
   * reconcile first. Never infer that the transaction failed.
   */
  if (!reconciliation) {
    return {
      action: 'check_same_transaction',

      txid,

      mayConstructNewTransaction: false,

      message:
        'A recovery broadcast request previously began. Check the exact persisted transaction ID before any retry.',
    };
  }

  /**
   * Narrow same-transaction retry exception.
   *
   * D4/D6F classified the server response specifically as input_unavailable,
   * and a subsequent successful reconciliation check positively reported that
   * this exact txid is still unknown.
   *
   * This still does NOT permit:
   *
   * - another transaction;
   * - another input set;
   * - another fee;
   * - another signature;
   * - another txid.
   */
  if (
    broadcast.explicitRejection?.retrySameTransaction === true &&
    reconciliation.status === 'unknown'
  ) {
    return {
      action: 'retry_same_transaction',

      txid,

      mayConstructNewTransaction: false,

      message:
        'The exact recovery transaction is not currently visible and the previous explicit rejection permits retrying those same persisted bytes.',
    };
  }

  /**
   * unavailable is deliberately NOT enough to authorize a retry.
   *
   * It means we failed to establish current network state, so the safe action
   * remains another read-only check.
   *
   * Generic uncertain/broadcasted outcomes also remain check-only.
   */
  return {
    action: 'check_same_transaction',

    txid,

    mayConstructNewTransaction: false,

    message:
      'The exact durable recovery transaction must be reconciled before any further submission decision.',
  };
}

export interface CashOutSettlementRecoveryRestartDependencies {
  getCashOutRecordById(cashOutId: string): Promise<CashOutRecord | undefined>;

  resumeRecovery(cashOutId: string): Promise<CashOutRecord>;

  checkRecovery(cashOutId: string): Promise<CashOutRecord>;

  broadcastRecoveryIntent(
    intent: CashOutSettlementRecoverySignedTransactionArtifact
  ): Promise<CashOutSettlementBroadcastResult>;

  storeRecoveryBroadcast(
    cashOutId: string,
    broadcast: CashOutSettlementBroadcastResult
  ): Promise<CashOutRecord | undefined>;
}

const DEFAULT_DEPENDENCIES: CashOutSettlementRecoveryRestartDependencies = {
  getCashOutRecordById,

  /**
   * Load the runtime broadcast layer only when a real recovery network action
   * is actually requested.
   *
   * This keeps the pure D6G restart-policy boundary importable under the
   * project's Node 18 / tsx test environment without eagerly loading
   * @bitauth/libauth.
   */
  resumeRecovery: async (cashOutId) => {
    const { broadcastAndReconcileCashOutSettlementRecovery } = await import(
      './cash-out-settlement-recovery-broadcast'
    );

    return broadcastAndReconcileCashOutSettlementRecovery(cashOutId);
  },

  checkRecovery: async (cashOutId) => {
    const { reconcileAndStoreCashOutSettlementRecovery } = await import(
      './cash-out-settlement-recovery-broadcast'
    );

    return reconcileAndStoreCashOutSettlementRecovery(cashOutId);
  },

  broadcastRecoveryIntent: async (intent) => {
    const { broadcastCashOutSettlementRecoveryIntent } = await import(
      './cash-out-settlement-recovery-broadcast'
    );

    return broadcastCashOutSettlementRecoveryIntent(intent);
  },

  storeRecoveryBroadcast: storeCashOutSettlementRecoveryBroadcast,
};

/**
 * Deliberately retry the SAME durable recovery transaction after the narrow
 * input_unavailable + exact-txid-unknown condition has been established.
 *
 * This function receives the already-persisted recoveryIntent.
 *
 * It never reconstructs or signs a transaction.
 */
async function retrySameRecoveryTransaction(
  record: CashOutRecord,
  dependencies: CashOutSettlementRecoveryRestartDependencies
): Promise<CashOutRecord> {
  const intent = record.recoveryIntent;

  if (!intent) {
    throw new Error(
      'Cash-out recovery retry requires a durable recovery intent.'
    );
  }

  const broadcast = await dependencies.broadcastRecoveryIntent(intent);

  const stored = await dependencies.storeRecoveryBroadcast(
    record.id,
    broadcast
  );

  if (!stored) {
    throw new Error(
      'Cash-out record could not be found while saving the recovery retry result.'
    );
  }

  /**
   * If no network submission request began, there is nothing to reconcile.
   */
  if (!broadcast.requestAttempted) {
    return stored;
  }

  /**
   * Once the retry request begins, revert immediately to exact-txid
   * reconciliation.
   */
  return dependencies.checkRecovery(record.id);
}

/**
 * D6G production-shaped restart/re-entry operation.
 *
 * The pure resolver above determines which action is allowed.
 *
 * No branch ever constructs or signs another recovery transaction.
 */
export async function resumeCashOutSettlementRecoveryWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementRecoveryRestartDependencies
): Promise<CashOutRecord> {
  const current = await dependencies.getCashOutRecordById(cashOutId);

  if (!current) {
    throw new Error(
      'Cash-out record could not be found while resuming exceptional recovery.'
    );
  }

  const restartState = resolveCashOutSettlementRecoveryRestartState(current);

  switch (restartState.action) {
    case 'not_prepared':
      throw new Error(
        'Cash-out recovery cannot be resumed because no durable recovery transaction exists.'
      );

    case 'network_observed':
      return current;

    case 'resume_same_transaction':
      return dependencies.resumeRecovery(cashOutId);

    case 'check_same_transaction':
      return dependencies.checkRecovery(cashOutId);

    case 'retry_same_transaction':
      return retrySameRecoveryTransaction(current, dependencies);
  }
}

export async function resumeCashOutSettlementRecovery(
  cashOutId: string
): Promise<CashOutRecord> {
  return resumeCashOutSettlementRecoveryWithDependencies(
    cashOutId,
    DEFAULT_DEPENDENCIES
  );
}
