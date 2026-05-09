<template>
  <div>
    <q-banner
      v-if="showPrivateKeyWarning"
      class="bg-orange-1 text-orange-10 q-mb-md"
      rounded
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>

      Development preview only. This receipt contains a sweepable private key QR.
      Anyone who scans or copies it can sweep the voucher funds.
    </q-banner>

    <q-card flat bordered class="voucher-receipt-preview-card">
      <q-card-section v-if="isLoading" class="text-center">
        <q-spinner size="32px" color="primary" />
        <div class="q-mt-sm text-grey-7">Building receipt preview...</div>
      </q-card-section>

      <q-card-section v-else-if="errorMessage">
        <q-banner class="bg-red-1 text-red-9" rounded>
          <template #avatar>
            <q-icon name="error" />
          </template>

          {{ errorMessage }}
        </q-banner>
      </q-card-section>

      <q-card-section v-else-if="receiptData" class="receipt-shell">
        <div class="receipt-paper">
          <div class="receipt-header">
            <div class="receipt-title">{{ receiptData.title }}</div>
            <div class="receipt-subtitle">Bitcoin Cash Voucher</div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-value">
            <div class="receipt-value-main">
              {{ receiptData.loadedFiatLabel }}
            </div>
            <div class="receipt-value-sub">
              in Bitcoin Cash
            </div>
            <div class="receipt-bch">
              {{ receiptData.bchAmountLabel }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-qr-wrap">
            <img
              v-if="qrCodeDataUrl"
              :src="qrCodeDataUrl"
              alt="Sweepable BCH voucher QR code"
              class="receipt-qr"
            />
          </div>

          <p class="receipt-instruction">
            {{ receiptData.redemptionInstruction }}
          </p>

          <div class="receipt-warning">
            {{ receiptData.cashWarning }}
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-row">
            <span>Reference</span>
            <strong>{{ receiptData.serial }}</strong>
          </div>

          <div class="receipt-row">
            <span>Issued</span>
            <strong>{{ receiptData.issuedAtLabel }}</strong>
          </div>

          <div class="receipt-block">
            <div class="receipt-label">Voucher address</div>
            <div class="receipt-address">
              {{ receiptData.address }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <p class="receipt-support">
            {{ receiptData.supportNote }}
          </p>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import QRCode from 'qrcode/lib/browser';

import type { VoucherRecord } from 'src/types/voucher';
import {
  buildVoucherReceiptData,
  type VoucherReceiptData,
} from 'src/services/voucher-receipt';

const props = withDefaults(
  defineProps<{
    voucher: VoucherRecord;
    showPrivateKeyWarning?: boolean;
  }>(),
  {
    showPrivateKeyWarning: true,
  }
);

const receiptData = ref<VoucherReceiptData | null>(null);
const qrCodeDataUrl = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

async function buildReceiptPreview(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  receiptData.value = null;
  qrCodeDataUrl.value = '';

  try {
    const builtReceiptData = await buildVoucherReceiptData(props.voucher);

    const builtQrCodeDataUrl = await QRCode.toDataURL(
      builtReceiptData.qrPayload,
      {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 240,
      }
    );

    receiptData.value = builtReceiptData;
    qrCodeDataUrl.value = builtQrCodeDataUrl;
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not build voucher receipt preview.';
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.voucher,
  () => {
    void buildReceiptPreview();
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>

<style scoped>
.voucher-receipt-preview-card {
  background: #f5f5f5;
}

.receipt-shell {
  display: flex;
  justify-content: center;
  padding: 24px 12px;
}

.receipt-paper {
  width: 320px;
  max-width: 100%;
  background: #ffffff;
  color: #111111;
  border: 1px solid #dddddd;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  font-family: 'Courier New', Courier, monospace;
  padding: 18px 14px;
}

.receipt-header {
  text-align: center;
}

.receipt-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.receipt-subtitle {
  font-size: 12px;
  margin-top: 4px;
}

.receipt-divider {
  border-top: 1px dashed #111111;
  margin: 14px 0;
}

.receipt-value {
  text-align: center;
}

.receipt-value-main {
  font-size: 24px;
  font-weight: 700;
}

.receipt-value-sub {
  font-size: 13px;
  margin-top: 2px;
}

.receipt-bch {
  font-size: 13px;
  margin-top: 6px;
  word-break: break-word;
}

.receipt-qr-wrap {
  display: flex;
  justify-content: center;
  margin: 12px 0;
}

.receipt-qr {
  width: 240px;
  height: 240px;
  image-rendering: pixelated;
}

.receipt-instruction,
.receipt-support {
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
  margin: 0;
}

.receipt-warning {
  border: 1px solid #111111;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  margin-top: 12px;
  padding: 8px;
  text-align: center;
  text-transform: uppercase;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 8px;
}

.receipt-row strong {
  text-align: right;
}

.receipt-block {
  font-size: 12px;
  margin-top: 10px;
}

.receipt-label {
  font-weight: 700;
  margin-bottom: 4px;
}

.receipt-address {
  word-break: break-all;
}
</style>
