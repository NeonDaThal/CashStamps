<template>
  <div v-if="treasuryAddress" class="treasury-top-up-card">
    <div v-if="paymentDetection" class="top-up-received-state">
      <div class="received-icon-wrap">
        <q-icon name="check" />
      </div>

      <div class="received-title">
        {{ t('treasuryTopUpQr.receivedTitle') }}
      </div>

      <p class="received-subtitle">
        {{ t('treasuryTopUpQr.receivedSubtitle') }}
      </p>

      <div class="received-details">
        <div class="received-detail-row">
          <span>{{ t('treasuryTopUpQr.receivedAmount') }}</span>
          <strong>{{ formatBchSats(paymentDetection.receivedSats) }}</strong>
        </div>

        <div v-if="paymentDetection.txid" class="received-detail-row">
          <span>{{ t('treasuryTopUpQr.receivedTxid') }}</span>
          <strong class="received-txid" :title="paymentDetection.txid">
            {{ shortenText(paymentDetection.txid, 18, 8) }}
          </strong>
        </div>
      </div>
    </div>

    <template v-else>
      <button
        type="button"
        class="qr-frame"
        :aria-label="t('treasuryTopUpQr.tapQrToCopy')"
        @click="handleCopyAddress"
      >
        <q-spinner v-if="isGeneratingQr" color="green" size="42px" />

        <q-img
          v-else-if="qrDataUrl"
          :src="qrDataUrl"
          :alt="t('treasuryTopUpQr.qrAlt')"
          class="top-up-qr-image"
          fit="contain"
        />

        <div v-else class="qr-unavailable">
          {{ t('treasuryTopUpQr.qrUnavailable') }}
        </div>
      </button>

      <div class="qr-copy-hint">
        {{ t('treasuryTopUpQr.tapQrToCopy') }}
      </div>

      <div class="treasury-address-panel">
        <div class="treasury-address-copy">
          <div class="treasury-address-text">
            <div class="treasury-address-label">
              {{ t('treasuryTopUpQr.treasuryAddress') }}
            </div>

            <div class="treasury-address-value" :title="topUpUri.address">
              {{ shortTreasuryAddress }}
            </div>
          </div>

          <q-btn
            flat
            dense
            class="address-copy-pill"
            icon="content_copy"
            :label="t('treasuryTopUpQr.copy')"
            no-caps
            @click="handleCopyAddress"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// qrcode is a CommonJS package. This browser subpath avoids Vite import-analysis
// issues seen with the package root import in this older Quasar/Vite setup.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode/lib/browser';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { createTreasuryTopUpUri } from 'src/services/treasury-topup-uri';
import { formatBchSats } from 'src/services/voucher-pricing';
import {
  watchTreasuryIncomingPayment,
  type TreasuryIncomingPaymentDetection,
  type TreasuryIncomingPaymentWatcher,
} from 'src/services/treasury-incoming-detector';

const props = defineProps<{
  treasuryAddress: string;
}>();

const emit = defineEmits<{
  paymentDetected: [detection: TreasuryIncomingPaymentDetection];
}>();

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

const MINIMUM_DETECTED_TOP_UP_SATS = 1;

const qrDataUrl = ref('');
const isGeneratingQr = ref(false);
const isWatchingForPayment = ref(false);
const watcherError = ref('');
const paymentDetection = ref<TreasuryIncomingPaymentDetection | null>(null);
const paymentWatcher = ref<TreasuryIncomingPaymentWatcher | null>(null);

const topUpUri = computed(() =>
  createTreasuryTopUpUri({
    address: props.treasuryAddress,
  })
);

const shortTreasuryAddress = computed(() =>
  shortenText(topUpUri.value.address, 24, 10)
);

async function generateQrCode(): Promise<void> {
  qrDataUrl.value = '';

  if (!props.treasuryAddress) {
    return;
  }

  isGeneratingQr.value = true;

  try {
    qrDataUrl.value = await QRCode.toDataURL(topUpUri.value.uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 420,
    });
  } catch (error) {
    console.error(error);
    qrDataUrl.value = '';
  } finally {
    isGeneratingQr.value = false;
  }
}

