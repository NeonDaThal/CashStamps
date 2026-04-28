<template>
  <q-form @submit.prevent="handleSubmit">
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
          Pricing preview
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7">Customer pays</div>
            <div class="text-body1">
              {{
                formatMinorFiatAmount(
                  previewPricing.customerPaysMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7">Service fee</div>
            <div class="text-body1">
              {{
                formatBasisPointsAsPercent(previewPricing.serviceFeeBasisPoints)
              }}
              —
              {{
                formatMinorFiatAmount(
                  previewPricing.serviceFeeAmountMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7">
              Voucher value before quote
            </div>
            <div class="text-body1">
              {{
                formatMinorFiatAmount(
                  previewPricing.voucherValueMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7">Quote source</div>
            <div class="text-body1">Fetched after review</div>
          </div>

          <div class="col-12">
            <div class="text-caption text-grey-7">Funding</div>
            <div class="text-body1">Fake only — no BCH sent yet</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-gutter-sm">
      <q-btn
        type="submit"
        color="primary"
        label="Review Voucher"
        :loading="isSubmitting"
        :disable="!canCreateVoucher"
      />

      <q-btn flat color="primary" label="View History" to="/voucher-history" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  calculateFakeVoucherPricing,
  formatBasisPointsAsPercent,
  formatMinorFiatAmount,
} from 'src/services/voucher-pricing';

const emit = defineEmits<{
  reviewVoucher: [fiatAmountMinor: number, fiatCurrency: string];
}>();

const fiatAmount = ref(100);
const fiatCurrency = 'GBP';

defineProps<{
  isSubmitting: boolean;
}>();

const fiatAmountMinor = computed(() => Math.round(fiatAmount.value * 100));

const canCreateVoucher = computed(() => {
  return Number.isFinite(fiatAmount.value) && fiatAmount.value > 0;
});

const previewPricing = computed(() =>
  calculateFakeVoucherPricing(fiatAmountMinor.value, fiatCurrency)
);

function handleSubmit(): void {
  if (!canCreateVoucher.value) {
    return;
  }

  emit('reviewVoucher', fiatAmountMinor.value, fiatCurrency);
}
</script>
