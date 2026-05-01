<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 620px; max-width: 95vw">
      <q-card-section>
        <div class="text-h5">Confirm Voucher Issue</div>
        <p class="text-grey-7 q-mb-none">
          Review the locked quote and pricing breakdown before creating this
          test voucher.
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-banner
          :class="
            pricing.isFallbackQuote
              ? 'bg-orange-1 text-orange-10'
              : 'bg-green-1 text-green-10'
          "
          rounded
          class="q-mb-md"
        >
          <template #avatar>
            <q-icon
              :name="pricing.isFallbackQuote ? 'warning' : 'check_circle'"
            />
          </template>

          <span v-if="pricing.isFallbackQuote">
            Live pricing was unavailable, so a recent cached quote is being
            used. Review the quote carefully before issuing.
          </span>

          <span v-else> Live price quote locked successfully. </span>
        </q-banner>

        <q-banner
          v-if="treasuryWarning"
          class="bg-orange-1 text-orange-10 q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>

          {{ treasuryWarning }}
        </q-banner>

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

          <q-separator spaced />

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

          <q-item v-if="treasuryBalanceSats !== undefined">
            <q-item-section>
              <q-item-label caption>Treasury balance</q-item-label>
              <q-item-label>
                {{ formatBchSats(treasuryBalanceSats) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header> Dry-run treasury funding preview </q-item-label>

          <template v-if="treasuryFundingPreview">
            <q-item>
              <q-item-section>
                <q-item-label caption>Treasury address</q-item-label>
                <q-item-label class="text-break">
                  {{ treasuryFundingPreview.treasuryAddress }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Voucher address</q-item-label>
                <q-item-label class="text-break">
                  {{ treasuryFundingPreview.voucherAddress }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Amount to send</q-item-label>
                <q-item-label>
                  {{ formatBchSats(treasuryFundingPreview.amountSats) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Selected input total</q-item-label>
                <q-item-label>
                  {{ formatBchSats(treasuryFundingPreview.selectedInputSats) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Selected UTXOs</q-item-label>
                <q-item-label>
                  {{ treasuryFundingPreview.selectedUtxos.length }}
                  of {{ treasuryFundingPreview.treasuryUtxoCount }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Estimated network fee</q-item-label>
                <q-item-label>
                  {{ formatBchSats(treasuryFundingPreview.estimatedFeeSats) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Estimated total required</q-item-label>
                <q-item-label>
                  {{
                    formatBchSats(
                      treasuryFundingPreview.estimatedTotalRequiredSats
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Estimated change</q-item-label>
                <q-item-label>
                  {{
                    formatBchSats(treasuryFundingPreview.estimatedChangeSats)
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-banner
              :class="
                treasuryFundingPreview.isAffordable
                  ? 'bg-green-1 text-green-10'
                  : 'bg-red-1 text-red-10'
              "
              rounded
              class="q-mt-sm q-mb-md"
            >
              <template #avatar>
                <q-icon
                  :name="
                    treasuryFundingPreview.isAffordable
                      ? 'check_circle'
                      : 'warning'
                  "
                />
              </template>

              <span v-if="treasuryFundingPreview.isAffordable">
                Treasury appears affordable for this voucher in dry-run preview.
              </span>

              <span v-else>
                Treasury does not appear affordable for this voucher in dry-run
                preview.
              </span>
            </q-banner>

            <q-card
              v-if="treasuryFundingPreview.selectedUtxos.length > 0"
              flat
              bordered
              class="q-mb-md"
            >
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">Selected UTXO details</div>

                <q-list dense separator>
                  <q-item
                    v-for="(
                      utxo, index
                    ) in treasuryFundingPreview.selectedUtxos"
                    :key="`${utxo.outpointTransactionHash}:${utxo.outpointIndex}`"
                  >
                    <q-item-section>
                      <q-item-label> UTXO {{ index + 1 }} </q-item-label>

                      <q-item-label caption>
                        Value:
                        {{ formatBchSats(utxo.valueSats) }}
                      </q-item-label>

                      <q-item-label caption class="text-break">
                        Tx:
                        {{ utxo.outpointTransactionHash }}
                      </q-item-label>

                      <q-item-label caption>
                        Output index:
                        {{ utxo.outpointIndex }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </template>

          <q-banner v-else class="bg-grey-2 text-grey-9 q-mb-md" rounded>
            Treasury funding preview is not available yet. Set up a treasury
            wallet and refresh/check balance before real funding is enabled.
          </q-banner>

          <q-separator spaced />

          <q-item>
            <q-item-section>
              <q-item-label caption>Quote source</q-item-label>
              <q-item-label>
                {{ quoteSourceLabel }}
                <q-badge
                  v-if="pricing.isFallbackQuote"
                  color="orange"
                  class="q-ml-sm"
                >
                  fallback
                </q-badge>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Quote timestamp</q-item-label>
              <q-item-label>
                {{ formatDateTime(pricing.quoteTimestamp) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="pricing.quoteLockedAt">
            <q-item-section>
              <q-item-label caption>Quote locked</q-item-label>
              <q-item-label>
                {{ formatDateTime(pricing.quoteLockedAt) }}
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

          <q-separator spaced />

          <q-item>
            <q-item-section>
              <q-item-label caption>Funding mode</q-item-label>
              <q-item-label>Fake only — no BCH will be sent yet</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          This is still a dry-run only. No transaction is built, signed, or
          broadcast yet. Real treasury funding will be added after this preview
          layer is correct.
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

import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
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
  treasuryWarning?: string;
  treasuryBalanceSats?: number;
  treasuryFundingPreview?: TreasuryFundingPreview | null;
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
