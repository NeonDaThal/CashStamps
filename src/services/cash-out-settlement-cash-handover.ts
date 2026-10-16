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
 * Shared physical-cash business transition.
 *
 * IMPORTANT:
 *
 * This function does NOT decide whether BCH settlement/recovery is safe.
 *
 * Its caller must already have established the appropriate safety condition:
 *
 * - normal settlement safety for the D5 path; or
 * - confirmed exceptional-recovery safety for the D6 path.
 *
 * This function represents only the human/business event:
 *
 * "The merchant has physically handed the agreed cash to the customer."
 *
 * It remains deliberately independent of:
 *
 * - normal settlement evidence;
 * - exceptional recovery evidence;
 * - network calls;
 * - Cash on Hand;
 * - reports;
 * - receipt printing.
 */
export function applyCashOutPhysicalCashHandoverConfirmation(
  cashOut: CashOutRecord,
  confirmation: CashOutCashHandoverConfirmation
): CashOutRecord {
  if (confirmation.merchantConfirmedCashHandedOver !== true) {
    throw new Error(
      'Explicit merchant confirmation that cash was handed over is required.'
    );
  }

  /**
   * Duplicate merchant confirmation after completion is idempotent.
   *
   * In particular, completedAt must never be replaced by a later retry.
   */
  if (cashOut.status === 'completed') {
    return cashOut;
  }

  /**
   * Every physical completion path, whether normal settlement or exceptional
   * recovery, must cross the same received -> completed boundary.
   *
   * Recovery must therefore first persist its confirmed BCH-side result as
   * received before physical cash can be completed.
   */
  if (cashOut.status !== 'received') {
    throw new Error(
      'Physical cash handover may only complete a received Cash-out.'
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

/**
 * Pure D5E NORMAL-settlement business transition.
 *
 * This remains the normal Cash-out path.
 *
 * Normal settlement safety is checked first. Only after D5 considers the exact
 * deterministic normal settlement safe does execution enter the shared
 * physical-cash transition.
 *
 * Exceptional recovery must NOT call this function because its safety evidence
 * is different. D6 will use its own recovery-safety boundary and then call the
 * same shared physical-cash transition.
 */
export function applyCashOutCashHandoverConfirmation(
  cashOut: CashOutRecord,
  confirmation: CashOutCashHandoverConfirmation
): CashOutRecord {
  /**
   * Preserve the existing runtime guard before any other decision.
   */
  if (confirmation.merchantConfirmedCashHandedOver !== true) {
    throw new Error(
      'Explicit merchant confirmation that cash was handed over is required.'
    );
  }

  /**
   * Preserve existing duplicate-confirmation semantics.
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

  return applyCashOutPhysicalCashHandoverConfirmation(cashOut, confirmation);
}
