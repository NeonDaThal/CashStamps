import type {
  CashOutSettlementRecoveryEconomics,
  CashOutSettlementRecoveryEconomicsInput,
  CashOutSettlementRecoveryVariance,
} from 'src/types/cash-out-settlement';

function requireNonEmptyString(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function requirePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer.`);
  }

  return value;
}

function requireNonNegativeSafeInteger(
  value: number,
  fieldName: string
): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer.`);
  }

  return value;
}

function classifyVariance(
  paymentVarianceSats: number
): CashOutSettlementRecoveryVariance {
  if (paymentVarianceSats < 0) {
    return 'underpayment';
  }

  if (paymentVarianceSats > 0) {
    return 'overpayment';
  }

  return 'exact';
}

/**
 * D6 Recovery Economics v1.
 *
 * Exceptional recovery preserves the ORIGINAL commercial allocation.
 *
 * It does not:
 *
 * - reprice the Cash-out;
 * - calculate a new service fee from actual payment;
 * - proportionally reduce the platform fee for an underpayment;
 * - increase the platform fee for an overpayment;
 * - treat overpayment surplus as normal merchant fee revenue.
 *
 * Platform receives its original frozen allocation exactly once.
 *
 * Recovery miner fee remains merchant-side.
 *
 * All remaining recovered BCH goes to Treasury.
 */
export function calculateCashOutSettlementRecoveryEconomics(
  input: CashOutSettlementRecoveryEconomicsInput
): CashOutSettlementRecoveryEconomics {
  const cashOutId = requireNonEmptyString(
    input.cashOutId,
    'Recovery Cash-out ID'
  );

  const requiredSats = requirePositiveSafeInteger(
    input.requiredSats,
    'Recovery original required sats'
  );

  const recoveryInputSats = requirePositiveSafeInteger(
    input.recoveryInputSats,
    'Recovery input sats'
  );

  const platformFeeSats = requireNonNegativeSafeInteger(
    input.platformFeeSats,
    'Recovery platform fee sats'
  );

  const recoveryFeeSats = requirePositiveSafeInteger(
    input.recoveryFeeSats,
    'Recovery miner fee sats'
  );

  /**
   * Platform protection is absolute for Recovery v1.
   *
   * Miner fee is also merchant-side.
   *
   * There must still be a positive Treasury output after both are paid.
   */
  const treasuryOutputSats =
    recoveryInputSats - platformFeeSats - recoveryFeeSats;

  if (!Number.isSafeInteger(treasuryOutputSats) || treasuryOutputSats <= 0) {
    throw new Error(
      'Exceptional recovery payment is too small to preserve the platform allocation, pay the recovery miner fee, and leave a positive Treasury output.'
    );
  }

  const paymentVarianceSats = recoveryInputSats - requiredSats;

  if (!Number.isSafeInteger(paymentVarianceSats)) {
    throw new Error(
      'Exceptional recovery payment variance is outside the safe integer range.'
    );
  }

  const variance = classifyVariance(paymentVarianceSats);

  const merchantShortfallSats =
    paymentVarianceSats < 0 ? Math.abs(paymentVarianceSats) : 0;

  const customerSurplusSats = paymentVarianceSats > 0 ? paymentVarianceSats : 0;

  /**
   * Full recovery transaction economics must reconcile exactly.
   */
  if (
    treasuryOutputSats + platformFeeSats + recoveryFeeSats !==
    recoveryInputSats
  ) {
    throw new Error(
      'Exceptional recovery economics do not reconcile exactly to the selected recovery inputs.'
    );
  }

  return {
    version: 'cash_out_recovery_v1',

    cashOutId,

    requiredSats,

    recoveryInputSats,

    platformFeeSats,

    recoveryFeeSats,

    treasuryOutputSats,

    paymentVarianceSats,

    variance,

    merchantShortfallSats,

    customerSurplusSats,
  };
}
