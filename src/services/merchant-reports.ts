import type {
  BuildMerchantReportInput,
  MerchantReport,
  MerchantReportActivityItem,
  MerchantReportCashOutTotals,
  MerchantReportCurrencyTotals,
  MerchantReportGrowthMetric,
  MerchantReportGrowthSummary,
  MerchantReportOverallTotals,
  MerchantReportPeriod,
  MerchantReportPeriodTotals,
  MerchantReportRange,
  MerchantReportVoucherTotals,
} from 'src/types/merchant-reports';
import type { CashOutRecord, CashOutStatus } from 'src/types/cash-out';
import type { VoucherRecord, VoucherStatus } from 'src/types/voucher';
import { getCashOutRecords } from 'src/services/cash-out-store';
import { getVoucherRecords } from 'src/services/voucher-store';
import { getTopupRecordValues } from 'src/services/topup-record-values';
import { getCashOutRecordValues } from 'src/services/cash-out-record-values';

const DEFAULT_PRIMARY_CURRENCY = 'GBP';

const REPORTABLE_VOUCHER_STATUSES: VoucherStatus[] = [
  'funded',
  'printed',
  'redeemed',
];

const REPORTABLE_CASH_OUT_STATUSES: CashOutStatus[] = ['completed'];

const RECEIVED_CASH_OUT_STATUSES: CashOutStatus[] = ['received', 'completed'];

export async function getMerchantReport(
  range: MerchantReportRange,
  now: Date = new Date()
): Promise<MerchantReport> {
  const [voucherRecords, cashOutRecords] = await Promise.all([
    getVoucherRecords(),
    getCashOutRecords(),
  ]);

  return buildMerchantReport({
    range,
    now,
    voucherRecords,
    cashOutRecords,
  });
}

export function buildMerchantReport(
  input: BuildMerchantReportInput
): MerchantReport {
  const now = input.now ?? new Date();

  const reportableVouchers = input.voucherRecords.filter(isReportableVoucher);
  const reportableCashOuts = input.cashOutRecords.filter(isReportableCashOut);

  const allReportableActivityDates = [
    ...reportableVouchers.map(getVoucherReportDateIso),
    ...reportableCashOuts.map(getCashOutReportDateIso),
  ].filter(Boolean);

  const currentPeriod = createCurrentPeriod(
    input.range,
    now,
    allReportableActivityDates
  );

  const previousPeriod = createPreviousPeriod(currentPeriod);

  const currentTotals = buildPeriodTotals({
    period: currentPeriod,
    voucherRecords: reportableVouchers,
    cashOutRecords: reportableCashOuts,
  });

  const previousTotals = previousPeriod
    ? buildPeriodTotals({
        period: previousPeriod,
        voucherRecords: reportableVouchers,
        cashOutRecords: reportableCashOuts,
      })
    : null;

  return {
    range: input.range,
    generatedAt: now.toISOString(),

    comparison: {
      current: currentPeriod,
      previous: previousPeriod,
    },

    current: currentTotals,
    previous: previousTotals,

    growth: previousTotals
      ? buildGrowthSummary(currentTotals, previousTotals)
      : null,

    sourceRecordCounts: {
      vouchersLoaded: input.voucherRecords.length,
      cashOutsLoaded: input.cashOutRecords.length,
      reportableVouchers: reportableVouchers.length,
      reportableCashOuts: reportableCashOuts.length,
    },

    privacyNotice: {
      localOnly: true,
      message:
        'Reports are calculated locally from this device’s voucher and cash-out history. No report data is sent to a server.',
    },
  };
}

