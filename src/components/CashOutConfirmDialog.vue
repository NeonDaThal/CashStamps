<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="!isCashOutCompleted"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="confirm-card">
      <q-card-section class="dialog-header">
        <div class="dialog-title-row">
          <div class="header-icon">
            <q-icon
              :name="
                isCashOutCompleted
                  ? 'task_alt'
                  : isPaymentDetected
                  ? 'payments'
                  : 'currency_exchange'
              "
            />
          </div>

          <div class="dialog-title">
            {{
              isCashOutCompleted
                ? t('cashOutConfirm.header.completedTitle')
                : isPaymentDetected
                ? t('cashOutConfirm.header.receivedTitle')
                : t('cashOutConfirm.header.reviewTitle')
            }}
          </div>
        </div>

        <p class="dialog-subtitle">
          {{
            isCashOutCompleted
              ? t('cashOutConfirm.header.completedSubtitle')
              : isPaymentDetected
              ? t('cashOutConfirm.header.receivedSubtitle')
              : t('cashOutConfirm.header.reviewSubtitle')
          }}
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <template v-if="!isPaymentDetected">
          <div
            :class="[
              'quote-status-pill',
              cashOut.quote.isFallbackQuote
                ? 'quote-status-pill--fallback'
                : 'quote-status-pill--locked',
            ]"
            role="status"
          >
            <q-icon
              :name="cashOut.quote.isFallbackQuote ? 'warning' : 'check_circle'"
              class="quote-status-pill-icon"
            />

            <span v-if="cashOut.quote.isFallbackQuote">
              {{ t('cashOutConfirm.quoteStatus.fallback') }}
            </span>

            <span v-else>
              {{ t('cashOutConfirm.quoteStatus.liveLocked') }}
            </span>
          </div>

          <section class="cash-out-breakdown">
            <div class="breakdown-header">
              <div class="breakdown-title">
                {{ t('cashOutConfirm.breakdown.title') }}
              </div>

              <q-icon
                name="format_list_bulleted"
                class="breakdown-header-icon"
              />
            </div>

            <div class="breakdown-lines">
              <div class="breakdown-line breakdown-line--main">
                <div class="breakdown-line-text">
                  <div class="breakdown-label">
                    {{ t('cashOutConfirm.breakdown.cashOutAmount') }}
                  </div>
                  <div class="breakdown-note">
                    {{ t('cashOutConfirm.breakdown.cashOutAmountNote') }}
                  </div>
                </div>

                <div class="breakdown-values">
                  <strong>
                    {{
                      formatFiatAmount(
                        cashOut.fiatAmountMinor,
                        cashOut.fiatCurrency
                      )
                    }}
                  </strong>

                  <span class="breakdown-bch-value">
                    <img :src="bchLogoUrl" alt="" class="breakdown-bch-logo" />
                    {{ formatBchAmount(cashOut.marketBchSats) }}
                  </span>
                </div>
              </div>

              <div class="breakdown-fee-row">
                <span class="breakdown-fee-label">
                  {{ t('cashOutConfirm.breakdown.serviceFeeSpread') }}
                </span>

                <span class="breakdown-fee-fiat">
                  {{
                    formatFiatAmount(
                      cashOut.fee.totalServiceFeeAmountMinor,
                      cashOut.fiatCurrency
                    )
                  }}
                </span>

                <span class="breakdown-fee-bch">
                  <img :src="bchLogoUrl" alt="" class="breakdown-bch-logo" />
                  {{ formatBchAmount(serviceFeeBchSats) }}
                </span>
              </div>
            </div>

            <div class="breakdown-total">
              <div>
                <div class="breakdown-total-label">
                  {{ t('cashOutConfirm.breakdown.cashOutTotal') }}
                </div>
                <div class="breakdown-total-note">
                  {{ t('cashOutConfirm.breakdown.cashOutTotalNote') }}
                </div>
              </div>

              <div class="breakdown-total-values">
                <strong>
                  {{
                    formatFiatAmount(
                      cashOut.customerSendsFiatEquivalentMinor,
                      cashOut.fiatCurrency
                    )
                  }}
                </strong>

                <span>
                  <img :src="bchLogoUrl" alt="" class="breakdown-bch-logo" />
                  {{ formatBchAmount(cashOut.bchSatsRequired) }}
                </span>
              </div>
            </div>
          </section>

          <q-card flat bordered class="payment-card q-mt-md">
            <q-card-section>
              <div class="payment-instruction">
                <p class="payment-instruction-title">
                  {{ t('cashOutConfirm.paymentQr.title') }}
                </p>
                <p class="payment-instruction-subtitle">
                  {{ t('cashOutConfirm.paymentQr.subtitle') }}
                </p>
              </div>

              <div class="payment-layout">
                <div class="payment-qr-panel">
                  <div class="amount-to-send-card">
                    <div class="amount-label">
                      {{ t('cashOutConfirm.paymentDetails.amountToSend') }}
                    </div>

                    <div class="amount-values">
                      <strong>
                        {{
                          formatFiatAmount(
                            cashOut.customerSendsFiatEquivalentMinor,
                            cashOut.fiatCurrency
                          )
                        }}
                      </strong>

                      <span>
                        <img :src="bchLogoUrl" alt="" class="amount-bch-logo" />
                        {{ formatBchAmount(cashOut.bchSatsRequired) }}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="qr-copy-button"
                    :aria-label="t('cashOutConfirm.actions.copyPaymentUri')"
                    @click="handleCopyUri"
                  >
                    <div class="qr-wrap">
                      <q-spinner
                        v-if="isGeneratingQr"
                        color="primary"
                        size="42px"
                      />

                      <q-img
                        v-else-if="qrDataUrl"
                        :src="qrDataUrl"
                        :alt="t('cashOutConfirm.paymentQr.qrAlt')"
                        class="qr-image"
                        fit="contain"
                      />

                      <div v-else class="text-negative text-center">
                        {{ t('cashOutConfirm.paymentQr.qrUnavailable') }}
                      </div>
                    </div>
                  </button>

                  <q-btn
                    flat
                    dense
                    no-caps
                    icon="content_copy"
                    class="copy-soft-button"
                    :label="t('cashOutConfirm.actions.copyPaymentUri')"
                    @click="handleCopyUri"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-expansion-item
            dense
            class="order-details-card q-mt-md"
            :label="t('cashOutConfirm.details.orderDetailsTitle')"
            :caption="t('cashOutConfirm.details.orderDetailsCaption')"
          >
            <div class="order-details-body">
              <div class="details-row">
                <span>{{ t('cashOutConfirm.details.reference') }}</span>
                <strong>{{ cashOut.serial }}</strong>
              </div>

              <div class="details-row">
                <span>{{ t('cashOutConfirm.details.marketRate') }}</span>
                <strong>
                  {{
                    formatRate(cashOut.quote.marketRate, cashOut.fiatCurrency)
                  }}
                </strong>
              </div>

              <div class="details-row">
                <span>{{ t('cashOutConfirm.details.quoteTime') }}</span>
                <strong>
                  {{ formatDateTime(cashOut.quote.marketRateTimestamp) }}
                </strong>
              </div>

              <div v-if="cashOut.quote.quoteExpiresAt" class="details-row">
                <span>{{ t('cashOutConfirm.details.quoteExpires') }}</span>
                <strong>
                  {{ formatDateTime(cashOut.quote.quoteExpiresAt) }}
                </strong>
              </div>

              <div class="details-row">
                <span>
                  {{
                    t('cashOutConfirm.paymentDetails.treasuryReceivingAddress')
                  }}
                </span>

                <div class="details-address-value">
                  <strong class="details-address-text">
                    {{ cashOut.treasuryReceivingAddress }}
                  </strong>

                  <q-btn
                    flat
                    dense
                    no-caps
                    icon="content_copy"
                    class="details-copy-button"
                    :label="t('cashOutConfirm.actions.copyAddress')"
                    @click="handleCopyAddress"
                  />
                </div>
              </div>

              <div class="details-row">
                <span>{{ t('cashOutConfirm.details.status') }}</span>
                <strong>{{ cashOutStatusLabel }}</strong>
              </div>
            </div>
          </q-expansion-item>

          <q-banner
            v-if="paymentDetectionError"
            class="bg-red-1 text-red-10 q-mt-md"
            rounded
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>

            Payment detector issue: {{ paymentDetectionError }}
          </q-banner>

          <q-banner
            v-else
            :class="
              isWatchingForPayment
                ? 'bg-blue-1 text-blue-10'
                : 'bg-grey-2 text-grey-9'
            "
            rounded
            class="q-mt-md"
          >
            <template #avatar>
              <q-spinner v-if="isWatchingForPayment" color="primary" />
              <q-icon v-else name="info" />
            </template>

            <span v-if="isWatchingForPayment">
              Watching Treasury Wallet for the customer BCH payment. This screen
              will change automatically when the payment arrives.
            </span>

            <span v-else>
              Payment watcher is not active. Close this review and start again
              before using this cash-out for a live payout.
            </span>
          </q-banner>
        </template>

        <template v-else>
          <div class="success-panel">
            <div class="success-icon">
              <q-icon
                :name="isCashOutCompleted ? 'task_alt' : 'check_circle'"
              />
            </div>

            <template v-if="isCashOutCompleted">
              <h2>
                {{ t('cashOutConfirm.success.completedTitle') }}
              </h2>

              <p>
                {{ t('cashOutConfirm.success.completedMessage') }}
              </p>
            </template>

            <template v-else>
              <h2>
                {{ t('cashOutConfirm.success.title') }}
              </h2>

              <p>
                {{ t('cashOutConfirm.success.nowGiveCustomer') }}

                <strong>
                  {{
                    formatFiatAmount(
                      cashOut.fiatAmountMinor,
                      cashOut.fiatCurrency
                    )
                  }}
                </strong>

                {{ t('cashOutConfirm.success.cash') }}.
              </p>

              <p class="q-mt-sm text-weight-bold">
                {{ t('cashOutConfirm.success.confirmAfterCashPaid') }}
              </p>
            </template>
          </div>

          <q-card flat bordered class="details-card q-mt-md">
            <q-card-section>
              <div class="details-row">
                <span>{{ t('cashOutConfirm.details.reference') }}</span>
                <strong>{{ cashOut.serial }}</strong>
              </div>

              <div class="details-row">
                <span>{{ t('cashOutConfirm.details.bchReceived') }}</span>
                <strong>
                  {{
                    formatBchAmount(
                      cashOut.bchSatsReceived ?? cashOut.bchSatsRequired
                    )
                  }}
                </strong>
              </div>

              <div v-if="cashOut.receivedTxid" class="details-row">
                <span>{{ t('cashOutConfirm.details.transactionId') }}</span>
                <strong class="text-break">{{ cashOut.receivedTxid }}</strong>
              </div>

              <div v-if="cashOut.detectedAt" class="details-row">
                <span>{{ t('cashOutConfirm.details.detected') }}</span>
                <strong>{{ formatDateTime(cashOut.detectedAt) }}</strong>
              </div>
            </q-card-section>
          </q-card>
        </template>
      </q-card-section>

      <q-separator />

      <q-card-actions
        align="right"
        :class="[
          'dialog-actions',
          {
            'dialog-actions--review': !isPaymentDetected,
          },
          {
            'success-actions': isPaymentDetected,
          },
        ]"
      >
        <q-btn
          v-if="!isPaymentDetected"
          flat
          class="cancel-review-button"
          :label="t('cashOutConfirm.actions.closeReview')"
          no-caps
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          v-else-if="!isCashOutCompleted"
          class="primary-button"
          icon="payments"
          :label="t('cashOutConfirm.actions.confirmCashPaid')"
          :loading="isCompletingCashOut"
          :disable="isCompletingCashOut"
          unelevated
          no-caps
          @click="emit('confirm-cash-paid')"
        />

        <template v-else>
          <q-btn
            outline
            class="secondary-action-button"
            icon="close"
            color="grey-9"
            :label="t('common.close')"
            :disable="isPreparingReceipt"
            no-caps
            @click="emit('update:modelValue', false)"
          />

          <q-btn
            class="primary-button"
            :label="t('cashOutConfirm.actions.printReceipt')"
            icon="print"
            :loading="isPreparingReceipt"
            unelevated
            no-caps
            @click="emit('print-receipt')"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// qrcode is a CommonJS package. This browser subpath avoids Vite import-analysis
