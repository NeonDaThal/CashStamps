<template>
  <q-card flat bordered class="printed-voucher-card">
    <q-card-section>
      <div class="printed-header">
        <div class="printed-header-icon">
          <q-icon name="print" />
        </div>

        <div>
          <div class="text-h6 text-weight-bold">Printed Bitcoin Cash Topup</div>

          <div class="text-grey-7">
            The customer's bearer voucher is sent directly to the thermal
            printer.
          </div>
        </div>
      </div>

      <q-banner class="printed-safety-notice q-mt-md" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        This Topup is permanently locked to Printed delivery. Its sweepable WIF
        is never displayed on this screen and it can never be switched to
        Digital delivery.
      </q-banner>

      <div v-if="isPrinting" class="printing-state">
        <q-spinner size="42px" color="primary" />

        <div class="q-mt-sm text-weight-bold">Sending voucher to printer…</div>

        <div class="text-grey-7 q-mt-xs">
          Do not start another print while this attempt is in progress.
        </div>
      </div>

      <q-banner
        v-else-if="outcome === 'delivered'"
        class="bg-green-1 text-green-10 q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="check_circle" />
        </template>

        <div class="text-weight-bold">Voucher sent to printer</div>

        <div class="q-mt-xs">
          Check the printed voucher and give it to the customer.
        </div>
      </q-banner>

      <q-banner
        v-else-if="outcome === 'definitely_not_printed'"
        class="bg-orange-1 text-orange-10 q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="print_disabled" />
        </template>

        <div class="text-weight-bold">Voucher was not sent to the printer</div>

        <div class="q-mt-xs">
          {{ statusMessage }}
        </div>

        <div class="q-mt-xs">
          The same Printed voucher may safely be tried again.
        </div>
      </q-banner>

      <q-banner
        v-else-if="outcome === 'uncertain'"
        class="bg-red-1 text-red-10 q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="warning" />
        </template>

        <div class="text-weight-bold">Print outcome uncertain</div>

        <div class="q-mt-xs">
          {{ statusMessage }}
        </div>

        <div class="q-mt-xs text-weight-bold">
          Do not automatically print another copy. Check the printer and
          physical receipt carefully.
        </div>
      </q-banner>

      <q-banner
        v-else-if="outcome === 'blocked'"
        class="bg-orange-1 text-orange-10 q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="block" />
        </template>

        {{ statusMessage }}
      </q-banner>

      <q-banner
        v-if="errorMessage"
        class="bg-red-1 text-red-10 q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="error" />
        </template>

        {{ errorMessage }}
      </q-banner>

      <div class="printed-actions q-mt-md">
        <q-btn
          v-if="canRetry"
          class="primary-button"
          icon="print"
          label="Try Print Again"
          unelevated
          no-caps
          :loading="isPrinting"
          @click="handlePrintVoucher"
        />

        <q-btn
          v-if="!isPrinting"
          flat
          color="grey-8"
          label="Close"
          no-caps
          @click="emit('close')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// qrcode is a CommonJS package. This browser subpath avoids Vite
// import-analysis issues in this Quasar/Vite setup.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode/lib/browser';

import { computed, onMounted, ref } from 'vue';

import { useI18n } from 'vue-i18n';

import type { VoucherRecord } from 'src/types/voucher';

import { buildVoucherReceiptData } from 'src/services/voucher-receipt';

import {
  isAndroidPrinterBridgeAvailable,
  printBluetoothVoucherReceipt,
} from 'src/services/android-printer';

import { classifyVoucherPrintFailure } from 'src/services/voucher-print-outcome';

import {
  completeStoredVoucherDelivery,
  markStoredVoucherDeliveryUncertain,
  resetStoredVoucherDeliveryAfterDefiniteFailure,
  startVoucherDelivery,
} from 'src/services/voucher-store';

import { assertPrintedVoucherDeliveryAllowed } from 'src/services/voucher-printed-delivery-safety';

type PrintedDeliveryOutcome =
  | ''
  | 'delivered'
  | 'definitely_not_printed'
  | 'uncertain'
  | 'blocked';

const props = defineProps<{
  voucher: VoucherRecord;
}>();

const emit = defineEmits<{
  updated: [voucher: VoucherRecord];
  close: [];
}>();

const { t, te } = useI18n({
  useScope: 'global',
});

const isPrinting = ref(false);

