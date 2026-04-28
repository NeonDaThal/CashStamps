<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section>
        <div class="text-h5">Confirm Fake Voucher Issue</div>
        <p class="text-grey-7 q-mb-none">
          Review the placeholder Phase 2 pricing before creating this test
          voucher.
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label caption>Customer cash amount</q-item-label>
              <q-item-label>{{ formattedFiatAmount }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Placeholder fee</q-item-label>
              <q-item-label>10%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Quote source</q-item-label>
              <q-item-label>Fake Phase 2 quote</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Funding mode</q-item-label>
              <q-item-label>Fake only — no BCH will be sent</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          This confirmation dialog is temporary. In later phases it will show
          the locked quote, real fee breakdown, BCH amount, and funding details.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="grey-8"
          :disable="isSubmitting"
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          color="primary"
          label="Confirm Fake Issue"
          :loading="isSubmitting"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  fiatAmountMinor: number;
  fiatCurrency: string;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

const formattedFiatAmount = computed(() => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: props.fiatCurrency,
  }).format(props.fiatAmountMinor / 100);
});
</script>
