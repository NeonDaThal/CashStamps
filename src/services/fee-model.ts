import { getFeeSchedule } from '../config/fee-model/currencies';
import type {
  CashOutFeeModelV1Calculation,
  CurrencyFeeSchedule,
  FeeSplit,
  TopupFeeModelV1Calculation,
  TopupFeeTier,
} from '../types/fee-model';

const BASIS_POINTS_DENOMINATOR = 10_000;

function assertValidPrincipalMinor(
  principalMinor: number,
  schedule: CurrencyFeeSchedule
): void {
  if (!Number.isSafeInteger(principalMinor)) {
    throw new Error('Principal amount must be a safe integer in minor units.');
  }

  if (principalMinor < schedule.smallestPositivePrincipalMinor) {
    throw new Error(
      `Principal amount must be at least ${schedule.smallestPositivePrincipalMinor} minor unit(s) for ${schedule.currency}.`
    );
  }
}

function assertValidBasisPoints(basisPoints: number): void {
  if (
    !Number.isSafeInteger(basisPoints) ||
    basisPoints < 0 ||
    basisPoints > BASIS_POINTS_DENOMINATOR
  ) {
    throw new Error('Basis points must be an integer between 0 and 10000.');
  }
}

/**
 * Calculate a percentage using integer fiat minor units.
 *
 * Positive half values round upward to the nearest minor unit.
 *
 * Example:
 * 4005 pence × 10% = 400.5 pence -> 401 pence.
 */
export function calculateBasisPointFeeMinor(
  amountMinor: number,
  basisPoints: number
): number {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new Error('Amount must be a non-negative safe integer.');
  }

  assertValidBasisPoints(basisPoints);

  if (basisPoints > 0 && amountMinor > Number.MAX_SAFE_INTEGER / basisPoints) {
    throw new Error('Fee calculation exceeds the safe integer range.');
  }

  return Math.round((amountMinor * basisPoints) / BASIS_POINTS_DENOMINATOR);
}

/**
 * Split a service fee equally between merchant and platform.
 *
 * If an odd minor unit cannot be divided exactly:
 *
 * - platform receives floor(total / 2)
 * - merchant receives the remainder
 *
 * This guarantees that rounding never causes the platform to collect more
 * than half of the total service fee.
 */
export function splitServiceFeeMinor(serviceFeeMinor: number): FeeSplit {
  if (!Number.isSafeInteger(serviceFeeMinor) || serviceFeeMinor < 0) {
    throw new Error(
      'Service fee must be a non-negative safe integer in minor units.'
    );
  }

  const platformFeeMinor = Math.floor(serviceFeeMinor / 2);
  const merchantFeeMinor = serviceFeeMinor - platformFeeMinor;

  return {
    serviceFeeMinor,
    merchantFeeMinor,
    platformFeeMinor,
  };
}

function getTopupFeeTier(
  principalMinor: number,
  schedule: CurrencyFeeSchedule
): TopupFeeTier {
  if (principalMinor <= schedule.topup.minimumTierMaximumPrincipalMinor) {
    return 'minimum';
  }

  if (principalMinor <= schedule.topup.percentageTierMaximumPrincipalMinor) {
    return 'percentage';
  }

  return 'maximum';
}

export function calculateTopupFeeModelV1(
  principalMinor: number,
  currency = 'GBP'
): TopupFeeModelV1Calculation {
  const schedule = getFeeSchedule(currency);

  assertValidPrincipalMinor(principalMinor, schedule);

  const feeTier = getTopupFeeTier(principalMinor, schedule);

  let serviceFeeMinor: number;

  if (feeTier === 'minimum') {
    serviceFeeMinor = schedule.topup.minimumFeeMinor;
  } else if (feeTier === 'percentage') {
    serviceFeeMinor = calculateBasisPointFeeMinor(
      principalMinor,
      schedule.topup.percentageBasisPoints
    );
  } else {
    serviceFeeMinor = schedule.topup.maximumFeeMinor;
  }

  const feeSplit = splitServiceFeeMinor(serviceFeeMinor);

  return {
    version: 'topup_v1',

    currency: schedule.currency,
    principalMinor,

    feeTier,

    percentageBasisPoints: schedule.topup.percentageBasisPoints,

    ...feeSplit,

    customerTotalBeforeNetworkFeeMinor:
      principalMinor + feeSplit.serviceFeeMinor,

    scheduleSnapshot: {
      minorUnitDigits: schedule.minorUnitDigits,
      smallestPositivePrincipalMinor: schedule.smallestPositivePrincipalMinor,

      minimumTierMaximumPrincipalMinor:
        schedule.topup.minimumTierMaximumPrincipalMinor,

      percentageTierMaximumPrincipalMinor:
        schedule.topup.percentageTierMaximumPrincipalMinor,

      minimumFeeMinor: schedule.topup.minimumFeeMinor,
      percentageBasisPoints: schedule.topup.percentageBasisPoints,
      maximumFeeMinor: schedule.topup.maximumFeeMinor,
    },
  };
}

export function calculateCashOutFeeModelV1(
  principalMinor: number,
  currency = 'GBP'
): CashOutFeeModelV1Calculation {
  const schedule = getFeeSchedule(currency);

  assertValidPrincipalMinor(principalMinor, schedule);

  const serviceFeeMinor = calculateBasisPointFeeMinor(
    principalMinor,
    schedule.cashOut.percentageBasisPoints
  );

  const feeSplit = splitServiceFeeMinor(serviceFeeMinor);

  return {
    version: 'cashout_v1',

    currency: schedule.currency,
    principalMinor,

    percentageBasisPoints: schedule.cashOut.percentageBasisPoints,

    ...feeSplit,

    customerTotalBeforeNetworkFeeMinor:
      principalMinor + feeSplit.serviceFeeMinor,

    scheduleSnapshot: {
      minorUnitDigits: schedule.minorUnitDigits,
      smallestPositivePrincipalMinor: schedule.smallestPositivePrincipalMinor,
      percentageBasisPoints: schedule.cashOut.percentageBasisPoints,
    },
  };
}
