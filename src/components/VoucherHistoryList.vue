<template>
  <q-card v-if="voucherRecords.length === 0" flat bordered class="empty-card">
    <q-card-section class="text-center">
      <q-icon name="receipt_long" size="42px" color="grey-6" />
      <div class="text-h6 q-mt-sm">
        {{ t('historyList.empty.title') }}
      </div>
      <p class="text-grey-7 q-mb-none">
        {{ t('historyList.empty.text') }}
      </p>
    </q-card-section>
  </q-card>

  <div v-else class="voucher-list">
    <q-card
      v-for="voucher in voucherRecords"
      :key="voucher.id"
      flat
      bordered
      class="voucher-card"
    >
      <q-card-section>
        <div class="voucher-header">
          <div>
            <div class="voucher-serial">{{ voucher.serial }}</div>
            <div class="voucher-date">
              {{
                t('historyList.issuedDate', {
                  date: formatDate(voucher.createdAt),
                })
              }}
            </div>
          </div>

          <q-badge :class="getStatusBadgeClass(voucher)">
            {{ getVoucherStatusLabel(voucher) }}
          </q-badge>
        </div>

        <div class="voucher-summary-grid q-mt-md">
          <div class="summary-tile highlight">
            <div class="summary-label">
              {{ t('historyList.summary.customerPaid') }}
            </div>
            <div class="summary-value">
              {{
                formatFiatAmount(voucher.fiatAmountMinor, voucher.fiatCurrency)
              }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('historyList.summary.bchLoaded') }}
            </div>
            <div class="summary-value">
              {{ formatBchSats(voucher.finalBchSats) }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('historyList.summary.redemption') }}
            </div>
            <div class="summary-value">
              {{ getRedemptionLabel(voucher) }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('historyList.summary.quote') }}
            </div>
            <div class="summary-value">
              {{ formatQuoteSource(voucher.quote.source) }}
            </div>
          </div>
        </div>

        <q-card flat bordered class="address-card q-mt-md">
          <q-card-section>
            <div class="address-label">
              {{ t('historyList.address.voucherAddress') }}
            </div>
            <div class="address-value">
              {{ voucher.address || t('historyList.address.notDerivedYet') }}
            </div>
          </q-card-section>
        </q-card>

        <q-banner
          v-if="canCheckFunding(voucher)"
          class="bg-orange-1 text-orange-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="sync" />
          </template>

          <div class="text-weight-bold">Funding verification pending</div>

          <div>
            The exact saved transaction can be checked again. This check does
            not send or create another transaction.
          </div>
        </q-banner>

        <div class="action-row q-mt-md">
          <q-btn
            class="primary-button"
            :label="t('historyList.actions.previewReceipt')"
            icon="receipt"
            unelevated
            no-caps
            @click="handlePreviewReceipt(voucher)"
          />

          <q-btn
            class="secondary-button"
            :label="t('historyList.actions.checkRedemption')"
            icon="travel_explore"
            outline
            no-caps
            :loading="checkingRedemptionVoucherId === voucher.id"
            @click="emit('checkOnChainRedemption', voucher.id)"
          />
        </div>

        <q-btn
          v-if="canCheckFunding(voucher)"
          class="secondary-button"
          label="Check funding"
          icon="sync"
          outline
          no-caps
          :loading="checkingFundingVoucherId === voucher.id"
          @click="emit('checkFunding', voucher.id)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="accordion-section">
        <q-expansion-item
          icon="check_circle"
          :label="t('historyList.redemptionTools.label')"
          :caption="t('historyList.redemptionTools.caption')"
          class="history-expansion"
        >
          <q-card flat bordered>
            <q-card-section>
              <q-banner
                v-if="voucher.manualRedemption"
                class="bg-green-1 text-green-10 q-mb-md"
                rounded
              >
                <template #avatar>
                  <q-icon name="check_circle" />
                </template>

                {{ t('historyList.redemptionTools.manualMarked') }}
              </q-banner>

              <q-banner
                v-else-if="voucher.redemptionDetection"
                :class="
                  voucher.redemptionDetection.status === 'funded'
                    ? 'bg-green-1 text-green-10'
                    : voucher.redemptionDetection.status === 'swept'
                    ? 'bg-blue-1 text-blue-10'
                    : voucher.redemptionDetection.status === 'unfunded'
                    ? 'bg-grey-2 text-grey-9'
                    : 'bg-orange-1 text-orange-10'
                "
                rounded
                class="q-mb-md"
              >
                <template #avatar>
                  <q-icon
                    :name="
                      voucher.redemptionDetection.status === 'funded'
                        ? 'account_balance_wallet'
                        : voucher.redemptionDetection.status === 'swept'
                        ? 'check_circle'
                        : voucher.redemptionDetection.status === 'unfunded'
                        ? 'info'
                        : 'warning'
                    "
                  />
                </template>

                {{ voucher.redemptionDetection.message }}
              </q-banner>

              <q-banner v-else class="bg-grey-2 text-grey-9 q-mb-md" rounded>
                <template #avatar>
                  <q-icon name="info" />
                </template>

                {{ t('historyList.redemptionTools.notCheckedYet') }}
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
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.status') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.manualRedemption.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.manualRedemption.txid">
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.sweepTransactionId') }}
                    </q-item-label>
                    <q-item-label class="text-break">
                      {{ voucher.manualRedemption.txid }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.manualRedemption.note">
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.note') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.manualRedemption.note }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.redeemed') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.manualRedemption.redeemedAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-list
                v-if="voucher.redemptionDetection"
                dense
                bordered
                separator
                class="q-mb-md"
              >
                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.detectedStatus') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.redemptionDetection.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.detectedBalance') }}
                    </q-item-label>
                    <q-item-label>
                      {{
                        formatBchSats(voucher.redemptionDetection.balanceSats)
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.detectedUtxos') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.redemptionDetection.utxoCount }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.checked') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.redemptionDetection.checkedAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div
                v-if="!voucher.manualRedemption"
                class="row q-col-gutter-sm q-mb-md"
              >
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="redemptionInputs[voucher.id].txid"
                    dense
                    outlined
                    :label="t('historyList.redemptionTools.sweepTxidOptional')"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="redemptionInputs[voucher.id].note"
                    dense
                    outlined
                    :label="t('historyList.redemptionTools.noteOptional')"
                  />
                </div>
              </div>

              <div class="tool-actions">
                <q-btn
                  v-if="!voucher.manualRedemption"
                  color="positive"
                  outline
                  :label="t('historyList.actions.markAsManuallySwept')"
                  no-caps
                  @click="handleMarkManualRedemption(voucher.id)"
                />

                <q-btn
                  v-if="voucher.manualRedemption"
                  color="grey-8"
                  outline
                  :label="t('historyList.actions.clearManualSweepStatus')"
                  no-caps
                  @click="emit('clearManualRedemption', voucher.id)"
                />

                <q-btn
                  class="secondary-button"
                  :label="t('historyList.actions.checkOnChainStatus')"
                  icon="travel_explore"
                  outline
                  no-caps
                  :loading="checkingRedemptionVoucherId === voucher.id"
                  @click="emit('checkOnChainRedemption', voucher.id)"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          icon="receipt"
          label="Receipt preview"
          caption="Development-only access to the sweepable voucher QR"
          class="history-expansion"
        >
          <q-card flat bordered>
            <q-card-section>
              <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
                <template #avatar>
                  <q-icon name="warning" />
                </template>

                Testing only. The receipt QR contains sweepable private key
                material and should not be freely accessible in the final
                merchant history screen.
              </q-banner>

              <q-btn
                class="primary-button"
                :label="t('historyList.actions.previewReceipt')"
                icon="receipt"
                unelevated
                no-caps
                @click="handlePreviewReceipt(voucher)"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          icon="code"
          label="Development details"
          caption="Key export checks, fee plan, funding preview, and quote data"
          class="history-expansion"
        >
          <q-card flat bordered>
            <q-card-section>
              <q-banner class="bg-grey-2 text-grey-9 q-mb-md" rounded>
                <template #avatar>
                  <q-icon name="shield" />
                </template>

                Technical information for development and testing. Sensitive
                voucher key tools should be removed or hidden behind developer
                mode before merchant production use.
              </q-banner>

              <q-list dense bordered separator class="q-mb-md">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Record status</q-item-label>
                    <q-item-label>
                      {{ voucher.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Derivation index</q-item-label>
                    <q-item-label>
                      {{ voucher.derivationIndex }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>WIF ready</q-item-label>
                    <q-item-label>
                      <span v-if="voucher.keyMetadata">
                        {{ voucher.keyMetadata.hasWif ? 'Yes' : 'No' }}
                        · checked
                        {{ formatDate(voucher.keyMetadata.checkedAt) }}
                      </span>
                      <span v-else>Not checked</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Service fee</q-item-label>
                    <q-item-label>
                      {{ formatFee(voucher) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <VoucherWifRevealCard
                :derivation-index="voucher.derivationIndex"
                :voucher-address="voucher.address"
                :has-wif="voucher.keyMetadata?.hasWif === true"
              />

              <q-list dense bordered separator class="q-mt-md">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Market rate</q-item-label>
                    <q-item-label>
                      {{
                        formatMarketRate(
                          voucher.quote.marketRate,
                          voucher.fiatCurrency
                        )
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Quote source</q-item-label>
                    <q-item-label>
                      {{ formatQuoteSource(voucher.quote.source) }}
                      <q-badge
                        v-if="voucher.quote.isFallbackQuote"
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
                    <q-item-label caption>Quote time</q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.quote.marketRateTimestamp) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.quote.quoteExpiresAt">
                  <q-item-section>
                    <q-item-label caption>Quote expires</q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.quote.quoteExpiresAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-expansion-item
                dense
                icon="payments"
                label="Fee output plan"
                class="nested-expansion q-mt-md"
              >
                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Fee output plan</q-item-label>
                      <q-item-label>
                        <span v-if="voucher.feeOutputPlan">
                          <template v-if="isTopupFeeModelV1(voucher)">
                            platform
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.platformFeeSats
                              )
                            }}
                            · merchant service fee share
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.merchantRetainedSats
                              )
                            }}
                            · total service fee equivalent
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.totalServiceFeeSats
                              )
                            }}
                          </template>

                          <template v-else>
                            platform
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.platformFeeSats
                              )
                            }}
                            · merchant retained
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.merchantRetainedSats
                              )
                            }}
                            · buffer
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.bufferReserveSats
                              )
                            }}
                            · total
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.totalServiceFeeSats
                              )
                            }}
                          </template>
                        </span>
                        <span v-else>Not available</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>

              <q-expansion-item
                dense
                icon="account_balance_wallet"
                label="Funding preview"
                class="nested-expansion q-mt-sm"
              >
                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Funding preview</q-item-label>
                      <q-item-label>
                        <span v-if="voucher.treasuryFundingPreview">
                          selected {{ getSelectedUtxoCount(voucher) }} UTXOs ·
                          inputs
                          {{ formatBchSats(getSelectedInputSats(voucher)) }}
                          · fee
                          {{
                            formatBchSats(
                              voucher.treasuryFundingPreview.estimatedFeeSats
                            )
                          }}
                          · total
                          {{
                            formatBchSats(
                              voucher.treasuryFundingPreview
                                .estimatedTotalRequiredSats
                            )
                          }}
                          · change
                          {{
                            formatBchSats(
                              voucher.treasuryFundingPreview.estimatedChangeSats
                            )
                          }}
                          ·
                          {{
                            voucher.treasuryFundingPreview.isAffordable
                              ? 'affordable'
                              : 'not affordable'
                          }}
                        </span>
                        <span v-else>Not available</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>

              <q-expansion-item
                v-if="voucher.fundingBroadcast"
                dense
                icon="send"
                label="Funding broadcast"
                class="nested-expansion q-mt-sm"
              >
                <q-banner
                  :class="
                    voucher.fundingBroadcast.status === 'broadcasted'
                      ? 'bg-green-1 text-green-10'
                      : voucher.fundingBroadcast.status === 'blocked'
                      ? 'bg-orange-1 text-orange-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
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

                  <span
                    v-if="voucher.fundingBroadcast.status === 'broadcasted'"
                  >
                    Real funding transaction was broadcast.
                  </span>

                  <span
                    v-else-if="voucher.fundingBroadcast.status === 'blocked'"
                  >
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
                      <q-item-label caption
                        >Funding transaction ID</q-item-label
                      >
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
                          voucher.fundingBroadcast.broadcastEnabled
                            ? 'Yes'
                            : 'No'
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
              </q-expansion-item>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </div>

  <q-dialog
    v-model="isReceiptPreviewDialogOpen"
    @hide="handleReceiptPreviewDialogHide"
  >
    <q-card class="receipt-dialog-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Voucher Receipt</div>
          <div class="text-caption text-grey-7">
            Development/test preview only
          </div>
        </div>

        <q-btn v-close-popup dense flat round icon="close" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="selectedReceiptVoucher">
        <VoucherReceiptPreview :voucher="selectedReceiptVoucher" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup color="primary" flat label="Close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import VoucherReceiptPreview from 'src/components/VoucherReceiptPreview.vue';
