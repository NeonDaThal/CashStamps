<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="handleDialogModelUpdate"
  >
    <q-card class="cash-on-hand-transactions-card">
      <q-card-section class="transactions-header">
        <div class="transactions-header-main">
          <div class="transactions-header-icon">
            <q-icon name="receipt_long" />
          </div>

          <div>
            <div class="transactions-title">
              {{ t('treasuryPage.cashOnHand.transactions.title') }}
            </div>
            <p class="transactions-subtitle">
              {{ t('treasuryPage.cashOnHand.transactions.subtitle') }}
            </p>
          </div>
        </div>

        <q-btn
          flat
          dense
          round
          icon="close"
          class="transactions-close-button"
          :aria-label="t('common.close')"
          @click="emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="transactions-body">
        <template v-if="selectedTransaction">
          <div class="transactions-detail-top">
            <q-btn
              flat
              dense
              icon="arrow_back"
              class="transactions-back-button"
              :label="t('common.back')"
              no-caps
              @click="selectedMovementId = ''"
            />

            <span
              :class="[
                'transaction-type-pill',
                `transaction-type-pill--${selectedTransaction.typeStyle}`,
              ]"
            >
              {{ selectedTransaction.typeLabel }}
            </span>
          </div>

          <div class="transaction-detail-hero">
            <div>
              <div class="transaction-detail-label">
                {{ t('treasuryPage.cashOnHand.transactions.cashAmount') }}
              </div>
              <div
                :class="[
                  'transaction-detail-amount',
                  selectedTransaction.amountToneClass,
                ]"
              >
                {{ selectedTransaction.amountDisplay }}
              </div>
            </div>

            <div v-if="selectedTransaction.bchDisplay" class="transaction-bch">
              <img :src="bchLogoUrl" alt="" class="transaction-bch-logo" />
              {{ selectedTransaction.bchDisplay }}
            </div>
          </div>

          <div class="transaction-detail-grid">
            <div class="transaction-detail-row">
              <span>{{ t('treasuryPage.cashOnHand.transactions.type') }}</span>
              <strong>{{ selectedTransaction.typeLabel }}</strong>
            </div>

            <div class="transaction-detail-row">
              <span>{{ t('treasuryPage.cashOnHand.transactions.date') }}</span>
              <strong>{{ selectedTransaction.fullDateDisplay }}</strong>
            </div>

            <div class="transaction-detail-row">
              <span>
                {{ t('treasuryPage.cashOnHand.transactions.balanceAfter') }}
              </span>
              <strong>{{ selectedTransaction.balanceAfterDisplay }}</strong>
            </div>

            <div
              v-if="selectedTransaction.relatedSerial"
              class="transaction-detail-row"
            >
              <span>
                {{ t('treasuryPage.cashOnHand.transactions.reference') }}
              </span>
              <strong>{{ selectedTransaction.relatedSerial }}</strong>
            </div>

            <div
              v-if="selectedTransaction.relatedAddress"
              class="transaction-detail-row"
            >
              <span>
                {{ t('treasuryPage.cashOnHand.transactions.bchAddress') }}
              </span>
              <strong class="transaction-detail-address">
                {{ selectedTransaction.relatedAddress }}
              </strong>
            </div>

            <div
              v-if="selectedTransaction.blockchairUrl"
              class="transaction-detail-row"
            >
              <span>
                {{ t('treasuryPage.cashOnHand.transactions.bchTransaction') }}
              </span>

              <a
                :href="selectedTransaction.blockchairUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="transaction-detail-link"
              >
                {{ selectedTransaction.shortTxid }}
              </a>
            </div>

            <div v-if="selectedTransaction.note" class="transaction-detail-row">
              <span>{{ t('treasuryPage.cashOnHand.transactions.note') }}</span>
              <strong>{{ selectedTransaction.note }}</strong>
            </div>

            <div
              v-if="selectedTransaction.relatedMissing"
              class="transaction-detail-row"
            >
              <span>{{
                t('treasuryPage.cashOnHand.transactions.reference')
              }}</span>
              <strong>
                {{ t('treasuryPage.cashOnHand.transactions.noRelatedRecord') }}
              </strong>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-if="isLoading" class="transactions-loading">
            <q-spinner color="green" size="36px" />
          </div>

          <div
            v-else-if="transactionRows.length === 0"
            class="transactions-empty"
          >
            <div class="transactions-empty-icon">
              <q-icon name="receipt_long" />
            </div>
            <div class="transactions-empty-title">
              {{ t('treasuryPage.cashOnHand.transactions.emptyTitle') }}
            </div>
            <p>{{ t('treasuryPage.cashOnHand.transactions.emptySubtitle') }}</p>
          </div>

          <template v-else>
            <div class="transactions-list-meta">
              <span v-if="!isOlderPageMode">
                {{
                  t('treasuryPage.cashOnHand.transactions.showing', {
                    count: visibleLatestRows.length,
                    total: transactionRows.length,
                  })
                }}
              </span>

              <span v-else>
                {{
                  t('treasuryPage.cashOnHand.transactions.olderPage', {
                    page: olderPage,
                  })
                }}
              </span>
            </div>

            <div class="transactions-list">
              <button
                v-for="row in displayedRows"
                :key="row.id"
                type="button"
                class="transaction-row"
                @click="selectedMovementId = row.id"
              >
                <div class="transaction-row-main">
                  <span
                    :class="[
                      'transaction-type-pill',
                      `transaction-type-pill--${row.typeStyle}`,
                    ]"
                  >
                    {{ row.typeLabel }}
                  </span>

                  <span class="transaction-date">
                    {{ row.dateDisplay }}
                  </span>
                </div>

                <div class="transaction-row-values">
                  <strong :class="['transaction-amount', row.amountToneClass]">
                    {{ row.amountDisplay }}
                  </strong>

                  <span v-if="row.bchDisplay" class="transaction-bch">
                    <img
                      :src="bchLogoUrl"
                      alt=""
                      class="transaction-bch-logo"
                    />
                    {{ row.bchDisplay }}
                  </span>
                </div>
              </button>
            </div>

            <div class="transactions-pagination-actions">
              <q-btn
                v-if="canShowMoreLatest"
                flat
                dense
                class="transactions-soft-button"
                icon="expand_more"
                :label="t('treasuryPage.cashOnHand.transactions.showMore')"
                no-caps
                @click="showMoreLatestTransactions"
              />

              <q-btn
                v-if="canEnterOlderPageMode && !isOlderPageMode"
                flat
                dense
                class="transactions-soft-button"
                icon="history"
                :label="t('treasuryPage.cashOnHand.transactions.viewOlder')"
                no-caps
                @click="openOlderPageMode"
              />

              <q-btn
                v-if="isOlderPageMode"
                flat
                dense
                class="transactions-soft-button"
                icon="arrow_back"
                :label="t('treasuryPage.cashOnHand.transactions.backToLatest')"
                no-caps
                @click="closeOlderPageMode"
              />
            </div>

            <div
              v-if="isOlderPageMode && olderPageCount > 1"
              class="transactions-page-wrap"
            >
              <q-pagination
                v-model="olderPage"
                :max="olderPageCount"
                :max-pages="5"
                boundary-numbers
                direction-links
                flat
                color="green"
              />
            </div>
          </template>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  CashOnHandMovement,
  CashOnHandMovementType,
  CashOnHandState,
} from 'src/types/cash-on-hand';
import type { CashOutRecord } from 'src/types/cash-out';
import type { VoucherRecord } from 'src/types/voucher';
import { getCashOutRecords } from 'src/services/cash-out-store';
import { getVoucherRecords } from 'src/services/voucher-store';
import { formatBchSats } from 'src/services/voucher-pricing';

