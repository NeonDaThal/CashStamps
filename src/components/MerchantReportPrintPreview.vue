<template>
  <q-dialog v-model="isDialogOpen" class="merchant-report-print-dialog">
    <q-card class="print-preview-card">
      <Transition name="image-save-toast">
        <div
          v-if="saveToast"
          class="image-save-toast"
          :class="`image-save-toast--${saveToast.type}`"
        >
          <q-icon
            :name="saveToast.type === 'success' ? 'check_circle' : 'error'"
            size="22px"
            class="image-save-toast-icon"
          />

          <div class="image-save-toast-copy">
            <div class="image-save-toast-title">
              {{ saveToast.message }}
            </div>
            <div class="image-save-toast-caption">
              {{ saveToast.caption }}
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            size="sm"
            class="image-save-toast-close"
            @click="dismissSaveToast"
          />
        </div>
      </Transition>

      <div class="print-preview-toolbar no-print">
        <div>
          <div class="print-preview-title">
            {{ previewTitle }}
          </div>
          <div class="print-preview-subtitle">
            {{ previewSubtitle }}
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
            :icon="primaryActionIcon"
            class="primary-button"
            :label="primaryActionLabel"
            :loading="showImageSaveButtonBusy"
            :disable="showImageSaveButtonBusy"
            @click="handlePrintPreview"
          />
        </div>
      </div>

      <q-card-section class="print-preview-scroll">
        <div class="print-preview-page-wrapper">
          <div v-if="showImageSaveOverlay" class="image-save-overlay" />

          <div class="print-page-scale-frame">
            <article class="report-print-document">
              <header class="print-header">
                <div class="print-brand-row">
                  <img
                    :src="printLogoSrc"
                    alt="Bitcoin Cash Topups"
                    class="print-brand-logo"
                  />

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
                    <span>
                      {{ t('merchantReportsPage.printPreview.generated') }}
                    </span>
                    <strong>{{ generatedAtLabel }}</strong>
                  </div>
                </div>
              </header>

              <section class="print-section">
                <h2>{{ t('merchantReportsPage.printPreview.atAGlance') }}</h2>

                <div class="print-summary-grid">
                  <div class="print-summary-tile topup-print-tile">
                    <span>
                      {{ t('merchantReportsPage.summary.totalTopups') }}
                    </span>
                    <strong>
                      {{ formatInteger(report?.current.vouchers.count ?? 0) }}
                    </strong>
                  </div>

                  <div class="print-summary-tile cashout-print-tile">
                    <span>
                      {{ t('merchantReportsPage.summary.cashOutsCompleted') }}
                    </span>
                    <strong>
                      {{ formatInteger(report?.current.cashOuts.count ?? 0) }}
                    </strong>
                  </div>

                  <div class="print-summary-tile">
                    <span>
                      {{ t('merchantReportsPage.summary.topupCashCollected') }}
                    </span>
                    <strong>
                      {{
                        formatFiatAmount(
                          report?.current.vouchers.customerCashCollectedMinor ??
                            0,
                          primaryCurrency
                        )
                      }}
                    </strong>
                  </div>

                  <div class="print-summary-tile">
                    <span>
                      {{ t('merchantReportsPage.summary.topupServiceFees') }}
                    </span>
                    <strong>
                      {{
                        formatFiatAmount(
                          report?.current.vouchers.serviceFeeMinor ?? 0,
                          primaryCurrency
                        )
                      }}
                    </strong>
                  </div>

                  <div class="print-summary-tile">
                    <span>
                      {{ t('merchantReportsPage.summary.bchLoaded') }}
                    </span>
                    <strong>
                      {{
                        formatBchSats(
                          report?.current.vouchers.finalBchSats ?? 0
                        )
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
                    <span>
                      {{ t('merchantReportsPage.summary.totalBchMovement') }}
                    </span>
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
                    <span>
                      {{ t('merchantReportsPage.tracker.cashOuts') }}
                    </span>
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
                    <span>
                      {{ t('merchantReportsPage.printPreview.currency') }}
                    </span>
                    <span>
                      {{ t('merchantReportsPage.printPreview.topups') }}
                    </span>
                    <span>
                      {{ t('merchantReportsPage.printPreview.cashOuts') }}
                    </span>
                    <span>
                      {{ t('merchantReportsPage.printPreview.totalFiat') }}
                    </span>
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
                <span>
                  {{ t('merchantReportsPage.printPreview.localNotice') }}
                </span>

                <span
                  v-if="imageExportSavedAtLabel"
                  class="image-export-saved-at"
                >
                  {{ imageExportSavedAtLabel }}
                </span>
              </footer>
            </article>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toPng } from 'html-to-image';

import {
  isAndroidReportPrinterAvailable,
  printAndroidReportHtml,
} from 'src/services/android-report-printer';
import {
  isAndroidImageSaverAvailable,
  saveAndroidPngImage,
} from 'src/services/android-image-saver';
import {
  isAndroidReportSharerAvailable,
  shareAndroidPngReport,
} from 'src/services/android-report-sharer';
import {
  cancelPinLockNativeShare,
  preparePinLockNativeShare,
} from 'src/services/pin-lock-session';

import type {
  MerchantReport,
  MerchantReportCurrencyTotals,
} from 'src/types/merchant-reports';

import appIconUrl from 'src/assets/bch-logo.png';

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
    mode: 'print' | 'pdf' | 'image' | 'share';
    report: MerchantReport | null;
    currentPeriodLabel: string;
    generatedAtLabel: string;
    primaryCurrency: string;
    movementTracker: MerchantReportPrintMovementTracker;
    currencyRows: MerchantReportCurrencyTotals[];
  }>(),
  {
    modelValue: false,
    mode: 'print',
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

const printLogoDataUrl = ref('');
const isSavingImage = ref(false);
const isSharingReport = ref(false);
const imageExportSavedAtLabel = ref('');

const saveToast = ref<{
  type: 'success' | 'error';
  message: string;
  caption: string;
} | null>(null);

let saveToastTimeout: number | undefined;

const isDialogOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

const printLogoSrc = computed(() => {
  return printLogoDataUrl.value || appIconUrl;
});

const previewTitle = computed(() => {
  if (props.mode === 'image') {
    return t('merchantReportsPage.printPreview.imageTitle');
  }

  if (props.mode === 'share') {
    return t('merchantReportsPage.printPreview.shareTitle');
  }

  return props.mode === 'pdf'
    ? t('merchantReportsPage.printPreview.pdfTitle')
    : t('merchantReportsPage.printPreview.title');
});

const previewSubtitle = computed(() => {
  if (props.mode === 'image') {
    return t('merchantReportsPage.printPreview.imageSubtitle');
  }

  if (props.mode === 'share') {
    return t('merchantReportsPage.printPreview.shareSubtitle');
  }

  return props.mode === 'pdf'
    ? t('merchantReportsPage.printPreview.pdfSubtitle')
    : t('merchantReportsPage.printPreview.subtitle');
});

const primaryActionLabel = computed(() => {
  if (props.mode === 'image') {
    return t('merchantReportsPage.printPreview.saveImage');
  }

  if (props.mode === 'share') {
    return t('merchantReportsPage.printPreview.share');
  }

  return props.mode === 'pdf'
    ? t('merchantReportsPage.printPreview.savePdf')
    : t('merchantReportsPage.printPreview.print');
});

const primaryActionIcon = computed(() => {
  if (props.mode === 'image') {
    return 'image';
  }

  if (props.mode === 'share') {
    return 'ios_share';
  }

  return 'print';
});

const shouldUseNativeReportActionFeedback = computed(() => {
  if (props.mode === 'image') {
    return isAndroidImageSaverAvailable();
  }

  if (props.mode === 'share') {
    return isAndroidReportSharerAvailable();
  }

  return false;
});

const showImageSaveOverlay = computed(() => {
  return (
    shouldUseNativeReportActionFeedback.value &&
    (isSavingImage.value || isSharingReport.value)
  );
});

const showImageSaveButtonBusy = computed(() => {
  return (
    shouldUseNativeReportActionFeedback.value &&
    (isSavingImage.value || isSharingReport.value)
  );
});

async function handlePrintPreview(): Promise<void> {
  if (props.mode === 'image') {
    await handleSaveImage();
    return;
  }

  if (props.mode === 'share') {
    await handleShareReport();
    return;
  }

  const originalTitle = document.title;
  const reportTitle =
    props.mode === 'pdf'
      ? 'Bitcoin Cash Topups Merchant Report PDF'
      : 'Bitcoin Cash Topups Merchant Report';

  document.title = reportTitle;

  await ensurePrintLogoDataUrl();

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

async function handleSaveImage(): Promise<void> {
  const reportElement = document.querySelector('.report-print-document');

  if (!(reportElement instanceof HTMLElement) || isSavingImage.value) {
    return;
  }

  isSavingImage.value = true;
  dismissSaveToast();

  try {
    imageExportSavedAtLabel.value = buildImageExportSavedAtLabel();

    await nextTick();
    await ensurePrintLogoDataUrl();
    await nextTick();

    const dataUrl = await toPng(reportElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: reportElement.scrollWidth,
      height: reportElement.scrollHeight,
      style: {
        boxShadow: 'none',
        margin: '0',
        transform: 'none',
      },
    });

    const fileName = buildReportImageFilename();

    if (isAndroidImageSaverAvailable()) {
      await saveAndroidPngImage({
        dataUrl,
        fileName,
        albumName: 'Bitcoin Cash Topups',
      });

      showSaveToast({
        type: 'success',
        message: t('merchantReportsPage.printPreview.imageSaved'),
        caption: t('merchantReportsPage.printPreview.imageSavedAndroidCaption'),
      });

      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    downloadLink.click();
  } catch (error) {
    console.error('Could not save merchant report image.', error);

    showSaveToast({
      type: 'error',
      message: t('merchantReportsPage.printPreview.imageSaveFailed'),
      caption: t('merchantReportsPage.printPreview.imageSaveFailedCaption'),
    });
  } finally {
    imageExportSavedAtLabel.value = '';
    isSavingImage.value = false;
  }
}

async function handleShareReport(): Promise<void> {
  const reportElement = document.querySelector('.report-print-document');

  if (!(reportElement instanceof HTMLElement) || isSharingReport.value) {
    return;
  }

  isSharingReport.value = true;
  dismissSaveToast();

  try {
    await nextTick();
    await ensurePrintLogoDataUrl();
    await nextTick();

    const dataUrl = await toPng(reportElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: reportElement.scrollWidth,
      height: reportElement.scrollHeight,
      style: {
        boxShadow: 'none',
        margin: '0',
        transform: 'none',
      },
    });

    const fileName = buildReportImageFilename();
    const title = t('merchantReportsPage.printPreview.shareSubject');
    const text = buildReportShareText();

    if (isAndroidReportSharerAvailable()) {
      preparePinLockNativeShare();

      try {
        await shareAndroidPngReport({
          dataUrl,
          fileName,
          title,
          text,
        });
      } catch (error) {
        cancelPinLockNativeShare();
        throw error;
      }

      return;
    }

    await shareReportImageInBrowser({
      dataUrl,
      fileName,
      title,
      text,
    });
  } catch (error) {
    console.error('Could not share merchant report image.', error);

    showSaveToast({
      type: 'error',
      message: t('merchantReportsPage.printPreview.shareFailed'),
      caption: t('merchantReportsPage.printPreview.shareFailedCaption'),
    });
  } finally {
    isSharingReport.value = false;
  }
}

function showSaveToast(options: {
  type: 'success' | 'error';
  message: string;
  caption: string;
}): void {
  saveToast.value = options;

  if (saveToastTimeout) {
    window.clearTimeout(saveToastTimeout);
  }

  saveToastTimeout = window.setTimeout(
    () => {
      saveToast.value = null;
      saveToastTimeout = undefined;
    },
    options.type === 'success' ? 1900 : 4500
  );
}

function dismissSaveToast(): void {
  if (saveToastTimeout) {
    window.clearTimeout(saveToastTimeout);
    saveToastTimeout = undefined;
  }

  saveToast.value = null;
}

function buildReportImageFilename(): string {
  const now = new Date();

  const timestampLabel = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    String(now.getMilliseconds()).padStart(3, '0'),
  ].join('-');

  const uniqueSuffix = Math.random().toString(36).slice(2, 7);

  return `bitcoin-cash-topups-report-${timestampLabel}-${uniqueSuffix}.png`;
}