function buildPeriodTotals(input: {
  period: MerchantReportPeriod;
  voucherRecords: VoucherRecord[];
  cashOutRecords: CashOutRecord[];
}): MerchantReportPeriodTotals {
  const vouchersInPeriod = input.voucherRecords.filter((voucher) =>
    isIsoInPeriod(getVoucherReportDateIso(voucher), input.period)
  );

  const cashOutsInPeriod = input.cashOutRecords.filter((cashOut) =>
    isIsoInPeriod(getCashOutReportDateIso(cashOut), input.period)
  );

  const activityItems = buildActivityItems(vouchersInPeriod, cashOutsInPeriod);

  const vouchers = buildVoucherTotals(vouchersInPeriod);
  const cashOuts = buildCashOutTotals(cashOutsInPeriod);

  const currencyTotals = buildCurrencyTotals(
    vouchersInPeriod,
    cashOutsInPeriod
  );

  const primaryCurrency = selectPrimaryCurrency(currencyTotals);

  const primaryCurrencyTotals =
    currencyTotals.find((item) => item.currency === primaryCurrency) ?? null;

  const overall = buildOverallTotals({
    vouchers,
    cashOuts,
    primaryCurrencyTotals,
  });

  return {
    period: input.period,

    overall,
    vouchers,
    cashOuts,

    currencyTotals,
    primaryCurrency,
    primaryCurrencyTotals,
    hasMultipleCurrencies: currencyTotals.length > 1,

    activityItems,
  };
}

function buildVoucherTotals(
  voucherRecords: VoucherRecord[]
): MerchantReportVoucherTotals {
  const values = voucherRecords.map(getTopupRecordValues);

  const customerCashCollectedMinor = values.reduce(
    (total, value) => total + value.customerPaysMinor,
    0
  );

  const principalMinor = values.reduce(
    (total, value) => total + value.principalMinor,
    0
  );

  const serviceFeeMinor = values.reduce(
    (total, value) => total + value.serviceFeeMinor,
    0
  );

  const merchantFeeRevenueMinor = values.reduce(
    (total, value) => total + (value.merchantFeeMinor ?? 0),
    0
  );

  const platformFeeMinor = values.reduce(
    (total, value) => total + (value.platformFeeMinor ?? 0),
    0
  );

  const feeSplitUnknownCount = values.filter(
    (value) => value.serviceFeeMinor > 0 && !value.feeSplitKnown
  ).length;

  const actualMinerFeeSats = values.reduce(
    (total, value) => total + (value.actualMinerFeeSats ?? 0),
    0
  );

  const estimatedMinerFeeSats = values.reduce(
    (total, value) => total + (value.estimatedMinerFeeSats ?? 0),
    0
  );

  const finalMinerFeeCount = values.filter(
    (value) => value.networkFeeStatus === 'final'
  ).length;

  const estimatedMinerFeeCount = values.filter(
    (value) => value.networkFeeStatus === 'estimated'
  ).length;

  const networkFeeNotCalculatedCount = values.filter(
    (value) => value.networkFeeStatus === 'not_calculated'
  ).length;

  const networkFeeUnknownCount = values.filter(
    (value) => value.networkFeeStatus === 'unknown'
  ).length;

  const customerNetworkFeeRecoveryMinor = values.reduce(
    (total, value) => total + (value.customerNetworkFeeRecoveryMinor ?? 0),
    0
  );

  const customerNetworkFeeRecoveryKnownCount = values.filter(
    (value) => value.customerNetworkFeeRecoveryMinor !== null
  ).length;

  const marketBchSats = voucherRecords.reduce(
    (total, voucher) => total + safeNumber(voucher.marketBchSats),
    0
  );

  const finalBchSats = values.reduce(
    (total, value) => total + value.bchLoadedSats,
    0
  );

  return {
    count: voucherRecords.length,

    customerCashCollectedMinor,
    principalMinor,
    serviceFeeMinor,
    merchantFeeRevenueMinor,
    platformFeeMinor,
    feeSplitUnknownCount,
    actualMinerFeeSats,
    estimatedMinerFeeSats,

    finalMinerFeeCount,
    estimatedMinerFeeCount,
    networkFeeNotCalculatedCount,
    networkFeeUnknownCount,

    customerNetworkFeeRecoveryMinor,
    customerNetworkFeeRecoveryKnownCount,

    // Existing report consumers still use these names during B4a.
    grossFiatRevenueMinor: customerCashCollectedMinor,
    netFiatRevenueMinor: principalMinor,
    feeRevenueMinor: serviceFeeMinor,

    marketBchSats,
    finalBchSats,

    // "Average Topup Value" should mean value loaded, not cash including fees.
    averageOrderValueMinor: calculateAverageMinor(
      principalMinor,
      voucherRecords.length
    ),
  };
}

