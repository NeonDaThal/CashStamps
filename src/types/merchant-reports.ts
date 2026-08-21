import type { CashOutRecord } from 'src/types/cash-out';
import type { VoucherRecord } from 'src/types/voucher';
import type { NetworkFeeSnapshotStatus } from 'src/types/fee-model';

export type MerchantReportRange =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'all_time';

export type MerchantReportActivityType = 'voucher' | 'cash_out';

export type MerchantReportGrowthDirection = 'up' | 'down' | 'flat' | 'new';

export type MerchantReportTopupNetworkFeeStatus =
  | NetworkFeeSnapshotStatus
  | 'unknown';

export interface MerchantReportPeriod {
  range: MerchantReportRange;
  label: string;
  startIso: string | null;
  endIso: string;
}

export interface MerchantReportPeriodComparison {
  current: MerchantReportPeriod;
  previous: MerchantReportPeriod | null;
}

export interface MerchantReportGrowthMetric {
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentageChange: number | null;
  direction: MerchantReportGrowthDirection;
}

export interface MerchantReportGrowthSummary {
  transactionCount: MerchantReportGrowthMetric;
  voucherCount: MerchantReportGrowthMetric;
  cashOutCount: MerchantReportGrowthMetric;
  grossFiatMovementMinor: MerchantReportGrowthMetric;
  netFiatMovementMinor: MerchantReportGrowthMetric;

  /**
   * Compatibility name.
   *
   * This currently represents total tracked service fees, not merchant-only
   * fee revenue.
   */
  feeRevenueMinor: MerchantReportGrowthMetric;

  bchMovementSats: MerchantReportGrowthMetric;

  topupActualMinerFeeSats: MerchantReportGrowthMetric;
}

export interface MerchantReportVoucherTotals {
  count: number;

  /**
   * Total physical cash collected from Topup customers.
   *
   * Fee Model v1:
   * principal + service fee.
   */
  customerCashCollectedMinor: number;

  /**
   * Fiat value actually loaded into Topups.
   */
  principalMinor: number;

  /**
   * Total service fees charged on Topups.
   */
  serviceFeeMinor: number;

  /**
   * Known merchant share of Topup service fees.
   *
   * Legacy fee splits that cannot be reconstructed safely are excluded.
   */
  merchantFeeRevenueMinor: number;

  /**
   * Known platform share of Topup service fees.
   *
   * Legacy fee splits that cannot be reconstructed safely are excluded.
   */
  platformFeeMinor: number;

  /**
   * Number of fee-bearing legacy Topup records whose merchant/platform split
   * cannot be reconstructed safely.
   */
  feeSplitUnknownCount: number;

  /**
   * Sum of exact miner fees from final signed Topup transactions.
   *
   * Estimates and unknown historical fees are deliberately excluded.
   */
  actualMinerFeeSats: number;

  /**
   * Sum of persisted miner-fee estimates for records which do not yet contain
   * an exact final fee.
   *
   * This is informational only and must not be treated as actual merchant cost.
   */
  estimatedMinerFeeSats: number;

  /**
   * Number of Topups with a trustworthy final miner fee.
   */
  finalMinerFeeCount: number;

  /**
   * Number of Topups with only an estimated miner fee.
   */
  estimatedMinerFeeCount: number;

  /**
   * Number of explicit Fee Model records where the miner fee had not yet been
   * calculated when the snapshot was created.
   */
  networkFeeNotCalculatedCount: number;

  /**
   * Number of legacy or otherwise unclassifiable Topups whose miner fee is not
   * safely known.
   */
  networkFeeUnknownCount: number;

  /**
   * Explicit customer miner-fee recovery recorded by final snapshots.
   *
   * Current launch Topups record zero because the merchant absorbs the fee.
   */
  customerNetworkFeeRecoveryMinor: number;

  /**
   * Number of records whose customer miner-fee recovery value is explicitly
   * known.
   */
  customerNetworkFeeRecoveryKnownCount: number;

  /**
   * Compatibility alias for customerCashCollectedMinor.
   */
  grossFiatRevenueMinor: number;

  /**
   * Compatibility alias for principalMinor.
   */
  netFiatRevenueMinor: number;

  /**
   * Compatibility alias for serviceFeeMinor.
   *
   * Despite the historic property name, this is total service fee rather than
   * merchant-only revenue.
   */
  feeRevenueMinor: number;

  marketBchSats: number;
  finalBchSats: number;

  /**
   * Average Topup principal/value loaded, excluding service fees.
   */
  averageOrderValueMinor: number;
}

export interface MerchantReportCashOutTotals {
  count: number;
  receivedCount: number;
  cashPaidOutMinor: number;
  customerSendsFiatEquivalentMinor: number;
  feeRevenueMinor: number;
  marketBchSats: number;
  bchSatsRequired: number;
  bchSatsReceived: number;
  averageOrderValueMinor: number;
}

export interface MerchantReportCurrencyTotals {
  currency: string;

  voucherCount: number;
  cashOutCount: number;
  transactionCount: number;

