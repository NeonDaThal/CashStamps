import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import {
  applyCashOutSettlementSourceConflictEvidence,
  resolveCashOutSettlementSourceConflictWithConfirmedSettlement,
} from 'src/services/cash-out-settlement-conflict-state';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementSourceConflictEvidence } from 'src/types/cash-out-settlement';

export interface CashOutSettlementConflictStoreDependencies {
  mutateCashOutRecordAtomically: (
    id: string,
    updater: (record: CashOutRecord) => CashOutRecord
  ) => Promise<CashOutRecord | undefined>;
}

const productionDependencies: CashOutSettlementConflictStoreDependencies = {
  mutateCashOutRecordAtomically,
};

/**
 * Persist positive source-conflict evidence atomically.
 *
 * The pure D5D.3a reducer owns conflict-state semantics.
 *
 * This layer owns only:
 *
 * - serialized Cash-out persistence;
 * - updatedAt when durable state actually changes.
 */
export async function storeCashOutSettlementSourceConflictWithDependencies(
  cashOutId: string,
  evidence: CashOutSettlementSourceConflictEvidence,
  dependencies: CashOutSettlementConflictStoreDependencies
): Promise<CashOutRecord | undefined> {
  return dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (current) => {
      const next = applyCashOutSettlementSourceConflictEvidence(
        current,
        evidence
      );

      /**
       * Pure reducer returned the exact same object:
       *
       * this is an idempotent/no-downgrade observation.
       *
       * Do not rewrite IndexedDB and do not move updatedAt.
       */
      if (next === current) {
        return current;
      }

      return {
        ...next,

        updatedAt: evidence.detectedAt,
      };
    }
  );
}

export async function storeCashOutSettlementSourceConflict(
  cashOutId: string,
  evidence: CashOutSettlementSourceConflictEvidence
): Promise<CashOutRecord | undefined> {
  return storeCashOutSettlementSourceConflictWithDependencies(
    cashOutId,
    evidence,
    productionDependencies
  );
}

/**
 * Persist the narrow normal-path conflict resolution:
 *
 * exact deterministic settlement transaction is confirmed.
 */
export async function resolveStoredCashOutSettlementSourceConflictWithDependencies(
  cashOutId: string,
  resolvedAt: string,
  dependencies: CashOutSettlementConflictStoreDependencies
): Promise<CashOutRecord | undefined> {
  return dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (current) => {
      const next =
        resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
          current,
          resolvedAt
        );

      if (next === current) {
        return current;
      }

      return {
        ...next,

        updatedAt: resolvedAt,
      };
    }
  );
}

export async function resolveStoredCashOutSettlementSourceConflict(
  cashOutId: string,
  resolvedAt: string
): Promise<CashOutRecord | undefined> {
  return resolveStoredCashOutSettlementSourceConflictWithDependencies(
    cashOutId,
    resolvedAt,
    productionDependencies
  );
}