function buildCashOutTotals(
  cashOutRecords: CashOutRecord[]
): MerchantReportCashOutTotals {
  const values = cashOutRecords.map(getCashOutRecordValues);

  const cashPaidOutMinor = values.reduce(
    (total, value) => total + value.cashPaidOutMinor,
    0
  );

  const customerSendsFiatEquivalentMinor = values.reduce(
    (total, value) => total + value.customerSendsFiatEquivalentMinor,
    0
  );

  const serviceFeeMinor = values.reduce(
    (total, value) => total + value.serviceFeeMinor,
    0
  );

  const merchantFeeRevenueMinor = values.reduce(
    (total, value) => total + (value.merchantFeeMinor ?? 0),
    0
  );

  const platformFeeMinor = values.reduce(
    (total, value) => total + (value.platformFeeMinor ?? 0),
    0
  );

  const feeSplitUnknownCount = values.filter(
    (value) => value.serviceFeeMinor > 0 && !value.feeSplitKnown
  ).length;

  const accountingOnlyCount = values.filter(
    (value) => value.settlementMode === 'accounting_only'
  ).length;

  const marketBchSats = values.reduce(
    (total, value) => total + value.marketBchSats,
    0
  );

  const bchSatsRequired = values.reduce(
    (total, value) => total + value.bchRequiredSats,
    0
  );

  const bchSatsReceived = values.reduce(
    (total, value) => total + value.bchReceivedSats,
    0
  );

  return {
    count: cashOutRecords.length,

    receivedCount: cashOutRecords.filter((cashOut) =>
      RECEIVED_CASH_OUT_STATUSES.includes(cashOut.status)
    ).length,

    cashPaidOutMinor,

    customerSendsFiatEquivalentMinor,

    serviceFeeMinor,

    merchantFeeRevenueMinor,

    platformFeeMinor,

    feeSplitUnknownCount,

    accountingOnlyCount,

    // Compatibility alias.
    feeRevenueMinor: serviceFeeMinor,

    marketBchSats,

    bchSatsRequired,

    bchSatsReceived,

    averageOrderValueMinor: calculateAverageMinor(
      cashPaidOutMinor,
      cashOutRecords.length
    ),
  };
}

