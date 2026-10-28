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
          {{ t('cashOutPage.contractIntro') }}
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
                min="1"
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

        {{ t('cashOutPage.contractSafetyNotice') }}
      </q-banner>

      <CashOutConfirmDialog
        v-if="pendingCashOut"
        :model-value="isConfirmDialogOpen"
        :cash-out="pendingCashOut"
        :is-payment-detected="isPendingCashOutPaymentDetected"
        :is-cash-out-completed="isPendingCashOutCompleted"
        :is-watching-for-payment="isWatchingForPayment"
        :payment-detection-error="paymentDetectionError"
        :is-preparing-receipt="isPreparingReceipt"
        :contract-display-state="sessionDisplay?.state ?? 'awaiting_payment'"
        :is-checking-payment="sessionDisplay?.isChecking ?? false"
        :remaining-milliseconds="remainingMilliseconds"
        @update:model-value="handleConfirmDialogModelUpdate"
        @create-new-cash-out="handleCreateNewCashOut"
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
import { ElectrumNetworkProvider, Network } from 'cashscript';
import bchLogoUrl from 'src/assets/bch-logo.png';
import CashOutConfirmDialog from 'src/components/CashOutConfirmDialog.vue';
import CashOutReceiptPreview from 'src/components/CashOutReceiptPreview.vue';
import type { CashOutRecord } from 'src/types/cash-out';
import type { TreasuryWalletPublicInfo } from 'src/types/treasury';
import {
  calculateCashOutFeeBreakdown,
  formatCashOutBasisPointsAsPercent,
  formatCashOutMinorFiatAmount,
  isCashOutAmountAllowed,
} from 'src/services/cash-out-pricing';
import {
  createCashOutContractSession,
  createCashOutContractPaymentSession,
  type CashOutContractSessionDisplay,
} from 'src/services/cash-out-contract-session';
import { getCashOutQuoteRemainingMilliseconds } from 'src/services/cash-out-quote-policy';
import { getTreasuryWalletPublicInfo } from 'src/services/treasury-wallet';

const { t } = useI18n({ useScope: 'global' });
const cashAmountInput = ref('100');
const isSubmitting = ref(false);
const isWatchingForPayment = ref(false);
const isPreparingReceipt = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');
const paymentDetectionError = ref('');
const isConfirmDialogOpen = ref(false);
const isReceiptPreviewOpen = ref(false);
const pendingCashOut = ref<CashOutRecord | null>(null);
const sessionDisplay = ref<CashOutContractSessionDisplay | null>(null);
const clock = ref(Date.now());
const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});
let paymentSession:
  | ReturnType<typeof createCashOutContractPaymentSession>
  | undefined;
let uiTimer: ReturnType<typeof setInterval> | undefined;
let expiryRequested = false;
let generation = 0;
let mounted = true;

