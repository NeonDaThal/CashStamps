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
          Address:
          {{ voucher.address || 'Not derived yet' }}
          · Index:
          {{ voucher.derivationIndex }}
        </q-item-label>

        <q-item-label caption>
          WIF ready:
          <span v-if="voucher.keyMetadata">
            {{ voucher.keyMetadata.hasWif ? 'Yes' : 'No' }}
            · checked {{ formatDate(voucher.keyMetadata.checkedAt) }}
          </span>
          <span v-else> Not checked </span>
        </q-item-label>

        <VoucherWifRevealCard
          :derivation-index="voucher.derivationIndex"
          :voucher-address="voucher.address"
          :has-wif="voucher.keyMetadata?.hasWif === true"
        />

        <q-item-label caption>
          Fee output plan:
          <span v-if="voucher.feeOutputPlan">
            platform
            {{ formatBchSats(voucher.feeOutputPlan.platformFeeSats) }} ·
            merchant retained
            {{ formatBchSats(voucher.feeOutputPlan.merchantRetainedSats) }} ·
            buffer
            {{ formatBchSats(voucher.feeOutputPlan.bufferReserveSats) }} · total
            {{ formatBchSats(voucher.feeOutputPlan.totalServiceFeeSats) }}
          </span>
          <span v-else> Not available </span>
        </q-item-label>

        <q-item-label caption>
          Funding preview:
          <span v-if="voucher.treasuryFundingPreview">
            selected {{ getSelectedUtxoCount(voucher) }} UTXOs · inputs
            {{ formatBchSats(getSelectedInputSats(voucher)) }} · fee
            {{ formatBchSats(voucher.treasuryFundingPreview.estimatedFeeSats) }}
            · total
            {{
              formatBchSats(
                voucher.treasuryFundingPreview.estimatedTotalRequiredSats
              )
            }}
            · change
            {{
              formatBchSats(voucher.treasuryFundingPreview.estimatedChangeSats)
            }}
            ·
            {{
              voucher.treasuryFundingPreview.isAffordable
                ? 'affordable'
                : 'not affordable'
            }}
          </span>
          <span v-else> Not available </span>
        </q-item-label>

        <q-card v-if="voucher.fundingBroadcast" flat bordered class="q-mt-sm">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">Funding broadcast</div>

            <q-banner
              :class="
                voucher.fundingBroadcast.status === 'broadcasted'
                  ? 'bg-green-1 text-green-10'
                  : voucher.fundingBroadcast.status === 'blocked'
                  ? 'bg-orange-1 text-orange-10'
                  : 'bg-red-1 text-red-10'
              "
              rounded
              class="q-mb-sm"
            >
              <template #avatar>
                <q-icon
                  :name="
                    voucher.fundingBroadcast.status === 'broadcasted'
                      ? 'check_circle'
                      : voucher.fundingBroadcast.status === 'blocked'
                      ? 'block'
                      : 'warning'
                  "
                />
              </template>

              <span v-if="voucher.fundingBroadcast.status === 'broadcasted'">
                Real funding transaction was broadcast.
              </span>

              <span v-else-if="voucher.fundingBroadcast.status === 'blocked'">
                Funding broadcast was blocked.
              </span>

              <span v-else> Funding broadcast failed. </span>
            </q-banner>

            <q-list dense bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Status</q-item-label>
                  <q-item-label>
                    {{ voucher.fundingBroadcast.status }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="voucher.fundingBroadcast.txid">
                <q-item-section>
                  <q-item-label caption>Funding transaction ID</q-item-label>
                  <q-item-label class="text-break">
                    {{ voucher.fundingBroadcast.txid }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="voucher.fundingBroadcast.errorMessage">
                <q-item-section>
                  <q-item-label caption>Broadcast message</q-item-label>
                  <q-item-label>
                    {{ voucher.fundingBroadcast.errorMessage }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Broadcast enabled</q-item-label>
                  <q-item-label>
                    {{
                      voucher.fundingBroadcast.broadcastEnabled ? 'Yes' : 'No'
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Attempted</q-item-label>
                  <q-item-label>
                    {{ formatDate(voucher.fundingBroadcast.attemptedAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-sm">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">Manual redemption status</div>

            <q-banner
              v-if="voucher.manualRedemption"
              class="bg-green-1 text-green-10 q-mb-sm"
              rounded
            >
              <template #avatar>
                <q-icon name="check_circle" />
              </template>

              Voucher manually marked as swept/redeemed.
            </q-banner>

            <q-banner v-else class="bg-grey-2 text-grey-9 q-mb-sm" rounded>
              <template #avatar>
                <q-icon name="info" />
              </template>

              Voucher has not been manually marked as swept/redeemed.
            </q-banner>

            <q-list
              v-if="voucher.manualRedemption"
              dense
              bordered
              separator
              class="q-mb-md"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>Status</q-item-label>
                  <q-item-label>
                    {{ voucher.manualRedemption.status }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="voucher.manualRedemption.txid">
                <q-item-section>
                  <q-item-label caption>Sweep transaction ID</q-item-label>
                  <q-item-label class="text-break">
                    {{ voucher.manualRedemption.txid }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="voucher.manualRedemption.note">
                <q-item-section>
                  <q-item-label caption>Note</q-item-label>
                  <q-item-label>
                    {{ voucher.manualRedemption.note }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Redeemed</q-item-label>
                  <q-item-label>
                    {{ formatDate(voucher.manualRedemption.redeemedAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div
              v-if="!voucher.manualRedemption"
              class="row q-col-gutter-sm q-mb-sm"
            >
              <div class="col-12 col-md-6">
                <q-input
                  v-model="redemptionInputs[voucher.id].txid"
                  dense
                  outlined
                  label="Sweep TXID optional"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="redemptionInputs[voucher.id].note"
                  dense
                  outlined
                  label="Note optional"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-auto">
                <q-btn
                  v-if="!voucher.manualRedemption"
                  color="positive"
                  outline
                  label="Mark as Manually Swept"
                  @click="handleMarkManualRedemption(voucher.id)"
                />
              </div>

              <div class="col-12 col-sm-auto">
                <q-btn
                  v-if="voucher.manualRedemption"
                  color="grey-8"
                  outline
                  label="Clear Manual Sweep Status"
                  @click="emit('clearManualRedemption', voucher.id)"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

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
import { reactive, watch } from 'vue';

import VoucherWifRevealCard from 'src/components/VoucherWifRevealCard.vue';
import type { VoucherRecord, VoucherQuoteSource } from 'src/types/voucher';
import { formatBchSats, formatMarketRate } from 'src/services/voucher-pricing';

const props = defineProps<{
  voucherRecords: VoucherRecord[];
}>();

const emit = defineEmits<{
  markManualRedemption: [
    payload: {
      voucherId: string;
      txid?: string;
      note?: string;
    }
  ];
  clearManualRedemption: [voucherId: string];
}>();

const redemptionInputs = reactive<
  Record<string, { txid: string; note: string }>
>({});

function ensureRedemptionInputs(): void {
  props.voucherRecords.forEach((voucher) => {
    if (!redemptionInputs[voucher.id]) {
      redemptionInputs[voucher.id] = {
        txid: '',
        note: '',
      };
    }
  });
}

watch(
  () => props.voucherRecords,
  () => {
    ensureRedemptionInputs();
  },
  {
    immediate: true,
    deep: true,
  }
);

function handleMarkManualRedemption(voucherId: string): void {
  const input = redemptionInputs[voucherId] ?? {
    txid: '',
    note: '',
  };

  emit('markManualRedemption', {
    voucherId,
    txid: input.txid.trim() || undefined,
    note: input.note.trim() || undefined,
  });
}

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

function getSelectedUtxoCount(voucher: VoucherRecord): number {
  return voucher.treasuryFundingPreview?.selectedUtxos?.length ?? 0;
}

function getSelectedInputSats(voucher: VoucherRecord): number {
  return (
    voucher.treasuryFundingPreview?.selectedInputSats ??
    voucher.treasuryFundingPreview?.treasuryBalanceSats ??
    0
  );
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