function buildOverallTotals(input: {
  vouchers: MerchantReportVoucherTotals;
  cashOuts: MerchantReportCashOutTotals;
  primaryCurrencyTotals: MerchantReportCurrencyTotals | null;
}): MerchantReportOverallTotals {
  const primaryCurrencyTotals = input.primaryCurrencyTotals;

  const serviceFeeMinor = primaryCurrencyTotals?.serviceFeeMinor ?? 0;

  return {
    transactionCount: input.vouchers.count + input.cashOuts.count,

    grossFiatMovementMinor: primaryCurrencyTotals?.grossFiatMovementMinor ?? 0,

    netFiatMovementMinor: primaryCurrencyTotals?.netFiatMovementMinor ?? 0,

    serviceFeeMinor,

    // Existing compatibility field. This is total tracked service fee.
    feeRevenueMinor: serviceFeeMinor,

    topupCustomerCashCollectedMinor:
      primaryCurrencyTotals?.voucherCustomerCashCollectedMinor ?? 0,

    topupPrincipalMinor: primaryCurrencyTotals?.voucherPrincipalMinor ?? 0,

    topupServiceFeeMinor: primaryCurrencyTotals?.voucherServiceFeeMinor ?? 0,

    topupMerchantFeeRevenueMinor:
      primaryCurrencyTotals?.voucherMerchantFeeRevenueMinor ?? 0,

    topupPlatformFeeMinor: primaryCurrencyTotals?.voucherPlatformFeeMinor ?? 0,

    topupFeeSplitUnknownCount:
      primaryCurrencyTotals?.voucherFeeSplitUnknownCount ?? 0,
    /**
     * BCH miner-fee metrics are taken from the complete Topup totals rather than
     * only the primary fiat currency because satoshis are currency-independent.
     */
    topupActualMinerFeeSats: input.vouchers.actualMinerFeeSats,

    topupEstimatedMinerFeeSats: input.vouchers.estimatedMinerFeeSats,

    topupFinalMinerFeeCount: input.vouchers.finalMinerFeeCount,

    topupEstimatedMinerFeeCount: input.vouchers.estimatedMinerFeeCount,

    topupNetworkFeeNotCalculatedCount:
      input.vouchers.networkFeeNotCalculatedCount,

    topupNetworkFeeUnknownCount: input.vouchers.networkFeeUnknownCount,

    topupCustomerNetworkFeeRecoveryMinor:
      primaryCurrencyTotals?.voucherCustomerNetworkFeeRecoveryMinor ?? 0,

    topupCustomerNetworkFeeRecoveryKnownCount:
      input.vouchers.customerNetworkFeeRecoveryKnownCount,

    cashOutCashPaidOutMinor:
      primaryCurrencyTotals?.cashOutCashPaidOutMinor ?? 0,

    cashOutCustomerSendsFiatEquivalentMinor:
      primaryCurrencyTotals?.cashOutCustomerSendsFiatEquivalentMinor ?? 0,

    cashOutServiceFeeMinor: primaryCurrencyTotals?.cashOutServiceFeeMinor ?? 0,

    cashOutMerchantFeeRevenueMinor:
      primaryCurrencyTotals?.cashOutMerchantFeeRevenueMinor ?? 0,

    cashOutPlatformFeeMinor:
      primaryCurrencyTotals?.cashOutPlatformFeeMinor ?? 0,

    cashOutFeeSplitUnknownCount:
      primaryCurrencyTotals?.cashOutFeeSplitUnknownCount ?? 0,

    cashOutAccountingOnlyCount:
      primaryCurrencyTotals?.cashOutAccountingOnlyCount ?? 0,

    bchBoughtByCustomersSats: input.vouchers.finalBchSats,
    bchSoldByCustomersSats: input.cashOuts.bchSatsRequired,

    totalBchMovementSats:
      input.vouchers.finalBchSats + input.cashOuts.bchSatsRequired,

    averageOrderValueMinor: calculateAverageMinor(
      primaryCurrencyTotals?.grossFiatMovementMinor ?? 0,
      input.vouchers.count + input.cashOuts.count
    ),
  };
}

