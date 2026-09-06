export interface CashOutSettlementServiceFeeSplitInput {
  /**
   * BCH sats representing the physical cash payout before the service fee.
   */
  marketBchSats: number;

  /**
   * Exact BCH sats the customer is required to send.
   */
  bchSatsRequired: number;

  /**
   * Canonical stored fiat service-fee amounts.
   *
   * These must already come from Cash-out Fee Model v1.
   */
  totalServiceFeeAmountMinor: number;
  platformFeeAmountMinor: number;
  merchantFeeAmountMinor: number;
}

export interface CashOutSettlementServiceFeeSplit {
  /**
   * Exact BCH service-fee portion contained in the customer payment.
   */
  serviceFeeSats: number;

  /**
   * Exact platform allocation in sats.
   *
   * Rounding is deliberately downward so any indivisible satoshi remainder
   * remains merchant-side, matching the Cash-out v1 fiat odd-unit rule.
   */
  platformFeeSats: number;

  /**
   * Exact merchant service-fee allocation in sats.
   */
  merchantFeeSats: number;
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

function requirePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer.`);
  }

  return value;
}

/**
 * Convert the already-frozen Cash-out v1 fiat fee split into an exact
 * satoshi allocation.
 *
 * IMPORTANT:
 *
 * We do NOT independently calculate two fresh 1.5% BCH amounts.
 *
 * Instead:
 *
 * 1. derive the exact BCH service-fee sats already contained in the locked
 *    customer payment;
 * 2. allocate the platform portion proportionally using the canonical stored
 *    fiat split;
 * 3. give any indivisible satoshi remainder to the merchant.
 *
 * This preserves:
 *
 * platformFeeSats + merchantFeeSats === serviceFeeSats
 *
 * exactly.
 */
export function calculateCashOutSettlementServiceFeeSplit(
  input: CashOutSettlementServiceFeeSplitInput
): CashOutSettlementServiceFeeSplit {
  const marketBchSats = requirePositiveSafeInteger(
    input.marketBchSats,
    'Cash-out market BCH sats'
  );

  const bchSatsRequired = requirePositiveSafeInteger(
    input.bchSatsRequired,
    'Cash-out required BCH sats'
  );

  const totalServiceFeeAmountMinor = requirePositiveSafeInteger(
    input.totalServiceFeeAmountMinor,
    'Cash-out total service fee'
  );

  const platformFeeAmountMinor = requireNonNegativeSafeInteger(
    input.platformFeeAmountMinor,
    'Cash-out platform fee'
  );

  const merchantFeeAmountMinor = requireNonNegativeSafeInteger(
    input.merchantFeeAmountMinor,
    'Cash-out merchant fee'
  );

  if (bchSatsRequired <= marketBchSats) {
    throw new Error(
      'Cash-out required BCH must contain a positive service-fee amount.'
    );
  }

  if (
    platformFeeAmountMinor + merchantFeeAmountMinor !==
    totalServiceFeeAmountMinor
  ) {
    throw new Error(
      'Cash-out stored merchant/platform fees must exactly reconcile to the total service fee.'
    );
  }

  const serviceFeeSats = bchSatsRequired - marketBchSats;

  /**
   * Use bigint for the multiplication so an otherwise valid safe-integer
   * amount cannot lose precision during the intermediate calculation.
   */
  const platformFeeSatsBigInt =
    (BigInt(serviceFeeSats) * BigInt(platformFeeAmountMinor)) /
    BigInt(totalServiceFeeAmountMinor);

  const platformFeeSats = Number(platformFeeSatsBigInt);

  if (!Number.isSafeInteger(platformFeeSats)) {
    throw new Error(
      'Cash-out platform fee satoshi allocation exceeds safe integer range.'
    );
  }

  /**
   * Merchant receives the exact remainder.
   *
   * This guarantees there can never be an unallocated service-fee satoshi.
   */
  const merchantFeeSats = serviceFeeSats - platformFeeSats;

  return {
    serviceFeeSats,

    platformFeeSats,

    merchantFeeSats,
  };
}