import VoucherWifRevealCard from 'src/components/VoucherWifRevealCard.vue';
import type { VoucherRecord, VoucherQuoteSource } from 'src/types/voucher';
import { formatBchSats, formatMarketRate } from 'src/services/voucher-pricing';
import {
  getTopupRecordValues,
  isTopupFeeModelV1,
} from 'src/services/topup-record-values';

type VoucherStatusKey = 'redeemed' | 'funded' | 'funding' | 'error' | 'issued';

const props = defineProps<{
  voucherRecords: VoucherRecord[];
  checkingRedemptionVoucherId?: string | null;
  checkingFundingVoucherId?: string | null;
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

  checkOnChainRedemption: [voucherId: string];

  checkFunding: [voucherId: string];
}>();

const { t } = useI18n({ useScope: 'global' });

const redemptionInputs = reactive<
  Record<string, { txid: string; note: string }>
>({});

const isReceiptPreviewDialogOpen = ref(false);
const selectedReceiptVoucher = ref<VoucherRecord | null>(null);

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

function handlePreviewReceipt(voucher: VoucherRecord): void {
  selectedReceiptVoucher.value = voucher;
  isReceiptPreviewDialogOpen.value = true;
}

function handleReceiptPreviewDialogHide(): void {
  selectedReceiptVoucher.value = null;
}

