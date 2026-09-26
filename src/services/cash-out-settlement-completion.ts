import { confirmCashOutCashHandover } from 'src/services/cash-out-settlement-cash-handover-store';

import { reconcileCompletedCashOutAccounting } from 'src/services/cash-out-settlement-accounting';

import type { CashOutCashHandoverConfirmation } from 'src/services/cash-out-settlement-cash-handover';

import type { CashOutCashHandoverConfirmationResult } from 'src/services/cash-out-settlement-cash-handover-store';

import type { CashOutSettlementAccountingResult } from 'src/services/cash-out-settlement-accounting';

export interface CashOutSettlementCompletionDependencies {
  confirmCashHandover: (
    cashOutId: string,
    confirmation: CashOutCashHandoverConfirmation
  ) => Promise<CashOutCashHandoverConfirmationResult>;

  reconcileAccounting: (
    cashOutId: string
  ) => Promise<CashOutSettlementAccountingResult>;
}

export interface CashOutSettlementCompletionResult {
  handover: CashOutCashHandoverConfirmationResult;

  accounting: CashOutSettlementAccountingResult;
}

const productionDependencies: CashOutSettlementCompletionDependencies = {
  confirmCashHandover: confirmCashOutCashHandover,

  reconcileAccounting: reconcileCompletedCashOutAccounting,
};

/**
 * D5F — complete one merchant-confirmed Cash-out and reconcile its local cash
 * accounting.
 *
 * Ordering is intentionally asymmetric:
 *
 * 1. Persist `completed` first.
 * 2. Reconcile Cash on Hand second.
 *
 * The completed Cash-out is the authoritative durable business event.
 *
 * If the application crashes after step 1, replay repairs the missing
 * Cash-on-Hand movement.
 *
 * If the application crashes after step 2 but before success reaches the UI,
 * replay sees the already-completed Cash-out and the existing idempotent
 * cash_out_paid movement, so no second payout/accounting event is created.
 */
export async function completeCashOutSettlementWithDependencies(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation,
  dependencies: CashOutSettlementCompletionDependencies
): Promise<CashOutSettlementCompletionResult> {
  const handover = await dependencies.confirmCashHandover(
    cashOutId,
    confirmation
  );

  if (handover.record.status !== 'completed') {
    throw new Error(
      'Cash-out completion did not persist before accounting reconciliation.'
    );
  }

  const accounting = await dependencies.reconcileAccounting(cashOutId);

  /**
   * These results would contradict the successfully persisted completed
   * business event.
   */
  if (accounting.status === 'missing_cash_out') {
    throw new Error(
      'Completed Cash-out disappeared before accounting reconciliation.'
    );
  }

  if (accounting.status === 'not_completed') {
    throw new Error(
      'Cash-out accounting observed a non-completed record after completion was persisted.'
    );
  }

  /**
   * `cash_on_hand_not_set_up` is valid.
   *
   * Cash on Hand is optional local accounting and must never make an otherwise
   * valid physical Cash-out incomplete.
   */
  return {
    handover,
    accounting,
  };
}

export async function completeCashOutSettlement(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation
): Promise<CashOutSettlementCompletionResult> {
  return completeCashOutSettlementWithDependencies(
    cashOutId,
    confirmation,
    productionDependencies
  );
}