function buildCurrencyTotals(
  voucherRecords: VoucherRecord[],
  cashOutRecords: CashOutRecord[]
): MerchantReportCurrencyTotals[] {
  const totalsByCurrency = new Map<string, MerchantReportCurrencyTotals>();

  for (const voucher of voucherRecords) {
    const currency = normaliseCurrency(voucher.fiatCurrency);
    const totals = getOrCreateCurrencyTotals(totalsByCurrency, currency);
    const values = getTopupRecordValues(voucher);

    totals.voucherCount += 1;
    totals.transactionCount += 1;

    totals.voucherCustomerCashCollectedMinor += values.customerPaysMinor;
    totals.voucherPrincipalMinor += values.principalMinor;
    totals.voucherServiceFeeMinor += values.serviceFeeMinor;

    totals.voucherMerchantFeeRevenueMinor += values.merchantFeeMinor ?? 0;
    totals.voucherPlatformFeeMinor += values.platformFeeMinor ?? 0;

    if (values.serviceFeeMinor > 0 && !values.feeSplitKnown) {
      totals.voucherFeeSplitUnknownCount += 1;
    }
    totals.voucherActualMinerFeeSats += values.actualMinerFeeSats ?? 0;

    totals.voucherEstimatedMinerFeeSats += values.estimatedMinerFeeSats ?? 0;

    if (values.networkFeeStatus === 'final') {
      totals.voucherFinalMinerFeeCount += 1;
    }

    if (values.networkFeeStatus === 'estimated') {
      totals.voucherEstimatedMinerFeeCount += 1;
    }

    if (values.networkFeeStatus === 'not_calculated') {
      totals.voucherNetworkFeeNotCalculatedCount += 1;
    }

    if (values.networkFeeStatus === 'unknown') {
      totals.voucherNetworkFeeUnknownCount += 1;
    }

    if (values.customerNetworkFeeRecoveryMinor !== null) {
      totals.voucherCustomerNetworkFeeRecoveryMinor +=
        values.customerNetworkFeeRecoveryMinor;

      totals.voucherCustomerNetworkFeeRecoveryKnownCount += 1;
    }

    // Compatibility aliases.
    totals.voucherGrossFiatRevenueMinor += values.customerPaysMinor;
    totals.voucherNetFiatRevenueMinor += values.principalMinor;
    totals.voucherFeeRevenueMinor += values.serviceFeeMinor;

    totals.grossFiatMovementMinor += values.customerPaysMinor;
    totals.netFiatMovementMinor += values.principalMinor;

    totals.serviceFeeMinor += values.serviceFeeMinor;
    totals.feeRevenueMinor += values.serviceFeeMinor;
  }

  for (const cashOut of cashOutRecords) {
    const currency = normaliseCurrency(cashOut.fiatCurrency);

    const totals = getOrCreateCurrencyTotals(totalsByCurrency, currency);

    const values = getCashOutRecordValues(cashOut);

    totals.cashOutCount += 1;

    totals.transactionCount += 1;

    totals.cashOutCashPaidOutMinor += values.cashPaidOutMinor;

    totals.cashOutCustomerSendsFiatEquivalentMinor +=
      values.customerSendsFiatEquivalentMinor;

    totals.cashOutServiceFeeMinor += values.serviceFeeMinor;

    totals.cashOutMerchantFeeRevenueMinor += values.merchantFeeMinor ?? 0;

    totals.cashOutPlatformFeeMinor += values.platformFeeMinor ?? 0;

    if (values.serviceFeeMinor > 0 && !values.feeSplitKnown) {
      totals.cashOutFeeSplitUnknownCount += 1;
    }

    if (values.settlementMode === 'accounting_only') {
      totals.cashOutAccountingOnlyCount += 1;
    }

    /**
     * Compatibility alias.
     */
    totals.cashOutFeeRevenueMinor += values.serviceFeeMinor;

    /**
     * Existing report movement semantics are preserved:
     *
     * Cash-out fiat movement is the physical cash handed to the customer.
     * The service fee is tracked separately rather than inflating physical
     * Cash on Hand movement.
     */
    totals.grossFiatMovementMinor += values.cashPaidOutMinor;

    totals.netFiatMovementMinor += values.cashPaidOutMinor;

    totals.serviceFeeMinor += values.serviceFeeMinor;

    // Compatibility alias.
    totals.feeRevenueMinor += values.serviceFeeMinor;
  }

  return Array.from(totalsByCurrency.values())
    .map((totals) => ({
      ...totals,
      averageOrderValueMinor: calculateAverageMinor(
        totals.grossFiatMovementMinor,
        totals.transactionCount
      ),
    }))
    .sort((a, b) => {
      if (a.currency === DEFAULT_PRIMARY_CURRENCY) {
        return -1;
      }

      if (b.currency === DEFAULT_PRIMARY_CURRENCY) {
        return 1;
      }

      return a.currency.localeCompare(b.currency);
    });
}