// issues seen with the package root import in this older Quasar/Vite setup.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode/lib/browser';
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import type { CashOutRecord } from 'src/types/cash-out';
import {
  formatCashOutBchSats,
  formatCashOutMarketRate,
  formatCashOutMinorFiatAmount,
} from 'src/services/cash-out-pricing';

import { createCashOutPaymentUri } from 'src/services/cash-out-payment-uri';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    cashOut: CashOutRecord;
    isPaymentDetected?: boolean;
    isCashOutCompleted?: boolean;
    isWatchingForPayment?: boolean;
    paymentDetectionError?: string;
    isPreparingReceipt?: boolean;
    isCompletingCashOut?: boolean;
  }>(),
  {
    isPaymentDetected: false,
    isWatchingForPayment: false,
    paymentDetectionError: '',
    isPreparingReceipt: false,
    isCashOutCompleted: false,
    isCompletingCashOut: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm-cash-paid': [];
  'print-receipt': [];
}>();

const $q = useQuasar();
const { locale, t } = useI18n({ useScope: 'global' });

const qrDataUrl = ref('');
const isGeneratingQr = ref(false);

const paymentUri = computed(() => {
  if (props.cashOut.paymentUri) {
    return props.cashOut.paymentUri;
  }

  return createCashOutPaymentUri({
    address: props.cashOut.treasuryReceivingAddress,

    requiredSats: props.cashOut.bchSatsRequired,

    label: t('cashOutConfirm.paymentUri.label'),

    message: props.cashOut.serial,
  }).uri;
});

