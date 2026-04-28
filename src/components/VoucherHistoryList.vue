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
          Customer pays:
          {{ formatFiatAmount(voucher.fiatAmountMinor, voucher.fiatCurrency) }}
          · Fee:
          {{ formatFee(voucher) }}
          · BCH loaded:
          {{ formatBchSats(voucher.finalBchSats) }}
          · Status:
          {{ voucher.status }}
        </q-item-label>

        <q-item-label caption>
          Rate:
          {{ formatMarketRate(voucher.quote.marketRate, voucher.fiatCurrency) }}
          · Quote:
          {{ formatQuoteSource(voucher.quote.source) }}
          <span v-if="voucher.quote.isFallbackQuote">(fallback)</span>
        </q-item-label>

        <q-item-label caption>
          Quote time:
          {{ formatDate(voucher.quote.marketRateTimestamp) }}
          <span v-if="voucher.quote.quoteExpiresAt">
            · Expires:
            {{ formatDate(voucher.quote.quoteExpiresAt) }}
          </span>
          · Created:
          {{ formatDate(voucher.createdAt) }}
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-badge color="grey-8">
          {{ formatQuoteSource(voucher.quote.source) }}
        </q-badge>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import type { VoucherRecord, VoucherQuoteSource } from 'src/types/voucher';
import { formatBchSats, formatMarketRate } from 'src/services/voucher-pricing';

defineProps<{
  voucherRecords: VoucherRecord[];
}>();

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatFee(voucher: VoucherRecord): string {
  if (voucher.fee.type === 'none') {
    return 'None';
  }

  const feePercent = `${voucher.fee.basisPoints / 100}%`;
  const feeAmount = formatFiatAmount(
    voucher.fee.amountMinor,
    voucher.fiatCurrency
  );

  return `${feePercent} / ${feeAmount}`;
}

function formatQuoteSource(source: VoucherQuoteSource): string {
  const labels: Record<VoucherQuoteSource, string> = {
    general_protocols_oracle: 'GP Oracle',
    coingecko: 'CoinGecko',
    cached: 'Cached',
    manual: 'Manual',
    unknown: 'Unknown',
  };

  return labels[source];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
</script>
