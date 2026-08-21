export type FeeModelVersion = 'topup_v1' | 'cashout_v1';

export type TopupFeeTier = 'minimum' | 'percentage' | 'maximum';

export type NetworkFeeSnapshotStatus = 'not_calculated' | 'estimated' | 'final';

export interface TopupFeeSchedule {
  /**
   * Highest principal amount that still uses the flat minimum fee.
   *
   * GBP v1:
   * £5.00 = 500 minor units.
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
   * Customer cash total before considering miner-fee accounting.
   *
   * The property name is retained for Fee Model v1 compatibility.
   *
   * Under the current Topup launch model the merchant absorbs the BCH miner fee,
   * so no miner-fee recovery is added to the customer total.
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

/**
 * Network-fee information captured with a persisted fee-model snapshot.
 *
 * Fee Model v1 deliberately keeps the network fee separate from the service
 * fee so the two cannot accidentally be combined in reports or accounting.
 */
export interface FeeModelNetworkFeeSnapshot {
  status: NetworkFeeSnapshotStatus;

  /**
   * Actual or estimated blockchain miner fee.
   */
  feeSats?: number;

  /**
   * Fiat minor units recovered from the customer for the blockchain miner fee.
   *
   * Under the current Topup v1 launch model the merchant absorbs the miner fee,
   * so a final Topup network-fee snapshot stores this explicitly as 0.
   *
   * Older snapshots and other fee models may leave this undefined.
   */
  recoveryMinor?: number;
}

/**
 * Persisted Fee Model v1 snapshot for a Topup.
 *
 * Existing/legacy VoucherRecords do not have this property. Its absence
 * therefore identifies records created under the legacy fee model.
 *
 * The snapshot is designed to contain the commercial terms used when the
 * transaction was created so future configuration changes do not alter the
 * historical meaning of the record.
 */
export interface TopupFeeModelV1Snapshot extends TopupFeeModelV1Calculation {
  snapshotCreatedAt: string;

  networkFee: FeeModelNetworkFeeSnapshot;

  /**
   * Final physical cash amount paid by the customer.
   *
   * Under the current Topup v1 launch model this is:
   *
   * principal + service fee
   *
   * The merchant absorbs the BCH miner fee, so no miner-fee recovery is added.
   *
   * Older or non-final snapshots may leave this undefined.
   */
  customerTotalMinor?: number;
}
