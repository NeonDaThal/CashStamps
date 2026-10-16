import type { CashOutRecord } from 'src/types/cash-out';

export type CashOutSettlementRecoveryLifecycleReason =
  | 'recovery_confirmed'
  | 'cash_out_already_completed'
  | 'cash_out_not_recoverable'
  | 'missing_recovery_intent'
  | 'invalid_recovery_intent'
  | 'recovery_cash_out_mismatch'
  | 'recovery_input_identity_invalid'
  | 'missing_recovery_reconciliation'
  | 'recovery_txid_mismatch'
  | 'recovery_mempool_wait_for_confirmation'
  | 'recovery_unknown'
  | 'recovery_unavailable'
  | 'invalid_recovery_state';

export interface CashOutSettlementRecoveryLifecycleDecision {
  /**
   * True means the exceptional BCH recovery is sufficiently final to restore
   * the Cash-out to the received business state.
   *
   * This does NOT mean physical cash has been handed over.
   */
  readyForReceivedState: boolean;

  reason: CashOutSettlementRecoveryLifecycleReason;

  recoveryInputSats?: number;

  confirmedAt?: string;

  message: string;
}

function normalizeTxid(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : undefined;
}

function isValidTimestamp(value: string | undefined): value is string {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  return Number.isFinite(new Date(value).getTime());
}

function unsafe(
  reason: Exclude<
    CashOutSettlementRecoveryLifecycleReason,
    'recovery_confirmed'
  >,
  message: string
): CashOutSettlementRecoveryLifecycleDecision {
  return {
    readyForReceivedState: false,

    reason,

    message,
  };
}

function safe(
  recoveryInputSats: number,
  confirmedAt: string
): CashOutSettlementRecoveryLifecycleDecision {
  return {
    readyForReceivedState: true,

    reason: 'recovery_confirmed',

    recoveryInputSats,

    confirmedAt,

    message:
      'The exact persisted exceptional recovery transaction is confirmed and the Cash-out may return to the received state.',
  };
}

/**
 * D6H.1 — pure exceptional-recovery lifecycle decision.
 *
 * This does not:
 *
 * - perform network calls;
 * - persist anything;
 * - hand over cash;
 * - complete the Cash-out;
 * - alter Cash on Hand;
 * - create report/accounting events.
 *
 * Recovery v1 deliberately requires CONFIRMED evidence here.
 *
 * Mempool evidence alone is not yet accepted for recovery cash handover because
 * the recovery path can contain 1–3 source inputs and does not yet have the
 * D5-equivalent multi-input conflicting-spender inspection.
 */
