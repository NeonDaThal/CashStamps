<template>
  <q-page padding>
    <div class="q-mx-auto" style="max-width: 900px">
      <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="info" />
        </template>

        This is a temporary Phase 3 development screen for testing local voucher
        records, funding, and manual redemption. It is not the final
        merchant-facing voucher history UI.
      </q-banner>

      <div class="row items-center justify-between q-mb-md">
        <div>
          <h1 class="text-h4 q-mb-xs">Voucher History</h1>
          <p class="text-grey-7 q-mb-none">
            Local BCH voucher records for testing issue, funding, and sweep
            flows.
          </p>
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            label="Create Test Voucher"
            @click="handleCreateTestVoucher"
          />

          <q-btn
            color="negative"
            outline
            label="Clear Test Records"
            :disable="voucherRecords.length === 0"
            @click="handleClearTestRecords"
          />
        </div>
      </div>

      <q-banner
        v-if="successMessage"
        class="bg-green-1 text-green-9 q-mb-md"
        rounded
      >
        {{ successMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md" rounded>
        {{ errorMessage }}
      </q-banner>

      <VoucherHistoryList
        :voucher-records="voucherRecords"
        @mark-manual-redemption="handleMarkManualRedemption"
        @clear-manual-redemption="handleClearManualRedemption"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import VoucherHistoryList from 'src/components/VoucherHistoryList.vue';
import type { VoucherRecord } from 'src/types/voucher';
import {
  addVoucherRecord,
  clearVoucherManualRedemption,
  clearVoucherRecords,
  getVoucherRecords,
  markVoucherManuallyRedeemed,
} from 'src/services/voucher-store';
import { createDraftVoucherRecord } from 'src/services/voucher-factory';

const voucherRecords = ref<VoucherRecord[]>([]);
const errorMessage = ref('');
const successMessage = ref('');

async function loadVoucherRecords(): Promise<void> {
  errorMessage.value = '';

  try {
    voucherRecords.value = await getVoucherRecords();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load voucher records.';
  }
}

async function handleCreateTestVoucher(): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const testVoucher = createDraftVoucherRecord(10_000, 'GBP');

    await addVoucherRecord(testVoucher);
    await loadVoucherRecords();

    successMessage.value = `Created test voucher ${testVoucher.serial}.`;
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not create test voucher.';
  }
}

async function handleMarkManualRedemption(payload: {
  voucherId: string;
  txid?: string;
  note?: string;
}): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updatedVoucher = await markVoucherManuallyRedeemed(
      payload.voucherId,
      {
        txid: payload.txid,
        note: payload.note,
      }
    );

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? `Marked ${updatedVoucher.serial} as manually swept/redeemed.`
      : 'Could not find voucher record to update.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not mark voucher as manually redeemed.';
  }
}

async function handleClearManualRedemption(voucherId: string): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updatedVoucher = await clearVoucherManualRedemption(voucherId);

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? `Cleared manual redemption status for ${updatedVoucher.serial}.`
      : 'Could not find voucher record to update.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not clear manual redemption status.';
  }
}

async function handleClearTestRecords(): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await clearVoucherRecords();
    await loadVoucherRecords();

    successMessage.value = 'Cleared all local test voucher records.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not clear voucher records.';
  }
}

onMounted(() => {
  void loadVoucherRecords();
});
</script>