function canCheckFunding(voucher: VoucherRecord): boolean {
  return voucher.status === 'funding' && Boolean(voucher.fundingIntent?.txid);
}

function getVoucherStatusKey(voucher: VoucherRecord): VoucherStatusKey {
  if (
    voucher.status === 'redeemed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  ) {
    return 'redeemed';
  }

  if (
    voucher.status === 'funded' ||
    voucher.redemptionDetection?.status === 'funded'
  ) {
    return 'funded';
  }

  if (voucher.status === 'funding') {
    return 'funding';
  }

  if (voucher.status === 'error') {
    return 'error';
  }

  return 'issued';
}

function getVoucherStatusLabel(voucher: VoucherRecord): string {
  const status = getVoucherStatusKey(voucher);

  if (status === 'funding') {
    return 'Funding verification';
  }

  return t(`historyList.status.${status}`);
}

function getRedemptionLabel(voucher: VoucherRecord): string {
  if (voucher.manualRedemption) {
    return t('historyList.redemption.manualSwept');
  }

  if (voucher.redemptionDetection?.status === 'swept') {
    return t('historyList.redemption.swept');
  }

  if (voucher.redemptionDetection?.status === 'funded') {
    return t('historyList.redemption.funded');
  }

  if (voucher.redemptionDetection?.status === 'unfunded') {
    return t('historyList.redemption.unfunded');
  }

  return t('historyList.redemption.notChecked');
}