const serviceFeeBchSats = computed(() => {
  return Math.max(
    props.cashOut.bchSatsRequired - props.cashOut.marketBchSats,
    0
  );
});

const cashOutStatusLabel = computed(() => {
  return props.cashOut.status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
});

async function generateQrCode(): Promise<void> {
  qrDataUrl.value = '';

  if (!props.cashOut.treasuryReceivingAddress || !paymentUri.value) {
    return;
  }

  isGeneratingQr.value = true;

  try {
    qrDataUrl.value = await QRCode.toDataURL(paymentUri.value, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 460,
    });
  } catch (error) {
    console.error(error);
    qrDataUrl.value = '';
  } finally {
    isGeneratingQr.value = false;
  }
}

async function copyToClipboard(
  value: string,
  successMessage: string
): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);

    $q.notify({
      type: 'positive',
      message: successMessage,
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message: t('cashOutConfirm.messages.copyFailed'),
    });
  }
}

function handleCopyAddress(): void {
  void copyToClipboard(
    props.cashOut.treasuryReceivingAddress,
    t('cashOutConfirm.messages.treasuryAddressCopied')
  );
}

function handleCopyUri(): void {
  void copyToClipboard(
    paymentUri.value,
    t('cashOutConfirm.messages.paymentUriCopied')
  );
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return formatCashOutMinorFiatAmount(amountMinor, currency);
}

