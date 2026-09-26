import { validateCashOutSettlementNetworkState } from 'src/services/cash-out-settlement-broadcast-state';

import type { CashOutRecord } from 'src/types/cash-out';

import { evaluateCashOutSettlementSourceConflict } from 'src/services/cash-out-settlement-conflict';

export type CashOutSettlementMerchantSafetyReason =
  | 'settlement_mempool'
  | 'settlement_confirmed'
  | 'cash_out_not_payable'
  | 'cash_out_already_completed'
  | 'missing_customer_payment_txid'
  | 'missing_settlement_intent'
  | 'settlement_cash_out_mismatch'
  | 'settlement_payment_txid_mismatch'
  | 'settlement_source_outpoint_invalid'
  | 'settlement_payment_amount_mismatch'
  | 'missing_settlement_reconciliation'
  | 'settlement_unknown'
  | 'settlement_unavailable'
  | 'settlement_source_conflict'
  | 'invalid_settlement_state';

export interface CashOutSettlementMerchantSafety {
  /**
   * True means the normal contract-settlement evidence is sufficient for the
   * merchant to physically hand over the agreed cash.
   *
   * This does NOT itself complete the Cash-out.
   *
   * The later merchant confirmation remains the boundary which moves:
   *
   * received -> completed
   */
  safeToHandCash: boolean;

  reason: CashOutSettlementMerchantSafetyReason;

  /**
   * Positive settlement evidence which authorised cash handover.
   *
   * Present only when safeToHandCash is true.
   */
  settlementEvidence?: 'mempool' | 'confirmed';

  /**
   * Human-readable diagnostic information.
   *
   * This is intended for developer/audit diagnostics. Merchant-facing wording
   * can be introduced separately when D5 reaches UI integration.
   */
  message: string;
}

function normaliseTransactionId(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    return undefined;
  }

  return normalised;
}

function unsafe(
  reason: Exclude<
    CashOutSettlementMerchantSafetyReason,
    'settlement_mempool' | 'settlement_confirmed'
  >,
  message: string
): CashOutSettlementMerchantSafety {
  return {
    safeToHandCash: false,

    reason,

    message,
  };
}

function safe(
  evidence: 'mempool' | 'confirmed'
): CashOutSettlementMerchantSafety {
  return {
    safeToHandCash: true,

    reason:
      evidence === 'confirmed' ? 'settlement_confirmed' : 'settlement_mempool',

    settlementEvidence: evidence,

    message:
      evidence === 'confirmed'
        ? 'The exact persisted Cash-out settlement transaction is confirmed.'
        : 'The exact persisted Cash-out settlement transaction is visible in the BCH mempool.',
  };
}

/**
 * D5A — normal Cash-out merchant-safe decision.
 *
 * This function is intentionally:
 *
 * - pure;
 * - read-only;
 * - network-free;
 * - store-free;
 * - UI-free.
 *
 * It derives the merchant cash-handover decision from the durable Cash-out
 * evidence produced by D2, D3 and D4.
 *
 * IMPORTANT:
 *
 * safeToHandCash=true does NOT mutate the Cash-out to completed.
 *
 * The merchant must still physically hand over the cash and explicitly confirm
 * that action before the existing received -> completed transition may occur.
 */
