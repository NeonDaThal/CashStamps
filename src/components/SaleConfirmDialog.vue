<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 560px; max-width: 95vw">
      <q-card-section>
        <div class="text-h5">Confirm Voucher Issue</div>
        <p class="text-grey-7 q-mb-none">
          Review the locked quote and pricing breakdown before creating this
          test voucher.
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label caption>Customer pays</q-item-label>
              <q-item-label>
                {{
                  formatMinorFiatAmount(
                    pricing.customerPaysMinor,
                    pricing.fiatCurrency
                  )
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Service fee</q-item-label>
              <q-item-label>
                {{ formatBasisPointsAsPercent(pricing.serviceFeeBasisPoints) }}
                —
                {{
                  formatMinorFiatAmount(
                    pricing.serviceFeeAmountMinor,
                    pricing.fiatCurrency
                  )
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Voucher value</q-item-label>
              <q-item-label>
                {{
                  formatMinorFiatAmount(
                    pricing.voucherValueMinor,
                    pricing.fiatCurrency
                  )
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Market rate</q-item-label>
              <q-item-label>
                {{ formatMarketRate(pricing.marketRate, pricing.fiatCurrency) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Estimated BCH loaded</q-item-label>
              <q-item-label>
                {{ formatBchSats(pricing.finalBchSats) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Quote source</q-item-label>
              <q-item-label>
                {{ quoteSourceLabel }}
                <span v-if="pricing.isFallbackQuote">(fallback)</span>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="pricing.quoteExpiresAt">
            <q-item-section>
              <q-item-label caption>Quote expires</q-item-label>
              <q-item-label>
                {{ formatDateTime(pricing.quoteExpiresAt) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Funding mode</q-item-label>
              <q-item-label>Fake only — no BCH will be sent yet</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          This still uses fake funding. The quote and BCH amount are real
          pricing calculations, but treasury funding is added later in Phase 3.
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

import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';
import {
  formatBasisPointsAsPercent,
  formatBchSats,
  formatMarketRate,
  formatMinorFiatAmount,
} from 'src/services/voucher-pricing';

const props = defineProps<{
  modelValue: boolean;
  pricing: FakeVoucherPricingQuote;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

const quoteSourceLabel = computed(() => {
  const labels: Record<FakeVoucherPricingQuote['quoteSource'], string> = {
    fake_phase_2_quote: 'Fake Phase 2 quote',
    coingecko: 'CoinGecko',
    cached: 'Cached quote',
    general_protocols_oracle: 'General Protocols Oracle',
  };

  return labels[props.pricing.quoteSource];
});

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
</script>
