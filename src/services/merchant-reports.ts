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
  const grossFiatRevenueMinor = voucherRecords.reduce(
    (total, voucher) => total + safeNumber(voucher.fiatAmountMinor),
    0
  );

  const feeRevenueMinor = voucherRecords.reduce(
    (total, voucher) => total + safeNumber(voucher.fee?.amountMinor),
    0
  );

  const netFiatRevenueMinor = Math.max(
    0,
    grossFiatRevenueMinor - feeRevenueMinor
  );

  const marketBchSats = voucherRecords.reduce(
    (total, voucher) => total + safeNumber(voucher.marketBchSats),
    0
  );

  const finalBchSats = voucherRecords.reduce(
    (total, voucher) => total + safeNumber(voucher.finalBchSats),
    0
  );

  return {
    count: voucherRecords.length,
    grossFiatRevenueMinor,
    netFiatRevenueMinor,
    feeRevenueMinor,
    marketBchSats,
    finalBchSats,
    averageOrderValueMinor: calculateAverageMinor(
      grossFiatRevenueMinor,
      voucherRecords.length
    ),
  };
}

function buildCashOutTotals(
  cashOutRecords: CashOutRecord[]
): MerchantReportCashOutTotals {
  const cashPaidOutMinor = cashOutRecords.reduce(
    (total, cashOut) => total + safeNumber(cashOut.fiatAmountMinor),
    0
  );

  const customerSendsFiatEquivalentMinor = cashOutRecords.reduce(
    (total, cashOut) =>
      total + safeNumber(cashOut.customerSendsFiatEquivalentMinor),
    0
  );

  const feeRevenueMinor = cashOutRecords.reduce(
    (total, cashOut) =>
      total + safeNumber(cashOut.fee?.totalServiceFeeAmountMinor),
    0
  );

  const marketBchSats = cashOutRecords.reduce(
    (total, cashOut) => total + safeNumber(cashOut.marketBchSats),
    0
  );

  const bchSatsRequired = cashOutRecords.reduce(
    (total, cashOut) => total + safeNumber(cashOut.bchSatsRequired),
    0
  );

  const bchSatsReceived = cashOutRecords.reduce(
    (total, cashOut) => total + safeNumber(cashOut.bchSatsReceived),
    0
  );

  return {
    count: cashOutRecords.length,
    receivedCount: cashOutRecords.filter((cashOut) =>
      RECEIVED_CASH_OUT_STATUSES.includes(cashOut.status)
    ).length,
    cashPaidOutMinor,
    customerSendsFiatEquivalentMinor,
    feeRevenueMinor,
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
  return {
    transactionCount: input.vouchers.count + input.cashOuts.count,

    grossFiatMovementMinor:
      input.primaryCurrencyTotals?.grossFiatMovementMinor ?? 0,
    netFiatMovementMinor:
      input.primaryCurrencyTotals?.netFiatMovementMinor ?? 0,
    feeRevenueMinor: input.primaryCurrencyTotals?.feeRevenueMinor ?? 0,

    bchBoughtByCustomersSats: input.vouchers.finalBchSats,
    bchSoldByCustomersSats: input.cashOuts.bchSatsRequired,
    totalBchMovementSats:
      input.vouchers.finalBchSats + input.cashOuts.bchSatsRequired,

    averageOrderValueMinor: calculateAverageMinor(
      input.primaryCurrencyTotals?.grossFiatMovementMinor ?? 0,
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

    const grossFiatRevenueMinor = safeNumber(voucher.fiatAmountMinor);
    const feeRevenueMinor = safeNumber(voucher.fee?.amountMinor);
    const netFiatRevenueMinor = Math.max(
      0,
      grossFiatRevenueMinor - feeRevenueMinor
    );

    totals.voucherCount += 1;
    totals.transactionCount += 1;

    totals.voucherGrossFiatRevenueMinor += grossFiatRevenueMinor;
    totals.voucherNetFiatRevenueMinor += netFiatRevenueMinor;
    totals.voucherFeeRevenueMinor += feeRevenueMinor;

    totals.grossFiatMovementMinor += grossFiatRevenueMinor;
    totals.netFiatMovementMinor += netFiatRevenueMinor;
    totals.feeRevenueMinor += feeRevenueMinor;
  }

  for (const cashOut of cashOutRecords) {
    const currency = normaliseCurrency(cashOut.fiatCurrency);
    const totals = getOrCreateCurrencyTotals(totalsByCurrency, currency);

    const cashPaidOutMinor = safeNumber(cashOut.fiatAmountMinor);
    const customerSendsFiatEquivalentMinor = safeNumber(
      cashOut.customerSendsFiatEquivalentMinor
    );
    const feeRevenueMinor = safeNumber(cashOut.fee?.totalServiceFeeAmountMinor);

    totals.cashOutCount += 1;
    totals.transactionCount += 1;

    totals.cashOutCashPaidOutMinor += cashPaidOutMinor;
    totals.cashOutCustomerSendsFiatEquivalentMinor +=
      customerSendsFiatEquivalentMinor;
    totals.cashOutFeeRevenueMinor += feeRevenueMinor;

    totals.grossFiatMovementMinor += cashPaidOutMinor;
    totals.netFiatMovementMinor += cashPaidOutMinor;
    totals.feeRevenueMinor += feeRevenueMinor;
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

    voucherGrossFiatRevenueMinor: 0,
    voucherNetFiatRevenueMinor: 0,
    voucherFeeRevenueMinor: 0,

    cashOutCashPaidOutMinor: 0,
    cashOutCustomerSendsFiatEquivalentMinor: 0,
    cashOutFeeRevenueMinor: 0,

    grossFiatMovementMinor: 0,
    netFiatMovementMinor: 0,
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
    (voucher) => ({
      id: voucher.id,
      serial: voucher.serial,
      type: 'voucher',
      occurredAt: getVoucherReportDateIso(voucher),
      fiatCurrency: normaliseCurrency(voucher.fiatCurrency),
      fiatAmountMinor: safeNumber(voucher.fiatAmountMinor),
      feeAmountMinor: safeNumber(voucher.fee?.amountMinor),
      bchSats: safeNumber(voucher.finalBchSats),
      status: voucher.status,
    })
  );

  const cashOutItems: MerchantReportActivityItem[] = cashOutRecords.map(
    (cashOut) => ({
      id: cashOut.id,
      serial: cashOut.serial,
      type: 'cash_out',
      occurredAt: getCashOutReportDateIso(cashOut),
      fiatCurrency: normaliseCurrency(cashOut.fiatCurrency),
      fiatAmountMinor: safeNumber(cashOut.fiatAmountMinor),
      feeAmountMinor: safeNumber(cashOut.fee?.totalServiceFeeAmountMinor),
      bchSats: safeNumber(cashOut.bchSatsRequired),
      status: cashOut.status,
    })
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
      current.overall.feeRevenueMinor,
      previous.overall.feeRevenueMinor
    ),
    bchMovementSats: buildGrowthMetric(
      current.overall.totalBchMovementSats,
      previous.overall.totalBchMovementSats
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
