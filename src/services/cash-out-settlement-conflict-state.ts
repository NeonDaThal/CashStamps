import { evaluateCashOutSettlementSourceConflict } from 'src/services/cash-out-settlement-conflict';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementSourceConflictEvidence } from 'src/types/cash-out-settlement';

function normaliseTransactionId(value: string): string {
  return value.trim().toLowerCase();
}

function validateConflictEvidenceAgainstCashOut(
  cashOut: CashOutRecord,
  evidence: CashOutSettlementSourceConflictEvidence
): void {
  /**
   * Reuse D5D.1's canonical validation rather than introducing a second
   * interpretation of valid conflict evidence.
   */
  evaluateCashOutSettlementSourceConflict({
    ...cashOut,

    settlementSourceConflict: evidence,
  });
}

function sameConflictIdentity(
  left: CashOutSettlementSourceConflictEvidence,
  right: CashOutSettlementSourceConflictEvidence
): boolean {
  return (
    normaliseTransactionId(left.sourcePaymentTxid) ===
      normaliseTransactionId(right.sourcePaymentTxid) &&
    left.sourceOutpointIndex === right.sourceOutpointIndex &&
    normaliseTransactionId(left.expectedSettlementTxid) ===
      normaliseTransactionId(right.expectedSettlementTxid) &&
    normaliseTransactionId(left.conflictingTxid) ===
      normaliseTransactionId(right.conflictingTxid)
  );
}

/**
 * Apply newly-observed positive conflict evidence to one Cash-out record.
 *
 * This is pure and performs no persistence.
 *
 * Rules:
 *
 * - first valid conflict may be attached;
 * - exact replay is idempotent;
 * - the SAME conflicting transaction may strengthen mempool -> confirmed;
 * - confirmed evidence never downgrades;
 * - a different conflicting transaction cannot silently replace durable
 *   evidence;
 * - resolved conflict evidence cannot silently become active again.
 */
export function applyCashOutSettlementSourceConflictEvidence(
  cashOut: CashOutRecord,
  incoming: CashOutSettlementSourceConflictEvidence
): CashOutRecord {
  if (incoming.state !== 'detected') {
    throw new Error(
      'Only active detected conflict evidence may be applied through the conflict-detection path.'
    );
  }

  validateConflictEvidenceAgainstCashOut(cashOut, incoming);

  const existing = cashOut.settlementSourceConflict;

  if (!existing) {
    return {
      ...cashOut,

      settlementSourceConflict: incoming,
    };
  }

  /**
   * First ensure existing durable state itself remains valid.
   */
  evaluateCashOutSettlementSourceConflict(cashOut);

  if (existing.state === 'resolved') {
    throw new Error(
      'Resolved settlement conflict evidence cannot be replaced by new active conflict evidence.'
    );
  }

  if (!sameConflictIdentity(existing, incoming)) {
    /**
     * Do not silently rewrite one concrete conflicting spender into another.
     *
     * This remains fail-closed: the existing active conflict stays durable and
     * therefore the merchant remains blocked.
     */
    throw new Error(
      'A different conflicting transaction cannot replace existing durable settlement conflict evidence.'
    );
  }

  /**
   * Confirmed conflict evidence is already stronger than mempool evidence.
   * Never downgrade it.
   */
  if (existing.conflictingTransactionStatus === 'confirmed') {
    return cashOut;
  }

  /**
   * Repeated mempool observation changes nothing.
   *
   * In particular, do not rewrite detectedAt every time the app checks.
   */
  if (incoming.conflictingTransactionStatus === 'mempool') {
    return cashOut;
  }

  /**
   * The same concrete spender has now moved from mempool to confirmed.
   *
   * Preserve the original detectedAt timestamp while strengthening the durable
   * network evidence.
   */
  const strengthened: CashOutSettlementSourceConflictEvidence = {
    ...existing,

    conflictingTransactionStatus: 'confirmed',

    conflictingTransactionBlockHeight:
      incoming.conflictingTransactionBlockHeight,

    message: incoming.message,
  };

  validateConflictEvidenceAgainstCashOut(cashOut, strengthened);

  return {
    ...cashOut,

    settlementSourceConflict: strengthened,
  };
}

/**
 * Resolve an active source conflict only after the exact deterministic D3
 * settlement transaction itself has CONFIRMED.
 *
 * Mempool settlement evidence is deliberately insufficient once a concrete
 * conflict has previously been observed.
 */
export function resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
  cashOut: CashOutRecord,
  resolvedAt: string
): CashOutRecord {
  const existing = cashOut.settlementSourceConflict;

  if (!existing) {
    throw new Error(
      'Cash-out does not contain settlement conflict evidence to resolve.'
    );
  }

  const existingState = evaluateCashOutSettlementSourceConflict(cashOut);

  if (existingState === 'resolved') {
    return cashOut;
  }

  if (existingState !== 'active') {
    throw new Error('Cash-out does not contain an active settlement conflict.');
  }

  /**
   * A confirmed conflicting spender and a confirmed deterministic settlement
   * cannot both be valid on the same BCH chain because they consume the same
   * outpoint.
   *
   * Treat this as contradictory network evidence requiring exceptional review.
   * Never silently resolve it through the normal merchant path.
   */
  if (existing.conflictingTransactionStatus === 'confirmed') {
    throw new Error(
      'Confirmed conflicting-spender evidence cannot be automatically resolved by the normal settlement path.'
    );
  }

  const reconciliation = cashOut.settlementReconciliation;

  if (reconciliation?.status !== 'confirmed') {
    throw new Error(
      'Settlement conflict may only be resolved after confirmed evidence for the exact deterministic settlement.'
    );
  }

  const resolved: CashOutSettlementSourceConflictEvidence = {
    ...existing,

    state: 'resolved',

    resolvedAt,

    resolution: 'exact_settlement_confirmed',
  };

  /**
   * D5D.1 performs the final exact-txid and timestamp validation.
   */
  validateConflictEvidenceAgainstCashOut(cashOut, resolved);

  return {
    ...cashOut,

    settlementSourceConflict: resolved,
  };
}