function getOrCreateCurrencyTotals(
  totalsByCurrency: Map<string, MerchantReportCurrencyTotals>,
  currency: string
): MerchantReportCurrencyTotals {
  const existingTotals = totalsByCurrency.get(currency);

  if (existingTotals) {
    return existingTotals;
  }

  const newTotals: MerchantReportCurrencyTotals = {
    currency,

    voucherCount: 0,
    cashOutCount: 0,
    transactionCount: 0,

    voucherCustomerCashCollectedMinor: 0,
    voucherPrincipalMinor: 0,
    voucherServiceFeeMinor: 0,
    voucherMerchantFeeRevenueMinor: 0,
    voucherPlatformFeeMinor: 0,
    voucherFeeSplitUnknownCount: 0,
    voucherActualMinerFeeSats: 0,
    voucherEstimatedMinerFeeSats: 0,

    voucherFinalMinerFeeCount: 0,
    voucherEstimatedMinerFeeCount: 0,
    voucherNetworkFeeNotCalculatedCount: 0,
    voucherNetworkFeeUnknownCount: 0,

    voucherCustomerNetworkFeeRecoveryMinor: 0,
    voucherCustomerNetworkFeeRecoveryKnownCount: 0,

    voucherGrossFiatRevenueMinor: 0,
    voucherNetFiatRevenueMinor: 0,
    voucherFeeRevenueMinor: 0,

    cashOutCashPaidOutMinor: 0,

    cashOutCustomerSendsFiatEquivalentMinor: 0,

    cashOutServiceFeeMinor: 0,

    cashOutMerchantFeeRevenueMinor: 0,

    cashOutPlatformFeeMinor: 0,

    cashOutFeeSplitUnknownCount: 0,

    cashOutAccountingOnlyCount: 0,

    cashOutFeeRevenueMinor: 0,

    grossFiatMovementMinor: 0,
    netFiatMovementMinor: 0,

    serviceFeeMinor: 0,
    feeRevenueMinor: 0,

    averageOrderValueMinor: 0,
  };

  totalsByCurrency.set(currency, newTotals);

  return newTotals;
}