function formatBchAmount(sats: number): string {
  return formatCashOutBchSats(sats);
}

function formatRate(marketRate: number, currency: string): string {
  return formatCashOutMarketRate(marketRate, currency);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

watch(
  [() => props.modelValue, () => paymentUri.value, () => locale.value],
  () => {
    if (props.modelValue) {
      void generateQrCode();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.confirm-card {
  border-radius: 24px;
  max-width: 95vw;
  width: 660px;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
}

.header-icon {
  align-items: center;
  background: #111111;
  border-radius: 16px;
  color: #00ce1b;
  display: flex;
  flex: 0 0 48px;
  font-size: 28px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.dialog-title-row {
  align-items: center;
  display: flex;
  gap: 14px;
}

.dialog-title {
  color: #111111;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.4px;
  line-height: 1.08;
}

.dialog-subtitle {
  color: #666666;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
}

.quote-status-pill {
  --quote-pill-bg: #ffffff;
  --quote-pill-border: rgba(0, 206, 27, 0.45);
  --quote-pill-text: #111111;
  --quote-pill-icon: #00ce1b;

  align-items: center;
  background: var(--quote-pill-bg);
  border: 2px solid var(--quote-pill-border);
  border-radius: 999px;
  color: var(--quote-pill-text);
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  gap: 5px;
  line-height: 1.2;
  margin-bottom: 12px;
  max-width: 100%;
  padding: 5px 9px;
}

.quote-status-pill--locked {
  --quote-pill-bg: #ffffff;
  --quote-pill-border: rgba(0, 206, 27, 0.45);
  --quote-pill-text: #235c2b;
  --quote-pill-icon: #00ce1b;
}

.quote-status-pill--fallback {
  --quote-pill-bg: #ffffff;
  --quote-pill-border: rgba(245, 130, 32, 0.45);
  --quote-pill-text: #8a4b00;
  --quote-pill-icon: #f58220;
}

.quote-status-pill-icon {
  color: var(--quote-pill-icon);
  flex: 0 0 auto;
  font-size: 16px;
  padding-bottom: 1px;
}

.dialog-body {
  padding: 22px;
}

.cash-out-breakdown {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  overflow: hidden;
}

.breakdown-header {
  align-items: center;
  background: #f7f8f7;
  border-bottom: 1px solid #e4e4e4;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 16px;
}

.breakdown-title {
  color: #000000;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: 0.06em;
  line-height: 1.15;
  text-transform: uppercase;
}

.breakdown-header-icon {
  align-items: center;
  background: #111111;
  border-radius: 14px;
  color: #00ce1b;
  display: flex;
  flex: 0 0 42px;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.breakdown-lines {
  padding: 14px 16px;
}

.breakdown-line {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.breakdown-line--main {
  padding-top: 2px;
}

.breakdown-line-text {
  min-width: 0;
}

.breakdown-label {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
}

.breakdown-note {
  color: #777777;
  font-size: 12px;
  font-weight: 700;
  margin-top: 2px;
}

.breakdown-values {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 5px;
  text-align: right;
}

.breakdown-values strong {
  color: #111111;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.1;
}

.breakdown-bch-value,
.breakdown-total-values span {
  align-items: center;
  color: #666666;
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  gap: 5px;
  justify-content: flex-end;
  line-height: 1.2;
}

.breakdown-bch-logo {
  border-radius: 999px;
  display: block;
  height: 15px;
  width: 15px;
}

.breakdown-fee-row {
  align-items: center;
  border-top: 1px solid #eeeeee;
  color: #777777;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 10px;
  text-align: right;
}

.breakdown-fee-label {
  font-size: 12px;
  font-weight: 750;
}

.breakdown-fee-fiat {
  color: #444444;
  font-size: 13px;
  font-weight: 850;
}

.breakdown-fee-bch {
  align-items: center;
  color: #777777;
  display: inline-flex;
  font-size: 11px;
  font-weight: 750;
  gap: 4px;
}

.breakdown-fee-percent {
  color: #888888;
  font-size: 11px;
  font-weight: 750;
}

.breakdown-total {
  align-items: center;
  background: #111111;
  color: #ffffff;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 16px;
}

.breakdown-total-label {
  color: #ffffff;
  font-size: 16px;
  font-weight: 950;
  line-height: 1.15;
}

.breakdown-total-note {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 700;
  margin-top: 4px;
}

.breakdown-total-values {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 5px;
  text-align: right;
}

.breakdown-total-values strong {
  color: #ffffff;
  font-size: 22px;
  font-weight: 950;
  line-height: 1.05;
}

.breakdown-total-values span {
  color: #00ce1b;
}

.payment-card,
.details-card {
  background: #ffffff;
  border-color: #dddddd;
  border-radius: 18px;
}

.payment-card :deep(.q-card__section) {
  padding: 16px;
}

.payment-instruction {
  margin-bottom: 14px;
}

.payment-instruction-title {
  color: #111111;
  font-size: 15px;
  font-weight: 850;
  line-height: 1.3;
  margin: 0;
}

.payment-instruction-subtitle {
  color: #777777;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
  margin: 4px 0 0;
}

.payment-layout {
  display: flex;
  justify-content: center;
}

.payment-qr-panel {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.amount-to-send-card {
  align-items: flex-start;
  background: transparent;
  border: 0;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 0 2px 4px;
  width: 246px;
}

.amount-label {
  color: #666666;
  font-size: 13px;
  font-weight: 850;
  letter-spacing: 0;
  line-height: 1.2;
  text-transform: none;
}

.amount-values {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  text-align: right;
}

.amount-values strong {
  color: #111111;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.1;
}

.amount-values span {
  align-items: center;
  color: #666666;
  display: inline-flex;
  font-size: 11px;
  font-weight: 800;
  gap: 4px;
  justify-content: flex-end;
  line-height: 1.15;
  white-space: nowrap;
}

.amount-bch-logo {
  border-radius: 999px;
  display: block;
  flex: 0 0 13px;
  height: 13px;
  width: 13px;
}

.qr-copy-button {
  background: transparent;
  border: 0;
  border-radius: 20px;
  cursor: pointer;
  display: block;
  padding: 0;
}

.qr-copy-button:focus-visible {
  outline: 3px solid rgba(0, 206, 27, 0.35);
  outline-offset: 3px;
}

.qr-wrap {
  align-items: center;
  background: #ffffff;
  border: 3px solid #00ce1b;
  border-radius: 20px;
  display: flex;
  height: 246px;
  justify-content: center;
  padding: 10px;
  transition: border-color 160ms ease, transform 160ms ease;
  width: 246px;
}

.qr-copy-button:hover .qr-wrap {
  border-color: rgba(0, 206, 27, 0.65);
  transform: translateY(-1px);
}

.qr-image {
  height: 226px;
  width: 226px;
}

.copy-soft-button {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 999px;
  color: #333333;
  font-size: 12px;
  font-weight: 800;
  min-height: 34px;
  padding: 0 12px;
}

.copy-soft-button :deep(.q-icon) {
  color: #00a816;
  font-size: 17px;
}

.order-details-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 18px;
  overflow: hidden;
}

.order-details-card :deep(.q-item) {
  min-height: 54px;
  padding: 10px 12px;
}

.order-details-card :deep(.q-item__label) {
  color: #111111;
  font-size: 13px;
  font-weight: 850;
}

.order-details-card :deep(.q-item__label--caption) {
  color: #777777;
  font-size: 11px;
  font-weight: 650;
}

.order-details-body {
  border-top: 1px solid #e4e4e4;
  padding: 10px 14px;
}

.details-row {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: max-content minmax(0, 1fr);
  padding: 8px 0;
}

.details-row + .details-row {
  border-top: 1px solid #eeeeee;
}

.details-row span {
  color: #666666;
  font-size: 13px;
  min-width: 0;
  white-space: nowrap;
}

.details-row strong {
  color: #111111;
  font-size: 13px;
  font-weight: 850;
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.details-address-value {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.details-address-text {
  flex: 1 1 auto;
  min-width: 0;
}

.details-copy-button {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 999px;
  color: #333333;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
  min-height: 28px;
  padding: 0 9px;
}

.details-copy-button :deep(.q-icon) {
  color: #00a816;
  font-size: 14px;
}

.success-panel {
  align-items: center;
  background: #f7f8f7;
  border: 1px solid rgba(0, 206, 27, 0.55);
  border-radius: 22px;
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
  display: flex;
  flex-direction: column;
  padding: 26px 20px;
  text-align: center;
}

.success-icon {
  align-items: center;
  animation: success-pop 280ms ease-out;
  background: #00ce1b;
  border-radius: 999px;
  color: #000000;
  display: flex;
  font-size: 60px;
  height: 92px;
  justify-content: center;
  margin-bottom: 14px;
  width: 92px;
}

.success-panel h2 {
  color: #111111;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.1;
  margin: 0 0 10px;
}

.success-panel p {
  color: #333333;
  font-size: 18px;
  line-height: 1.35;
  margin: 0;
}

.dialog-actions {
  padding: 14px 22px;
}

.dialog-actions--review {
  background: #111111;
  justify-content: center;
}

.cancel-review-button {
  border-radius: 999px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 850;
  min-height: 38px;
  padding: 0 16px;
}

.dialog-actions--review .cancel-review-button {
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.cancel-review-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
  min-height: 42px;
  padding: 0 18px;
}

@keyframes success-pop {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .dialog-header {
    gap: 10px;
    padding: 18px;
  }

  .dialog-title-row {
    gap: 12px;
  }

  .dialog-title {
    font-size: 26px;
  }

  .dialog-subtitle {
    font-size: 13px;
  }

  .dialog-body {
    padding: 18px;
  }

  .breakdown-header {
    padding: 14px;
  }

  .breakdown-heading {
    font-size: 17px;
  }

  .breakdown-header-icon {
    flex-basis: 38px;
    font-size: 22px;
    height: 38px;
    width: 38px;
  }

  .breakdown-lines {
    padding: 13px 14px;
  }

  .breakdown-label {
    font-size: 14px;
  }

  .breakdown-values strong {
    font-size: 17px;
  }

  .breakdown-total {
    padding: 14px;
  }

  .breakdown-total-values strong {
    font-size: 20px;
  }

  .payment-card :deep(.q-card__section) {
    padding: 14px;
  }

  .amount-to-send-card {
    margin: 0 auto;
    max-width: 236px;
    padding: 0 2px 4px;
    width: 236px;
  }

  .amount-label {
    font-size: 13px;
  }

  .amount-values strong {
    font-size: 16px;
  }

  .amount-values span {
    font-size: 11px;
  }

  .qr-wrap {
    height: 236px;
    width: 236px;
  }

  .qr-image {
    height: 216px;
    width: 216px;
  }

  .details-row {
    gap: 10px;
    grid-template-columns: max-content minmax(0, 1fr);
  }

  .details-row span,
  .details-row strong {
    font-size: 12px;
  }

  .details-copy-button {
    font-size: 10px;
    min-height: 26px;
    padding: 0 7px;
  }

  .details-copy-button :deep(.q-icon) {
    font-size: 13px;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-actions .q-btn {
    width: 100%;
  }
  .success-actions {
    gap: 10px;
  }

  .secondary-action-button {
    border-radius: 14px;
    font-weight: 800;
    min-height: 44px;
    padding: 0 18px;
  }

  @media (max-width: 420px) {
    .success-actions {
      align-items: stretch;
      flex-direction: column-reverse;
    }

    .success-actions .q-btn {
      width: 100%;
    }
  }
}
</style>
