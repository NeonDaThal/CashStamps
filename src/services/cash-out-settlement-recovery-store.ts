import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementBroadcastResult } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Determine whether two durable recovery artifacts represent the exact same
 * signed transaction and recovery authorization.
 *
 * preparedAt is deliberately NOT part of transaction identity.
 *
 * Two concurrent/re-entrant preparations may independently produce the same
 * deterministic transaction with different in-memory timestamps. In that case
 * the already-persisted artifact remains authoritative.
 */
function isSameRecoveryIntent(
  existing: CashOutSettlementRecoverySignedTransactionArtifact,
  incoming: CashOutSettlementRecoverySignedTransactionArtifact
): boolean {
  return (
    existing.version === incoming.version &&
    existing.cashOutId === incoming.cashOutId &&
    normalize(existing.contractAddress) ===
      normalize(incoming.contractAddress) &&
    existing.inputSetId === incoming.inputSetId &&
    normalize(existing.rawTransactionHex) ===
      normalize(incoming.rawTransactionHex) &&
    normalize(existing.txid) === normalize(incoming.txid) &&
    existing.transactionBytes === incoming.transactionBytes &&
    existing.actualFeeSats === incoming.actualFeeSats &&
    sameJsonValue(existing.signingRequest, incoming.signingRequest) &&
    sameJsonValue(existing.transactionSummary, incoming.transactionSummary)
  );
}

/**
 * Pure D6E.4 record transition.
 *
 * First exact recovery transaction:
 *   attach it.
 *
 * Same exact recovery transaction again:
 *   idempotent no-op.
 *
 * Different second recovery transaction:
 *   reject permanently.
 */
export function applyCashOutSettlementRecoveryIntent(
  record: CashOutRecord,
  intent: CashOutSettlementRecoverySignedTransactionArtifact
): CashOutRecord {
  if (intent.cashOutId !== record.id) {
    throw new Error(
      'Cash-out recovery intent belongs to a different Cash-out record.'
    );
  }

  const existing = record.recoveryIntent;

  if (!existing) {
    return {
      ...record,

      recoveryIntent: intent,
    };
  }

  if (isSameRecoveryIntent(existing, intent)) {
    return record;
  }

  throw new Error(
    'Cash-out already has a different durable recovery transaction.'
  );
}

/**
 * Atomically cross the exceptional Cash-out recovery write-ahead boundary.
 *
 * This uses the same serialized Cash-out mutation queue as the rest of the
 * record store.
 *
 * This function never broadcasts.
 */
export async function storeCashOutSettlementRecoveryIntent(
  cashOutId: string,
  intent: CashOutSettlementRecoverySignedTransactionArtifact
): Promise<CashOutRecord | undefined> {
  return mutateCashOutRecordAtomically(
    cashOutId,

    (record) => {
      const next = applyCashOutSettlementRecoveryIntent(record, intent);

      if (next === record) {
        return record;
      }

      return {
        ...next,

        updatedAt: new Date().toISOString(),
      };
    }
  );
}

function recoveryReconciliationStrength(
  status: TreasuryBroadcastReconciliationResult['status']
): number {
  switch (status) {
    case 'confirmed':
      return 4;

    case 'mempool':
      return 3;

    case 'unknown':
      return 2;

    case 'unavailable':
      return 1;

    default:
      return 0;
  }
}

/**
 * Apply one network-submission result to the exact durable recovery
 * transaction.
 *
 * A broadcast result may never refer to another txid.
 *
 * Once the exact recovery transaction has positive mempool/confirmed evidence,
 * another broadcast attempt is not permitted through this state boundary.
 */
export function applyCashOutSettlementRecoveryBroadcast(
  record: CashOutRecord,
  broadcast: CashOutSettlementBroadcastResult
): CashOutRecord {
  const intent = record.recoveryIntent;

  if (!intent) {
    throw new Error(
      'Cash-out recovery broadcast requires a durable recovery intent.'
    );
  }

  const broadcastTxid =
    typeof broadcast.txid === 'string' ? normalize(broadcast.txid) : '';

  if (
    !/^[0-9a-f]{64}$/.test(broadcastTxid) ||
    broadcastTxid !== normalize(intent.txid)
  ) {
    throw new Error(
      'Cash-out recovery broadcast result does not match the durable recovery transaction ID.'
    );
  }

  if (
    record.recoveryReconciliation?.status === 'mempool' ||
    record.recoveryReconciliation?.status === 'confirmed'
  ) {
    throw new Error(
      'Cash-out recovery transaction already has positive network evidence and must not be broadcast again.'
    );
  }

  return {
    ...record,

    recoveryBroadcast: broadcast,
  };
}

/**
 * Persist one reconciliation result for the exact durable recovery txid.
 *
 * Stronger evidence is monotonic and cannot later be downgraded.
 */
export function applyCashOutSettlementRecoveryReconciliation(
  record: CashOutRecord,
  reconciliation: TreasuryBroadcastReconciliationResult
): CashOutRecord {
  const intent = record.recoveryIntent;

  if (!intent) {
    throw new Error(
      'Cash-out recovery reconciliation requires a durable recovery intent.'
    );
  }

  if (normalize(reconciliation.txid) !== normalize(intent.txid)) {
    throw new Error(
      'Cash-out recovery reconciliation does not match the durable recovery transaction ID.'
    );
  }

  const existing = record.recoveryReconciliation;

  if (
    existing &&
    recoveryReconciliationStrength(existing.status) >
      recoveryReconciliationStrength(reconciliation.status)
  ) {
    return record;
  }

  return {
    ...record,

    recoveryReconciliation: reconciliation,
  };
}

/**
 * Atomically persist the latest broadcast result for the exact durable
 * recovery transaction.
 */
export async function storeCashOutSettlementRecoveryBroadcast(
  cashOutId: string,
  broadcast: CashOutSettlementBroadcastResult
): Promise<CashOutRecord | undefined> {
  return mutateCashOutRecordAtomically(
    cashOutId,

    (record) => {
      const next = applyCashOutSettlementRecoveryBroadcast(record, broadcast);

      if (next === record) {
        return record;
      }

      return {
        ...next,

        updatedAt: broadcast.attemptedAt,
      };
    }
  );
}

/**
 * Atomically persist reconciliation evidence for the exact durable recovery
 * transaction.
 */
export async function storeCashOutSettlementRecoveryReconciliation(
  cashOutId: string,
  reconciliation: TreasuryBroadcastReconciliationResult
): Promise<CashOutRecord | undefined> {
  return mutateCashOutRecordAtomically(
    cashOutId,

    (record) => {
      const next = applyCashOutSettlementRecoveryReconciliation(
        record,
        reconciliation
      );

      if (next === record) {
        return record;
      }

      return {
        ...next,

        updatedAt: reconciliation.checkedAt,
      };
    }
  );
}