export function evaluateCashOutSettlementMerchantSafety(
  cashOut: CashOutRecord
): CashOutSettlementMerchantSafety {
  /**
   * The cash-handover action is valid only while the business lifecycle is
   * waiting for the merchant to perform it.
   *
   * completed must never authorise another payout.
   */
  if (cashOut.status === 'completed') {
    return unsafe(
      'cash_out_already_completed',

      'Cash-out is already completed. Cash must not be handed over again.'
    );
  }

  if (cashOut.status !== 'received') {
    return unsafe(
      'cash_out_not_payable',

      'Cash-out is not in the received state and cannot authorise normal cash handover.'
    );
  }

  /**
   * The customer transaction recorded by the Cash-out must be concrete and
   * canonical before it can be compared with the D3 settlement source.
   */
  const receivedTxid = normaliseTransactionId(cashOut.receivedTxid);

  if (!receivedTxid) {
    return unsafe(
      'missing_customer_payment_txid',

      'Cash-out does not contain a valid customer payment transaction ID.'
    );
  }

  const intent = cashOut.settlementIntent;

  if (!intent) {
    return unsafe(
      'missing_settlement_intent',

      'The deterministic settlement transaction has not been durably prepared.'
    );
  }

  /**
   * The D3 write-ahead intent must belong to this exact Cash-out.
   */
  if (
    intent.cashOutId !== cashOut.id ||
    intent.cashOutSerial !== cashOut.serial
  ) {
    return unsafe(
      'settlement_cash_out_mismatch',

      'The persisted settlement intent does not belong to this Cash-out.'
    );
  }

  const sourcePaymentTxid = normaliseTransactionId(intent.sourcePaymentTxid);

  if (!sourcePaymentTxid || sourcePaymentTxid !== receivedTxid) {
    return unsafe(
      'settlement_payment_txid_mismatch',

      'The settlement source transaction does not match the customer payment recorded for this Cash-out.'
    );
  }

  if (
    !Number.isSafeInteger(intent.sourceOutpointIndex) ||
    intent.sourceOutpointIndex < 0
  ) {
    return unsafe(
      'settlement_source_outpoint_invalid',

      'The persisted settlement source output index is invalid.'
    );
  }

  /**
   * Normal settlement requires exactly one customer UTXO with exactly the
   * frozen Cash-out payment amount.
   */
  if (
    !Number.isSafeInteger(intent.sourceValueSats) ||
    intent.sourceValueSats <= 0 ||
    !Number.isSafeInteger(cashOut.bchSatsRequired) ||
    cashOut.bchSatsRequired <= 0 ||
    intent.sourceValueSats !== cashOut.bchSatsRequired
  ) {
    return unsafe(
      'settlement_payment_amount_mismatch',

      'The selected settlement source does not equal the exact BCH amount required for this Cash-out.'
    );
  }

  /**
   * received normally persists the exact BCH amount observed for the customer
   * payment. Require it to reconcile as an additional fail-closed check.
   */
  if (
    !Number.isSafeInteger(cashOut.bchSatsReceived) ||
    cashOut.bchSatsReceived !== cashOut.bchSatsRequired
  ) {
    return unsafe(
      'settlement_payment_amount_mismatch',

      'The recorded BCH received amount does not equal the exact Cash-out payment amount.'
    );
  }

  /**
   * Reuse D4's canonical network-state validation.
   *
   * D5 must not invent a second, weaker interpretation of broadcast or
   * reconciliation evidence.
   */
  let conflictEvaluation: 'none' | 'active' | 'resolved';

  try {
    validateCashOutSettlementNetworkState(cashOut);

    conflictEvaluation = evaluateCashOutSettlementSourceConflict(cashOut);
  } catch (error) {
    return unsafe(
      'invalid_settlement_state',

      error instanceof Error
        ? error.message
        : 'The persisted settlement state is invalid.'
    );
  }

  if (conflictEvaluation === 'active') {
    return unsafe(
      'settlement_source_conflict',

      'The customer payment output has conflicting spend evidence. Do not hand over cash.'
    );
  }

  const reconciliation = cashOut.settlementReconciliation;

  if (!reconciliation) {
    return unsafe(
      'missing_settlement_reconciliation',

      'The exact settlement transaction does not yet have positive network evidence.'
    );
  }

  switch (reconciliation.status) {
    case 'confirmed':
      return safe('confirmed');

    case 'mempool':
      return safe('mempool');

    case 'unknown':
      return unsafe(
        'settlement_unknown',

        'The exact settlement transaction is not currently visible to the successfully queried Electrum servers.'
      );

    case 'unavailable':
      return unsafe(
        'settlement_unavailable',

        'The settlement transaction cannot currently be checked against the BCH network.'
      );

    default:
      return unsafe(
        'invalid_settlement_state',

        'The settlement reconciliation contains an unsupported status.'
      );
  }
}