const outcome = ref<PrintedDeliveryOutcome>('');

const statusMessage = ref('');

const errorMessage = ref('');

const PRINTER_SUBTITLE_KEY = 'receiptPreview.printerSubtitle';

const canRetry = computed(() => {
  return (
    !isPrinting.value &&
    outcome.value === 'definitely_not_printed' &&
    props.voucher.delivery?.method === 'printed' &&
    props.voucher.delivery?.status === 'selected' &&
    props.voucher.status === 'funded'
  );
});

function buildFallbackPrinterSubtitle(receiptTitle: string): string {
  const strippedTitle = receiptTitle
    .replace(/bitcoin\s*cash/gi, '')
    .replace(/\bbch\b/gi, '')
    .replace(/^[\s\-–—:|/]+|[\s\-–—:|/]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!strippedTitle || strippedTitle.toLowerCase() === 'voucher') {
    return 'Topup Voucher';
  }

  return strippedTitle;
}

function getReceiptPrinterSubtitle(): string {
  if (te(PRINTER_SUBTITLE_KEY)) {
    return t(PRINTER_SUBTITLE_KEY);
  }

  return buildFallbackPrinterSubtitle(t('receiptPreview.receiptTitle'));
}

function showExistingDeliveryState(): void {
  const delivery = props.voucher.delivery;

  if (!delivery) {
    outcome.value = 'blocked';

    statusMessage.value =
      'This Topup does not have a committed delivery method.';

    return;
  }

  if (delivery.method !== 'printed') {
    outcome.value = 'blocked';

    statusMessage.value = 'This Topup is not committed to Printed delivery.';

    return;
  }

  if (delivery.status === 'delivery_started') {
    outcome.value = 'uncertain';

    statusMessage.value =
      'A previous print attempt started but no safe final outcome was recorded. Another automatic print is blocked.';

    return;
  }

  if (delivery.status === 'uncertain') {
    outcome.value = 'uncertain';

    statusMessage.value =
      delivery.uncertaintyReason ||
      'A previous print attempt may have produced some or all of the physical voucher.';

    return;
  }

  if (delivery.status === 'delivered') {
    outcome.value = 'delivered';

    statusMessage.value =
      'This Printed voucher has already been sent to the printer.';
  }
}

