import type { CurrencyFeeSchedule } from '../../../types/fee-model';

export const GBP_FEE_SCHEDULE: CurrencyFeeSchedule = {
  currency: 'GBP',

  minorUnitDigits: 2,

  /**
   * Fee Model v1 has no commercial minimum Topup or Cash-out amount.
   *
   * One penny is simply the smallest positive GBP amount this calculator
   * can represent.
   *
   * A separate technical BCH minimum may still be determined later from
   * transaction-output and network-fee tests if one is required.
   */
  smallestPositivePrincipalMinor: 1,

  topup: {
    /**
     * £0.01 through £5.00:
     * flat £0.50 minimum service fee.
     */
    minimumTierMaximumPrincipalMinor: 500,

    /**
     * £5.01 through £500.00:
     * 10% service fee.
     *
     * £500.01 and above use the £50 maximum service fee.
     *
     * Fee Model v1 does not impose a maximum Topup amount.
     */
    percentageTierMaximumPrincipalMinor: 50_000,

    minimumFeeMinor: 50,
    percentageBasisPoints: 1_000,
    maximumFeeMinor: 5_000,
  },

  cashOut: {
    /**
     * 3% total Cash-out service fee.
     *
     * This total is split equally between merchant and platform.
     */
    percentageBasisPoints: 300,
  },
};
