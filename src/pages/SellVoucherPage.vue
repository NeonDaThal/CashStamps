<template>
  <q-page padding>
    <div class="q-mx-auto" style="max-width: 760px">
      <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="info" />
        </template>

        This is a temporary Phase 2 cashier screen. It uses fake funding only
        and does not send BCH yet.
      </q-banner>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h4 q-mb-xs">Sell BCH Voucher</div>
          <p class="text-grey-7 q-mb-none">
            Enter the customer&apos;s cash amount to create a test BCH voucher
            record.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <VoucherSaleForm
            :is-submitting="isSubmitting"
            @review-voucher="handleReviewVoucher"
          />
        </q-card-section>
      </q-card>

      <q-banner
        v-if="successMessage"
        class="bg-green-1 text-green-9 q-mt-md"
        rounded
      >
        {{ successMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mt-md" rounded>
        {{ errorMessage }}
      </q-banner>

      <SaleConfirmDialog
        v-model="isConfirmDialogOpen"
        :fiat-amount-minor="pendingFiatAmountMinor"
        :fiat-currency="pendingFiatCurrency"
        :is-submitting="isSubmitting"
        @confirm="handleCreateDraftVoucher"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import SaleConfirmDialog from 'src/components/SaleConfirmDialog.vue';
import VoucherSaleForm from 'src/components/VoucherSaleForm.vue';
import { createDraftVoucherRecord } from 'src/services/voucher-factory';
import { addVoucherRecord } from 'src/services/voucher-store';

const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const isConfirmDialogOpen = ref(false);
const pendingFiatAmountMinor = ref(0);
const pendingFiatCurrency = ref('GBP');

function handleReviewVoucher(
  fiatAmountMinor: number,
  fiatCurrency: string
): void {
  successMessage.value = '';
  errorMessage.value = '';

  if (!Number.isFinite(fiatAmountMinor) || fiatAmountMinor <= 0) {
    errorMessage.value = 'Enter a valid cash amount first.';
    return;
  }

  pendingFiatAmountMinor.value = fiatAmountMinor;
  pendingFiatCurrency.value = fiatCurrency;
  isConfirmDialogOpen.value = true;
}

async function handleCreateDraftVoucher(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  if (
    !Number.isFinite(pendingFiatAmountMinor.value) ||
    pendingFiatAmountMinor.value <= 0
  ) {
    errorMessage.value = 'Enter a valid cash amount first.';
    return;
  }

  isSubmitting.value = true;

  try {
    const voucher = createDraftVoucherRecord(
      pendingFiatAmountMinor.value,
      pendingFiatCurrency.value
    );

    await addVoucherRecord(voucher);

    const formattedFiatAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: pendingFiatCurrency.value,
    }).format(pendingFiatAmountMinor.value / 100);

    successMessage.value = `Created fake voucher ${voucher.serial} for ${formattedFiatAmount}.`;
    isConfirmDialogOpen.value = false;
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not create fake voucher.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
