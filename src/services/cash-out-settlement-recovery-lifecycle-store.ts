import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import { applyConfirmedCashOutSettlementRecoveryToReceived } from 'src/services/cash-out-settlement-recovery-lifecycle';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutSettlementRecoveryLifecycleStoreDependencies {
  mutateCashOutRecordAtomically: (
    id: string,
    updater: (record: CashOutRecord) => CashOutRecord
  ) => Promise<CashOutRecord | undefined>;
}

export interface CashOutSettlementRecoveryLifecycleStoreResult {
  record: CashOutRecord;

  /**
   * True only when this call durably moved a pre-received Cash-out into the
   * received state.
   *
   * Replay after restart therefore returns false.
   */
  advancedToReceivedNow: boolean;
}

const productionDependencies: CashOutSettlementRecoveryLifecycleStoreDependencies =
  {
    mutateCashOutRecordAtomically,
  };

/**
 * D6H.2A
 *
 * Atomically persist the BCH-side exceptional-recovery lifecycle boundary.
 *
 * Confirmed recovery may restore:
 *
 * - awaiting_payment -> received
 * - cancelled       -> received
 * - failed          -> received
 *
 * A Cash-out already at received remains received.
 *
 * completed is terminal and is never reopened.
 *
 * This operation deliberately does NOT:
 *
 * - complete the Cash-out;
 * - imply physical cash was handed over;
 * - alter Cash on Hand;
 * - create reporting/accounting movements;
 * - perform network calls;
 * - broadcast anything.
 *
 * The D6F/D6G durable reconciliation evidence must already exist.
 */
export async function reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementRecoveryLifecycleStoreDependencies
): Promise<CashOutSettlementRecoveryLifecycleStoreResult> {
  let advancedToReceivedNow = false;

  const stored = await dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (current) => {
      const previousStatus = current.status;

      const next = applyConfirmedCashOutSettlementRecoveryToReceived(current);

      advancedToReceivedNow =
        previousStatus !== 'received' &&
        previousStatus !== 'completed' &&
        next.status === 'received';

      return next;
    }
  );

  if (!stored) {
    throw new Error(
      'Cash-out disappeared while confirmed exceptional recovery lifecycle was being persisted.'
    );
  }

  return {
    record: stored,

    advancedToReceivedNow,
  };
}

export async function reconcileConfirmedCashOutSettlementRecoveryLifecycle(
  cashOutId: string
): Promise<CashOutSettlementRecoveryLifecycleStoreResult> {
  return reconcileConfirmedCashOutSettlementRecoveryLifecycleWithDependencies(
    cashOutId,
    productionDependencies
  );
}
