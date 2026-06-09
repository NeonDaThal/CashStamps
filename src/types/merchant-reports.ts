import type { CashOutRecord } from 'src/types/cash-out';
import type { VoucherRecord } from 'src/types/voucher';

export type MerchantReportRange =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'all_time';

export type MerchantReportActivityType = 'voucher' | 'cash_out';

export type MerchantReportGrowthDirection = 'up' | 'down' | 'flat' | 'new';

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
  feeRevenueMinor: MerchantReportGrowthMetric;
  bchMovementSats: MerchantReportGrowthMetric;
}

export interface MerchantReportVoucherTotals {
  count: number;
  grossFiatRevenueMinor: number;
  netFiatRevenueMinor: number;
  feeRevenueMinor: number;
  marketBchSats: number;
  finalBchSats: number;
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

  voucherGrossFiatRevenueMinor: number;
  voucherNetFiatRevenueMinor: number;
  voucherFeeRevenueMinor: number;

  cashOutCashPaidOutMinor: number;
  cashOutCustomerSendsFiatEquivalentMinor: number;
  cashOutFeeRevenueMinor: number;

  grossFiatMovementMinor: number;
  netFiatMovementMinor: number;
  feeRevenueMinor: number;

  averageOrderValueMinor: number;
}

export interface MerchantReportOverallTotals {
  transactionCount: number;

  grossFiatMovementMinor: number;
  netFiatMovementMinor: number;
  feeRevenueMinor: number;

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
  fiatAmountMinor: number;
  feeAmountMinor: number;
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
