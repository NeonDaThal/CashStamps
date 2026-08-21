<template>
  <div class="cash-out-receipt-preview">
    <q-banner v-if="receiptData" class="print-warning q-mb-md" rounded>
      <template #avatar>
        <q-icon name="print" />
      </template>

      <div class="print-warning-content">
        <div class="print-warning-title">
          {{ text('print.title', 'Physical cash-out receipt') }}
        </div>
        <div class="print-warning-copy">
          {{
            text(
              'print.copy',
              'This prints a customer-safe confirmation receipt. It does not contain a voucher WIF, private key, seed phrase, or sweep QR.'
            )
          }}
        </div>

        <q-btn
          class="print-receipt-button q-mt-sm"
          icon="print"
          :label="
            isPrintingReceipt
              ? text('print.printing', 'Printing receipt...')
              : text('print.button', 'Print physical receipt')
          "
          unelevated
          no-caps
          :disable="!isPrinterBridgeAvailable || isPrintingReceipt"
          :loading="isPrintingReceipt"
          @click="handlePrintReceipt"
        />

        <div v-if="printStatusMessage" class="print-status-message q-mt-xs">
          {{ printStatusMessage }}
        </div>

        <div
          v-if="!isPrinterBridgeAvailable"
          class="print-warning-small q-mt-xs"
        >
          {{
            text(
              'print.androidOnly',
              'Printing is only available inside the Android APK.'
            )
          }}
        </div>
      </div>
    </q-banner>

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
            <div class="receipt-subtitle">
              {{ text('receiptSubtitle', 'Customer cash-out proof') }}
            </div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-value">
            <div class="receipt-value-label">
              {{ text('labels.cashPaidOut', 'Cash paid out') }}
            </div>
            <div class="receipt-value-main">
              {{ receiptData.cashPaidOutLabel }}
            </div>
            <div class="receipt-bch">
              {{ text('labels.bchReceived', 'BCH received') }}:
              {{ receiptData.bchReceivedLabel }}
            </div>
          </div>

          <div class="receipt-warning">
            {{ receiptData.footerNote }}
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-row">
            <span>{{ text('labels.reference', 'Reference') }}</span>
            <strong>{{ receiptData.serial }}</strong>
          </div>

          <div class="receipt-row">
            <span>{{ text('labels.issued', 'Issued') }}</span>
            <strong>{{ receiptData.issuedAtLabel }}</strong>
          </div>

          <div class="receipt-row">
            <span>{{ text('labels.customerSent', 'Customer sent') }}</span>
            <strong>{{ receiptData.customerSentFiatEquivalentLabel }}</strong>
          </div>

          <div class="receipt-row">
            <span>{{ text('labels.serviceFee', 'Service fee') }}</span>
            <strong>
              {{ receiptData.serviceFeeLabel }}
              /
              {{ receiptData.serviceFeePercentLabel }}
            </strong>
          </div>

          <div class="receipt-row">
            <span>{{ text('labels.exchangeRate', 'Exchange rate') }}</span>
            <strong>{{ receiptData.exchangeRateLabel }}</strong>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-block">
            <div class="receipt-label">
              {{
                text(
                  'labels.treasuryReceivingAddress',
                  'Treasury receiving address'
                )
              }}
            </div>
            <div class="receipt-address">
              {{ receiptData.treasuryReceivingAddress }}
            </div>
          </div>

          <div class="receipt-block">
            <div class="receipt-label">
              {{ text('labels.transactionId', 'Transaction ID') }}
            </div>
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

          <div class="receipt-footer">
            {{ text('complete', 'Cash-out complete') }}
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import type { CashOutRecord } from 'src/types/cash-out';
import {
  buildCashOutReceiptData,
  type CashOutReceiptData,
} from 'src/services/cash-out-receipt';
import {
  isAndroidPrinterBridgeAvailable,
  printBluetoothCashOutReceipt,
} from 'src/services/android-printer';

const props = defineProps<{
  cashOut: CashOutRecord;
}>();

const $q = useQuasar();
const { locale, t, te } = useI18n({ useScope: 'global' });

const receiptData = ref<CashOutReceiptData | null>(null);
const errorMessage = ref('');
const isPrintingReceipt = ref(false);
const printStatusMessage = ref('');

