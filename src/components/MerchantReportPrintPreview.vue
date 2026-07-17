<template>
  <q-dialog v-model="isDialogOpen" class="merchant-report-print-dialog">
    <q-card class="print-preview-card">
      <div class="print-preview-toolbar no-print">
        <div>
          <div class="print-preview-title">
            {{ t('merchantReportsPage.printPreview.title') }}
          </div>
          <div class="print-preview-subtitle">
            {{ t('merchantReportsPage.printPreview.subtitle') }}
          </div>
        </div>

        <div class="print-preview-actions">
          <q-btn
            flat
            no-caps
            class="secondary-button"
            :label="t('merchantReportsPage.printPreview.close')"
            @click="isDialogOpen = false"
          />

          <q-btn
            unelevated
            no-caps
            icon="print"
            class="primary-button"
            :label="t('merchantReportsPage.printPreview.print')"
            @click="handlePrintPreview"
          />
        </div>
      </div>

      <q-card-section class="print-preview-scroll">
        <div class="print-page-scale-frame">
          <article class="report-print-document">
            <header class="print-header">
              <div class="print-brand-row">
                <div class="print-brand-mark">BCH</div>

                <div>
                  <div class="print-brand-title">Bitcoin Cash Topups</div>
                  <div class="print-report-title">
                    {{ t('merchantReportsPage.printPreview.reportTitle') }}
                  </div>
                </div>
              </div>

              <div class="print-meta">
                <div>
                  <span>
                    {{ t('merchantReportsPage.printPreview.selectedRange') }}
                  </span>
                  <strong>{{ currentPeriodLabel }}</strong>
                </div>

                <div>
                  <span>{{
                    t('merchantReportsPage.printPreview.generated')
                  }}</span>
                  <strong>{{ generatedAtLabel }}</strong>
                </div>
              </div>
            </header>

            <section class="print-section">
              <h2>{{ t('merchantReportsPage.printPreview.atAGlance') }}</h2>

              <div class="print-summary-grid">
                <div class="print-summary-tile topup-print-tile">
                  <span>{{
                    t('merchantReportsPage.summary.totalTopups')
                  }}</span>
                  <strong>{{
                    formatInteger(report?.current.vouchers.count ?? 0)
                  }}</strong>
                </div>

                <div class="print-summary-tile cashout-print-tile">
                  <span>
                    {{ t('merchantReportsPage.summary.cashOutsCompleted') }}
                  </span>
                  <strong>{{
                    formatInteger(report?.current.cashOuts.count ?? 0)
                  }}</strong>
                </div>

                <div class="print-summary-tile">
                  <span>{{ t('merchantReportsPage.summary.grossFiat') }}</span>
                  <strong>
                    {{
                      formatFiatAmount(
                        report?.current.overall.grossFiatMovementMinor ?? 0,
                        primaryCurrency
                      )
                    }}
                  </strong>
                </div>

                <div class="print-summary-tile">
                  <span>{{ t('merchantReportsPage.summary.netFiat') }}</span>
                  <strong>
                    {{
                      formatFiatAmount(
                        report?.current.overall.netFiatMovementMinor ?? 0,
                        primaryCurrency
                      )
                    }}
                  </strong>
                </div>

                <div class="print-summary-tile">
                  <span>{{ t('merchantReportsPage.summary.bchLoaded') }}</span>
                  <strong>
                    {{
                      formatBchSats(report?.current.vouchers.finalBchSats ?? 0)
                    }}
                  </strong>
                </div>

                <div class="print-summary-tile">
                  <span>
                    {{
                      t('merchantReportsPage.summary.bchBoughtFromCustomers')
                    }}
                  </span>
                  <strong>
                    {{
                      formatBchSats(
                        report?.current.cashOuts.bchSatsRequired ?? 0
                      )
                    }}
                  </strong>
                </div>

                <div class="print-summary-tile wide">
                  <span>{{
                    t('merchantReportsPage.summary.totalBchMovement')
                  }}</span>
                  <strong>
                    {{
                      formatBchSats(
                        report?.current.overall.totalBchMovementSats ?? 0
                      )
                    }}
                  </strong>
                </div>
              </div>
            </section>

            <section class="print-section">
              <h2>
                {{ t('merchantReportsPage.printPreview.topupsVsCashOuts') }}
              </h2>

              <div
                v-if="movementTracker.totalTransactionCount > 0"
                class="print-tracker-bar"
                aria-hidden="true"
              >
                <div
                  class="print-tracker-topup"
                  :style="{ width: movementTracker.topupFiatWidth }"
                />
                <div
                  class="print-tracker-cashout"
                  :style="{ width: movementTracker.cashOutFiatWidth }"
                />
              </div>

              <div v-else class="print-empty-line">
                {{ t('merchantReportsPage.tracker.emptyState') }}
              </div>

              <div class="print-split-grid">
                <div class="print-split-card topup">
                  <span>{{ t('merchantReportsPage.tracker.topups') }}</span>
                  <strong>
                    {{
                      formatFiatAmount(
                        movementTracker.topupFiatMinor,
                        primaryCurrency
                      )
                    }}
                  </strong>
                  <small>{{ movementTracker.topupFiatPercent }}</small>
                </div>

                <div class="print-split-card cashout">
                  <span>{{ t('merchantReportsPage.tracker.cashOuts') }}</span>
                  <strong>
                    {{
                      formatFiatAmount(
                        movementTracker.cashOutFiatMinor,
                        primaryCurrency
                      )
                    }}
                  </strong>
                  <small>{{ movementTracker.cashOutFiatPercent }}</small>
                </div>
              </div>
            </section>

            <section class="print-section">
              <h2>
                {{ t('merchantReportsPage.printPreview.currencyBreakdown') }}
              </h2>

              <div v-if="currencyRows.length === 0" class="print-empty-line">
                {{ t('merchantReportsPage.printPreview.noCurrencyData') }}
              </div>

              <div v-else class="print-currency-table">
                <div class="print-currency-row print-currency-header">
                  <span>{{
                    t('merchantReportsPage.printPreview.currency')
                  }}</span>
                  <span>{{
                    t('merchantReportsPage.printPreview.topups')
                  }}</span>
                  <span>{{
                    t('merchantReportsPage.printPreview.cashOuts')
                  }}</span>
                  <span>{{
                    t('merchantReportsPage.printPreview.totalFiat')
                  }}</span>
                </div>

                <div
                  v-for="currency in currencyRows"
                  :key="currency.currency"
                  class="print-currency-row"
                >
                  <span>{{ currency.currency }}</span>
                  <span>{{ currency.voucherCount }}</span>
                  <span>{{ currency.cashOutCount }}</span>
                  <strong>
                    {{
                      formatFiatAmount(
                        currency.grossFiatMovementMinor,
                        currency.currency
                      )
                    }}
                  </strong>
                </div>
              </div>
            </section>

            <footer class="print-footer">
              <span>{{
                t('merchantReportsPage.printPreview.localNotice')
              }}</span>
            </footer>
          </article>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  isAndroidReportPrinterAvailable,
  printAndroidReportHtml,
} from 'src/services/android-report-printer';