export function evaluateConfirmedCashOutSettlementRecovery(
  cashOut: CashOutRecord
): CashOutSettlementRecoveryLifecycleDecision {
  /**
   * Completed is terminal for the physical-cash business event.
   *
   * Never reopen a completed Cash-out.
   */
  if (cashOut.status === 'completed') {
    return unsafe(
      'cash_out_already_completed',

      'Cash-out is already completed and must not be reopened by recovery.'
    );
  }

  /**
   * These are the only pre-completion states from which an exceptional
   * recovery may legitimately restore the received boundary.
   *
   * In particular, late payment after cancellation is allowed to return from
   * cancelled -> received only after the exact recovery transaction confirms.
   */
  switch (cashOut.status) {
    case 'awaiting_payment':
    case 'received':
    case 'cancelled':
    case 'failed':
      break;

    default:
      return unsafe(
        'cash_out_not_recoverable',

        'Cash-out is not in a lifecycle state that exceptional recovery may restore to received.'
      );
  }

  const intent = cashOut.recoveryIntent;

  if (!intent) {
    return unsafe(
      'missing_recovery_intent',

      'Cash-out does not contain a durable exceptional recovery transaction.'
    );
  }

  if (
    intent.version !== 'cash_out_recovery_signed_transaction_v1' ||
    intent.signingRequest?.version !== 'cash_out_recovery_signing_request_v1'
  ) {
    return unsafe(
      'invalid_recovery_intent',

      'Cash-out recovery intent does not use the frozen recovery v1 transaction format.'
    );
  }

  if (
    intent.cashOutId !== cashOut.id ||
    intent.signingRequest.cashOutId !== cashOut.id
  ) {
    return unsafe(
      'recovery_cash_out_mismatch',

      'The durable exceptional recovery transaction does not belong to this Cash-out.'
    );
  }

  if (
    typeof intent.inputSetId !== 'string' ||
    !intent.inputSetId.trim() ||
    intent.signingRequest.inputSetId !== intent.inputSetId
  ) {
    return unsafe(
      'recovery_input_identity_invalid',

      'The exceptional recovery input-set identity is invalid.'
    );
  }

  const inputCount = intent.signingRequest.inputCount;

  const inputs = intent.signingRequest.inputs;

  if (
    !Number.isSafeInteger(inputCount) ||
    inputCount < 1 ||
    inputCount > 3 ||
    !Array.isArray(inputs) ||
    inputs.length !== inputCount
  ) {
    return unsafe(
      'recovery_input_identity_invalid',

      'The exceptional recovery must contain exactly one to three frozen inputs.'
    );
  }

  let calculatedInputSats = 0;

  for (const input of inputs) {
    const txid = normalizeTxid(input.txid);

    if (
      !txid ||
      !Number.isSafeInteger(input.vout) ||
      input.vout < 0 ||
      !Number.isSafeInteger(input.satoshis) ||
      input.satoshis <= 0 ||
      input.outpoint !== `${txid}:${input.vout}`
    ) {
      return unsafe(
        'recovery_input_identity_invalid',

        'The exceptional recovery contains an invalid frozen source input.'
      );
    }

    calculatedInputSats += input.satoshis;

    if (!Number.isSafeInteger(calculatedInputSats)) {
      return unsafe(
        'recovery_input_identity_invalid',

        'The exceptional recovery input total exceeds safe integer limits.'
      );
    }
  }

  if (
    !Number.isSafeInteger(intent.signingRequest.totalInputSats) ||
    intent.signingRequest.totalInputSats <= 0 ||
    calculatedInputSats !== intent.signingRequest.totalInputSats
  ) {
    return unsafe(
      'recovery_input_identity_invalid',

      'The exceptional recovery input values do not reconcile with the durable input total.'
    );
  }

  const intentTxid = normalizeTxid(intent.txid);

  if (!intentTxid) {
    return unsafe(
      'invalid_recovery_intent',

      'The durable exceptional recovery transaction ID is invalid.'
    );
  }

  const reconciliation = cashOut.recoveryReconciliation;

  if (!reconciliation) {
    return unsafe(
      'missing_recovery_reconciliation',

      'The exact exceptional recovery transaction does not yet have network reconciliation evidence.'
    );
  }

  const reconciliationTxid = normalizeTxid(reconciliation.txid);

  if (!reconciliationTxid || reconciliationTxid !== intentTxid) {
    return unsafe(
      'recovery_txid_mismatch',

      'Exceptional recovery reconciliation belongs to a different transaction.'
    );
  }

  switch (reconciliation.status) {
    case 'confirmed':
      if (!isValidTimestamp(reconciliation.checkedAt)) {
        return unsafe(
          'invalid_recovery_state',

          'Confirmed exceptional recovery evidence has an invalid reconciliation timestamp.'
        );
      }

      return safe(
        intent.signingRequest.totalInputSats,

        reconciliation.checkedAt
      );

    case 'mempool':
      return unsafe(
        'recovery_mempool_wait_for_confirmation',

        'The exceptional recovery transaction is visible in the BCH mempool, but recovery cash handover remains confirmation-only until multi-input conflict safety is hardened.'
      );

    case 'unknown':
      return unsafe(
        'recovery_unknown',

        'The exact exceptional recovery transaction is not currently visible to the successfully queried Electrum servers.'
      );

    case 'unavailable':
      return unsafe(
        'recovery_unavailable',

        'The exceptional recovery transaction cannot currently be checked against the BCH network.'
      );

    default:
      return unsafe(
        'invalid_recovery_state',

        'Exceptional recovery reconciliation contains an unsupported status.'
      );
  }
}

/**
 * Apply the BCH-side recovery lifecycle boundary.
 *
 * Confirmed recovery means:
 *
 * customer BCH has been successfully recovered through the exact persisted
 * recovery transaction.
 *
 * It does NOT mean:
 *
 * - physical cash has been handed over;
 * - the Cash-out is completed;
 * - Cash on Hand should move;
 * - reports should include the Cash-out yet.
 *
 * The existing D5 received -> completed merchant-confirmation boundary remains
 * responsible for those later business effects.
 */
export function applyConfirmedCashOutSettlementRecoveryToReceived(
  cashOut: CashOutRecord
): CashOutRecord {
  /**
   * Never reopen a completed Cash-out.
   */
  if (cashOut.status === 'completed') {
    return cashOut;
  }

  const decision = evaluateConfirmedCashOutSettlementRecovery(cashOut);

  if (
    !decision.readyForReceivedState ||
    !Number.isSafeInteger(decision.recoveryInputSats) ||
    !decision.confirmedAt
  ) {
    throw new Error(
      `Cash-out recovery cannot enter received state: ${decision.reason}. ${decision.message}`
    );
  }

  /**
   * recoveryInputSats is the actual BCH value recovered from the customer's
   * selected exceptional payment set.
   *
   * It does not alter the frozen fiat payout.
   */
  if (
    cashOut.status === 'received' &&
    cashOut.bchSatsReceived === decision.recoveryInputSats
  ) {
    return cashOut;
  }

  return {
    ...cashOut,

    status: 'received',

    bchSatsReceived: decision.recoveryInputSats,

    /**
     * Do not manufacture a receivedTxid.
     *
     * Exceptional recovery may contain multiple customer transactions and
     * therefore cannot always be represented by one receivedTxid.
     */

    /**
     * Preserve historical cancelledAt / failedAt / detectedAt fields if they
     * already exist. They remain useful audit evidence describing how the
     * exceptional case arose.
     */

    updatedAt:
      cashOut.status === 'received' ? cashOut.updatedAt : decision.confirmedAt,
  };
}
