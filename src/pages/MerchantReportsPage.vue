<template>
  <q-page padding class="merchant-reports-page">
    <div class="merchant-reports-container">
      <section class="reports-hero">
        <div>
          <p class="eyebrow">{{ t('merchantReportsPage.hero.eyebrow') }}</p>
          <h1>{{ t('merchantReportsPage.hero.title') }}</h1>
          <p class="intro">
            {{ t('merchantReportsPage.hero.intro') }}
          </p>
        </div>

        <div class="hero-actions">
          <q-btn
            class="secondary-button"
            :label="t('merchantReportsPage.actions.viewHistory')"
            icon="receipt_long"
            to="/voucher-history"
            outline
            no-caps
          />

          <q-btn
            class="primary-button"
            :label="t('merchantReportsPage.actions.sellVoucher')"
            icon="point_of_sale"
            to="/sell-voucher"
            unelevated
            no-caps
          />
        </div>
      </section>

      <q-card flat bordered class="main-card range-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="date_range" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.range.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.range.subtitle') }}
              </p>
            </div>
          </div>

          <div class="range-toggle-wrap q-mt-md">
            <q-btn-toggle
              v-model="selectedRange"
              :options="rangeOptions"
              class="range-toggle"
              toggle-color="green-6"
              color="white"
              text-color="black"
              unelevated
              no-caps
            />
          </div>

          <div class="period-row q-mt-md">
            <div>
              <div class="period-label">
                {{ t('merchantReportsPage.period.currentRange') }}
              </div>
              <div class="period-value">
                {{ currentPeriodLabel }}
              </div>
            </div>

            <q-btn
              flat
              dense
              round
              icon="refresh"
              class="refresh-button"
              :loading="isLoading"
              :aria-label="t('merchantReportsPage.actions.refreshReport')"
              @click="loadReport"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9" rounded>
        <template #avatar>
          <q-icon name="error" />
        </template>

        {{ errorMessage }}
      </q-banner>

      <q-banner
        v-if="isLoading && !report"
        class="bg-grey-2 text-grey-9"
        rounded
      >
        <template #avatar>
          <q-spinner size="20px" />
        </template>

        {{ t('merchantReportsPage.messages.loadingReport') }}
      </q-banner>

      <section class="summary-grid">
        <q-card
          v-for="card in summaryCards"
          :key="card.key"
          flat
          bordered
          class="summary-card"
          :class="{ 'summary-card-highlight': card.highlight }"
        >
          <q-card-section>
            <div class="summary-top-row">
              <div class="summary-icon">
                <q-icon :name="card.icon" />
              </div>

              <q-badge class="summary-status-badge">
                {{ card.badge }}
              </q-badge>
            </div>

            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value">{{ card.value }}</div>
            <p class="summary-caption">
              {{ card.caption }}
            </p>
          </q-card-section>
        </q-card>
      </section>

      <q-card flat bordered class="main-card target-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="emoji_events" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.targets.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.targets.subtitle') }}
              </p>
            </div>
          </div>

          <div class="target-preview q-mt-md">
            <div class="target-preview-copy">
              <div class="target-label">
                {{ t('merchantReportsPage.targets.progressLabel') }}
              </div>
              <div class="target-value">{{ targetStatusLabel }}</div>
            </div>

            <q-linear-progress
              :value="targetProgressValue"
              rounded
              size="12px"
              class="target-progress"
            />

            <p class="target-empty-state">
              {{ targetStatusMessage }}
            </p>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="bar_chart" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.breakdowns.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.breakdowns.subtitle') }}
              </p>
            </div>
          </div>

          <div class="breakdown-grid q-mt-md">
            <div class="breakdown-tile highlight">
              <div class="breakdown-title">
                {{ t('merchantReportsPage.breakdowns.currencyTitle') }}
              </div>

              <div v-if="currencyRows.length === 0" class="breakdown-empty">
                {{ t('merchantReportsPage.breakdowns.noCurrencyData') }}
              </div>

              <div v-else class="currency-list">
                <div
                  v-for="currency in currencyRows"
                  :key="currency.currency"
                  class="currency-row"
                >
                  <div>
                    <strong>{{ currency.currency }}</strong>
                    <span>
                      {{
                        t('merchantReportsPage.breakdowns.voucherCount', {
                          count: currency.voucherCount,
                        })
                      }}
                    </span>
                  </div>

                  <strong>
                    {{
                      formatFiatAmount(
                        currency.voucherGrossFiatRevenueMinor,
                        currency.currency
                      )
                    }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="breakdown-tile">
              <div class="breakdown-title">
                {{ t('merchantReportsPage.breakdowns.flowTitle') }}
              </div>

              <div class="mini-stat-row">
                <span>{{
                  t('merchantReportsPage.breakdowns.vouchersIssued')
                }}</span>
                <strong>{{ report?.current.vouchers.count ?? 0 }}</strong>
              </div>

              <div class="mini-stat-row">
                <span>{{ t('merchantReportsPage.breakdowns.bchLoaded') }}</span>
                <strong>
                  {{
                    formatBchSats(report?.current.vouchers.finalBchSats ?? 0)
                  }}
                </strong>
              </div>

              <p>
                {{ t('merchantReportsPage.breakdowns.flowText') }}
              </p>
            </div>

            <div class="breakdown-tile">
              <div class="breakdown-title">
                {{ t('merchantReportsPage.breakdowns.statusTitle') }}
              </div>

              <div class="mini-stat-row">
                <span>{{
                  t('merchantReportsPage.breakdowns.recordsLoaded')
                }}</span>
                <strong>{{
                  report?.sourceRecordCounts.vouchersLoaded ?? 0
                }}</strong>
              </div>

              <div class="mini-stat-row">
                <span>{{
                  t('merchantReportsPage.breakdowns.reportableVouchers')
                }}</span>
                <strong>
                  {{ report?.sourceRecordCounts.reportableVouchers ?? 0 }}
                </strong>
              </div>

              <p>
                {{ t('merchantReportsPage.breakdowns.statusText') }}
              </p>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="ios_share" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.reportActions.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.reportActions.subtitle') }}
              </p>
            </div>
          </div>

          <div class="report-action-grid q-mt-md">
            <q-btn
              v-for="action in reportActions"
              :key="action.key"
              class="report-action-button"
              :label="action.label"
              :icon="action.icon"
              disable
              outline
              no-caps
            >
              <q-tooltip>
                {{ t('merchantReportsPage.reportActions.comingSoon') }}
              </q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="privacy_tip" />
        </template>

        <strong>{{ t('merchantReportsPage.localFirst.title') }}</strong>
        {{ localFirstMessage }}
      </q-banner>

      <q-banner class="bg-green-1 text-green-10" rounded>
        <template #avatar>
          <q-icon name="check_circle" />
        </template>

        {{ t('merchantReportsPage.connectedNotice') }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getMerchantReport } from 'src/services/merchant-reports';
import type {
  MerchantReport,
  MerchantReportRange,
} from 'src/types/merchant-reports';

const SATS_PER_BCH = 100_000_000;
const DEFAULT_CURRENCY = 'GBP';

interface SummaryCard {
  key: string;
  icon: string;
  label: string;
  value: string;
  caption: string;
  badge: string;
  highlight?: boolean;
}

interface ReportAction {
  key: string;
  icon: string;
  label: string;
}

const { t } = useI18n({ useScope: 'global' });

const selectedRange = ref<MerchantReportRange>('today');
const report = ref<MerchantReport | null>(null);
const isLoading = ref(false);
const errorMessage = ref('');

const rangeOptions = computed(() => [
  {
    label: t('merchantReportsPage.ranges.today'),
    value: 'today',
  },
  {
    label: t('merchantReportsPage.ranges.week'),
    value: 'week',
  },
  {
    label: t('merchantReportsPage.ranges.month'),
    value: 'month',
  },
  {
    label: t('merchantReportsPage.ranges.year'),
    value: 'year',
  },
  {
    label: t('merchantReportsPage.ranges.allTime'),
    value: 'all_time',
  },
]);

const primaryCurrency = computed(() => {
  return report.value?.current.primaryCurrency ?? DEFAULT_CURRENCY;
});

const currentPeriodLabel = computed(() => {
  if (!report.value) {
    return t('merchantReportsPage.period.loading');
  }

  return formatReportPeriod(
    report.value.current.period.startIso,
    report.value.current.period.endIso
  );
});

const currencyRows = computed(() => {
  return report.value?.current.currencyTotals ?? [];
});

const localFirstMessage = computed(() => {
  return (
    report.value?.privacyNotice.message ??
    t('merchantReportsPage.localFirst.message')
  );
});

const summaryCards = computed<SummaryCard[]>(() => {
  const voucherTotals = report.value?.current.vouchers;
  const growthMetric = report.value?.growth?.voucherCount ?? null;

  return [
    {
      key: 'total-vouchers',
      icon: 'confirmation_number',
      label: t('merchantReportsPage.summary.totalVouchers'),
      value: formatInteger(voucherTotals?.count ?? 0),
      caption: t('merchantReportsPage.summary.totalVouchersCaption'),
      badge: t('merchantReportsPage.summary.localData'),
      highlight: true,
    },
    {
      key: 'gross-fiat',
      icon: 'payments',
      label: t('merchantReportsPage.summary.grossFiat'),
      value: formatFiatAmount(
        voucherTotals?.grossFiatRevenueMinor ?? 0,
        primaryCurrency.value
      ),
      caption: t('merchantReportsPage.summary.grossFiatCaption'),
      badge: primaryCurrency.value,
    },
    {
      key: 'net-fiat',
      icon: 'savings',
      label: t('merchantReportsPage.summary.netFiat'),
      value: formatFiatAmount(
        voucherTotals?.netFiatRevenueMinor ?? 0,
        primaryCurrency.value
      ),
      caption: t('merchantReportsPage.summary.netFiatCaption'),
      badge: primaryCurrency.value,
    },
    {
      key: 'bch-loaded',
      icon: 'currency_bitcoin',
      label: t('merchantReportsPage.summary.bchLoaded'),
      value: formatBchSats(voucherTotals?.finalBchSats ?? 0),
      caption: t('merchantReportsPage.summary.bchLoadedCaption'),
      badge: 'BCH',
    },
    {
      key: 'average-voucher-value',
      icon: 'shopping_basket',
      label: t('merchantReportsPage.summary.averageVoucherValue'),
      value: formatFiatAmount(
        voucherTotals?.averageOrderValueMinor ?? 0,
        primaryCurrency.value
      ),
      caption: t('merchantReportsPage.summary.averageVoucherValueCaption'),
      badge: primaryCurrency.value,
    },
    {
      key: 'growth',
      icon: 'trending_up',
      label: t('merchantReportsPage.summary.growth'),
      value: formatGrowthSummaryValue(growthMetric),
      caption: t('merchantReportsPage.summary.growthCaption'),
      badge: t('merchantReportsPage.summary.previousPeriod'),
    },
  ];
});

const targetProgressValue = computed(() => {
  const metric = report.value?.growth?.grossFiatMovementMinor;

  if (!metric) {
    return 0;
  }

  if (metric.previousValue <= 0) {
    return metric.currentValue > 0 ? 1 : 0;
  }

  return Math.min(1, metric.currentValue / metric.previousValue);
});

const targetStatusLabel = computed(() => {
  const metric = report.value?.growth?.grossFiatMovementMinor;

  if (!metric) {
    return t('merchantReportsPage.targets.noPreviousPeriod');
  }

  if (metric.direction === 'new') {
    return t('merchantReportsPage.targets.newActivity');
  }

  if (metric.direction === 'flat') {
    return t('merchantReportsPage.targets.matchedLastPeriod');
  }

  if (metric.absoluteChange > 0) {
    return t('merchantReportsPage.targets.aheadBy', {
      amount: formatFiatAmount(
        Math.abs(metric.absoluteChange),
        primaryCurrency.value
      ),
    });
  }

  return t('merchantReportsPage.targets.leftToBeat', {
    amount: formatFiatAmount(
      Math.abs(metric.absoluteChange),
      primaryCurrency.value
    ),
  });
});

const targetStatusMessage = computed(() => {
  const metric = report.value?.growth?.grossFiatMovementMinor;

  if (!metric) {
    return t('merchantReportsPage.targets.noPreviousPeriodMessage');
  }

  if (metric.direction === 'new') {
    return t('merchantReportsPage.targets.newActivityMessage');
  }

  if (metric.direction === 'up') {
    return t('merchantReportsPage.targets.aheadMessage');
  }

  if (metric.direction === 'down') {
    return t('merchantReportsPage.targets.behindMessage');
  }

  return t('merchantReportsPage.targets.matchedMessage');
});

const reportActions = computed<ReportAction[]>(() => [
  {
    key: 'print',
    icon: 'print',
    label: t('merchantReportsPage.actions.printReport'),
  },
  {
    key: 'pdf',
    icon: 'picture_as_pdf',
    label: t('merchantReportsPage.actions.exportPdf'),
  },
  {
    key: 'image',
    icon: 'image',
    label: t('merchantReportsPage.actions.saveImage'),
  },
  {
    key: 'share',
    icon: 'share',
    label: t('merchantReportsPage.actions.shareReport'),
  },
]);

async function loadReport(): Promise<void> {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    report.value = await getMerchantReport(selectedRange.value);
  } catch (error) {
    console.error(error);
    errorMessage.value = t('merchantReportsPage.messages.couldNotLoadReport');
  } finally {
    isLoading.value = false;
  }
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}

