import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementExceptionalCase,
  CashOutSettlementRecoveryAssessment,
  CashOutSettlementRecoveryBlockReason,
} from 'src/types/cash-out-settlement';

export interface CashOutSettlementExceptionalPaymentEvidence {
  exceptionalCase: CashOutSettlementExceptionalCase;

  observedSats: number;

  observedOutpointCount: number;

  /**
   * Positive customer-payment network evidence must exist before exceptional
   * recovery may even be considered.
   */
  networkEvidenceAvailable: boolean;

  /**
   * Only relevant to the `normal_settlement_problem` exceptional case.
   *
   * `unknown` is deliberately different from `demonstrably_unusable`.
   *
   * D6 must never use temporary ambiguity, an Electrum outage, or lack of
   * visibility as permission to bypass the normal deterministic settlement.
   */
  normalSettlementState?: 'available' | 'unknown' | 'demonstrably_unusable';
}

function blocked(
  exceptionalCase: CashOutSettlementExceptionalCase,
  observedSats: number,
  requiredSats: number,
  observedOutpointCount: number,
  blockReason: CashOutSettlementRecoveryBlockReason,
  message: string
): CashOutSettlementRecoveryAssessment {
  return {
    exceptionalCase,

    eligibility: 'blocked',

    observedSats,

    requiredSats,

    observedOutpointCount,

    blockReason,

    message,
  };
}

export function evaluateCashOutSettlementRecoveryEligibility(
  cashOut: CashOutRecord,
  evidence: CashOutSettlementExceptionalPaymentEvidence
): CashOutSettlementRecoveryAssessment {
  const {
    exceptionalCase,
    observedSats,
    observedOutpointCount,
    networkEvidenceAvailable,
  } = evidence;

  if (!Number.isSafeInteger(observedSats) || observedSats < 0) {
    throw new Error(
      'Exceptional recovery observedSats must be a non-negative safe integer.'
    );
  }

  if (
    !Number.isSafeInteger(observedOutpointCount) ||
    observedOutpointCount < 0
  ) {
    throw new Error(
      'Exceptional recovery observedOutpointCount must be a non-negative safe integer.'
    );
  }

  if (
    !Number.isSafeInteger(cashOut.bchSatsRequired) ||
    cashOut.bchSatsRequired <= 0
  ) {
    throw new Error(
      'Cash-out required sats are invalid for exceptional recovery.'
    );
  }

  if (cashOut.status === 'completed') {
    return blocked(
      exceptionalCase,
      observedSats,
      cashOut.bchSatsRequired,
      observedOutpointCount,
      'cash_out_already_completed',
      'Completed Cash-outs cannot enter exceptional recovery.'
    );
  }

  const durableConflict = cashOut.settlementSourceConflict;

  if (durableConflict?.state === 'detected') {
    return blocked(
      exceptionalCase,
      observedSats,
      cashOut.bchSatsRequired,
      observedOutpointCount,
      durableConflict.conflictingTransactionStatus === 'confirmed'
        ? 'confirmed_conflicting_spender'
        : 'source_conflict_active',
      'Exceptional recovery is blocked while conflicting-spender evidence remains active.'
    );
  }

  if (!networkEvidenceAvailable) {
    return blocked(
      exceptionalCase,
      observedSats,
      cashOut.bchSatsRequired,
      observedOutpointCount,
      'network_state_unavailable',
      'Exceptional recovery requires positive network evidence for the customer payment.'
    );
  }

  if (observedSats <= 0 || observedOutpointCount <= 0) {
    return blocked(
      exceptionalCase,
      observedSats,
      cashOut.bchSatsRequired,
      observedOutpointCount,
      'no_customer_value_received',
      'Exceptional recovery requires positively observed customer BCH.'
    );
  }

  /**
   * Exceptional recovery must never become an easier alternative to the
   * ordinary D1-D5 deterministic settlement path.
   */
  if (exceptionalCase === 'normal_settlement_problem') {
    if (
      cashOut.settlementReconciliation?.status === 'mempool' ||
      cashOut.settlementReconciliation?.status === 'confirmed' ||
      evidence.normalSettlementState === 'available'
    ) {
      return blocked(
        exceptionalCase,
        observedSats,
        cashOut.bchSatsRequired,
        observedOutpointCount,
        'normal_settlement_available',
        'The normal deterministic settlement remains available and must be used instead of exceptional recovery.'
      );
    }

    if (evidence.normalSettlementState !== 'demonstrably_unusable') {
      return blocked(
        exceptionalCase,
        observedSats,
        cashOut.bchSatsRequired,
        observedOutpointCount,
        'normal_settlement_not_proven_unusable',
        'Exceptional recovery cannot replace a normal settlement that is merely unknown or temporarily unavailable.'
      );
    }
  }

  return {
    exceptionalCase,

    eligibility: 'eligible',

    observedSats,

    requiredSats: cashOut.bchSatsRequired,

    observedOutpointCount,

    message:
      'Exceptional payment evidence is eligible to proceed to recovery planning.',
  };
}
