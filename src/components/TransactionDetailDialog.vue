<template>
  <q-dialog
    :model-value="modelValue"
    class="transaction-detail-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card v-if="row" class="transaction-detail-card">
      <q-card-section class="transaction-detail-header">
        <div class="transaction-detail-heading">
          <div
            :class="[
              'transaction-detail-icon',
              `transaction-detail-icon--${row.typeStyle}`,
            ]"
          >
            <q-icon :name="row.type === 'topup' ? topupIcon : 'currency_exchange'" />
          </div>

          <div class="transaction-detail-heading-copy">
            <div class="transaction-detail-pill-row">
              <span
                :class="[
                  'transaction-type-pill',
                  `transaction-type-pill--${row.typeStyle}`,
                ]"
              >
                {{ row.typeLabel }}
              </span>

              <span
                :class="[
                  'transaction-status-pill',
                  `transaction-status-pill--${row.statusStyle}`,
                ]"
              >
                {{ row.statusLabel }}
              </span>
            </div>

            <div class="transaction-detail-title">
              {{ t('historyPage.detail.title') }}
            </div>

            <p class="transaction-detail-subtitle">
              {{ row.reference }}
            </p>
          </div>
        </div>

        <q-btn
          flat
          dense
          round
          icon="close"
          :aria-label="t('common.close')"
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="transaction-detail-body">
        <div class="detail-amount-grid">
          <div class="detail-amount-tile detail-amount-tile--primary">
            <div class="detail-amount-label">
              {{ requestedAmountLabel }}
            </div>

            <div class="detail-amount-value">
              {{ requestedAmountDisplay }}
            </div>

            <div class="detail-bch-line">
              <img :src="bchLogoUrl" alt="" class="detail-bch-logo" />
              {{ requestedBchDisplay }}
            </div>
          </div>

          <div class="detail-amount-tile">
            <div class="detail-amount-label">
              {{ t('historyPage.detail.amounts.feePaid') }}
            </div>

            <div class="detail-amount-value">
              {{ feeDisplay }}
            </div>

            <div class="detail-amount-note">
              {{ feeCaption }}
            </div>
          </div>

          <div class="detail-amount-tile detail-amount-tile--dark">
            <div class="detail-amount-label">
              {{ receivedAmountLabel }}
            </div>

            <div class="detail-amount-value">
              {{ receivedAmountDisplay }}
            </div>

            <div class="detail-bch-line detail-bch-line--dark">
              <img :src="bchLogoUrl" alt="" class="detail-bch-logo" />
              {{ receivedBchDisplay }}
            </div>
          </div>
        </div>

        <q-card flat bordered class="detail-info-card">
          <q-card-section>
            <div class="detail-info-title">
              {{ t('historyPage.detail.sections.transaction') }}
            </div>

            <div class="detail-info-list">
              <div class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.reference') }}</span>
                <strong>{{ row.reference }}</strong>
              </div>

              <div class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.date') }}</span>
                <strong>{{ formattedDate }}</strong>
              </div>

              <div class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.status') }}</span>
                <strong>{{ row.statusLabel }}</strong>
              </div>

              <div v-if="deliveryMethodDisplay" class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.deliveryMethod') }}</span>
                <strong>{{ deliveryMethodDisplay }}</strong>
              </div>

              <div v-if="deliveryStatusDisplay" class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.deliveryStatus') }}</span>
                <strong>{{ deliveryStatusDisplay }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="detail-info-card">
          <q-card-section>
            <div class="detail-info-title">
              {{ t('historyPage.detail.sections.blockchain') }}
            </div>

            <div class="detail-info-list">
              <div class="detail-info-line detail-info-line--stacked">
                <span>{{ addressLabel }}</span>
                <strong>{{ addressDisplay }}</strong>
              </div>

              <div class="detail-info-line detail-info-line--stacked">
                <span>{{ t('historyPage.detail.labels.transactionId') }}</span>

                <a
                  v-if="transactionId"
                  class="detail-link-value"
                  :href="blockchairTransactionUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ transactionId }}
                  <q-icon name="open_in_new" />
                </a>

                <strong v-else>{{ t('historyPage.detail.labels.notAvailable') }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="detail-info-card">
          <q-card-section>
            <div class="detail-info-title">
              {{ t('historyPage.detail.sections.quote') }}
            </div>

            <div class="detail-info-list">
              <div class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.quoteSource') }}</span>
                <strong>{{ quoteSourceDisplay }}</strong>
              </div>

              <div class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.marketRate') }}</span>
                <strong>{{ marketRateDisplay }}</strong>
              </div>

              <div class="detail-info-line">
                <span>{{ t('historyPage.detail.labels.quoteTime') }}</span>
                <strong>{{ quoteTimeDisplay }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-banner
          v-if="topupRecord?.printedRecovery"
          class="bg-orange-1 text-orange-10"
          rounded
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>

          {{ t('historyPage.detail.notices.printedRecovery') }}
        </q-banner>

        <q-banner
          v-if="topupRecord?.replacement"
          class="bg-grey-2 text-grey-9"
          rounded
        >
          <template #avatar>
            <q-icon name="autorenew" />
          </template>

          {{ t('historyPage.detail.notices.replacementTopup') }}
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import { topupIcon } from 'src/icons/custom-icons';
import { formatBchSats } from 'src/services/voucher-pricing';
import type { CashOutRecord } from 'src/types/cash-out';
import type { TransactionHistoryRow } from 'src/types/transaction-history';
import type { VoucherRecord } from 'src/types/voucher';

const props = defineProps<{
  modelValue: boolean;
  row: TransactionHistoryRow | null;
  topupRecord?: VoucherRecord | null;
  cashOutRecord?: CashOutRecord | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n({ useScope: 'global' });

const requestedAmountLabel = computed(() => {
  return props.row?.type === 'cashout'
    ? t('historyPage.detail.amounts.cashOutRequested')
    : t('historyPage.detail.amounts.topupRequested');
});

const receivedAmountLabel = computed(() => {
  return props.row?.type === 'cashout'
    ? t('historyPage.detail.amounts.customerReceivesCash')
    : t('historyPage.detail.amounts.customerReceivesTopup');
});

const requestedAmountDisplay = computed(() => {
  if (props.cashOutRecord) {
    return formatFiatMinorAmount(
      props.cashOutRecord.fiatAmountMinor,
      props.cashOutRecord.fiatCurrency
    );
  }

  if (props.topupRecord) {
    return formatFiatMinorAmount(
      props.topupRecord.fiatAmountMinor,
      props.topupRecord.fiatCurrency
    );
  }

  return props.row?.fiatDisplay ?? '';
});

const requestedBchDisplay = computed(() => {
  if (props.cashOutRecord) {
    return formatBchSats(props.cashOutRecord.marketBchSats);
  }

  if (props.topupRecord) {
    return formatBchSats(props.topupRecord.finalBchSats);
  }

  return props.row?.bchDisplay ?? '';
});

const feeMinor = computed(() => {
  if (props.cashOutRecord) {
    return props.cashOutRecord.fee.totalServiceFeeAmountMinor;
  }

  if (props.topupRecord) {
    const feeModel = props.topupRecord.feeModel as
      | {
          serviceFeeAmountMinor?: number;
          totalServiceFeeAmountMinor?: number;
        }
      | undefined;

    return (
      feeModel?.serviceFeeAmountMinor ??
      feeModel?.totalServiceFeeAmountMinor ??
      props.topupRecord.fee.amountMinor
    );
  }

  return 0;
});

const feeCurrency = computed(() => {
  return (
    props.cashOutRecord?.fiatCurrency ??
    props.topupRecord?.fiatCurrency ??
    props.row?.fiatCurrency ??
    'GBP'
  );
});

const feeDisplay = computed(() => formatFiatMinorAmount(feeMinor.value, feeCurrency.value));

const feeCaption = computed(() => {
  if (props.cashOutRecord) {
    return t('historyPage.detail.amounts.cashOutFeeCaption');
  }

  return t('historyPage.detail.amounts.topupFeeCaption');
});

const receivedAmountDisplay = computed(() => {
  if (props.cashOutRecord) {
    return formatFiatMinorAmount(
      props.cashOutRecord.fiatAmountMinor,
      props.cashOutRecord.fiatCurrency
    );
  }

  if (props.topupRecord) {
    return formatFiatMinorAmount(
      props.topupRecord.fiatAmountMinor,
      props.topupRecord.fiatCurrency
    );
  }

  return props.row?.fiatDisplay ?? '';
});

const receivedBchDisplay = computed(() => {
  if (props.cashOutRecord) {
    return formatBchSats(
      props.cashOutRecord.bchSatsReceived ?? props.cashOutRecord.bchSatsRequired
    );
  }

  if (props.topupRecord) {
    return formatBchSats(props.topupRecord.finalBchSats);
  }

  return props.row?.bchDisplay ?? '';
});

const formattedDate = computed(() => {
  const createdAt = props.row?.createdAt;

  if (!createdAt) {
    return t('historyPage.detail.labels.notAvailable');
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(createdAt));
});

const deliveryMethodDisplay = computed(() => {
  const method = props.topupRecord?.delivery?.method;

  if (!method) {
    return '';
  }

  if (method === 'printed') {
    return t('historyPage.detail.delivery.printed');
  }

  return t('historyPage.detail.delivery.digital');
});

const deliveryStatusDisplay = computed(() => {
  const status = props.topupRecord?.delivery?.status;

  if (!status) {
    return '';
  }

  if (status === 'selected') {
    return t('historyPage.detail.delivery.selected');
  }

  if (status === 'delivery_started') {
    return t('historyPage.detail.delivery.deliveryStarted');
  }

  if (status === 'delivered') {
    return t('historyPage.detail.delivery.delivered');
  }

  if (status === 'uncertain') {
    return t('historyPage.detail.delivery.uncertain');
  }

  return status;
});

const addressLabel = computed(() => {
  return props.row?.type === 'cashout'
    ? t('historyPage.detail.labels.treasuryReceivingAddress')
    : t('historyPage.detail.labels.uniqueVoucherAddress');
});

const addressDisplay = computed(() => {
  return (
    props.cashOutRecord?.treasuryReceivingAddress ||
    props.topupRecord?.address ||
    t('historyPage.detail.labels.notAvailable')
  );
});

const transactionId = computed(() => {
  if (props.cashOutRecord) {
    return (
      props.cashOutRecord.receivedTxid ||
      props.cashOutRecord.paymentDetection?.txid ||
      ''
    );
  }

  if (props.topupRecord) {
    return (
      props.topupRecord.fundingTxid ||
      props.topupRecord.fundingBroadcast?.txid ||
      props.topupRecord.fundingBroadcast?.serverTxid ||
      props.topupRecord.fundingIntent?.txid ||
      ''
    );
  }

  return '';
});

const blockchairTransactionUrl = computed(() => {
  if (!transactionId.value) {
    return '';
  }

  return `https://blockchair.com/bitcoin-cash/transaction/${transactionId.value}`;
});

const quoteSourceDisplay = computed(() => {
  const source = props.cashOutRecord?.quote.source ?? props.topupRecord?.quote.source;

  if (!source) {
    return t('historyPage.detail.labels.notAvailable');
  }

  if (source === 'coingecko') {
    return 'CoinGecko';
  }

  if (source === 'general_protocols_oracle') {
    return 'General Protocols Oracle';
  }

  if (source === 'fake_phase_2_quote') {
    return t('historyPage.detail.quoteSources.developmentQuote');
  }

  if (source === 'cached') {
    return t('historyPage.detail.quoteSources.cached');
  }

  if (source === 'manual') {
    return t('historyPage.detail.quoteSources.manual');
  }

  return t('historyPage.detail.quoteSources.unknown');
});

const marketRateDisplay = computed(() => {
  const quote = props.cashOutRecord?.quote ?? props.topupRecord?.quote;

  if (!quote?.marketRate) {
    return t('historyPage.detail.labels.notAvailable');
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: quote.fiatCurrency,
    maximumFractionDigits: 2,
  }).format(quote.marketRate);
});

const quoteTimeDisplay = computed(() => {
  const quoteTime =
    props.cashOutRecord?.quote.marketRateTimestamp ??
    props.topupRecord?.quote.marketRateTimestamp;

  if (!quoteTime) {
    return t('historyPage.detail.labels.notAvailable');
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(quoteTime));
});

function formatFiatMinorAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}
</script>

<style lang="scss" scoped>
.transaction-detail-card {
  background: #ffffff;
  border-radius: 26px !important;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  clip-path: inset(0 round 26px);
  max-height: calc(100dvh - 32px);
  max-width: 760px;
  overflow: hidden;
  width: calc(100vw - 32px);
}

.transaction-detail-header {
  align-items: flex-start;
  background: linear-gradient(135deg, #eaffed 0%, #ffffff 100%);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
}

.transaction-detail-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  min-width: 0;
}

.transaction-detail-icon {
  align-items: center;
  border-radius: 16px;
  display: flex;
  flex: 0 0 48px;
  font-size: 27px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.transaction-detail-icon--topup {
  background: #00ce1b;
  color: #000000;
}

.transaction-detail-icon--cashout {
  background: #111111;
  color: #00ce1b;
}

.transaction-detail-heading-copy {
  min-width: 0;
}

.transaction-detail-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 7px;
}

.transaction-detail-title {
  color: #111111;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.25px;
  line-height: 1.1;
}

.transaction-detail-subtitle {
  color: #555555;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.transaction-detail-body {
  display: grid;
  gap: 14px;
  max-height: calc(100dvh - 138px);
  overflow-y: auto;
  padding: 18px 20px 20px;
}

.detail-amount-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-amount-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 16px;
}

.detail-amount-tile--primary {
  background: #ffffff;
  border-color: rgba(0, 206, 27, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.1);
}

.detail-amount-tile--dark {
  background: #111111;
  border-color: #111111;
}

.detail-amount-label {
  color: #666666;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.15;
  text-transform: uppercase;
}

.detail-amount-value {
  color: #111111;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.35px;
  line-height: 1.05;
}

.detail-amount-note,
.detail-bch-line {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.2;
}

.detail-bch-line {
  align-items: center;
  display: inline-flex;
  gap: 5px;
  white-space: nowrap;
}

.detail-bch-line--dark,
.detail-amount-tile--dark .detail-amount-label,
.detail-amount-tile--dark .detail-amount-note {
  color: rgba(255, 255, 255, 0.72);
}

.detail-amount-tile--dark .detail-amount-value {
  color: #00ce1b;
}

.detail-bch-logo {
  border-radius: 999px;
  display: block;
  height: 14px;
  width: 14px;
}

.detail-info-card {
  background: #f7f8f7;
  border-color: #dddddd;
  border-radius: 20px;
  overflow: hidden;
}

.detail-info-card :deep(.q-card__section) {
  padding: 16px;
}

.detail-info-title {
  color: #111111;
  font-size: 15px;
  font-weight: 950;
  margin-bottom: 12px;
}

.detail-info-list {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  overflow: hidden;
  padding: 2px 14px;
}

.detail-info-line {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 12px 0;
}

.detail-info-line + .detail-info-line {
  border-top: 1px solid #eeeeee;
}

.detail-info-line span {
  color: #666666;
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.2;
}

.detail-info-line strong,
.detail-link-value {
  color: #111111;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: right;
}

.detail-info-line--stacked {
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
}

.detail-info-line--stacked strong,
.detail-info-line--stacked .detail-link-value {
  text-align: left;
  width: 100%;
}

.detail-link-value {
  align-items: center;
  display: inline-flex;
  gap: 6px;
  text-decoration: none;
}

.detail-link-value:hover {
  color: #0c5f17;
  text-decoration: underline;
}

.transaction-type-pill,
.transaction-status-pill {
  border-radius: 999px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  padding: 5px 8px;
  white-space: nowrap;
}

.transaction-type-pill--topup {
  background: #00ce1b;
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #000000;
}

.transaction-type-pill--cashout {
  background: #111111;
  border: 1px solid #111111;
  color: #00ce1b;
}

.transaction-status-pill--redeemed,
.transaction-status-pill--completed,
.transaction-status-pill--received {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  color: #0c5f17;
}

.transaction-status-pill--not-redeemed,
.transaction-status-pill--awaiting-payment,
.transaction-status-pill--neutral {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  color: #555555;
}

.transaction-status-pill--cancelled {
  background: #fff8eb;
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #8a4b00;
}

.transaction-status-pill--failed,
.transaction-status-pill--error {
  background: #fff0f0;
  border: 1px solid rgba(217, 48, 37, 0.25);
  color: #9f1c14;
}

@media (max-width: 760px) {
  .detail-amount-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .transaction-detail-card {
    border-radius: 24px !important;
    clip-path: inset(0 round 24px);
    max-height: calc(100dvh - 24px);
    width: calc(100vw - 20px);
  }

  .transaction-detail-header {
    padding: 14px 16px 13px;
  }

  .transaction-detail-heading {
    gap: 11px;
  }

  .transaction-detail-icon {
    border-radius: 14px;
    flex-basis: 42px;
    font-size: 23px;
    height: 42px;
    width: 42px;
  }

  .transaction-detail-title {
    font-size: 20px;
  }

  .transaction-detail-body {
    gap: 12px;
    max-height: calc(100dvh - 112px);
    padding: 12px 16px 14px;
  }

  .detail-amount-tile {
    border-radius: 18px;
    padding: 14px;
  }

  .detail-amount-value {
    font-size: 21px;
  }

  .detail-info-list {
    padding: 1px 12px;
  }

  .detail-info-line {
    gap: 10px;
    padding: 10px 0;
  }

  .detail-info-line:not(.detail-info-line--stacked) {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .detail-info-line strong,
  .detail-link-value {
    text-align: left;
  }
}
</style>
