export type FeeModelVersion = 'topup_v1' | 'cashout_v1';

export type TopupFeeTier = 'minimum' | 'percentage' | 'maximum';

export interface TopupFeeSchedule {
  /**
   * Highest principal amount that still uses the flat minimum fee.
   *
   * GBP v1:
   * £40.00 = 4000 minor units.
   */
  minimumTierMaximumPrincipalMinor: number;

  /**
   * Highest principal amount that still uses the percentage fee.
   *
   * Anything above this amount uses the maximum/capped fee.
   *
   * GBP v1:
   * £500.00 = 50000 minor units.
   */
  percentageTierMaximumPrincipalMinor: number;

  minimumFeeMinor: number;
  percentageBasisPoints: number;
  maximumFeeMinor: number;
}

export interface CashOutFeeSchedule {
  percentageBasisPoints: number;
}

export interface CurrencyFeeSchedule {
  currency: string;

  /**
   * Number of decimal places normally used by this fiat currency.
   *
   * GBP = 2.
   *
   * Future currencies do not have to use two decimal places.
   */
  minorUnitDigits: number;

  /**
   * Smallest positive amount representable by this fee schedule.
   *
   * This is NOT a commercial minimum transaction size.
   *
   * For GBP this is 1 penny.
   */
  smallestPositivePrincipalMinor: number;

  topup: TopupFeeSchedule;
  cashOut: CashOutFeeSchedule;
}

export interface FeeSplit {
  serviceFeeMinor: number;
  merchantFeeMinor: number;
  platformFeeMinor: number;
}

export interface TopupFeeModelV1Calculation extends FeeSplit {
  version: 'topup_v1';

  currency: string;
  principalMinor: number;

  feeTier: TopupFeeTier;

  /**
   * The percentage configured for the middle fee tier.
   *
   * The actual transaction may use the minimum or maximum tier instead.
   */
  percentageBasisPoints: number;

  /**
   * Customer total before the separate BCH network-fee recovery is added.
   */
  customerTotalBeforeNetworkFeeMinor: number;

  scheduleSnapshot: {
    minorUnitDigits: number;
    smallestPositivePrincipalMinor: number;

    minimumTierMaximumPrincipalMinor: number;
    percentageTierMaximumPrincipalMinor: number;

    minimumFeeMinor: number;
    percentageBasisPoints: number;
    maximumFeeMinor: number;
  };
}

export interface CashOutFeeModelV1Calculation extends FeeSplit {
  version: 'cashout_v1';

  currency: string;
  principalMinor: number;

  percentageBasisPoints: number;

  /**
   * Fiat-equivalent total before the separate BCH settlement miner fee
   * is added.
   */
  customerTotalBeforeNetworkFeeMinor: number;

  scheduleSnapshot: {
    minorUnitDigits: number;
    smallestPositivePrincipalMinor: number;
    percentageBasisPoints: number;
  };
}