const isPrinterBridgeAvailable = computed(() =>
  isAndroidPrinterBridgeAvailable()
);

function text(key: string, fallback: string): string {
  const fullKey = `cashOutReceipt.${key}`;

  if (te(fullKey)) {
    return t(fullKey);
  }

  return fallback;
}

function buildReceiptPreview(): void {
  errorMessage.value = '';
  receiptData.value = null;
  printStatusMessage.value = '';

  try {
    receiptData.value = buildCashOutReceiptData(props.cashOut, {
      title: text('receiptTitle', 'Cash-out Receipt'),
      printerSubtitle: text('printerSubtitle', 'Cash-out Receipt'),
      statusNote: text(
        'statusNote',
        'BCH received before cash paid. Customer payment was detected in the merchant Treasury Wallet.'
      ),
      supportNote: text(
        'supportNote',
        'Keep this receipt as proof of the cash-out transaction.'
      ),
      footerNote: text('footerNote', 'BCH received before cash paid.'),
      printLabels: {
        cashPaidOut: text('labels.cashPaidOut', 'Cash paid out'),
        bchReceived: text('labels.bchReceived', 'BCH received'),
        reference: text('labels.reference', 'Reference'),
        issued: text('labels.issued', 'Issued'),
        customerSent: text('labels.customerSent', 'Customer sent'),
        serviceFee: text('labels.serviceFee', 'Service fee'),
        exchangeRate: text('labels.exchangeRate', 'Exchange rate'),
        treasuryReceivingAddress: text(
          'labels.treasuryReceivingAddress',
          'Treasury receiving address'
        ),
        transactionId: text('labels.transactionId', 'Transaction ID'),
      },
      errors: {
        missingSerial: text(
          'errors.missingSerial',
          'Cash-out does not have a reference number.'
        ),
        missingFiatCurrency: text(
          'errors.missingFiatCurrency',
          'Cash-out does not have a fiat currency.'
        ),
        invalidCashAmount: text(
          'errors.invalidCashAmount',
          'Cash-out does not have a valid cash amount.'
        ),
        invalidBchReceived: text(
          'errors.invalidBchReceived',
          'Cash-out does not have a valid BCH received amount.'
        ),
        missingTreasuryReceivingAddress: text(
          'errors.missingTreasuryReceivingAddress',
          'Cash-out does not have a treasury receiving address.'
        ),
        paymentNotDetected: text(
          'errors.paymentNotDetected',
          'Cash-out payment has not been detected yet. Receipt cannot be built.'
        ),
      },
    });
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : text('couldNotBuildPreview', 'Could not build cash-out receipt preview.');
  }
}

async function handlePrintReceipt(): Promise<void> {
  if (!receiptData.value) {
    $q.notify({
      type: 'negative',
      message: text('messages.notReady', 'Receipt data is not ready yet.'),
    });
    return;
  }

  isPrintingReceipt.value = true;
  printStatusMessage.value = text(
    'messages.sending',
    'Connecting to printer and sending receipt...'
  );

  try {
    const result = await printBluetoothCashOutReceipt(receiptData.value);

    printStatusMessage.value = text(
      'messages.sent',
      'Receipt sent to printer.'
    );

    $q.notify({
      type: 'positive',
      message: result.message || text('messages.sent', 'Receipt sent to printer.'),
    });
  } catch (error) {
    console.error(error);

    const fallbackMessage = text(
      'messages.printFailed',
      'Could not connect to printer. Check the printer is switched on, nearby, and not connected to another app.'
    );

    const message = error instanceof Error ? error.message : fallbackMessage;

    printStatusMessage.value = message;

    $q.notify({
      type: 'negative',
      message,
    });
  } finally {
    isPrintingReceipt.value = false;
  }
}

watch(
  [() => props.cashOut, () => locale.value],
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

.print-warning {
  background: #fff4df;
  color: #8a4b00;
}

.print-warning-content {
  width: 100%;
}

.print-warning-title {
  font-weight: 900;
  margin-bottom: 4px;
}

.print-warning-copy,
.print-warning-small,
.print-status-message {
  font-size: 12px;
  line-height: 1.35;
}

.print-status-message {
  font-weight: 800;
}

.print-receipt-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
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
