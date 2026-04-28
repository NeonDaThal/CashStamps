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
        label="Review Fake Voucher"
        :loading="isSubmitting"
        :disable="!canCreateVoucher"
      />

      <q-btn flat color="primary" label="View History" to="/voucher-history" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

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

const formattedFiatAmount = computed(() => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: fiatCurrency,
  }).format(fiatAmountMinor.value / 100);
});

function handleSubmit(): void {
  if (!canCreateVoucher.value) {
    return;
  }

  emit('reviewVoucher', fiatAmountMinor.value, fiatCurrency);
}
</script>