async function handlePrintVoucher(): Promise<void> {
  if (isPrinting.value) {
    return;
  }

  outcome.value = '';

  statusMessage.value = '';

  errorMessage.value = '';

  /**
   * This check occurs before receipt construction or delivery_started.
   * No printer bridge means no physical voucher can have been transmitted.
   */
  if (!isAndroidPrinterBridgeAvailable()) {
    outcome.value = 'definitely_not_printed';

    statusMessage.value = 'Printing is only available inside the Android app.';

    return;
  }

  try {
    /**
     * First-print safety guard:
     *
     * - Printed method only
     * - funded/unswept only
     * - delivery.status must be selected
     */
    assertPrintedVoucherDeliveryAllowed(props.voucher);
  } catch (error) {
    outcome.value = 'blocked';

    statusMessage.value =
      error instanceof Error
        ? error.message
        : 'Printed voucher delivery is blocked.';

    return;
  }

  isPrinting.value = true;

  try {
    /**
     * Build the existing receipt entirely in memory.
     *
     * The WIF is never assigned to reactive UI state and is never rendered
     * into the Vue template.
     *
     * If anything fails here, no physical print attempt has started and the
     * durable delivery state remains selected.
     */
    const receiptData = await buildVoucherReceiptData(props.voucher, {
      title: t('receiptPreview.receiptTitle'),

      printerSubtitle: getReceiptPrinterSubtitle(),

      redemptionInstruction: t('receiptPreview.redemptionInstruction'),

      cashWarning: t('receiptPreview.cashWarning'),

      supportNote: t('receiptPreview.supportNote'),

      printLabels: {
        valueLoaded: t('receiptPreview.printLabels.valueLoaded'),

        scanToRedeem: t('receiptPreview.printLabels.scanToRedeem'),

        reference: t('receiptPreview.printLabels.reference'),

        issued: t('receiptPreview.printLabels.issued'),

        customerPaid: t('receiptPreview.printLabels.customerPaid'),

        serviceFee: t('receiptPreview.printLabels.serviceFee'),

        voucherAddress: t('receiptPreview.printLabels.voucherAddress'),
      },

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

    /**
     * Preserve the exact QR-generation settings used by the existing physical
     * receipt path.
     *
     * This image is kept only in this local function variable. It is never
     * bound to an <img> or otherwise displayed.
     */
    const qrImageDataUrl = await QRCode.toDataURL(receiptData.qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 260,
    });

    /**
     * CRASH-SAFETY BOUNDARY
     *
     * Receipt construction is complete.
     *
     * Persist delivery_started immediately BEFORE handing bearer-voucher bytes
     * to the native printer.
     */
    const startedVoucher = await startVoucherDelivery(
      props.voucher.id,
      'printed'
    );

    if (!startedVoucher) {
      throw new Error(
        'Could not persist the Printed voucher delivery start. No print request was sent.'
      );
    }

    emit('updated', startedVoucher);

    try {
      const result = await printBluetoothVoucherReceipt(receiptData, {
        qrImageDataUrl,
      });

      /**
       * Native transmission completed without an observed communication
       * failure.
       */
      const deliveredVoucher = await completeStoredVoucherDelivery(
        startedVoucher.id,
        'printed'
      );

      if (!deliveredVoucher) {
        throw new Error(
          'The voucher was sent to the printer but its completed delivery state could not be saved.'
        );
      }

      emit('updated', deliveredVoucher);

      outcome.value = 'delivered';

      statusMessage.value =
        result.message || 'Voucher receipt sent to printer.';
    } catch (printError) {
      const failure = classifyVoucherPrintFailure(printError);

      if (failure.status === 'definitely_not_printed') {
        try {
          const resetVoucher =
            await resetStoredVoucherDeliveryAfterDefiniteFailure(
              startedVoucher.id,
              'printed'
            );

          if (!resetVoucher) {
            throw new Error('Could not persist the safe retry state.');
          }

          emit('updated', resetVoucher);

          outcome.value = 'definitely_not_printed';

          statusMessage.value = failure.message;

          return;
        } catch (resetError) {
          /**
           * Physically we were told nothing was transmitted, but until the
           * durable record also says selected we must NOT offer another print.
           */
          outcome.value = 'blocked';

          errorMessage.value =
            resetError instanceof Error
              ? `The printer reported that the voucher was not transmitted, but the app could not save the safe retry state: ${resetError.message}`
              : 'The voucher was not transmitted, but the app could not save the safe retry state.';

          return;
        }
      }

      /**
       * Any unknown/post-transmission failure is uncertain.
       *
       * If marking uncertain itself fails, the durable delivery_started state
       * still blocks automatic reprinting after restart.
       */
      try {
        const uncertainVoucher = await markStoredVoucherDeliveryUncertain(
          startedVoucher.id,
          'printed',
          failure.message
        );

        if (uncertainVoucher) {
          emit('updated', uncertainVoucher);
        }
      } catch (stateError) {
        console.error(stateError);
      }

      outcome.value = 'uncertain';

      statusMessage.value = failure.message;
    }
  } catch (error) {
    /**
     * This outer catch is reached before the native print request if receipt
     * construction, QR generation, or delivery-start persistence fails.
     *
     * No automatic print retry is started here.
     */
    console.error(error);

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not prepare the Printed voucher.';

    /**
     * Only claim definitely-not-printed when the CURRENT prop still says
     * selected. Once delivery_started has been persisted, an interruption is
     * treated conservatively.
     */
    if (props.voucher.delivery?.status === 'selected') {
      outcome.value = 'definitely_not_printed';
    } else {
      outcome.value = 'blocked';
    }
  } finally {
    isPrinting.value = false;
  }
}

onMounted(() => {
  const delivery = props.voucher.delivery;

  if (
    delivery?.method === 'printed' &&
    delivery.status === 'selected' &&
    props.voucher.status === 'funded'
  ) {
    void handlePrintVoucher();

    return;
  }

  showExistingDeliveryState();
});
</script>

<style scoped>
.printed-voucher-card {
  border-color: #dddddd;
  border-radius: 20px;
}

.printed-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
}

.printed-header-icon {
  align-items: center;
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  display: flex;
  flex: 0 0 44px;
  font-size: 25px;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.printed-safety-notice {
  background: #f4f4f4;
  color: #333333;
}

.printing-state {
  padding: 34px 12px;
  text-align: center;
}

.printed-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
}
</style>
