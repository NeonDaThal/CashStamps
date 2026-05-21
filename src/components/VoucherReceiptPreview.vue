<template>
  <div class="receipt-preview">
    <q-banner
      v-if="showPrivateKeyWarning"
      class="private-key-warning q-mb-md"
      rounded
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>

      {{ t('receiptPreview.privateKeyWarning') }}
    </q-banner>

    <q-card flat bordered class="voucher-receipt-preview-card">
      <q-card-section v-if="isLoading" class="loading-state">
        <q-spinner size="32px" color="primary" />
        <div class="q-mt-sm text-grey-7">
          {{ t('receiptPreview.loading') }}
        </div>
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
            <div class="receipt-brand">Bitcoin Cash</div>
            <div class="receipt-title">{{ receiptData.title }}</div>
            <div class="receipt-subtitle">
              {{ t('receiptPreview.receiptSubtitle') }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-value">
            <div class="receipt-value-label">
              {{ t('receiptPreview.voucherValueLoaded') }}
            </div>
            <div class="receipt-value-main">
              {{ receiptData.loadedFiatLabel }}
            </div>
            <div class="receipt-bch">
              {{ receiptData.bchAmountLabel }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-qr-section">
            <div class="qr-label">
              {{ t('receiptPreview.scanToSweep') }}
            </div>

            <div class="receipt-qr-wrap">
              <img
                v-if="qrCodeDataUrl"
                :src="qrCodeDataUrl"
                :alt="t('receiptPreview.qrAlt')"
                class="receipt-qr"
              />
            </div>

            <p class="receipt-instruction">
              {{ receiptData.redemptionInstruction }}
            </p>
          </div>

          <div class="receipt-warning">
            {{ receiptData.cashWarning }}
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-row">
            <span>{{ t('receiptPreview.reference') }}</span>
            <strong>{{ receiptData.serial }}</strong>
          </div>

          <div class="receipt-row">
            <span>{{ t('receiptPreview.issued') }}</span>
            <strong>{{ receiptData.issuedAtLabel }}</strong>
          </div>

          <div class="receipt-row">
            <span>{{ t('receiptPreview.customerPaid') }}</span>
            <strong>{{ receiptData.customerPaidLabel }}</strong>
          </div>

          <div class="receipt-block">
            <div class="receipt-label">
              {{ t('receiptPreview.voucherAddress') }}
            </div>
            <div class="receipt-address">
              {{ receiptData.address }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <p class="receipt-support">
            {{ receiptData.supportNote }}
          </p>

          <div class="receipt-footer">
            {{ t('receiptPreview.keepSafeUntilRedeemed') }}
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { locale, t } = useI18n({ useScope: 'global' });

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
    const builtReceiptData = await buildVoucherReceiptData(props.voucher, {
      title: t('receiptPreview.receiptTitle'),
      redemptionInstruction: t('receiptPreview.redemptionInstruction'),
      cashWarning: t('receiptPreview.cashWarning'),
      supportNote: t('receiptPreview.supportNote'),
      errors: {
        invalidDerivationIndex: t(
          'receiptPreview.errors.invalidDerivationIndex'
        ),
        missingSerial: t('receiptPreview.errors.missingSerial'),
        missingFiatCurrency: t('receiptPreview.errors.missingFiatCurrency'),
        invalidBchAmount: t('receiptPreview.errors.invalidBchAmount'),
        missingAddress: t('receiptPreview.errors.missingAddress'),
        addressMismatch: t('receiptPreview.errors.addressMismatch'),
      },
    });

    const builtQrCodeDataUrl = await QRCode.toDataURL(
      builtReceiptData.qrPayload,
      {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 260,
      }
    );

    receiptData.value = builtReceiptData;
    qrCodeDataUrl.value = builtQrCodeDataUrl;
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('receiptPreview.couldNotBuildPreview');
  } finally {
    isLoading.value = false;
  }
}

watch(
  [() => props.voucher, () => locale.value],
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
.receipt-preview {
  width: 100%;
}

.private-key-warning {
  background: #fff4df;
  color: #8a4b00;
}

.voucher-receipt-preview-card {
  background: #f1f1f1;
  border-color: #dddddd;
  border-radius: 22px;
  overflow: hidden;
}

.loading-state {
  padding: 28px 16px;
  text-align: center;
}

.receipt-shell {
  display: flex;
  justify-content: center;
  padding: 22px 10px;
}

.receipt-paper {
  background: #ffffff;
  border: 1px solid #d8d8d8;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
  color: #111111;
  font-family: 'Courier New', Courier, monospace;
  max-width: 100%;
  padding: 18px 14px;
  width: 330px;
}

.receipt-header {
  text-align: center;
}

.receipt-brand {
  background: #00ce1b;
  color: #000000;
  display: inline-block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  padding: 4px 8px;
  text-transform: uppercase;
}

.receipt-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0.5px;
  line-height: 1.05;
  text-transform: uppercase;
}

.receipt-subtitle {
  font-size: 12px;
  margin-top: 5px;
  text-transform: uppercase;
}

.receipt-divider {
  border-top: 1px dashed #111111;
  margin: 14px 0;
}

.receipt-value {
  text-align: center;
}

.receipt-value-label,
.qr-label {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.receipt-value-main {
  font-size: 28px;
  font-weight: 900;
  line-height: 1.1;
}

.receipt-bch {
  font-size: 13px;
  font-weight: 700;
  margin-top: 7px;
  word-break: break-word;
}

.receipt-qr-section {
  text-align: center;
}

.receipt-qr-wrap {
  background: #ffffff;
  border: 2px solid #111111;
  display: inline-flex;
  justify-content: center;
  margin: 4px 0 12px;
  padding: 8px;
}

.receipt-qr {
  display: block;
  height: 240px;
  image-rendering: pixelated;
  width: 240px;
}

.receipt-instruction,
.receipt-support {
  font-size: 12px;
  line-height: 1.35;
  margin: 0;
  text-align: center;
}

.receipt-warning {
  border: 2px solid #111111;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.35;
  margin-top: 12px;
  padding: 9px 8px;
  text-align: center;
  text-transform: uppercase;
}

.receipt-row {
  display: flex;
  font-size: 12px;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 8px;
}

.receipt-row span {
  flex: 0 0 auto;
}

.receipt-row strong {
  font-weight: 900;
  text-align: right;
}

.receipt-block {
  font-size: 12px;
  margin-top: 11px;
}

.receipt-label {
  font-weight: 900;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.receipt-address {
  border: 1px solid #111111;
  font-size: 11px;
  line-height: 1.3;
  padding: 7px;
  word-break: break-all;
}

.receipt-footer {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.04em;
  margin-top: 10px;
  text-align: center;
  text-transform: uppercase;
}

@media (max-width: 420px) {
  .receipt-shell {
    padding-left: 4px;
    padding-right: 4px;
  }

  .receipt-paper {
    padding: 16px 12px;
    width: 100%;
  }

  .receipt-qr {
    height: 220px;
    width: 220px;
  }

  .receipt-value-main {
    font-size: 25px;
  }
}
</style>