function getStatusBadgeClass(voucher: VoucherRecord): string {
  return `status-badge ${getVoucherStatusKey(voucher)}`;
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatFee(voucher: VoucherRecord): string {
  const values = getTopupRecordValues(voucher);

  if (values.serviceFeeMinor === 0) {
    return 'None';
  }

  const feeAmount = formatFiatAmount(
    values.serviceFeeMinor,
    voucher.fiatCurrency
  );

  if (values.model === 'topup_v1') {
    return feeAmount;
  }

  const feePercent = `${voucher.fee.basisPoints / 100}%`;

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
    cached: t('historyList.quoteSources.cached'),
    manual: t('historyList.quoteSources.manual'),
    unknown: t('historyList.quoteSources.unknown'),
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

<style lang="scss" scoped>
.empty-card,
.voucher-card {
  border-radius: 22px;
}

.voucher-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.voucher-card {
  background: #ffffff;
  border-color: #dddddd;
  overflow: hidden;
}

.voucher-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.voucher-serial {
  color: #111111;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.voucher-date {
  color: #666666;
  font-size: 13px;
  margin-top: 4px;
}

.status-badge {
  border-radius: 999px;
  color: #000000;
  font-weight: 850;
  padding: 6px 10px;
}

.status-badge.issued {
  background: #eeeeee;
}

.status-badge.funded {
  background: #00ce1b;
}

.status-badge.funding {
  background: #fff3cd;
  color: #7a5200;
}

.status-badge.redeemed {
  background: #d8ecff;
  color: #0b4f8a;
}

.status-badge.error {
  background: #ffe1e1;
  color: #b00020;
}

.voucher-summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, 1fr);
}