function formatBchSats(sats: number): string {
  const bchAmount = sats / SATS_PER_BCH;

  return `${new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: bchAmount > 0 && bchAmount < 1 ? 8 : 0,
    maximumFractionDigits: 8,
  }).format(bchAmount)} BCH`;
}

function formatGrowthSummaryValue(
  metric: MerchantReport['growth'] extends null
    ? never
    : NonNullable<MerchantReport['growth']>['voucherCount'] | null
): string {
  if (!metric) {
    return t('merchantReportsPage.summary.noPreviousPeriod');
  }

  if (metric.direction === 'new') {
    return t('merchantReportsPage.summary.newActivity');
  }

  if (metric.percentageChange === null) {
    return t('merchantReportsPage.summary.noPreviousPeriod');
  }

  const sign = metric.percentageChange > 0 ? '+' : '';

  return `${sign}${metric.percentageChange.toFixed(1)}%`;
}

function formatReportPeriod(startIso: string | null, endIso: string): string {
  if (!startIso) {
    return t('merchantReportsPage.period.noRecordsYet');
  }

  const startLabel = formatDate(startIso);
  const endLabel = formatDate(endIso);

  if (startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

watch(selectedRange, () => {
  void loadReport();
});

onMounted(() => {
  void loadReport();
});
</script>

<style lang="scss" scoped>
.merchant-reports-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.merchant-reports-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 960px;
  width: 100%;
}

.reports-hero,
.main-card,
.summary-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.reports-hero {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 24px;
}

.eyebrow {
  color: #4b4b4b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

h1 {
  color: #111111;
  font-size: clamp(32px, 8vw, 48px);
  font-weight: 900;
  letter-spacing: -1.2px;
  line-height: 1.08;
  margin: 0;
}

.intro {
  color: #444444;
  font-size: 16px;
  line-height: 1.45;
  margin: 12px 0 0;
  max-width: 620px;
}

.hero-actions {
  align-items: stretch;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
}

.section-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.section-icon {
  align-items: center;
  background: #00ce1b;
  border-radius: 16px;
  color: #000000;
  display: flex;
  flex: 0 0 48px;
  font-size: 28px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.primary-button,
.secondary-button,
.report-action-button,
.refresh-button {
  border-radius: 14px;
  font-weight: 850;
  min-height: 42px;
  overflow: hidden;
  padding: 0 18px;
}

.primary-button {
  background: #00ce1b;
  color: #000000;
}

.secondary-button,
.report-action-button {
  border-color: #222222;
  color: #111111;
}

.refresh-button {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  color: #111111;
  padding: 0;
}

.range-card :deep(.q-card__section) {
  padding: 18px;
}

.range-toggle-wrap {
  overflow-x: auto;
  padding-bottom: 2px;
}

.range-toggle {
  border: 1px solid #dddddd;
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;
}

.range-toggle :deep(.q-btn) {
  font-weight: 850;
  min-height: 42px;
}

.period-row {
  align-items: center;
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.period-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.period-value {
  color: #111111;
  font-size: 15px;
  font-weight: 850;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.summary-card :deep(.q-card__section) {
  padding: 18px;
}

.summary-card-highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12), 0 12px 28px rgba(0, 0, 0, 0.08);
}

.summary-top-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.summary-icon {
  align-items: center;
  background: rgba(0, 206, 27, 0.14);
  border-radius: 14px;
  color: #00a816;
  display: flex;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.summary-status-badge {
  background: #eeeeee;
  border-radius: 999px;
  color: #444444;
  font-size: 11px;
  font-weight: 850;
  padding: 5px 8px;
}

.summary-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.summary-value {
  color: #111111;
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
  overflow-wrap: anywhere;
}

.summary-caption {
  color: #666666;
  font-size: 13px;
  line-height: 1.35;
  margin: 10px 0 0;
}

.target-preview {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 16px;
}

.target-preview-copy {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-bottom: 10px;
}

.target-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.target-value {
  color: #111111;
  font-size: 18px;
  font-weight: 900;
  text-align: right;
}

.target-progress {
  color: #00ce1b;
}

.target-empty-state {
  color: #555555;
  line-height: 1.45;
  margin: 12px 0 0;
}

.breakdown-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.breakdown-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 16px;
}

.breakdown-tile.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.breakdown-title {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
  margin-bottom: 8px;
}

.breakdown-tile p {
  color: #555555;
  line-height: 1.45;
  margin: 12px 0 0;
}

.breakdown-empty {
  color: #555555;
  line-height: 1.45;
}

.currency-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.currency-row,
.mini-stat-row {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.currency-row + .currency-row,
.mini-stat-row + .mini-stat-row {
  border-top: 1px solid #e5e5e5;
  padding-top: 10px;
}

.currency-row div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.currency-row span,
.mini-stat-row span {
  color: #666666;
  font-size: 13px;
}

.currency-row strong,
.mini-stat-row strong {
  color: #111111;
  font-weight: 900;
  text-align: right;
}

.report-action-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, 1fr);
}

.main-card {
  overflow: hidden;
}

.main-card :deep(.q-card__section) {
  padding: 18px;
}

.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper),
.report-action-button :deep(.q-focus-helper),
.refresh-button :deep(.q-focus-helper),
.main-card :deep(.q-focus-helper) {
  border-radius: inherit;
}

@media (max-width: 800px) {
  .reports-hero {
    flex-direction: column;
    padding: 22px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions .q-btn {
    width: 100%;
  }

  .summary-grid,
  .breakdown-grid {
    grid-template-columns: 1fr;
  }

  .report-action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 460px) {
  .report-action-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
  }

  .target-preview-copy,
  .currency-row,
  .mini-stat-row {
    flex-direction: column;
  }

  .target-value,
  .currency-row strong,
  .mini-stat-row strong {
    text-align: left;
  }
}
</style>