async function startPaymentWatcher(): Promise<void> {
  await stopPaymentWatcher();

  watcherError.value = '';
  paymentDetection.value = null;

  if (!props.treasuryAddress) {
    return;
  }

  isWatchingForPayment.value = true;

  try {
    paymentWatcher.value = await watchTreasuryIncomingPayment({
      treasuryAddress: props.treasuryAddress,
      requiredSats: MINIMUM_DETECTED_TOP_UP_SATS,
      pollIntervalMs: 3_000,
      onDetected: (detection) => {
        paymentDetection.value = detection;
        isWatchingForPayment.value = false;
        watcherError.value = '';
        emit('paymentDetected', detection);
      },
      onError: (error) => {
        console.error(error);
        watcherError.value = t('treasuryTopUpQr.watchingError');
      },
    });
  } catch (error) {
    console.error(error);
    watcherError.value = t('treasuryTopUpQr.watchingError');
    isWatchingForPayment.value = false;
  }
}

async function stopPaymentWatcher(): Promise<void> {
  if (!paymentWatcher.value) {
    return;
  }

  try {
    await paymentWatcher.value.stop();
  } catch (error) {
    console.warn(error);
  } finally {
    paymentWatcher.value = null;
    isWatchingForPayment.value = false;
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
      message: t('treasuryTopUpQr.copyFailed'),
    });
  }
}

function handleCopyAddress(): void {
  void copyToClipboard(
    topUpUri.value.address,
    t('treasuryTopUpQr.addressCopied')
  );
}

function shortenText(
  value: string,
  startLength: number,
  endLength: number
): string {
  if (value.length <= startLength + endLength + 1) {
    return value;
  }

  return `${value.slice(0, startLength)}…${value.slice(-endLength)}`;
}

onMounted(() => {
  void generateQrCode();
  void startPaymentWatcher();
});

onUnmounted(() => {
  void stopPaymentWatcher();
});

watch(
  () => props.treasuryAddress,
  () => {
    void generateQrCode();
    void startPaymentWatcher();
  }
);
</script>

<style lang="scss" scoped>
.treasury-top-up-card {
  display: grid;
  gap: 14px;
}

.qr-frame {
  align-items: center;
  appearance: none;
  background: #ffffff;
  border: 3px solid #00ce1b;
  border-radius: 24px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  justify-content: center;
  min-height: 258px;
  padding: 14px;
  width: 100%;
}

.top-up-qr-image {
  display: block;
  height: 226px;
  width: 226px;
}

.qr-unavailable {
  color: #d93025;
  font-size: 14px;
  font-weight: 850;
}

.qr-copy-hint {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  margin-top: -6px;
  text-align: center;
}

.treasury-address-panel {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 12px 14px;
}

.treasury-address-copy {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.treasury-address-text {
  min-width: 0;
}

.treasury-address-label {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.treasury-address-value {
  color: #111111;
  direction: ltr;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.25;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-copy-pill {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  border-radius: 999px;
  color: #0c5f17;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 850;
  min-height: 32px;
  padding: 0 10px;
}

.address-copy-pill :deep(.q-focus-helper) {
  border-radius: inherit;
}


.top-up-received-state {
  align-items: center;
  background: linear-gradient(135deg, #eaffed 0%, #ffffff 100%);
  border: 1px solid rgba(0, 206, 27, 0.35);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  text-align: center;
}

.received-icon-wrap {
  align-items: center;
  animation: received-pop 360ms ease-out;
  background: #00ce1b;
  border-radius: 999px;
  color: #000000;
  display: flex;
  font-size: 44px;
  height: 78px;
  justify-content: center;
  width: 78px;
}

.received-title {
  color: #111111;
  font-size: 28px;
  font-weight: 950;
  line-height: 1.05;
  margin-top: 14px;
}

.received-subtitle {
  color: #444444;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.35;
  margin: 8px 0 0;
}

.received-details {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 16px;
  margin-top: 16px;
  padding: 2px 12px;
  width: 100%;
}

.received-detail-row {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  padding: 10px 0;
}

.received-detail-row + .received-detail-row {
  border-top: 1px solid #eeeeee;
}

.received-detail-row span {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
}

.received-detail-row strong {
  color: #111111;
  font-size: 13px;
  font-weight: 900;
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.received-txid {
  direction: ltr;
}

@keyframes received-pop {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }

  70% {
    opacity: 1;
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .qr-frame {
    min-height: 238px;
    padding: 12px;
  }

  .top-up-qr-image {
    height: 212px;
    width: 212px;
  }

  .treasury-address-copy {
    align-items: stretch;
    flex-direction: column;
  }

  .address-copy-pill {
    width: 100%;
  }
}
</style>