import type {
  MerchantReport,
  MerchantReportCurrencyTotals,
} from 'src/types/merchant-reports';

const SATS_PER_BCH = 100_000_000;

export interface MerchantReportPrintMovementTracker {
  topupFiatMinor: number;
  cashOutFiatMinor: number;
  totalFiatMinor: number;

  topupCount: number;
  cashOutCount: number;
  totalTransactionCount: number;

  topupFiatWidth: string;
  cashOutFiatWidth: string;

  topupFiatPercent: string;
  cashOutFiatPercent: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    report: MerchantReport | null;
    currentPeriodLabel: string;
    generatedAtLabel: string;
    primaryCurrency: string;
    movementTracker: MerchantReportPrintMovementTracker;
    currencyRows: MerchantReportCurrencyTotals[];
  }>(),
  {
    modelValue: false,
    report: null,
    currentPeriodLabel: '',
    generatedAtLabel: '',
    primaryCurrency: 'GBP',
    movementTracker: () => ({
      topupFiatMinor: 0,
      cashOutFiatMinor: 0,
      totalFiatMinor: 0,

      topupCount: 0,
      cashOutCount: 0,
      totalTransactionCount: 0,

      topupFiatWidth: '0%',
      cashOutFiatWidth: '0%',

      topupFiatPercent: '0%',
      cashOutFiatPercent: '0%',
    }),
    currencyRows: () => [],
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const isDialogOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

async function handlePrintPreview(): Promise<void> {
  const originalTitle = document.title;
  const reportTitle = 'Bitcoin Cash Topups Merchant Report';

  document.title = reportTitle;

  if (isAndroidReportPrinterAvailable()) {
    const reportElement = document.querySelector('.report-print-document');

    if (reportElement instanceof HTMLElement) {
      try {
        await printAndroidReportHtml({
          html: buildAndroidReportPrintHtml(reportElement.outerHTML),
          jobName: reportTitle,
        });

        document.title = originalTitle;
        return;
      } catch (error) {
        console.error(
          'Android report print failed. Falling back to web print.',
          error
        );
      }
    }
  }

  window.setTimeout(() => {
    window.print();

    window.setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  }, 100);
}

function buildAndroidReportPrintHtml(reportHtml: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bitcoin Cash Topups Merchant Report</title>
  <style>
    ${ANDROID_REPORT_PRINT_CSS}
  </style>
</head>
<body>
  ${reportHtml}
</body>
</html>`;
}

const ANDROID_REPORT_PRINT_CSS = `
@page {
  size: A4 portrait;
  margin: 14mm;
}

html,
body {
  background: #ffffff;
  color: #111111;
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.report-print-document {
  background: #ffffff;
  box-sizing: border-box;
  color: #111111;
  width: 100%;
}

.print-header {
  border-bottom: 3px solid #00ce1b;
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: space-between;
  padding-bottom: 18px;
}

.print-brand-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.print-brand-mark {
  align-items: center;
  background: #ffffff;
  border: 2px solid #00ce1b;
  border-radius: 16px;
  color: #00a816;
  display: flex;
  flex: 0 0 56px;
  font-size: 20px;
  font-weight: 900;
  height: 56px;
  justify-content: center;
  width: 56px;
}

.print-brand-title {
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -0.6px;
  line-height: 1.05;
}

.print-report-title {
  color: #555555;
  font-size: 14px;
  font-weight: 800;
  margin-top: 4px;
  text-transform: uppercase;
}

.print-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 190px;
  text-align: right;
}

.print-meta div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.print-meta span {
  color: #666666;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-meta strong {
  color: #111111;
  font-size: 13px;
  font-weight: 900;
}

.print-section {
  margin-top: 22px;
}

.print-section h2 {
  color: #111111;
  font-size: 17px;
  font-weight: 950;
  letter-spacing: -0.2px;
  margin: 0 0 12px;
}

.print-summary-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, 1fr);
}

