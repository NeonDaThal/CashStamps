import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';

import type { CashOutRecord } from 'src/types/cash-out';

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
