import { getCashOutRecordById } from 'src/services/cash-out-store';

import { recordCashOutPaid } from 'src/services/cash-on-hand-store';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOnHandState } from 'src/types/cash-on-hand';

export interface CashOutSettlementAccountingDependencies {
  getCashOutRecordById: (
    cashOutId: string
  ) => Promise<CashOutRecord | undefined>;

  recordCashOutPaid: (input: {
    relatedRecordId: string;

    amountMinor: number;

    currency: string;

    note?: string;

    createdAt?: string;
  }) => Promise<CashOnHandState | undefined>;
}

export type CashOutSettlementAccountingStatus =
  | 'reconciled'
  | 'cash_on_hand_not_set_up'
  | 'not_completed'
  | 'missing_cash_out';

export interface CashOutSettlementAccountingResult {
  status: CashOutSettlementAccountingStatus;

  cashOut?: CashOutRecord;

  cashOnHandState?: CashOnHandState;
}

const productionDependencies: CashOutSettlementAccountingDependencies = {
  getCashOutRecordById,
  recordCashOutPaid,
};

function validateCompletedCashOutForAccounting(cashOut: CashOutRecord): void {
  if (cashOut.status !== 'completed') {
    throw new Error(
      'Cash-out must be completed before Cash-on-Hand accounting may be reconciled.'
    );
  }

  if (
    !Number.isSafeInteger(cashOut.fiatAmountMinor) ||
    cashOut.fiatAmountMinor <= 0
  ) {
    throw new Error(
      'Completed Cash-out contains an invalid fiat cash payout amount.'
    );
  }

  if (
    typeof cashOut.fiatCurrency !== 'string' ||
    !cashOut.fiatCurrency.trim()
  ) {
    throw new Error('Completed Cash-out contains an invalid fiat currency.');
  }

  if (
    typeof cashOut.completedAt !== 'string' ||
    !cashOut.completedAt.trim() ||
    !Number.isFinite(new Date(cashOut.completedAt).getTime())
  ) {
    throw new Error(
      'Completed Cash-out requires a valid completedAt timestamp before accounting reconciliation.'
    );
  }
}

/**
 * D5F.2 — reconcile one authoritative completed Cash-out into Cash on Hand.
 *
 * The Cash-out record is the durable business event.
 *
 * Therefore:
 *
 * - received does NOT deduct Cash on Hand;
 * - completed DOES require one cash_out_paid movement;
 * - replay after a crash is safe because recordCashOutPaid() is idempotent by
 *   Cash-out relatedRecordId and, after D5F.1, serialized.
 */
export async function reconcileCompletedCashOutAccountingWithDependencies(
  cashOutId: string,
  dependencies: CashOutSettlementAccountingDependencies
): Promise<CashOutSettlementAccountingResult> {
  const cashOut = await dependencies.getCashOutRecordById(cashOutId);

  if (!cashOut) {
    return {
      status: 'missing_cash_out',
    };
  }

  if (cashOut.status !== 'completed') {
    return {
      status: 'not_completed',

      cashOut,
    };
  }

  validateCompletedCashOutForAccounting(cashOut);

  const cashOnHandState = await dependencies.recordCashOutPaid({
    relatedRecordId: cashOut.id,

    amountMinor: cashOut.fiatAmountMinor,

    currency: cashOut.fiatCurrency,

    /**
     * completedAt is the authoritative business-event time.
     *
     * Reconciliation after a later restart must not make the accounting
     * movement look like it happened at restart time.
     */
    createdAt: cashOut.completedAt,

    note: `Cash-out ${cashOut.serial} completed`,
  });

  if (!cashOnHandState) {
    return {
      status: 'cash_on_hand_not_set_up',

      cashOut,
    };
  }

  return {
    status: 'reconciled',

    cashOut,

    cashOnHandState,
  };
}

export async function reconcileCompletedCashOutAccounting(
  cashOutId: string
): Promise<CashOutSettlementAccountingResult> {
  return reconcileCompletedCashOutAccountingWithDependencies(
    cashOutId,
    productionDependencies
  );
}
