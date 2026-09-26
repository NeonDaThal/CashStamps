import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

export type CashOutCashHandoverDecisionReason =
  | 'ready'
  | 'already_completed'
  | 'cash_out_not_received'
  | 'settlement_not_safe';

export interface CashOutCashHandoverDecision {
  allowed: boolean;

  reason: CashOutCashHandoverDecisionReason;

  merchantSafety: ReturnType<typeof evaluateCashOutSettlementMerchantSafety>;

  message: string;
}

export interface CashOutCashHandoverConfirmation {
  /**
   * This literal confirmation is intentionally explicit.
   *
   * Calling code must state that the merchant has physically handed the cash
   * to the customer. Settlement evidence by itself must never complete a
   * Cash-out.
   */
  merchantConfirmedCashHandedOver: true;

  confirmedAt: string;
}

function validateTimestamp(value: string, fieldName: string): void {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error(`${fieldName} must be a valid timestamp.`);
  }
}

/**
 * Answer the human/business question:
 *
 * "May the merchant hand over the physical cash now?"
 *
 * This does not mutate anything.
 */
export function evaluateCashOutCashHandover(
  cashOut: CashOutRecord
): CashOutCashHandoverDecision {
  const merchantSafety = evaluateCashOutSettlementMerchantSafety(cashOut);

  /**
   * completed means the merchant already confirmed that physical cash was
   * handed over.
   *
   * Never present this record as authorising another payout.
   */
  if (cashOut.status === 'completed') {
    return {
      allowed: false,

      reason: 'already_completed',

      merchantSafety,

      message:
        'This Cash-out has already been completed. Do not hand over cash again.',
    };
  }

  /**
   * Normal cash handover belongs only to the received -> completed boundary.
   */
  if (cashOut.status !== 'received') {
    return {
      allowed: false,

      reason: 'cash_out_not_received',

      merchantSafety,

      message: 'Cash may only be handed over for a received Cash-out.',
    };
  }

  if (!merchantSafety.safeToHandCash) {
    return {
      allowed: false,

      reason: 'settlement_not_safe',

      merchantSafety,

      message:
        'Settlement safety requirements have not been satisfied. Do not hand over cash.',
    };
  }

  return {
    allowed: true,

    reason: 'ready',

    merchantSafety,

    message:
      'Settlement evidence is sufficient for the merchant to hand over cash.',
  };
}

/**
 * Pure D5E business transition.
 *
 * IMPORTANT:
 *
 * This function represents the merchant confirming AFTER physically handing
 * cash to the customer.
 *
 * It does not:
 *
 * - perform network calls;
 * - perform settlement;
 * - alter Cash on Hand;
 * - create report movements;
 * - print a receipt.
 *
 * D5F will separately reconcile completed Cash-outs into Cash-on-Hand
 * accounting.
 */
export function applyCashOutCashHandoverConfirmation(
  cashOut: CashOutRecord,
  confirmation: CashOutCashHandoverConfirmation
): CashOutRecord {
  if (confirmation.merchantConfirmedCashHandedOver !== true) {
    throw new Error(
      'Explicit merchant confirmation that cash was handed over is required.'
    );
  }

  /**
   * Duplicate merchant presses after a successful completion must not create a
   * second business event or rewrite completedAt.
   */
  if (cashOut.status === 'completed') {
    return cashOut;
  }

  const decision = evaluateCashOutCashHandover(cashOut);

  if (!decision.allowed) {
    throw new Error(
      `Cash handover is blocked: ${decision.reason}. ${decision.message}`
    );
  }

  validateTimestamp(confirmation.confirmedAt, 'Cash handover confirmedAt');

  return {
    ...cashOut,

    status: 'completed',

    completedAt: confirmation.confirmedAt,

    updatedAt: confirmation.confirmedAt,
  };
}