function buildActivityItems(
  voucherRecords: VoucherRecord[],
  cashOutRecords: CashOutRecord[]
): MerchantReportActivityItem[] {
  const voucherItems: MerchantReportActivityItem[] = voucherRecords.map(
    (voucher) => {
      const values = getTopupRecordValues(voucher);

      return {
        id: voucher.id,
        serial: voucher.serial,
        type: 'voucher',
        occurredAt: getVoucherReportDateIso(voucher),
        fiatCurrency: normaliseCurrency(voucher.fiatCurrency),

        // Compatibility amount means cash handled for the activity item.
        fiatAmountMinor: values.customerPaysMinor,

        feeAmountMinor: values.serviceFeeMinor,

        principalMinor: values.principalMinor,

        merchantFeeAmountMinor: values.merchantFeeMinor ?? undefined,

        platformFeeAmountMinor: values.platformFeeMinor ?? undefined,

        feeSplitKnown: values.feeSplitKnown,

        networkFeeStatus: values.networkFeeStatus,

        actualMinerFeeSats: values.actualMinerFeeSats ?? undefined,

        estimatedMinerFeeSats: values.estimatedMinerFeeSats ?? undefined,

        customerNetworkFeeRecoveryMinor:
          values.customerNetworkFeeRecoveryMinor ?? undefined,

        bchSats: values.bchLoadedSats,
        status: voucher.status,
      };
    }
  );

  const cashOutItems: MerchantReportActivityItem[] = cashOutRecords.map(
    (cashOut) => {
      const values = getCashOutRecordValues(cashOut);

      return {
        id: cashOut.id,

        serial: cashOut.serial,

        type: 'cash_out',

        occurredAt: getCashOutReportDateIso(cashOut),

        fiatCurrency: normaliseCurrency(cashOut.fiatCurrency),

        /**
         * Compatibility amount = physical cash payout.
         */
        fiatAmountMinor: values.cashPaidOutMinor,

        feeAmountMinor: values.serviceFeeMinor,

        merchantFeeAmountMinor: values.merchantFeeMinor ?? undefined,

        platformFeeAmountMinor: values.platformFeeMinor ?? undefined,

        feeSplitKnown: values.feeSplitKnown,

        cashOutCustomerSendsFiatEquivalentMinor:
          values.customerSendsFiatEquivalentMinor,

        cashOutSettlementMode: values.settlementMode,

        bchSats: values.bchRequiredSats,

        status: cashOut.status,
      };
    }
  );

  return [...voucherItems, ...cashOutItems].sort((a, b) => {
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
}

function buildGrowthSummary(
  current: MerchantReportPeriodTotals,
  previous: MerchantReportPeriodTotals
): MerchantReportGrowthSummary {
  return {
    transactionCount: buildGrowthMetric(
      current.overall.transactionCount,
      previous.overall.transactionCount
    ),

    voucherCount: buildGrowthMetric(
      current.vouchers.count,
      previous.vouchers.count
    ),

    cashOutCount: buildGrowthMetric(
      current.cashOuts.count,
      previous.cashOuts.count
    ),

    grossFiatMovementMinor: buildGrowthMetric(
      current.overall.grossFiatMovementMinor,
      previous.overall.grossFiatMovementMinor
    ),

    netFiatMovementMinor: buildGrowthMetric(
      current.overall.netFiatMovementMinor,
      previous.overall.netFiatMovementMinor
    ),

    feeRevenueMinor: buildGrowthMetric(
      current.overall.serviceFeeMinor,
      previous.overall.serviceFeeMinor
    ),

    bchMovementSats: buildGrowthMetric(
      current.overall.totalBchMovementSats,
      previous.overall.totalBchMovementSats
    ),

    topupActualMinerFeeSats: buildGrowthMetric(
      current.overall.topupActualMinerFeeSats,
      previous.overall.topupActualMinerFeeSats
    ),
  };
}

function buildGrowthMetric(
  currentValue: number,
  previousValue: number
): MerchantReportGrowthMetric {
  const absoluteChange = currentValue - previousValue;

  if (previousValue === 0 && currentValue === 0) {
    return {
      currentValue,
      previousValue,
      absoluteChange,
      percentageChange: 0,
      direction: 'flat',
    };
  }

  if (previousValue === 0 && currentValue > 0) {
    return {
      currentValue,
      previousValue,
      absoluteChange,
      percentageChange: null,
      direction: 'new',
    };
  }

  const percentageChange = (absoluteChange / previousValue) * 100;

  return {
    currentValue,
    previousValue,
    absoluteChange,
    percentageChange,
    direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'flat',
  };
}

function createCurrentPeriod(
  range: MerchantReportRange,
  now: Date,
  reportableActivityDates: string[]
): MerchantReportPeriod {
  const end = new Date(now);

  if (range === 'all_time') {
    const earliestActivityDate = getEarliestIsoDate(reportableActivityDates);

    return {
      range,
      label: 'All time',
      startIso: earliestActivityDate,
      endIso: end.toISOString(),
    };
  }

  const start =
    range === 'today'
      ? startOfDay(now)
      : range === 'week'
      ? startOfWeek(now)
      : range === 'month'
      ? startOfMonth(now)
      : startOfYear(now);

  return {
    range,
    label: getRangeLabel(range),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function createPreviousPeriod(
  currentPeriod: MerchantReportPeriod
): MerchantReportPeriod | null {
  if (!currentPeriod.startIso || currentPeriod.range === 'all_time') {
    return null;
  }

  const currentStart = new Date(currentPeriod.startIso);
  const currentEnd = new Date(currentPeriod.endIso);

  const currentDurationMs = currentEnd.getTime() - currentStart.getTime();

  const previousEnd = new Date(currentStart);

  const previousStart = new Date(previousEnd.getTime() - currentDurationMs);

  return {
    range: currentPeriod.range,
    label: `Previous ${currentPeriod.label.toLowerCase()}`,
    startIso: previousStart.toISOString(),
    endIso: previousEnd.toISOString(),
  };
}

function isIsoInPeriod(
  isoValue: string,
  period: MerchantReportPeriod
): boolean {
  const timestamp = new Date(isoValue).getTime();

  const startTimestamp = period.startIso
    ? new Date(period.startIso).getTime()
    : Number.NEGATIVE_INFINITY;

  const endTimestamp = new Date(period.endIso).getTime();

  return timestamp >= startTimestamp && timestamp < endTimestamp;
}

function getVoucherReportDateIso(voucher: VoucherRecord): string {
  return (
    voucher.printedAt ||
    voucher.fundingDetectedAt ||
    voucher.updatedAt ||
    voucher.createdAt
  );
}

function getCashOutReportDateIso(cashOut: CashOutRecord): string {
  return (
    cashOut.completedAt ||
    cashOut.detectedAt ||
    cashOut.updatedAt ||
    cashOut.createdAt
  );
}

function isReportableVoucher(voucher: VoucherRecord): boolean {
  /**
   * Replacement vouchers fulfil an existing customer sale.
   *
   * The original voucher remains the one accounting/reporting source.
   */
  if (voucher.replacement) {
    return false;
  }

  /**
   * A successfully reclaimed original Printed voucher STILL represents the
   * real customer sale which occurred.
   *
   * Reclaim changes where the failed original BCH ended up; it does not undo:
   *
   * - the customer's cash payment
   * - the service/platform fee
   * - the sale count
   * - the customer's BCH entitlement, which was fulfilled by its linked
   *   replacement voucher
   */
  if (
    voucher.status === 'reclaimed' &&
    voucher.printedRecovery?.resolution === 'replacement_required' &&
    voucher.printedRecovery.reclaimStatus === 'reclaimed'
  ) {
    return true;
  }

  return REPORTABLE_VOUCHER_STATUSES.includes(voucher.status);
}

function isReportableCashOut(cashOut: CashOutRecord): boolean {
  return REPORTABLE_CASH_OUT_STATUSES.includes(cashOut.status);
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  return date;
}

function startOfWeek(value: Date): Date {
  const date = startOfDay(value);

  const day = date.getDay();

  const daysSinceMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - daysSinceMonday);

  return date;
}

function startOfMonth(value: Date): Date {
  const date = startOfDay(value);
  date.setDate(1);

  return date;
}

function startOfYear(value: Date): Date {
  const date = startOfDay(value);
  date.setMonth(0, 1);

  return date;
}

function getEarliestIsoDate(isoDates: string[]): string | null {
  if (isoDates.length === 0) {
    return null;
  }

  return isoDates.reduce((earliest, current) => {
    return new Date(current).getTime() < new Date(earliest).getTime()
      ? current
      : earliest;
  });
}

function getRangeLabel(range: MerchantReportRange): string {
  if (range === 'today') {
    return 'Today';
  }

  if (range === 'week') {
    return 'This week';
  }

  if (range === 'month') {
    return 'This month';
  }

  if (range === 'year') {
    return 'This year';
  }

  return 'All time';
}

function selectPrimaryCurrency(
  currencyTotals: MerchantReportCurrencyTotals[]
): string {
  if (
    currencyTotals.some((item) => item.currency === DEFAULT_PRIMARY_CURRENCY)
  ) {
    return DEFAULT_PRIMARY_CURRENCY;
  }

  return currencyTotals[0]?.currency ?? DEFAULT_PRIMARY_CURRENCY;
}

function normaliseCurrency(currency: string | undefined): string {
  const normalisedCurrency = currency?.trim().toUpperCase();

  return normalisedCurrency || DEFAULT_PRIMARY_CURRENCY;
}

function calculateAverageMinor(totalMinor: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return Math.round(totalMinor / count);
}

function safeNumber(value: number | undefined | null): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value);
}