async function shareReportImageInBrowser(options: {
  dataUrl: string;
  fileName: string;
  title: string;
  text: string;
}): Promise<void> {
  const imageBlob = dataUrlToBlob(options.dataUrl);
  const imageFile = new File([imageBlob], options.fileName, {
    type: 'image/png',
  });

  const shareData: ShareData = {
    title: options.title,
    text: options.text,
    files: [imageFile],
  };

  if (
    typeof navigator.share === 'function' &&
    (!navigator.canShare || navigator.canShare(shareData))
  ) {
    await navigator.share(shareData);
    return;
  }

  const downloadLink = document.createElement('a');
  downloadLink.href = options.dataUrl;
  downloadLink.download = options.fileName;
  downloadLink.click();
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata = '', base64Data = ''] = dataUrl.split(',');
  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/png';
  const binaryString = window.atob(base64Data);
  const byteNumbers = new Array<number>(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    byteNumbers[index] = binaryString.charCodeAt(index);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const arrayBuffer = byteArray.buffer.slice(
    byteArray.byteOffset,
    byteArray.byteOffset + byteArray.byteLength
  );

  return new Blob([arrayBuffer], { type: mimeType });
}

function buildReportShareText(): string {
  return t('merchantReportsPage.printPreview.shareBody', {
    period: props.currentPeriodLabel,
  });
}

