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
          <q-form @submit.prevent="handleCreateDraftVoucher">
            <q-input
              v-model.number="fiatAmount"
              type="number"
              min="1"
              step="1"
              label="Customer cash amount"
              prefix="£"
              outlined
              :disable="isSubmitting"
              class="q-mb-md"
            />

            <q-card flat bordered class="bg-grey-1 q-mb-md">
              <q-card-section>
                <div class="text-subtitle1 text-weight-medium q-mb-sm">
                  Phase 2 placeholder pricing
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Fiat amount</div>
                    <div class="text-body1">
                      {{ formattedFiatAmount }}
                    </div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Fee</div>
                    <div class="text-body1">10% placeholder fee</div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Quote source</div>
                    <div class="text-body1">Fake Phase 2 quote</div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Funding</div>
                    <div class="text-body1">Fake only — no BCH sent</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <div class="row q-gutter-sm">
              <q-btn
                type="submit"
                color="primary"
                label="Create Fake Voucher"
                :loading="isSubmitting"
                :disable="!canCreateVoucher"
              />

              <q-btn
                flat
                color="primary"
                label="View History"
                to="/voucher-history"
              />
            </div>
          </q-form>
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { createDraftVoucherRecord } from 'src/services/voucher-factory';
import { addVoucherRecord } from 'src/services/voucher-store';

const fiatAmount = ref(100);
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const fiatCurrency = 'GBP';

const fiatAmountMinor = computed(() => Math.round(fiatAmount.value * 100));

const canCreateVoucher = computed(() => {
  return Number.isFinite(fiatAmount.value) && fiatAmount.value > 0;
});

const formattedFiatAmount = computed(() => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: fiatCurrency,
  }).format(fiatAmountMinor.value / 100);
});

async function handleCreateDraftVoucher(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  if (!canCreateVoucher.value) {
    errorMessage.value = 'Enter a valid cash amount first.';
    return;
  }

  isSubmitting.value = true;

  try {
    const voucher = createDraftVoucherRecord(
      fiatAmountMinor.value,
      fiatCurrency
    );

    await addVoucherRecord(voucher);

    successMessage.value = `Created fake voucher ${voucher.serial} for ${formattedFiatAmount.value}.`;
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not create fake voucher.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