const LATEST_INCREMENT = 10;
const LATEST_MAX_ROWS = 50;
const OLDER_PAGE_SIZE = 10;

type TransactionTypeStyle =
  | 'setup'
  | 'topup'
  | 'cashout'
  | 'cash-added'
  | 'withdrawal'
  | 'cleared';

interface CashOnHandTransactionRow {
  id: string;
  movement: CashOnHandMovement;
  typeLabel: string;
  typeStyle: TransactionTypeStyle;
  amountDisplay: string;
  amountToneClass: string;
  balanceAfterDisplay: string;
  dateDisplay: string;
  fullDateDisplay: string;
  bchDisplay: string;
  relatedSerial: string;
  relatedAddress: string;
  txid: string;
  shortTxid: string;
  blockchairUrl: string;
  note: string;
  relatedMissing: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  cashOnHandState: CashOnHandState;
  bchLogoUrl: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n({ useScope: 'global' });

const isLoading = ref(false);
const voucherRecords = ref<VoucherRecord[]>([]);
const cashOutRecords = ref<CashOutRecord[]>([]);
const latestVisibleLimit = ref(LATEST_INCREMENT);
const isOlderPageMode = ref(false);
const olderPage = ref(1);
const selectedMovementId = ref('');

const voucherRecordById = computed(() => {
  return new Map(voucherRecords.value.map((record) => [record.id, record]));
});

const cashOutRecordById = computed(() => {
  return new Map(cashOutRecords.value.map((record) => [record.id, record]));
});

const transactionRows = computed(() => {
  return [...props.cashOnHandState.movements]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((movement) => createTransactionRow(movement));
});

const visibleLatestRows = computed(() =>
  transactionRows.value.slice(0, latestVisibleLimit.value)
);

const olderRows = computed(() => transactionRows.value.slice(LATEST_MAX_ROWS));

const olderPageCount = computed(() =>
  Math.max(1, Math.ceil(olderRows.value.length / OLDER_PAGE_SIZE))
);

const visibleOlderRows = computed(() => {
  const startIndex = (olderPage.value - 1) * OLDER_PAGE_SIZE;
  return olderRows.value.slice(startIndex, startIndex + OLDER_PAGE_SIZE);
});

const displayedRows = computed(() =>
  isOlderPageMode.value ? visibleOlderRows.value : visibleLatestRows.value
);

const canShowMoreLatest = computed(
  () =>
    !isOlderPageMode.value &&
    latestVisibleLimit.value <
      Math.min(transactionRows.value.length, LATEST_MAX_ROWS)
);

const canEnterOlderPageMode = computed(
  () =>
    transactionRows.value.length > LATEST_MAX_ROWS &&
    latestVisibleLimit.value >= LATEST_MAX_ROWS
);

const selectedTransaction = computed(() => {
  if (!selectedMovementId.value) {
    return null;
  }

  return (
    transactionRows.value.find((row) => row.id === selectedMovementId.value) ??
    null
  );
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      void loadRelatedRecords();
      resetListState();
    } else {
      selectedMovementId.value = '';
    }
  }
);

