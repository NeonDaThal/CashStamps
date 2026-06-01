<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="confirm-card">
      <q-card-section class="dialog-header">
        <div class="header-icon">
          <q-icon :name="isPaymentDetected ? 'check_circle' : 'qr_code_2'" />
        </div>

        <div>
          <div class="text-h5 text-weight-bold">
            {{ isPaymentDetected ? 'BCH received' : 'Review cash-out payment' }}
          </div>
          <p class="text-grey-7 q-mb-none">
            {{
              isPaymentDetected
                ? 'The customer payment has been detected in the merchant treasury.'
                : 'Ask the customer to scan the QR code and send the required BCH.'
            }}
          </p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <template v-if="!isPaymentDetected">
          <q-banner
            :class="
              cashOut.quote.isFallbackQuote
                ? 'bg-orange-1 text-orange-10'
                : 'bg-green-1 text-green-10'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="
                  cashOut.quote.isFallbackQuote ? 'warning' : 'check_circle'
                "
              />
            </template>

            <span v-if="cashOut.quote.isFallbackQuote">
              Fallback price quote used. Check the rate carefully before
              continuing.
            </span>

            <span v-else>Live price quote locked successfully.</span>
          </q-banner>

          <section class="summary-grid">
            <div class="summary-tile highlight">
              <div class="summary-label">Cash customer receives</div>
              <div class="summary-value">
                {{
                  formatFiatAmount(
                    cashOut.fiatAmountMinor,
                    cashOut.fiatCurrency
                  )
                }}
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">Customer sends</div>
              <div class="summary-value">
                {{ formatBchAmount(cashOut.bchSatsRequired) }}
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">Fiat equivalent sent</div>
              <div class="summary-value">
                {{
                  formatFiatAmount(
                    cashOut.customerSendsFiatEquivalentMinor,
                    cashOut.fiatCurrency
                  )
                }}
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">Service fee / spread</div>
              <div class="summary-value">
                {{
                  formatFiatAmount(
                    cashOut.fee.totalServiceFeeAmountMinor,
                    cashOut.fiatCurrency
                  )
                }}
                —
                {{ formatPercent(cashOut.fee.totalServiceFeeBasisPoints) }}
              </div>
            </div>
          </section>

          <q-card flat bordered class="qr-card q-mt-md">
            <q-card-section>
              <div class="payment-heading">
                <div>
                  <div class="text-h6">Customer payment QR</div>
                  <p class="text-grey-7 q-mb-none">
                    Ask the customer to scan this QR code with their BCH wallet.
                    Wait for the BCH payment to arrive in your Treasury Wallet
                    before giving their cash.
                  </p>
                </div>
              </div>

              <div class="payment-layout q-mt-md">
                <div class="qr-wrap">
                  <q-spinner
                    v-if="isGeneratingQr"
                    color="primary"
                    size="42px"
                  />

                  <q-img
                    v-else-if="qrDataUrl"
                    :src="qrDataUrl"
                    alt="Cash-out BCH payment QR"
                    class="qr-image"
                    fit="contain"
                  />

                  <div v-else class="text-negative text-center">
                    QR unavailable
                  </div>
                </div>

                <div class="payment-details">
                  <q-list bordered separator class="details-list">
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Amount to send</q-item-label>
                        <q-item-label class="text-weight-bold">
                          {{ formatBchAmount(cashOut.bchSatsRequired) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label caption>
                          Treasury receiving address
                        </q-item-label>
                        <q-item-label class="text-break">
                          {{ cashOut.treasuryReceivingAddress }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Payment URI</q-item-label>
                        <q-item-label class="text-break">
                          {{ paymentUri }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <div class="copy-actions q-mt-md">
                    <q-btn
                      color="primary"
                      outline
                      label="Copy address"
                      no-caps
                      @click="handleCopyAddress"
                    />

                    <q-btn
                      color="primary"
                      outline
                      label="Copy payment URI"
                      no-caps
                      @click="handleCopyUri"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="details-card q-mt-md">
            <q-card-section>
              <div class="details-row">
                <span>Reference</span>
                <strong>{{ cashOut.serial }}</strong>
              </div>

              <div class="details-row">
                <span>Market rate</span>
                <strong>
                  {{
                    formatRate(cashOut.quote.marketRate, cashOut.fiatCurrency)
                  }}
                </strong>
              </div>

              <div class="details-row">
                <span>Quote source</span>
                <strong>
                  {{ quoteSourceLabel }}
                  <q-badge
                    v-if="cashOut.quote.isFallbackQuote"
                    color="orange"
                    class="q-ml-sm"
                  >
                    fallback
                  </q-badge>
                </strong>
              </div>

              <div class="details-row">
                <span>Quote time</span>
                <strong>
                  {{ formatDateTime(cashOut.quote.marketRateTimestamp) }}
                </strong>
              </div>

              <div v-if="cashOut.quote.quoteExpiresAt" class="details-row">
                <span>Quote expires</span>
                <strong>
                  {{ formatDateTime(cashOut.quote.quoteExpiresAt) }}
                </strong>
              </div>

              <div class="details-row">
                <span>Status</span>
                <strong>{{ cashOut.status }}</strong>
              </div>
            </q-card-section>
          </q-card>

          <q-banner class="bg-grey-2 text-grey-9 q-mt-md" rounded>
            <template #avatar>
              <q-icon name="info" />
            </template>

            Step 4 will connect automatic BCH detection. This screen should not
            be used for live cash payouts until the detector is active.
          </q-banner>
        </template>

        <template v-else>
          <div class="success-panel">
            <div class="success-icon">
              <q-icon name="check_circle" />
            </div>

            <h2>BCH received</h2>

            <p>
              Now give the customer
              <strong>
                {{
                  formatFiatAmount(
                    cashOut.fiatAmountMinor,
                    cashOut.fiatCurrency
                  )
                }}
              </strong>
              cash.
            </p>
          </div>

          <q-card flat bordered class="details-card q-mt-md">
            <q-card-section>
              <div class="details-row">
                <span>Reference</span>
                <strong>{{ cashOut.serial }}</strong>
              </div>

              <div class="details-row">
                <span>BCH received</span>
                <strong>
                  {{
                    formatBchAmount(
                      cashOut.bchSatsReceived ?? cashOut.bchSatsRequired
                    )
                  }}
                </strong>
              </div>

              <div v-if="cashOut.receivedTxid" class="details-row">
                <span>Transaction ID</span>
                <strong class="text-break">{{ cashOut.receivedTxid }}</strong>
              </div>

              <div v-if="cashOut.detectedAt" class="details-row">
                <span>Detected</span>
                <strong>{{ formatDateTime(cashOut.detectedAt) }}</strong>
              </div>
            </q-card-section>
          </q-card>
        </template>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          :label="isPaymentDetected ? 'Close' : 'Close review'"
          color="grey-8"
          :disable="isPreparingReceipt"
          no-caps
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          v-if="isPaymentDetected"
          class="primary-button"
          label="Print Receipt"
          icon="print"
          :loading="isPreparingReceipt"
          unelevated
          no-caps
          @click="emit('print-receipt')"
        />
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

import type { CashOutRecord } from 'src/types/cash-out';
import {
  formatCashOutBasisPointsAsPercent,
  formatCashOutBchSats,
  formatCashOutMarketRate,
  formatCashOutMinorFiatAmount,
} from 'src/services/cash-out-pricing';
import { createTreasuryTopUpUri } from 'src/services/treasury-topup-uri';

const SATS_PER_BCH = 100_000_000;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    cashOut: CashOutRecord;
    isPaymentDetected?: boolean;
    isPreparingReceipt?: boolean;
  }>(),
  {
    isPaymentDetected: false,
    isPreparingReceipt: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'print-receipt': [];
}>();

const $q = useQuasar();

const qrDataUrl = ref('');
const isGeneratingQr = ref(false);

const paymentUri = computed(() => {
  if (props.cashOut.paymentUri) {
    return props.cashOut.paymentUri;
  }

  return createTreasuryTopUpUri({
    address: props.cashOut.treasuryReceivingAddress,
    amountBch: satsToBchAmount(props.cashOut.bchSatsRequired),
    label: 'BCH Cash-out',
    message: props.cashOut.serial,
  }).uri;
});

const quoteSourceLabel = computed(() => {
  const labels: Record<CashOutRecord['quote']['source'], string> = {
    fake_phase_2_quote: 'Development quote',
    coingecko: 'CoinGecko',
    cached: 'Cached quote',
    general_protocols_oracle: 'General Protocols Oracle',
    manual: 'Manual quote',
    unknown: 'Unknown',
  };

  return labels[props.cashOut.quote.source];
});

function satsToBchAmount(sats: number): number {
  return Number((sats / SATS_PER_BCH).toFixed(8));
}

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
      message: 'Copy failed.',
    });
  }
}

