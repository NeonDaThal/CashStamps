import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import { applyCashOutSettlementIntent } from 'src/services/cash-out-settlement-intent';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

/**
 * Atomically cross the normal Cash-out settlement write-ahead boundary.
 *
 * This settlement-specific service is deliberately separate from the general
 * Cash-out store because settlement validation imports BCH transaction
 * primitives such as libauth.
 *
 * Keeping that dependency here prevents unrelated consumers of
 * cash-out-store.ts — including Merchant Reports — from loading the BCH
 * transaction stack merely to read Cash-out records.
 *
 * Same transaction:
 *   idempotent.
 *
 * Different second transaction:
 *   permanently rejected.
 */
export async function storeCashOutSettlementIntent(
  cashOutId: string,
  intent: CashOutSettlementIntent
): Promise<CashOutRecord | undefined> {
  return mutateCashOutRecordAtomically(cashOutId, (existingRecord) => {
    const settlementRecord = applyCashOutSettlementIntent(
      existingRecord,
      intent
    );

    if (settlementRecord === existingRecord) {
      return existingRecord;
    }

    return {
      ...settlementRecord,

      updatedAt: intent.preparedAt,
    };
  });
}