  voucherCustomerCashCollectedMinor: number;
  voucherPrincipalMinor: number;
  voucherServiceFeeMinor: number;
  voucherMerchantFeeRevenueMinor: number;
  voucherPlatformFeeMinor: number;
  voucherFeeSplitUnknownCount: number;
  voucherActualMinerFeeSats: number;
  voucherEstimatedMinerFeeSats: number;

  voucherFinalMinerFeeCount: number;
  voucherEstimatedMinerFeeCount: number;
  voucherNetworkFeeNotCalculatedCount: number;
  voucherNetworkFeeUnknownCount: number;

  voucherCustomerNetworkFeeRecoveryMinor: number;
  voucherCustomerNetworkFeeRecoveryKnownCount: number;

  /**
   * Compatibility aliases for existing report consumers.
   */
  voucherGrossFiatRevenueMinor: number;
  voucherNetFiatRevenueMinor: number;
  voucherFeeRevenueMinor: number;

  cashOutCashPaidOutMinor: number;
  cashOutCustomerSendsFiatEquivalentMinor: number;
  cashOutFeeRevenueMinor: number;

  /**
   * Topup customer cash collected plus Cash-out cash paid out.
   */
  grossFiatMovementMinor: number;

  /**
   * Topup principal plus Cash-out cash paid out.
   */
  netFiatMovementMinor: number;

  /**
   * Total tracked service fees from Topups and Cash-outs.
   */
  serviceFeeMinor: number;

  /**
   * Compatibility alias for serviceFeeMinor.
   */
  feeRevenueMinor: number;

  averageOrderValueMinor: number;
}

export interface MerchantReportOverallTotals {
  transactionCount: number;

  grossFiatMovementMinor: number;
  netFiatMovementMinor: number;

  /**
   * Total tracked service fees in the report's primary currency.
   */
  serviceFeeMinor: number;

  /**
   * Compatibility alias for serviceFeeMinor.
   */
  feeRevenueMinor: number;

  topupCustomerCashCollectedMinor: number;
  topupPrincipalMinor: number;
  topupServiceFeeMinor: number;
  topupMerchantFeeRevenueMinor: number;
  topupPlatformFeeMinor: number;
  topupFeeSplitUnknownCount: number;
  /**
   * Exact BCH miner fees paid by the merchant treasury for Topups.
   */
  topupActualMinerFeeSats: number;

  /**
   * Non-final miner-fee estimates retained only for historical/informational
   * purposes.
   */
  topupEstimatedMinerFeeSats: number;

  topupFinalMinerFeeCount: number;
  topupEstimatedMinerFeeCount: number;
  topupNetworkFeeNotCalculatedCount: number;
  topupNetworkFeeUnknownCount: number;

  topupCustomerNetworkFeeRecoveryMinor: number;
  topupCustomerNetworkFeeRecoveryKnownCount: number;

  bchBoughtByCustomersSats: number;
  bchSoldByCustomersSats: number;
  totalBchMovementSats: number;

  averageOrderValueMinor: number;
}

export interface MerchantReportActivityItem {
  id: string;
  serial: string;
  type: MerchantReportActivityType;
  occurredAt: string;
  fiatCurrency: string;

  /**
   * Compatibility amount:
   * - Topup: customer cash collected
   * - Cash-out: cash paid out
   */
  fiatAmountMinor: number;

  feeAmountMinor: number;

  /**
   * Explicit Topup accounting fields.
   *
   * Cash-out semantics will be wired separately when Cash-out Fee Model v1 is
   * integrated.
   */
  principalMinor?: number;
  merchantFeeAmountMinor?: number;
  platformFeeAmountMinor?: number;
  feeSplitKnown?: boolean;
  /**
   * Topup miner-fee accounting.
   *
   * Cash-out miner-fee semantics will remain separate.
   */
  networkFeeStatus?: MerchantReportTopupNetworkFeeStatus;

  actualMinerFeeSats?: number;
  estimatedMinerFeeSats?: number;

  customerNetworkFeeRecoveryMinor?: number;

  bchSats: number;
  status: string;
}

export interface MerchantReportPeriodTotals {
  period: MerchantReportPeriod;

  overall: MerchantReportOverallTotals;
  vouchers: MerchantReportVoucherTotals;
  cashOuts: MerchantReportCashOutTotals;

  currencyTotals: MerchantReportCurrencyTotals[];
  primaryCurrency: string;
  primaryCurrencyTotals: MerchantReportCurrencyTotals | null;
  hasMultipleCurrencies: boolean;

  activityItems: MerchantReportActivityItem[];
}

export interface MerchantReport {
  range: MerchantReportRange;
  generatedAt: string;

  comparison: MerchantReportPeriodComparison;

  current: MerchantReportPeriodTotals;
  previous: MerchantReportPeriodTotals | null;

  growth: MerchantReportGrowthSummary | null;

  sourceRecordCounts: {
    vouchersLoaded: number;
    cashOutsLoaded: number;
    reportableVouchers: number;
    reportableCashOuts: number;
  };

  privacyNotice: {
    localOnly: boolean;
    message: string;
  };
}

export interface BuildMerchantReportInput {
  range: MerchantReportRange;
  now?: Date;
  voucherRecords: VoucherRecord[];
  cashOutRecords: CashOutRecord[];
}