const canReviewCashOut = computed(
  () =>
    isCashOutAmountAllowed(
      parseCashAmountInputToMinor(cashAmountInput.value)
    ) && !isSubmitting.value
);
// Legacy completed receipt display remains supported. This boolean no longer
// decides whether an incomplete CONTRACT record may authorize physical cash.
const isPendingCashOutPaymentDetected = computed(
  () =>
    pendingCashOut.value?.status === 'received' ||
    pendingCashOut.value?.status === 'completed'
);
const isPendingCashOutCompleted = computed(
  () => pendingCashOut.value?.status === 'completed'
);
const remainingMilliseconds = computed(() =>
  pendingCashOut.value
    ? getCashOutQuoteRemainingMilliseconds(
        pendingCashOut.value.quote,
        clock.value
      )
    : 0
);
const previewPricing = computed(() => {
  const fiatAmountMinor = parseCashAmountInputToMinor(cashAmountInput.value);
  const fee = calculateCashOutFeeBreakdown(fiatAmountMinor);
  return {
    fiatCurrency: 'GBP',
    fiatAmountMinor,
    totalServiceFeeBasisPoints: fee.totalServiceFeeBasisPoints,
    totalServiceFeeAmountMinor: fee.totalServiceFeeAmountMinor,
    customerSendsFiatEquivalentMinor:
      fiatAmountMinor + fee.totalServiceFeeAmountMinor,
  };
});
function parseCashAmountInputToMinor(value: string): number {
  const amount = Number(value.trim());
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}
async function loadTreasuryWallet() {
  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();
  } catch {
    if (mounted)
      errorMessage.value = t('cashOutPage.messages.couldNotLoadTreasuryWallet');
  }
}
async function stopPaymentSession() {
  if (uiTimer !== undefined) {
    clearInterval(uiTimer);
    uiTimer = undefined;
  }
  const previous = paymentSession;
  paymentSession = undefined;
  isWatchingForPayment.value = false;
  await previous?.stop();
}
async function handleReviewCashOut() {
  if (isSubmitting.value) return;
  const ownGeneration = ++generation;
  isSubmitting.value = true;
  successMessage.value = '';
  warningMessage.value = '';
  errorMessage.value = '';
  paymentDetectionError.value = '';
  isConfirmDialogOpen.value = false;
  pendingCashOut.value = null;
  sessionDisplay.value = null;
  try {
    await stopPaymentSession();
    const fiatAmountMinor = parseCashAmountInputToMinor(cashAmountInput.value);
    if (!isCashOutAmountAllowed(fiatAmountMinor))
      throw new Error(t('cashOutPage.messages.minimumCashOutAmount'));
    const id = globalThis.crypto.randomUUID();
    const provider = new ElectrumNetworkProvider(Network.MAINNET);
    const stored = await createCashOutContractSession({
      id,
      serial: `CO-${id.slice(0, 8).toUpperCase()}`,
      fiatAmountMinor,
      provider,
    });
    if (!mounted || ownGeneration !== generation) return;
    // No payment instruction enters Vue until E1's durable creation has returned.
    pendingCashOut.value = stored;
    sessionDisplay.value = {
      record: stored,
      state: 'awaiting_payment',
      cashHandoverAllowed: false,
    };
    clock.value = Date.now();
    isConfirmDialogOpen.value = true;
    if (stored.quote.isFallbackQuote)
      warningMessage.value = t('cashOutPage.messages.fallbackQuoteWarning');
    paymentSession = createCashOutContractPaymentSession({
      cashOutId: stored.id,
      provider,
      visible: document.visibilityState === 'visible',
      onUpdate(display) {
        if (
          !mounted ||
          ownGeneration !== generation ||
          !isConfirmDialogOpen.value ||
          pendingCashOut.value?.id !== stored.id
        )
          return;
        pendingCashOut.value = display.record;
        sessionDisplay.value = display;
        paymentDetectionError.value = display.errorMessage ?? '';
      },
      onError(message) {
        if (
          mounted &&
          ownGeneration === generation &&
          isConfirmDialogOpen.value
        ) {
          paymentDetectionError.value = message;
          sessionDisplay.value = {
            record: stored,
            state: 'error',
            cashHandoverAllowed: false,
            errorMessage: message,
          };
        }
      },
    });
    isWatchingForPayment.value = true;
    expiryRequested = false;
    updateUiTimer();
    void paymentSession.start();
  } catch (error) {
    if (mounted && ownGeneration === generation)
      errorMessage.value =
        error instanceof Error
          ? error.message
          : t('cashOutPage.messages.couldNotPrepareCashOut');
  } finally {
    if (mounted && ownGeneration === generation) isSubmitting.value = false;
  }
}
function handleConfirmDialogModelUpdate(value: boolean) {
  isConfirmDialogOpen.value = value;
  if (!value) {
    generation += 1;
    void stopPaymentSession(); // Closing never cancels/deletes the durable record.
  }
}
function requestCurrentObservation() {
  if (!isConfirmDialogOpen.value) return;
  const visible = document.visibilityState === 'visible';
  // Recompute from the frozen absolute expiry BEFORE rendering the resumed UI.
  if (visible) clock.value = Date.now();
  updateUiTimer();
  void paymentSession?.setVisible(visible);
}
function updateUiTimer() {
  if (uiTimer !== undefined) clearInterval(uiTimer);
  uiTimer = undefined;
  if (!isConfirmDialogOpen.value || document.visibilityState !== 'visible')
    return;
  uiTimer = setInterval(() => {
    clock.value = Date.now();
    if (!expiryRequested && remainingMilliseconds.value <= 0) {
      expiryRequested = true;
      void paymentSession?.requestAdvance();
    }
  }, 1_000);
}
function handleCreateNewCashOut() {
  handleConfirmDialogModelUpdate(false);
  pendingCashOut.value = null;
  sessionDisplay.value = null;
  paymentDetectionError.value = '';
  errorMessage.value = '';
  warningMessage.value = '';
  successMessage.value = '';
  isReceiptPreviewOpen.value = false;
  // Keep the entered amount only. Review creates a new ID, quote and contract.
}
function handlePrintReceiptPlaceholder() {
  if (pendingCashOut.value?.status !== 'completed') return;
  isReceiptPreviewOpen.value = true;
}
function formatFiatAmount(amountMinor: number, currency: string) {
  return formatCashOutMinorFiatAmount(amountMinor, currency);
}
function formatPercent(basisPoints: number) {
  return formatCashOutBasisPointsAsPercent(basisPoints);
}
onMounted(() => {
  void loadTreasuryWallet();
  window.addEventListener('focus', requestCurrentObservation);
  document.addEventListener('visibilitychange', requestCurrentObservation);
});
onBeforeUnmount(() => {
  mounted = false;
  generation += 1;
  window.removeEventListener('focus', requestCurrentObservation);
  document.removeEventListener('visibilitychange', requestCurrentObservation);
  void stopPaymentSession();
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
  min-width: 0;
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
  appearance: textfield;
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
  .preview-line {
    flex-wrap: wrap;
  }
  .preview-value {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
  }
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