async function loadRelatedRecords(): Promise<void> {
  isLoading.value = true;

  try {
    const [vouchers, cashOuts] = await Promise.all([
      getVoucherRecords(),
      getCashOutRecords(),
    ]);

    voucherRecords.value = vouchers;
    cashOutRecords.value = cashOuts;
  } catch (error) {
    console.error(error);
    voucherRecords.value = [];
    cashOutRecords.value = [];
  } finally {
    isLoading.value = false;
  }
}

function resetListState(): void {
  latestVisibleLimit.value = LATEST_INCREMENT;
  isOlderPageMode.value = false;
  olderPage.value = 1;
  selectedMovementId.value = '';
}

function handleDialogModelUpdate(value: boolean): void {
  emit('update:modelValue', value);
}

function showMoreLatestTransactions(): void {
  latestVisibleLimit.value = Math.min(
    latestVisibleLimit.value + LATEST_INCREMENT,
    Math.min(transactionRows.value.length, LATEST_MAX_ROWS)
  );
}

function openOlderPageMode(): void {
  isOlderPageMode.value = true;
  olderPage.value = 1;
}

function closeOlderPageMode(): void {
  isOlderPageMode.value = false;
  olderPage.value = 1;
}

function createTransactionRow(
  movement: CashOnHandMovement
): CashOnHandTransactionRow {
  const voucher =
    movement.relatedRecordType === 'voucher' && movement.relatedRecordId
      ? voucherRecordById.value.get(movement.relatedRecordId)
      : undefined;

  const cashOut =
    movement.relatedRecordType === 'cash_out' && movement.relatedRecordId
      ? cashOutRecordById.value.get(movement.relatedRecordId)
      : undefined;

  const txid = getTransactionId(movement, voucher, cashOut);
  const relatedAddress = getRelatedAddress(movement, voucher, cashOut);
  const bchSats = getBchSats(movement, voucher, cashOut);
  const relatedSerial = voucher?.serial ?? cashOut?.serial ?? '';

  return {
    id: movement.id,
    movement,
    typeLabel: getMovementTypeLabel(movement.type),
    typeStyle: getMovementTypeStyle(movement.type),
    amountDisplay: getMovementAmountDisplay(movement),
    amountToneClass: getMovementAmountToneClass(movement.type),
    balanceAfterDisplay: formatFiatMinorAmount(
      movement.balanceAfterMinor,
      movement.currency
    ),
    dateDisplay: formatShortDateTime(movement.createdAt),
    fullDateDisplay: formatFullDateTime(movement.createdAt),
    bchDisplay: bchSats !== null ? formatBchSats(bchSats) : '',
    relatedSerial,
    relatedAddress,
    txid,
    shortTxid: shortenText(txid, 14, 8),
    blockchairUrl: txid
      ? `https://blockchair.com/bitcoin-cash/transaction/${txid}`
      : '',
    note: movement.note ?? '',
    relatedMissing: Boolean(movement.relatedRecordId) && !voucher && !cashOut,
  };
}

