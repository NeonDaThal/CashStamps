<template>
  <div class="cash-out-receipt-preview">
    <q-card flat bordered class="cash-out-receipt-preview-card">
      <q-card-section v-if="errorMessage">
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
            <div class="receipt-subtitle">Customer cash-out proof</div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-value">
            <div class="receipt-value-label">Cash paid out</div>
            <div class="receipt-value-main">
              {{ receiptData.cashPaidOutLabel }}
            </div>
            <div class="receipt-bch">
              BCH received: {{ receiptData.bchReceivedLabel }}
            </div>
          </div>

          <div class="receipt-warning">
            {{ receiptData.footerNote }}
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

          <div class="receipt-row">
            <span>Customer sent</span>
            <strong>{{ receiptData.customerSentFiatEquivalentLabel }}</strong>
          </div>

          <div class="receipt-row">
            <span>Service fee</span>
            <strong>
              {{ receiptData.serviceFeeLabel }}
              /
              {{ receiptData.serviceFeePercentLabel }}
            </strong>
          </div>

          <div class="receipt-row">
            <span>Rate</span>
            <strong>{{ receiptData.exchangeRateLabel }}</strong>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-block">
            <div class="receipt-label">Treasury receiving address</div>
            <div class="receipt-address">
              {{ receiptData.treasuryReceivingAddress }}
            </div>
          </div>

          <div class="receipt-block">
            <div class="receipt-label">Transaction ID</div>
            <div class="receipt-address">
              {{ receiptData.txid ?? receiptData.txidShort }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <p class="receipt-support">
            {{ receiptData.statusNote }}
          </p>

          <p class="receipt-support q-mt-sm">
            {{ receiptData.supportNote }}
          </p>

          <div class="receipt-footer">Cash-out complete</div>
        </div>
      </q-card-section>
    </q-card>

    <q-banner class="bg-grey-2 text-grey-9 q-mt-md" rounded>
      <template #avatar>
        <q-icon name="info" />
      </template>

      Physical cash-out printing will be connected in the next printer step.
      This preview does not contain a voucher WIF, private key, seed phrase, or
      sweep QR.
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import type { CashOutRecord } from 'src/types/cash-out';
import {
  buildCashOutReceiptData,
  type CashOutReceiptData,
} from 'src/services/cash-out-receipt';

const props = defineProps<{
  cashOut: CashOutRecord;
}>();

const receiptData = ref<CashOutReceiptData | null>(null);
const errorMessage = ref('');

function buildReceiptPreview(): void {
  errorMessage.value = '';
  receiptData.value = null;

  try {
    receiptData.value = buildCashOutReceiptData(props.cashOut);
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not build cash-out receipt preview.';
  }
}

watch(
  () => props.cashOut,
  () => {
    buildReceiptPreview();
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>

<style scoped>
.cash-out-receipt-preview {
  width: 100%;
}

.cash-out-receipt-preview-card {
  background: #f1f1f1;
  border-color: #dddddd;
  border-radius: 22px;
  overflow: hidden;
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

.receipt-value-label {
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

.receipt-support {
  font-size: 12px;
  line-height: 1.35;
  margin: 0;
  text-align: center;
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

  .receipt-value-main {
    font-size: 25px;
  }
}
</style>