function handleCopyAddress(): void {
  void copyToClipboard(
    props.cashOut.treasuryReceivingAddress,
    'Treasury address copied.'
  );
}

function handleCopyUri(): void {
  void copyToClipboard(paymentUri.value, 'Payment URI copied.');
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

function formatPercent(basisPoints: number): string {
  return formatCashOutBasisPointsAsPercent(basisPoints);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

watch(
  [() => props.modelValue, () => paymentUri.value],
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
  align-items: flex-start;
  display: flex;
  gap: 14px;
  padding: 22px;
}

.header-icon {
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

.dialog-body {
  padding: 22px;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
}

.summary-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 16px;
}

.summary-tile.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
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
  font-size: 17px;
  font-weight: 850;
  line-height: 1.25;
}

.qr-card,
.details-card {
  background: #ffffff;
  border-color: #dddddd;
  border-radius: 18px;
}

.payment-heading {
  align-items: flex-start;
  display: flex;
  gap: 12px;
}

.payment-layout {
  align-items: flex-start;
  display: grid;
  gap: 16px;
  grid-template-columns: auto 1fr;
}

.qr-wrap {
  align-items: center;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 18px;
  display: flex;
  height: 240px;
  justify-content: center;
  padding: 10px;
  width: 240px;
}

.qr-image {
  height: 220px;
  width: 220px;
}

.payment-details {
  min-width: 0;
}

.details-list {
  border-radius: 16px;
  overflow: hidden;
}

.copy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.details-row {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 8px 0;
}

.details-row + .details-row {
  border-top: 1px solid #eeeeee;
}

.details-row span {
  color: #666666;
}

.details-row strong {
  color: #111111;
  text-align: right;
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
    padding: 18px;
  }

  .dialog-body {
    padding: 18px;
  }

  .summary-grid,
  .payment-layout {
    grid-template-columns: 1fr;
  }

  .qr-wrap {
    justify-self: center;
  }

  .details-row {
    flex-direction: column;
    gap: 4px;
  }

  .details-row strong {
    text-align: left;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-actions .q-btn {
    width: 100%;
  }
}
</style>