function getMovementTypeLabel(type: CashOnHandMovementType): string {
  const labels: Record<CashOnHandMovementType, string> = {
    setup: t('treasuryPage.cashOnHand.transactions.types.setup'),
    manual_add: t('treasuryPage.cashOnHand.transactions.types.cashAdded'),
    manual_withdraw: t('treasuryPage.cashOnHand.transactions.types.withdrawal'),
    topup_sale: t('treasuryPage.cashOnHand.transactions.types.topup'),
    cash_out_paid: t('treasuryPage.cashOnHand.transactions.types.cashOut'),
    clear: t('treasuryPage.cashOnHand.transactions.types.cleared'),
  };

  return labels[type];
}

function getMovementTypeStyle(
  type: CashOnHandMovementType
): TransactionTypeStyle {
  const styles: Record<CashOnHandMovementType, TransactionTypeStyle> = {
    setup: 'setup',
    manual_add: 'cash-added',
    manual_withdraw: 'withdrawal',
    topup_sale: 'topup',
    cash_out_paid: 'cashout',
    clear: 'cleared',
  };

  return styles[type];
}

function getMovementAmountDisplay(movement: CashOnHandMovement): string {
  if (movement.type === 'clear') {
    return t('treasuryPage.cashOnHand.transactions.amount.reset', {
      amount: formatFiatMinorAmount(0, movement.currency),
    });
  }

  const sign = getMovementAmountSign(movement.type);
  const formattedAmount = formatFiatMinorAmount(
    movement.amountMinor,
    movement.currency
  );

  if (sign > 0) {
    return `+${formattedAmount}`;
  }

  if (sign < 0) {
    return `-${formattedAmount}`;
  }

  return formattedAmount;
}

function getMovementAmountSign(type: CashOnHandMovementType): number {
  if (type === 'setup' || type === 'manual_add' || type === 'topup_sale') {
    return 1;
  }

  if (type === 'manual_withdraw' || type === 'cash_out_paid') {
    return -1;
  }

  return 0;
}