.print-summary-tile {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.print-summary-tile.wide {
  grid-column: span 3;
}

.print-summary-tile span {
  color: #666666;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-summary-tile strong {
  color: #111111;
  font-size: 17px;
  font-weight: 950;
  line-height: 1.1;
}

.topup-print-tile {
  background: #ffffff;
  border: 2px solid #00ce1b;
}

.topup-print-tile span,
.topup-print-tile strong {
  color: #000000;
}

.cashout-print-tile {
  background: #ffffff;
  border: 2px solid #111111;
}

.cashout-print-tile span,
.cashout-print-tile strong {
  color: #111111;
}

.print-tracker-bar {
  background: #eeeeee;
  border: 1px solid #dddddd;
  border-radius: 999px;
  display: flex;
  height: 18px;
  overflow: hidden;
}

.print-tracker-topup {
  background: #00ce1b;
}

.print-tracker-cashout {
  background: #111111;
}

.print-empty-line {
  background: #f7f8f7;
  border: 1px dashed #cccccc;
  border-radius: 12px;
  color: #555555;
  font-size: 13px;
  padding: 12px;
}

.print-split-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, 1fr);
  margin-top: 12px;
}

.print-split-card {
  background: #ffffff;
  border-radius: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.print-split-card.topup {
  border: 2px solid #00ce1b;
  color: #000000;
}

.print-split-card.cashout {
  border: 2px solid #111111;
  color: #111111;
}

.print-split-card span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-split-card strong {
  font-size: 18px;
  font-weight: 950;
}

.print-split-card small {
  font-size: 12px;
  font-weight: 850;
}

.print-currency-table {
  border: 1px solid #dddddd;
  border-radius: 14px;
  overflow: hidden;
}

.print-currency-row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr 1fr 1.4fr;
  padding: 10px 12px;
}

