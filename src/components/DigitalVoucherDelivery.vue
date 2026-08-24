<template>
  <q-card flat bordered class="digital-voucher-card">
    <q-card-section>
      <div class="digital-header">
        <div class="digital-header-icon">
          <q-icon name="qr_code_2" />
        </div>

        <div>
          <div class="text-h6 text-weight-bold">Digital Bitcoin Cash Topup</div>

          <div class="text-grey-7">
            Ask the customer to sweep this voucher before leaving the shop.
          </div>
        </div>
      </div>

      <q-banner class="digital-warning q-mt-md" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        This QR is the customer's voucher. Anyone who has it can sweep the BCH.
        This Digital Topup can never be converted into a printed voucher.
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

      <div v-if="isPreparing" class="digital-loading">
        <q-spinner size="42px" color="primary" />

        <div class="q-mt-sm text-grey-7">
          Preparing the customer's Digital Topup…
        </div>
      </div>

      <div v-else-if="qrDataUrl" class="digital-ready q-mt-md">
        <div class="digital-value">
          <div class="digital-value-label">Topup value</div>

          <div class="digital-value-main">
            {{
              formatFiatAmount(
                recordValues.principalMinor,
                voucher.fiatCurrency
              )
            }}
          </div>

          <div class="digital-bch-value">
            {{ formatBchSats(recordValues.bchLoadedSats) }}
          </div>
        </div>

        <div class="digital-qr-wrap q-mt-md">
          <q-img
            :src="qrDataUrl"
            alt="Digital Bitcoin Cash Topup sweep QR"
            class="digital-qr"
            fit="contain"
          />
        </div>

        <div class="digital-scan-instruction">
          Customer: scan this QR with a Bitcoin Cash wallet that supports
          private-key sweeping/import.
        </div>

        <q-banner class="bg-green-1 text-green-10 q-mt-md" rounded>
          Keep this screen available until the customer confirms the BCH has
          been swept into their wallet.
        </q-banner>

        <div class="digital-reference q-mt-md">
          <div class="digital-reference-label">Reference</div>

          <div class="digital-reference-value">
            {{ voucher.serial }}
          </div>
        </div>
      </div>

      <q-btn
        v-if="errorMessage"
        class="retry-button q-mt-md"
        label="Try showing the same Digital Voucher again"
        icon="refresh"
        unelevated
        no-caps
        :loading="isPreparing"
        @click="prepareDigitalVoucher"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// qrcode is a CommonJS package. This browser subpath avoids Vite import-analysis
// issues with this Quasar/Vite setup.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode/lib/browser';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import type { VoucherRecord } from 'src/types/voucher';

import {
  completeStoredVoucherDelivery,
  startVoucherDelivery,
} from 'src/services/voucher-store';

import { assertDigitalVoucherDeliveryAllowed } from 'src/services/voucher-digital-delivery';

import { exportVoucherKeyAtIndex } from 'src/services/voucher-wallet';

import { getTopupRecordValues } from 'src/services/topup-record-values';

import { formatBchSats } from 'src/services/voucher-pricing';

const props = defineProps<{
  voucher: VoucherRecord;
}>();

const emit = defineEmits<{
  updated: [voucher: VoucherRecord];
}>();

const isPreparing = ref(false);
const errorMessage = ref('');
const qrDataUrl = ref('');

const recordValues = computed(() => getTopupRecordValues(props.voucher));

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

async function prepareDigitalVoucher(): Promise<void> {
  if (isPreparing.value) {
    return;
  }

  isPreparing.value = true;

  errorMessage.value = '';
  qrDataUrl.value = '';

  try {
    /**
     * This is the first and most important cross-delivery guard.
     */
    assertDigitalVoucherDeliveryAllowed(props.voucher);

    let workingVoucher = props.voucher;

    /**
     * Persist the bearer-secret exposure boundary BEFORE deriving/rendering
     * the real WIF QR.
     *
     * Re-entering delivery_started for this SAME digital voucher is
     * idempotent.
     *
     * An already-delivered digital voucher may also be safely redisplayed
     * while it remains funded.
     */
    if (workingVoucher.delivery?.status !== 'delivered') {
      const startedVoucher = await startVoucherDelivery(
        workingVoucher.id,
        'digital'
      );

      if (!startedVoucher) {
        throw new Error('Could not persist the Digital Topup delivery start.');
      }

      workingVoucher = startedVoucher;
    }

    assertDigitalVoucherDeliveryAllowed(workingVoucher);

    /**
     * Keep the raw WIF in a local variable only.
     *
     * It is never:
     * - rendered as text
     * - copied to clipboard
     * - logged
     * - persisted separately
     */
    const exportedKey = await exportVoucherKeyAtIndex(
      workingVoucher.derivationIndex
    );

    if (exportedKey.address !== workingVoucher.address) {
      throw new Error(
        'Derived Digital Topup key does not match the saved voucher address.'
      );
    }

    const generatedQrDataUrl = await QRCode.toDataURL(exportedKey.wif, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 520,
    });

    /**
     * Persist the digital exposure as committed BEFORE inserting the QR into
     * the rendered UI.
     *
     * If the app closes immediately after this write, History may simply
     * display the SAME digital voucher again.
     */
    if (workingVoucher.delivery?.status !== 'delivered') {
      const deliveredVoucher = await completeStoredVoucherDelivery(
        workingVoucher.id,
        'digital'
      );

      if (!deliveredVoucher) {
        throw new Error('Could not persist Digital Topup delivery.');
      }

      workingVoucher = deliveredVoucher;

      emit('updated', workingVoucher);
    }

    /**
     * The real bearer QR becomes visible only after all required durable state
     * has been written.
     */
    qrDataUrl.value = generatedQrDataUrl;
  } catch (error) {
    console.error(error);

    qrDataUrl.value = '';

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not prepare the Digital Topup.';
  } finally {
    isPreparing.value = false;
  }
}

watch(
  () => props.voucher.id,
  () => {
    void prepareDigitalVoucher();
  },
  {
    immediate: true,
  }
);

onBeforeUnmount(() => {
  /**
   * The QR itself contains bearer-secret material.
   */
  qrDataUrl.value = '';
});
</script>

<style scoped>
.digital-voucher-card {
  border-color: #dddddd;
  border-radius: 20px;
}

.digital-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
}

.digital-header-icon {
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

.digital-warning {
  background: #fff4df;
  color: #795000;
}

.digital-loading {
  padding: 36px 12px;
  text-align: center;
}

.digital-ready {
  text-align: center;
}

.digital-value-label,
.digital-reference-label {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.digital-value-main {
  color: #111111;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.1;
  margin-top: 4px;
}

.digital-bch-value {
  color: #333333;
  font-size: 14px;
  font-weight: 800;
  margin-top: 6px;
}

.digital-qr-wrap {
  background: #ffffff;
  border: 2px solid #111111;
  display: inline-block;
  padding: 10px;
}

.digital-qr {
  height: 260px;
  width: 260px;
}

.digital-scan-instruction {
  color: #222222;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  margin: 14px auto 0;
  max-width: 360px;
}

.digital-reference {
  border-top: 1px solid #dddddd;
  padding-top: 14px;
}

.digital-reference-value {
  color: #111111;
  font-weight: 900;
  margin-top: 3px;
}

.retry-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
  width: 100%;
}

@media (max-width: 420px) {
  .digital-qr {
    height: 230px;
    width: 230px;
  }
}
</style>