function getMovementAmountToneClass(type: CashOnHandMovementType): string {
  const sign = getMovementAmountSign(type);

  if (sign > 0) {
    return 'transaction-amount--positive';
  }

  if (sign < 0) {
    return 'transaction-amount--negative';
  }

  return 'transaction-amount--neutral';
}

function getBchSats(
  movement: CashOnHandMovement,
  voucher?: VoucherRecord,
  cashOut?: CashOutRecord
): number | null {
  if (movement.type === 'topup_sale' && voucher) {
    return voucher.finalBchSats;
  }

  if (movement.type === 'cash_out_paid' && cashOut) {
    return cashOut.bchSatsReceived ?? cashOut.bchSatsRequired;
  }

  return null;
}

function getTransactionId(
  movement: CashOnHandMovement,
  voucher?: VoucherRecord,
  cashOut?: CashOutRecord
): string {
  if (movement.type === 'topup_sale' && voucher) {
    return voucher.fundingBroadcast?.txid ?? voucher.fundingTxid ?? '';
  }

  if (movement.type === 'cash_out_paid' && cashOut) {
    return cashOut.receivedTxid ?? '';
  }

  return '';
}

function getRelatedAddress(
  movement: CashOnHandMovement,
  voucher?: VoucherRecord,
  cashOut?: CashOutRecord
): string {
  if (movement.type === 'topup_sale' && voucher) {
    return voucher.address;
  }

  if (movement.type === 'cash_out_paid' && cashOut) {
    return cashOut.treasuryReceivingAddress;
  }

  return '';
}

function formatFiatMinorAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatShortDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFullDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function shortenText(
  value: string,
  startLength: number,
  endLength: number
): string {
  if (!value) {
    return '';
  }

  if (value.length <= startLength + endLength + 1) {
    return value;
  }

  return `${value.slice(0, startLength)}…${value.slice(-endLength)}`;
}
</script>

<style lang="scss" scoped>
.cash-on-hand-transactions-card {
  border-radius: 24px;
  max-width: 95vw;
  width: 720px;
}

.transactions-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 22px;
}

.transactions-header-main {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  min-width: 0;
}