.print-currency-row + .print-currency-row {
  border-top: 1px solid #eeeeee;
}

.print-currency-header {
  background: #f7f8f7;
  color: #111111;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-currency-row span,
.print-currency-row strong {
  font-size: 13px;
}

.print-currency-row strong {
  text-align: right;
}

.print-footer {
  border-top: 1px solid #dddddd;
  color: #666666;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  margin-top: 26px;
  padding-top: 12px;
}
`;

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
</script>

<style lang="scss" scoped>
.print-preview-card {
  background: #f1f2f1;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  height: min(92vh, 940px);
  max-width: 980px;
  min-height: 0;
  width: min(94vw, 980px);
}

.print-preview-toolbar {
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid #dddddd;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 14px 18px;
  position: sticky;
  top: 0;
  z-index: 2;
}

.print-preview-title {
  color: #111111;
  font-size: 18px;
  font-weight: 900;
}

.print-preview-subtitle {
  color: #666666;
  font-size: 13px;
  font-weight: 700;
  margin-top: 2px;
}

.print-preview-actions {
  display: flex;
  gap: 10px;
}

.primary-button,
.secondary-button {
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

.secondary-button {
  border-color: #222222;
  color: #111111;
}

.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.print-preview-scroll {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.print-page-scale-frame {
  margin: 0 auto;
  min-height: 297mm;
  width: 210mm;
}

.report-print-document {
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
  color: #111111;
  min-height: 297mm;
  padding: 18mm;
  transform-origin: top left;
  width: 210mm;
}

.print-header {
  border-bottom: 3px solid #00ce1b;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  padding-bottom: 18px;
}

.print-brand-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.print-brand-mark {
  align-items: center;
  background: #ffffff;
  border: 2px solid #00ce1b;
  border-radius: 16px;
  color: #00a816;
  display: flex;
  flex: 0 0 56px;
  font-size: 20px;
  font-weight: 900;
  height: 56px;
  justify-content: center;
  width: 56px;
}

.print-brand-title {
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -0.6px;
  line-height: 1.05;
}

.print-report-title {
  color: #555555;
  font-size: 14px;
  font-weight: 800;
  margin-top: 4px;
  text-transform: uppercase;
}

.print-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 190px;
  text-align: right;
}

.print-meta div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.print-meta span {
  color: #666666;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-meta strong {
  color: #111111;
  font-size: 13px;
  font-weight: 900;
}

.print-section {
  margin-top: 22px;
}

.print-section h2 {
  color: #111111;
  font-size: 17px;
  font-weight: 950;
  letter-spacing: -0.2px;
  margin: 0 0 12px;
}

.print-summary-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, 1fr);
}

.print-summary-tile {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.print-summary-tile.wide {
  grid-column: span 3;
}

.print-summary-tile span {
  color: #666666;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-summary-tile strong {
  color: #111111;
  font-size: 17px;
  font-weight: 950;
  line-height: 1.1;
}

.topup-print-tile {
  background: #f7fff8;
  border-color: #00ce1b;
  border-width: 2px;
}

.topup-print-tile span,
.topup-print-tile strong {
  color: #000000;
}

.cashout-print-tile {
  background: #ffffff;
  border-color: #111111;
  border-width: 2px;
}

.cashout-print-tile span,
.cashout-print-tile strong {
  color: #111111;
}

.print-tracker-bar {
  background: #eeeeee;
  border: 1px solid #dddddd;
  border-radius: 999px;
  display: flex;
  height: 18px;
  overflow: hidden;
}

.print-tracker-topup {
  background: #00ce1b;
}

.print-tracker-cashout {
  background: #111111;
}

.print-empty-line {
  background: #f7f8f7;
  border: 1px dashed #cccccc;
  border-radius: 12px;
  color: #555555;
  font-size: 13px;
  padding: 12px;
}

.print-split-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, 1fr);
  margin-top: 12px;
}

.print-split-card {
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.print-split-card.topup {
  border: 2px solid #00ce1b;
  color: #000000;
}

.print-split-card.cashout {
  border: 2px solid #111111;
  color: #111111;
}

.print-split-card span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-split-card strong {
  font-size: 18px;
  font-weight: 950;
}

.print-split-card small {
  font-size: 12px;
  font-weight: 850;
}

.print-currency-table {
  border: 1px solid #dddddd;
  border-radius: 14px;
  overflow: hidden;
}

.print-currency-row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr 1fr 1.4fr;
  padding: 10px 12px;
}

.print-currency-row + .print-currency-row {
  border-top: 1px solid #eeeeee;
}

.print-currency-header {
  background: #f7f8f7;
  color: #111111;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.print-currency-row span,
.print-currency-row strong {
  font-size: 13px;
}

.print-currency-row strong {
  text-align: right;
}

.print-footer {
  border-top: 1px solid #dddddd;
  color: #666666;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  margin-top: 26px;
  padding-top: 12px;
}

@media (max-width: 900px) {
  .print-preview-scroll {
    padding: 18px;
  }

  .print-page-scale-frame {
    min-height: 222.75mm;
    width: 157.5mm;
  }

  .report-print-document {
    transform: scale(0.75);
  }
}

@media (max-width: 720px) {
  .print-preview-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .print-preview-actions {
    flex-direction: column;
  }

  .print-preview-actions .q-btn {
    width: 100%;
  }

  .print-preview-scroll {
    padding: 14px;
  }

  .print-page-scale-frame {
    min-height: 178.2mm;
    width: 126mm;
  }

  .report-print-document {
    transform: scale(0.6);
  }
}

@media (max-width: 520px) {
  .print-page-scale-frame {
    min-height: 133.65mm;
    width: 94.5mm;
  }

  .report-print-document {
    transform: scale(0.45);
  }
}

@media (max-width: 390px) {
  .print-page-scale-frame {
    min-height: 118.8mm;
    width: 84mm;
  }

  .report-print-document {
    transform: scale(0.4);
  }
}
</style>

<style lang="scss">
@media print {
  @page {
    size: A4 portrait;
    margin: 14mm;
  }

  html,
  body {
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body * {
    visibility: hidden !important;
  }

  .report-print-document,
  .report-print-document * {
    visibility: visible !important;
  }

  .print-page-scale-frame {
    height: auto !important;
    min-height: auto !important;
    width: auto !important;
  }

  .report-print-document {
    background: #ffffff !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    color: #111111 !important;
    left: 0 !important;
    margin: 0 !important;
    max-width: none !important;
    min-height: auto !important;
    min-width: 0 !important;
    padding: 0 !important;
    position: absolute !important;
    top: 0 !important;
    transform: none !important;
    width: 100% !important;
  }

  .no-print {
    display: none !important;
  }

  .print-header {
    border-bottom: 3px solid #00ce1b !important;
    display: flex !important;
    flex-direction: row !important;
    gap: 20px !important;
    justify-content: space-between !important;
    padding-bottom: 18px !important;
  }

  .print-meta {
    text-align: right !important;
  }

  .print-summary-grid {
    display: grid !important;
    gap: 10px !important;
    grid-template-columns: repeat(3, 1fr) !important;
  }

  .print-summary-tile.wide {
    grid-column: span 3 !important;
  }

  .print-split-grid {
    display: grid !important;
    gap: 10px !important;
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .print-currency-row {
    display: grid !important;
    gap: 10px !important;
    grid-template-columns: 1fr 1fr 1fr 1.4fr !important;
  }

  .topup-print-tile,
  .print-split-card.topup {
    background: #ffffff !important;
    border: 2px solid #00ce1b !important;
    color: #000000 !important;
  }

  .cashout-print-tile,
  .print-split-card.cashout {
    background: #ffffff !important;
    border: 2px solid #111111 !important;
    color: #111111 !important;
  }

  .print-currency-header,
  .print-empty-line {
    background: #f7f8f7 !important;
  }
}
</style>
