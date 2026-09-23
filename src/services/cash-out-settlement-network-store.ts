import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import {
  applyCashOutSettlementBroadcast,
  applyCashOutSettlementReconciliation,
} from 'src/services/cash-out-settlement-broadcast-state';

import type { CashOutRecord } from 'src/types/cash-out';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

export interface CashOutSettlementNetworkStoreDependencies {
  mutateCashOutRecordAtomically(
    id: string,
    updater: (record: CashOutRecord) => CashOutRecord
  ): Promise<CashOutRecord | undefined>;
}

const DEFAULT_DEPENDENCIES: CashOutSettlementNetworkStoreDependencies = {
  mutateCashOutRecordAtomically,
};

/**
 * Atomically persist one broadcast result for the ONE exact D3 settlement
 * transaction.
 *
 * Validation and persistence happen under the existing Cash-out mutation
 * queue, so another record mutation cannot race between them.
 */
export async function storeCashOutSettlementBroadcastWithDependencies(
  cashOutId: string,
  broadcast: TreasuryBroadcastResult,
  dependencies: CashOutSettlementNetworkStoreDependencies
): Promise<CashOutRecord | undefined> {
  return dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (existingRecord) => {
      const settlementRecord = applyCashOutSettlementBroadcast(
        existingRecord,
        broadcast
      );

      if (settlementRecord === existingRecord) {
        return existingRecord;
      }

      return {
        ...settlementRecord,

        updatedAt: broadcast.attemptedAt,
      };
    }
  );
}

export async function storeCashOutSettlementBroadcast(
  cashOutId: string,
  broadcast: TreasuryBroadcastResult
): Promise<CashOutRecord | undefined> {
  return storeCashOutSettlementBroadcastWithDependencies(
    cashOutId,
    broadcast,
    DEFAULT_DEPENDENCIES
  );
}

/**
 * Atomically persist read-only network evidence for the ONE exact deterministic
 * settlement txid.
 *
 * applyCashOutSettlementReconciliation() owns the monotonic-evidence rule:
 *
 * confirmed > mempool > unknown > unavailable
 *
 * If weaker evidence is rejected as a downgrade, this function also avoids
 * rewriting updatedAt.
 */
export async function storeCashOutSettlementReconciliationWithDependencies(
  cashOutId: string,
  reconciliation: TreasuryBroadcastReconciliationResult,
  dependencies: CashOutSettlementNetworkStoreDependencies
): Promise<CashOutRecord | undefined> {
  return dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (existingRecord) => {
      const settlementRecord = applyCashOutSettlementReconciliation(
        existingRecord,
        reconciliation
      );

      if (settlementRecord === existingRecord) {
        return existingRecord;
      }

      return {
        ...settlementRecord,

        updatedAt: reconciliation.checkedAt,
      };
    }
  );
}

export async function storeCashOutSettlementReconciliation(
  cashOutId: string,
  reconciliation: TreasuryBroadcastReconciliationResult
): Promise<CashOutRecord | undefined> {
  return storeCashOutSettlementReconciliationWithDependencies(
    cashOutId,
    reconciliation,
    DEFAULT_DEPENDENCIES
  );
}