.transactions-header-icon {
  align-items: center;
  background: #111111;
  border-radius: 16px;
  color: #00ce1b;
  display: flex;
  flex: 0 0 48px;
  font-size: 28px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.transactions-title {
  color: #111111;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -0.4px;
  line-height: 1.1;
}

.transactions-subtitle {
  color: #666666;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  margin: 6px 0 0;
}

.transactions-close-button {
  background: #f0f0f0;
  color: #111111;
  flex: 0 0 auto;
}

.transactions-body {
  padding: 18px;
}

.transactions-loading {
  display: flex;
  justify-content: center;
  padding: 28px;
}

.transactions-empty {
  align-items: center;
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 22px;
  display: grid;
  justify-items: center;
  padding: 28px 18px;
  text-align: center;
}

.transactions-empty-icon {
  align-items: center;
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  border-radius: 999px;
  color: #0c5f17;
  display: flex;
  font-size: 34px;
  height: 62px;
  justify-content: center;
  margin-bottom: 12px;
  width: 62px;
}

.transactions-empty-title {
  color: #111111;
  font-size: 18px;
  font-weight: 950;
}

.transactions-empty p {
  color: #666666;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  margin: 5px 0 0;
}

.transactions-list-meta {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.transactions-list {
  display: grid;
  gap: 10px;
}

.transaction-row {
  align-items: center;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 18px;
  cursor: pointer;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 13px 14px;
  text-align: left;
  transition: border-color 160ms ease, box-shadow 160ms ease,
    transform 160ms ease;
  width: 100%;
}

.transaction-row:hover {
  border-color: rgba(0, 206, 27, 0.45);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.transaction-row-main {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.transaction-date {
  color: #666666;
  font-size: 12px;
  font-weight: 750;
}

.transaction-row-values {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.transaction-amount,
.transaction-detail-amount {
  color: #111111;
  font-weight: 950;
}

.transaction-amount {
  font-size: 15px;
  line-height: 1.15;
}

.transaction-detail-amount {
  font-size: 30px;
  letter-spacing: -0.6px;
  line-height: 1.05;
  margin-top: 4px;
}

.transaction-amount--positive {
  color: #0c5f17;
}

.transaction-amount--negative {
  color: #b00020;
}

.transaction-amount--neutral {
  color: #111111;
}

.transaction-bch {
  align-items: center;
  color: #666666;
  display: inline-flex;
  font-size: 11px;
  font-weight: 850;
  gap: 5px;
  line-height: 1.2;
  white-space: nowrap;
}

.transaction-bch-logo {
  border-radius: 999px;
  display: block;
  height: 14px;
  width: 14px;
}

.transaction-type-pill {
  border-radius: 999px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  padding: 5px 8px;
  white-space: nowrap;
}

.transaction-type-pill--setup {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  color: #0c5f17;
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

.transaction-type-pill--cash-added {
  background: #e8f5ff;
  border: 1px solid rgba(25, 118, 210, 0.25);
  color: #0d47a1;
}

.transaction-type-pill--withdrawal {
  background: #fff8eb;
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #8a4b00;
}

.transaction-type-pill--cleared {
  background: #fff0f0;
  border: 1px solid rgba(217, 48, 37, 0.25);
  color: #9f1c14;
}

.transactions-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
}

.transactions-soft-button {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 999px;
  color: #111111;
  font-size: 12px;
  font-weight: 850;
  min-height: 34px;
  padding: 0 12px;
}

.transactions-soft-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.transactions-page-wrap {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.transactions-detail-top {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.transactions-back-button {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 999px;
  color: #111111;
  font-size: 12px;
  font-weight: 850;
  min-height: 34px;
  padding: 0 12px;
}

.transaction-detail-hero {
  align-items: center;
  background: linear-gradient(135deg, #eaffed 0%, #ffffff 100%);
  border: 1px solid rgba(0, 206, 27, 0.32);
  border-radius: 22px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 16px;
}

.transaction-detail-label {
  color: rgba(17, 17, 17, 0.62);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.transaction-detail-grid {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  margin-top: 14px;
  padding: 2px 14px;
}

.transaction-detail-row {
  align-items: flex-start;
  display: grid;
  gap: 14px;
  grid-template-columns: max-content minmax(0, 1fr);
  padding: 12px 0;
}

.transaction-detail-row + .transaction-detail-row {
  border-top: 1px solid #e8e8e8;
}

.transaction-detail-row span {
  color: #666666;
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
}

.transaction-detail-row strong,
.transaction-detail-link {
  color: #111111;
  font-size: 13px;
  font-weight: 850;
  min-width: 0;
  text-align: right;
  word-break: break-word;
}

.transaction-detail-link {
  color: #0c5f17;
  text-decoration: none;
}

.transaction-detail-link:hover {
  text-decoration: underline;
}

.transaction-detail-address {
  direction: ltr;
}

@media (max-width: 640px) {
  .transactions-header {
    padding: 18px;
  }

  .transactions-body {
    padding: 14px;
  }

  .transactions-title {
    font-size: 22px;
  }

  .transaction-row {
    align-items: center;
    grid-template-columns: minmax(0, 1fr) max-content;
  }

  .transaction-row-main {
    min-width: 0;
  }

  .transaction-row-values {
    align-items: flex-end;
    min-width: max-content;
    text-align: right;
  }

  .transaction-amount {
    white-space: nowrap;
  }

  .transaction-bch {
    white-space: nowrap;
  }

  .transaction-detail-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .transaction-detail-row {
    gap: 5px;
    grid-template-columns: 1fr;
  }

  .transaction-detail-row strong,
  .transaction-detail-link {
    text-align: left;
  }
}
</style>