.summary-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 14px;
}

.summary-tile.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.summary-label,
.address-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.summary-value {
  color: #111111;
  font-size: 15px;
  font-weight: 850;
  line-height: 1.25;
}

.address-card {
  background: #f7f8f7;
  border-color: #dddddd;
  border-radius: 18px;
}

.address-card :deep(.q-card__section) {
  padding: 14px;
}

.address-value {
  color: #111111;
  font-size: 13px;
  font-weight: 700;
  word-break: break-all;
}

.action-row,
.tool-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.primary-button,
.secondary-button {
  border-radius: 14px;
  font-weight: 850;
  min-height: 42px;
  overflow: hidden;
  padding: 0 18px;
}

.primary-button {
  background: #00ce1b;
  color: #000000;
}

.secondary-button {
  border-color: #222222;
  color: #111111;
}

.accordion-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-expansion,
.nested-expansion {
  border: 1px solid #dddddd;
  border-radius: 18px;
  overflow: hidden;
}

.history-expansion :deep(.q-expansion-item__container),
.nested-expansion :deep(.q-expansion-item__container) {
  border-radius: 18px;
  overflow: hidden;
}

.history-expansion :deep(.q-focus-helper),
.nested-expansion :deep(.q-focus-helper),
.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.receipt-dialog-card {
  border-radius: 22px;
  max-width: 95vw;
  width: 440px;
}

@media (max-width: 820px) {
  .voucher-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .voucher-header {
    flex-direction: column;
  }

  .voucher-summary-grid {
    grid-template-columns: 1fr;
  }

  .action-row,
  .tool-actions {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button,
  .tool-actions .q-btn {
    width: 100%;
  }
}
</style>