function buildImageExportSavedAtLabel(): string {
  const now = new Date();

  const dateLabel = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const timeLabel = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join(':');

  return `Saved ${dateLabel} ${timeLabel}`;
}

async function ensurePrintLogoDataUrl(): Promise<void> {
  if (printLogoDataUrl.value) {
    return;
  }

  try {
    const response = await fetch(appIconUrl);
    const blob = await response.blob();

    printLogoDataUrl.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Could not prepare report logo for printing.', error);
  }
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

.print-brand-logo {
  display: block;
  flex: 0 0 auto;
  height: auto;
  max-height: 52px;
  max-width: 52px;
  object-fit: contain;
  width: auto;
  margin-right: 10px;
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
  overflow: hidden;
  position: relative;
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

.print-preview-page-wrapper {
  position: relative;
}

.image-save-overlay {
  animation: image-save-dip 420ms ease;
  background: rgba(3, 7, 5, 0.34);
  border-radius: 8px;
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 8;
}

.image-save-toast {
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(0, 206, 27, 0.26);
  border-radius: 22px;
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 12px;
  left: 50%;
  max-width: min(420px, calc(100% - 32px));
  padding: 14px 14px 14px 16px;
  position: absolute;
  top: 76px;
  transform: translateX(-50%);
  width: max-content;
  z-index: 30;
}

.image-save-toast--success {
  border-color: rgba(0, 206, 27, 0.38);
}

.image-save-toast--error {
  border-color: rgba(193, 0, 21, 0.28);
}

.image-save-toast-icon {
  color: #00a816;
  flex: 0 0 auto;
}

.image-save-toast--error .image-save-toast-icon {
  color: #c10015;
}

.image-save-toast-copy {
  min-width: 0;
}

.image-save-toast-title {
  color: #111111;
  font-size: 14px;
  font-weight: 950;
  line-height: 1.2;
}

.image-save-toast-caption {
  color: #5f6661;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.35;
  margin-top: 3px;
}

.image-save-toast-close {
  color: #667069;
  flex: 0 0 auto;
  margin-left: 2px;
}

.image-save-toast-enter-active,
.image-save-toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.image-save-toast-enter-from,
.image-save-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

@keyframes image-save-dip {
  0% {
    opacity: 0;
  }

  30% {
    opacity: 1;
  }

  100% {
    opacity: 0.78;
  }
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

.print-brand-logo {
  display: block;
  flex: 0 0 auto;
  height: auto;
  max-height: 52px;
  max-width: 52px;
  object-fit: contain;
  width: auto;
  margin-right: 5px;
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
  display: flex;
  font-size: 11px;
  font-weight: 700;
  gap: 12px;
  justify-content: space-between;
  line-height: 1.4;
  margin-top: 26px;
  padding-top: 12px;
}

.image-export-saved-at {
  color: #999999;
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 750;
  text-align: right;
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
