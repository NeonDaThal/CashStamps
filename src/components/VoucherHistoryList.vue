<template>
  <q-card v-if="voucherRecords.length === 0" flat bordered>
    <q-card-section>
      No voucher records found yet. Click
      <strong>Create Test Voucher</strong> to add one.
    </q-card-section>
  </q-card>

  <q-list v-else bordered separator>
    <q-item v-for="voucher in voucherRecords" :key="voucher.id">
      <q-item-section>
        <q-item-label class="text-weight-bold">
          {{ voucher.serial }}
        </q-item-label>

        <q-item-label caption>
          {{ formatFiatAmount(voucher.fiatAmountMinor, voucher.fiatCurrency) }}
          · Status: {{ voucher.status }} · Created:
          {{ formatDate(voucher.createdAt) }}
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-badge color="grey-8">
          {{ voucher.quote.source }}
        </q-badge>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import type { VoucherRecord } from 'src/types/voucher';

defineProps<{
  voucherRecords: VoucherRecord[];
}>();

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
</script>
