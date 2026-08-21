<template>
  <q-page padding class="cash-out-page">
    <div class="cash-out-container">
      <section class="cash-out-hero">
        <div class="section-heading hero-heading">
          <div>
            <p class="eyebrow">{{ t('cashOutPage.hero.eyebrow') }}</p>
            <h1>{{ t('cashOutPage.hero.title') }}</h1>
          </div>

          <div class="hero-action-icons">
            <q-btn
              flat
              dense
              round
              icon="account_balance_wallet"
              class="hero-icon-button"
              :aria-label="t('cashOutPage.actions.treasuryWallet')"
              to="/treasury-settings"
            >
              <q-badge
                floating
                rounded
                :class="
                  treasuryWallet.isSetup
                    ? 'quick-action-status-ready'
                    : 'quick-action-status-muted'
                "
              />
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="receipt_long"
              class="hero-icon-button"
              :aria-label="t('cashOutPage.actions.voucherHistory')"
              to="/voucher-history"
            />
          </div>
        </div>

        <p class="intro">
          {{ t('cashOutPage.hero.intro') }}
        </p>

        <div class="hero-form-wrap">
          <q-form class="cash-out-form" @submit.prevent="handleReviewCashOut">
            <div class="amount-field">
              <div class="amount-field-label">
                {{ t('cashOutPage.form.cashAmountLabel') }}
              </div>

              <q-input
                v-model="cashAmountInput"
                type="number"
                inputmode="decimal"
                min="0.01"
                step="0.01"
                :aria-label="t('cashOutPage.form.cashAmountLabel')"
                prefix="£"
                borderless
                :disable="isSubmitting"
                class="amount-input"
              />
            </div>

            <q-card flat bordered class="pricing-card">
              <q-card-section>
                <div class="pricing-header">
                  <div>
                    <div class="text-subtitle1 text-weight-bold">
                      {{ t('cashOutPage.preview.title') }}
                    </div>
                    <div class="text-caption text-grey-7">
                      {{ t('cashOutPage.preview.subtitle') }}
                    </div>
                  </div>

                  <div class="pricing-logo-wrap" aria-hidden="true">
                    <img :src="bchLogoUrl" alt="" class="pricing-logo" />
                  </div>
                </div>

                <div class="preview-breakdown">
                  <div class="preview-line preview-line--primary">
                    <div class="preview-label">
                      {{ t('cashOutPage.preview.customerReceivesCash') }}
                    </div>

                    <div class="preview-value">
                      {{
                        formatFiatAmount(
                          previewPricing.fiatAmountMinor,
                          previewPricing.fiatCurrency
                        )
                      }}
                    </div>
                  </div>

                  <div class="preview-line preview-line--subtle">
                    <div class="preview-label">
                      {{ t('cashOutPage.preview.serviceFeeSpread') }}
                    </div>

                    <div class="preview-value">
                      {{
                        formatPercent(previewPricing.totalServiceFeeBasisPoints)
                      }}
                      —
                      {{
                        formatFiatAmount(
                          previewPricing.totalServiceFeeAmountMinor,
                          previewPricing.fiatCurrency
                        )
                      }}
                    </div>
                  </div>

                  <div class="preview-line">
                    <div class="preview-label">
                      {{ t('cashOutPage.preview.customerSendsValue') }}
                    </div>

                    <div class="preview-value">
                      {{
                        formatFiatAmount(
                          previewPricing.customerSendsFiatEquivalentMinor,
                          previewPricing.fiatCurrency
                        )
                      }}
                    </div>
                  </div>

                  <div class="preview-line preview-line--quote">
                    <div class="preview-label">
                      {{ t('cashOutPage.preview.quoteSource') }}
                    </div>

                    <div class="preview-value">
                      {{ t('cashOutPage.preview.lockedAfterReview') }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <div class="form-actions">
              <q-btn
                class="cash-out-primary-button"
                type="submit"
                :label="t('cashOutPage.actions.reviewCashOut')"
                icon="fact_check"
                no-caps
                unelevated
                :loading="isSubmitting"
                :disable="!canReviewCashOut"
              />
            </div>
          </q-form>
        </div>
      </section>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9" rounded>
        {{ successMessage }}
      </q-banner>

      <q-banner
        v-if="warningMessage"
        class="bg-orange-1 text-orange-10"
        rounded
      >
        {{ warningMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        {{ t('cashOutPage.safetyNotice') }}
      </q-banner>

      <CashOutConfirmDialog
        v-if="pendingCashOut"
        :model-value="isConfirmDialogOpen"
        :cash-out="pendingCashOut"
        :is-payment-detected="isPendingCashOutPaymentDetected"
        :is-watching-for-payment="isWatchingForPayment"
        :payment-detection-error="paymentDetectionError"
        :is-preparing-receipt="isPreparingReceipt"
        @update:model-value="handleConfirmDialogModelUpdate"
        @print-receipt="handlePrintReceiptPlaceholder"
      />
      <q-dialog v-model="isReceiptPreviewOpen">
        <q-card class="cash-out-receipt-dialog">
          <q-card-section class="receipt-dialog-header">
            <div>
              <div class="text-h6 text-weight-bold">Cash-out Receipt</div>
              <div class="text-caption text-grey-7">
                Customer-safe cash-out receipt preview
              </div>
            </div>

            <q-btn
              flat
              dense
              round
              icon="close"
              aria-label="Close cash-out receipt preview"
              @click="isReceiptPreviewOpen = false"
            />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <CashOutReceiptPreview
              v-if="pendingCashOut"
              :cash-out="pendingCashOut"
            />
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import CashOutConfirmDialog from 'src/components/CashOutConfirmDialog.vue';
import CashOutReceiptPreview from 'src/components/CashOutReceiptPreview.vue';
import type {
  CashOutPaymentDetection,
  CashOutRecord,
} from 'src/types/cash-out';
import { calculateCashOutPricingFromLockedQuote } from 'src/services/cash-out-pricing';
import {
  addCashOutRecord,
  markCashOutPaymentDetected,
} from 'src/services/cash-out-store';
import { recordCashOutPaid } from 'src/services/cash-on-hand-store';
import {
  PricingService,
  PricingUnavailableError,
} from 'src/services/pricing-service';
import { createTreasuryTopUpUri } from 'src/services/treasury-topup-uri';
import {
  deriveNextTreasuryCashOutReceivingAddress,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';
import {
  BUFFER_RESERVE_BASIS_POINTS,
  MERCHANT_RETAINED_BASIS_POINTS,
  PLATFORM_FEE_BASIS_POINTS,
  TOTAL_SERVICE_FEE_BASIS_POINTS,
} from 'src/services/platform-fee-config';
import {
  formatCashOutBasisPointsAsPercent,
  formatCashOutMinorFiatAmount,
} from 'src/services/cash-out-pricing';
import {
  checkTreasuryIncomingPaymentOnce,
  watchTreasuryIncomingPayment,
  type TreasuryIncomingPaymentDetection,
  type TreasuryIncomingPaymentWatcher,
} from 'src/services/treasury-incoming-detector';
import type { TreasuryWalletPublicInfo } from 'src/types/treasury';

const SATS_PER_BCH = 100_000_000;

const pricingService = new PricingService();

const { t } = useI18n({ useScope: 'global' });

const cashAmountInput = ref('100');
const isSubmitting = ref(false);
const isWatchingForPayment = ref(false);
const isPreparingReceipt = ref(false);
const isReconcilingPaymentOnResume = ref(false);

const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');
const paymentDetectionError = ref('');

const isConfirmDialogOpen = ref(false);
const isReceiptPreviewOpen = ref(false);
const pendingCashOut = ref<CashOutRecord | null>(null);
const paymentWatcher = ref<TreasuryIncomingPaymentWatcher | null>(null);

const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});

const canReviewCashOut = computed(() => {
  const amountMinor = parseCashAmountInputToMinor(cashAmountInput.value);
  return amountMinor > 0 && !isSubmitting.value;
});

const isPendingCashOutPaymentDetected = computed(() => {
  return pendingCashOut.value?.status === 'received';
});

const previewPricing = computed(() => {
  const fiatAmountMinor = parseCashAmountInputToMinor(cashAmountInput.value);
  const platformFeeAmountMinor = calculateFeeAmountMinor(
    fiatAmountMinor,
    PLATFORM_FEE_BASIS_POINTS
  );
  const merchantRetainedAmountMinor = calculateFeeAmountMinor(
    fiatAmountMinor,
    MERCHANT_RETAINED_BASIS_POINTS
  );
  const bufferReserveAmountMinor = calculateFeeAmountMinor(
    fiatAmountMinor,
    BUFFER_RESERVE_BASIS_POINTS
  );
  const totalServiceFeeAmountMinor =
    platformFeeAmountMinor +
    merchantRetainedAmountMinor +
    bufferReserveAmountMinor;

  return {
    fiatCurrency: 'GBP',
    fiatAmountMinor,
    totalServiceFeeBasisPoints: TOTAL_SERVICE_FEE_BASIS_POINTS,
    totalServiceFeeAmountMinor,
    customerSendsFiatEquivalentMinor:
      fiatAmountMinor + totalServiceFeeAmountMinor,
  };
});

function clearMessages(): void {
  successMessage.value = '';
  warningMessage.value = '';
  errorMessage.value = '';
}

function calculateFeeAmountMinor(
  amountMinor: number,
  basisPoints: number
): number {
  return Math.round((amountMinor * basisPoints) / 10_000);
}

function parseCashAmountInputToMinor(value: string): number {
  const normalisedValue = value.trim();

  if (!normalisedValue) {
    return 0;
  }

  const parsedAmount = Number(normalisedValue);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return 0;
  }

  return Math.round(parsedAmount * 100);
}

function generateId(): string {
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  return `cash-out-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateSerial(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `CO-${datePart}-${randomPart}`;
}

function satsToBchAmount(sats: number): number {
  return Number((sats / SATS_PER_BCH).toFixed(8));
}

async function loadTreasuryWallet(): Promise<void> {
  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();
  } catch (error) {
    console.error(error);
    errorMessage.value = t('cashOutPage.messages.couldNotLoadTreasuryWallet');
  }
}

async function stopPaymentWatcher(): Promise<void> {
  const watcher = paymentWatcher.value;

  paymentWatcher.value = null;
  isWatchingForPayment.value = false;

  if (!watcher) {
    return;
  }

  await watcher.stop();
}

async function reconcilePendingCashOutPaymentOnResume(): Promise<void> {
  const currentCashOut = pendingCashOut.value;

  if (
    !currentCashOut ||
    currentCashOut.status !== 'awaiting_payment' ||
    isReconcilingPaymentOnResume.value
  ) {
    return;
  }

  isReconcilingPaymentOnResume.value = true;
  paymentDetectionError.value = '';

  try {
    const detection = await checkTreasuryIncomingPaymentOnce({
      treasuryAddress: currentCashOut.treasuryReceivingAddress,
      requiredSats: currentCashOut.bchSatsRequired,
      baselineBalanceSats: paymentWatcher.value?.baselineBalanceSats ?? 0,
    });

    if (detection) {
      await stopPaymentWatcher();
      await handleDetectedPayment(detection);
      return;
    }

    if (pendingCashOut.value?.status === 'awaiting_payment') {
      await startPaymentWatcher(pendingCashOut.value);
    }
  } catch (error) {
    console.error(error);

    const normalizedError =
      error instanceof Error
        ? error
        : new Error('Could not reconcile cash-out payment after app resume.');

    if (isTransientElectrumDisconnectError(normalizedError)) {
      paymentDetectionError.value = '';

      try {
        if (pendingCashOut.value?.status === 'awaiting_payment') {
          await startPaymentWatcher(pendingCashOut.value);
        }
      } catch (restartError) {
        console.error(restartError);

        paymentDetectionError.value =
          restartError instanceof Error
            ? restartError.message
            : 'Could not restart treasury payment detector after app resume.';
      }

      return;
    }

    paymentDetectionError.value = normalizedError.message;
  } finally {
    isReconcilingPaymentOnResume.value = false;
  }
}

function handleVisibilityChange(): void {
  if (
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible'
  ) {
    void reconcilePendingCashOutPaymentOnResume();
  }
}

function handleWindowFocus(): void {
  void reconcilePendingCashOutPaymentOnResume();
}

async function handleDetectedPayment(
  detection: TreasuryIncomingPaymentDetection
): Promise<void> {
  const currentCashOut = pendingCashOut.value;

  if (!currentCashOut) {
    return;
  }

  const storeDetection: CashOutPaymentDetection = {
    treasuryAddress: detection.treasuryAddress,
    requiredSats: detection.requiredSats,
    receivedSats: detection.receivedSats,
    txid: detection.txid,
    detectedAt: detection.detectedAt,
    message: detection.message,
  };

  const updatedCashOut = await markCashOutPaymentDetected(
    currentCashOut.id,
    storeDetection
  );

  const fallbackUpdatedCashOut: CashOutRecord = {
    ...currentCashOut,
    status: 'received',
    bchSatsReceived: detection.receivedSats,
    receivedTxid: detection.txid,
    detectedAt: detection.detectedAt,
    paymentDetection: storeDetection,
    updatedAt: new Date().toISOString(),
  };

  const detectedCashOut = updatedCashOut ?? fallbackUpdatedCashOut;

  pendingCashOut.value = detectedCashOut;

  await recordCashOnHandForDetectedCashOut(detectedCashOut);

  paymentWatcher.value = null;
  isWatchingForPayment.value = false;
  paymentDetectionError.value = '';
  successMessage.value =
    'BCH payment detected in Treasury Wallet. Give cash only after checking the success screen.';
}

async function recordCashOnHandForDetectedCashOut(
  cashOut: CashOutRecord
): Promise<void> {
  try {
    await recordCashOutPaid({
      amountMinor: cashOut.fiatAmountMinor,
      currency: cashOut.fiatCurrency,
      relatedRecordId: cashOut.id,
      note: `Cash-out ${cashOut.serial}`,
      createdAt: cashOut.detectedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    warningMessage.value =
      'The BCH payment was detected, but Cash on Hand could not be updated automatically.';
  }
}

async function startPaymentWatcher(
  cashOutRecord: CashOutRecord
): Promise<void> {
  await stopPaymentWatcher();

  paymentDetectionError.value = '';
  isWatchingForPayment.value = true;

  try {
    paymentWatcher.value = await watchTreasuryIncomingPayment({
      treasuryAddress: cashOutRecord.treasuryReceivingAddress,
      requiredSats: cashOutRecord.bchSatsRequired,
      pollIntervalMs: 3_000,
      onDetected: handleDetectedPayment,
      onError: (error) => {
        console.error(error);

        if (isTransientElectrumDisconnectError(error)) {
          paymentDetectionError.value = '';
          return;
        }

        paymentDetectionError.value = error.message;
      },
    });
  } catch (error) {
    console.error(error);
    isWatchingForPayment.value = false;
    paymentDetectionError.value =
      error instanceof Error
        ? error.message
        : 'Could not start treasury payment detector.';

    throw error;
  }
}

async function handleReviewCashOut(): Promise<void> {
  clearMessages();
  paymentDetectionError.value = '';
  pendingCashOut.value = null;
  isConfirmDialogOpen.value = false;

  await stopPaymentWatcher();

  const fiatAmountMinor = parseCashAmountInputToMinor(cashAmountInput.value);

  if (!Number.isFinite(fiatAmountMinor) || fiatAmountMinor <= 0) {
    errorMessage.value = t('cashOutPage.messages.enterValidCashAmount');
    return;
  }

  isSubmitting.value = true;

  try {
    await loadTreasuryWallet();

    if (!treasuryWallet.value.isSetup || !treasuryWallet.value.address) {
      errorMessage.value = t('cashOutPage.messages.setUpTreasuryFirst');
      return;
    }

    const lockedQuote = await pricingService.getLockedQuote('GBP');
    const pricing = calculateCashOutPricingFromLockedQuote(
      fiatAmountMinor,
      lockedQuote
    );

    const now = new Date().toISOString();
    const serial = generateSerial();

    const cashOutReceivingAddress =
      await deriveNextTreasuryCashOutReceivingAddress();

    const paymentUri = createTreasuryTopUpUri({
      address: cashOutReceivingAddress.address,
      amountBch: satsToBchAmount(pricing.bchSatsRequired),
      label: t('cashOutPage.paymentUri.label'),
      message: serial,
    });

    const cashOutRecord: CashOutRecord = {
      id: generateId(),
      serial,

      createdAt: now,
      updatedAt: now,

      fiatCurrency: pricing.fiatCurrency,
      fiatAmountMinor: pricing.fiatAmountMinor,

      customerSendsFiatEquivalentMinor:
        pricing.customerSendsFiatEquivalentMinor,

      marketBchSats: pricing.marketBchSats,
      bchSatsRequired: pricing.bchSatsRequired,

      quote: {
        source: pricing.quoteSource,
        fiatCurrency: pricing.fiatCurrency,
        marketRate: pricing.marketRate,
        marketRateTimestamp: pricing.quoteTimestamp,
        quoteLockedAt: pricing.quoteLockedAt,
        quoteExpiresAt: pricing.quoteExpiresAt,
        isFallbackQuote: pricing.isFallbackQuote,
      },

      fee: pricing.fee,

      treasuryMasterAddress: cashOutReceivingAddress.treasuryMasterAddress,
      treasuryReceivingAddress: cashOutReceivingAddress.address,
      treasuryReceivingDerivationIndex: cashOutReceivingAddress.derivationIndex,
      paymentUri: paymentUri.uri,

      status: 'awaiting_payment',
    };

    await addCashOutRecord(cashOutRecord);

    pendingCashOut.value = cashOutRecord;

    await startPaymentWatcher(cashOutRecord);

    isConfirmDialogOpen.value = true;

    if (lockedQuote.isFallbackQuote) {
      warningMessage.value = t('cashOutPage.messages.fallbackQuoteWarning');
    }
  } catch (error) {
    console.error(error);

    if (error instanceof PricingUnavailableError) {
      errorMessage.value = t('cashOutPage.messages.pricingUnavailable');
      return;
    }

    if (paymentDetectionError.value) {
      errorMessage.value =
        'Cash-out was prepared, but the payment detector could not start. Please do not use this cash-out for a live payout.';
      return;
    }

    errorMessage.value = t('cashOutPage.messages.couldNotPrepareCashOut');
  } finally {
    isSubmitting.value = false;
  }
}

function handlePrintReceiptPlaceholder(): void {
  if (!pendingCashOut.value || !isPendingCashOutPaymentDetected.value) {
    warningMessage.value = t('cashOutPage.messages.receiptPrintingPending');
    return;
  }

  isReceiptPreviewOpen.value = true;
}

function handleConfirmDialogModelUpdate(value: boolean): void {
  isConfirmDialogOpen.value = value;

  if (!value && !isPendingCashOutPaymentDetected.value) {
    void stopPaymentWatcher();
  }
}

function isTransientElectrumDisconnectError(error: Error): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('disconnected server') ||
    message.includes('not connected') ||
    message.includes('websocket') ||
    message.includes('connection')
  );
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return formatCashOutMinorFiatAmount(amountMinor, currency);
}

function formatPercent(basisPoints: number): string {
  return formatCashOutBasisPointsAsPercent(basisPoints);
}

onMounted(() => {
  void loadTreasuryWallet();

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleWindowFocus);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', handleWindowFocus);
  }

  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  void stopPaymentWatcher();
});
</script>

<style lang="scss" scoped>
.cash-out-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.cash-out-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 760px;
  width: 100%;
}

.cash-out-hero {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.hero-heading {
  justify-content: space-between;
}

.hero-action-icons {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.hero-icon-button {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  border-radius: 14px;
  color: #111111;
  height: 42px;
  overflow: hidden;
  width: 42px;
}

.hero-icon-button :deep(.q-focus-helper) {
  border-radius: inherit;
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
  max-width: 660px;
}

.cash-out-receipt-dialog {
  border-radius: 24px;
  max-width: 95vw;
  width: 720px;
}

.receipt-dialog-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 18px 22px;
}

.hero-form-wrap {
  margin-top: 20px;
}

.cash-out-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.amount-field {
  background: #ffffff;
  border: 2px solid #00ce1b;
  border-radius: 20px;
  padding: 7px 16px 8px;
}

.amount-field-label {
  color: #555555;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.1;
  margin-bottom: 0;
}

.amount-input :deep(.q-field__control) {
  min-height: 34px;
  padding: 0;
}

.amount-input :deep(.q-field__control-container) {
  padding-top: 0;
}

.amount-input :deep(.q-field__native),
.amount-input :deep(.q-field__prefix) {
  color: #111111;
  font-size: 30px;
  font-weight: 950;
  line-height: 1;
}

.amount-input :deep(.q-field__prefix) {
  align-items: center;
  display: flex;
  padding-bottom: 0;
  padding-right: 5px;
  transform: translateY(-3px);
}

.amount-input :deep(.q-field__native) {
  padding: 0;
}

.amount-input :deep(input[type='number']) {
  -moz-appearance: textfield;
}

.amount-input :deep(input[type='number']::-webkit-inner-spin-button),
.amount-input :deep(input[type='number']::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.pricing-card {
  background: #f7f8f7;
  border-color: #dddddd;
  border-radius: 20px;
}

.pricing-card :deep(.q-card__section) {
  padding: 18px;
}

.pricing-header {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pricing-logo-wrap {
  align-items: center;
  background: #00ce1b;
  border-radius: 50%;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
  display: flex;
  flex: 0 0 42px;
  height: 42px;
  justify-content: center;
  overflow: hidden;
  width: 42px;
}

.pricing-logo {
  border-radius: 50%;
  display: block;
  height: 82%;
  object-fit: contain;
  width: 82%;
}

.preview-breakdown {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  overflow: hidden;
  padding: 2px 14px;
}

.preview-line {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 12px 0;
}

.preview-line + .preview-line {
  border-top: 1px solid #eeeeee;
}

.preview-line--primary {
  padding-top: 13px;
}

.preview-line--subtle {
  color: #777777;
  padding: 9px 0;
}

.preview-line--quote {
  background: transparent;
}

.preview-label {
  color: #666666;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.2;
  min-width: 0;
}

.preview-value {
  color: #111111;
  flex: 0 0 auto;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
}

.preview-line--primary .preview-value {
  font-size: 17px;
  font-weight: 950;
}

.preview-line--subtle .preview-label,
.preview-line--subtle .preview-value {
  color: #777777;
  font-size: 12px;
  font-weight: 800;
}

.preview-line--quote .preview-label,
.preview-line--quote .preview-value {
  color: #777777;
  font-size: 12px;
  font-weight: 800;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.cash-out-primary-button {
  background: #111111;
  border-radius: 14px;
  color: #00ce1b;
  font-size: 17px;
  font-weight: 850;
  min-height: 48px;
  overflow: hidden;
  padding: 0 22px;
}

.cash-out-primary-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.quick-action-status-ready,
.quick-action-status-muted {
  height: 10px;
  min-height: 10px;
  min-width: 10px;
  padding: 0;
  right: 6px;
  top: 6px;
  width: 10px;
}

.quick-action-status-ready {
  background: #00ce1b;
}

.quick-action-status-muted {
  background: #8a8a8a;
}

.section-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}


@media (max-width: 640px) {
  .cash-out-hero {
    padding: 22px;
  }

  .hero-heading {
    align-items: flex-start;
  }

  .hero-action-icons {
    padding-top: 2px;
  }

  .amount-field {
    border-radius: 18px;
    padding: 5px 14px 5px;
  }

  .amount-field-label {
    font-size: 12px;
    line-height: 1;
    margin-bottom: 0;
    padding-top: 8px;
  }

  .amount-input :deep(.q-field__control) {
    min-height: 28px;
  }

  .amount-input :deep(.q-field__native),
  .amount-input :deep(.q-field__prefix) {
    font-size: 24px;
    line-height: 1;
  }

  .amount-input :deep(.q-field__prefix) {
    transform: translateY(-2px);
  }

  .preview-breakdown {
    padding: 2px 12px;
  }

  .preview-line {
    gap: 12px;
    padding: 11px 0;
  }

  .preview-label {
    font-size: 12px;
  }

  .preview-value {
    font-size: 14px;
  }

  .preview-line--primary .preview-value {
    font-size: 16px;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions .q-btn {
    width: 100%;
  }
}
</style>