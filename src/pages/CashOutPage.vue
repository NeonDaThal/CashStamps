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

        <q-form
          class="cash-out-form q-mt-lg"
          @submit.prevent="handleReviewCashOut"
        >
          <q-input
            v-model="cashAmountInput"
            outlined
            inputmode="decimal"
            type="number"
            min="0.01"
            step="0.01"
            :label="t('cashOutPage.form.cashAmountLabel')"
            prefix="£"
            :disable="isSubmitting"
            class="amount-input"
          />

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

              <div class="preview-grid">
                <div class="preview-item highlight">
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

                <div class="preview-item">
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

                <div class="preview-item">
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

                <div class="preview-item">
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

          <q-banner class="bg-grey-2 text-grey-9" rounded>
            <template #avatar>
              <q-icon name="info" />
            </template>

            {{ t('cashOutPage.form.paymentQrNotice') }}
          </q-banner>

          <div class="form-actions">
            <q-btn
              class="primary-button"
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
        v-model="isConfirmDialogOpen"
        :cash-out="pendingCashOut"
        :is-payment-detected="false"
        @print-receipt="handlePrintReceiptPlaceholder"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import CashOutConfirmDialog from 'src/components/CashOutConfirmDialog.vue';
import type { CashOutRecord } from 'src/types/cash-out';
import { calculateCashOutPricingFromLockedQuote } from 'src/services/cash-out-pricing';
import { addCashOutRecord } from 'src/services/cash-out-store';
import {
  PricingService,
  PricingUnavailableError,
} from 'src/services/pricing-service';
import { createTreasuryTopUpUri } from 'src/services/treasury-topup-uri';
import { getTreasuryWalletPublicInfo } from 'src/services/treasury-wallet';
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
import type { TreasuryWalletPublicInfo } from 'src/types/treasury';

const SATS_PER_BCH = 100_000_000;

const pricingService = new PricingService();

const { t } = useI18n({ useScope: 'global' });

const cashAmountInput = ref('100');
const isSubmitting = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');

const isConfirmDialogOpen = ref(false);
const pendingCashOut = ref<CashOutRecord | null>(null);

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

async function handleReviewCashOut(): Promise<void> {
  clearMessages();
  pendingCashOut.value = null;
  isConfirmDialogOpen.value = false;

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

    const paymentUri = createTreasuryTopUpUri({
      address: treasuryWallet.value.address,
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

      treasuryReceivingAddress: treasuryWallet.value.address,
      paymentUri: paymentUri.uri,

      status: 'awaiting_payment',
    };

    await addCashOutRecord(cashOutRecord);

    pendingCashOut.value = cashOutRecord;
    isConfirmDialogOpen.value = true;

    if (lockedQuote.isFallbackQuote) {
      warningMessage.value = t('cashOutPage.messages.fallbackQuoteWarning');
    }
  } catch (error) {
    console.error(error);

    if (error instanceof PricingUnavailableError) {
      errorMessage.value = t('cashOutPage.messages.pricingUnavailable');
    } else {
      errorMessage.value = t('cashOutPage.messages.couldNotPrepareCashOut');
    }
  } finally {
    isSubmitting.value = false;
  }
}

function handlePrintReceiptPlaceholder(): void {
  warningMessage.value = t('cashOutPage.messages.receiptPrintingPending');
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return formatCashOutMinorFiatAmount(amountMinor, currency);
}

function formatPercent(basisPoints: number): string {
  return formatCashOutBasisPointsAsPercent(basisPoints);
}

onMounted(() => {
  void loadTreasuryWallet();
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

.cash-out-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.amount-input :deep(.q-field__control) {
  border-radius: 16px;
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

.preview-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
}

.preview-item {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 14px;
}

.preview-item.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.preview-label {
  color: #666666;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.preview-value {
  color: #111111;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
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

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #ffffff;
  font-weight: 800;
  min-height: 48px;
  overflow: hidden;
  padding: 0 22px;
}

.primary-button :deep(.q-focus-helper) {
  border-radius: inherit;
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

  .preview-grid {
    grid-template-columns: 1fr;
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
