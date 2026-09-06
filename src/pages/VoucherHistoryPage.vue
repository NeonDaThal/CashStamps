<template>
  <q-page padding class="history-page">
    <div class="history-container">
      <section class="history-hero">
        <div>
          <p class="eyebrow">
            {{ t('historyPage.hero.eyebrow') }}
          </p>

          <h1>
            {{ t('historyPage.hero.title') }}
          </h1>

          <p class="intro">
            {{ t('historyPage.hero.intro') }}
          </p>
        </div>

        <q-btn
          class="primary-button"
          :label="t('historyPage.actions.sellVoucher')"
          :icon="topupIcon"
          to="/sell-voucher"
          unelevated
          no-caps
        />
      </section>

      <section class="summary-grid">
        <q-card flat bordered class="summary-card summary-card--total">
          <q-card-section>
            <div class="summary-icon">
              <q-icon name="receipt_long" />
            </div>

            <div>
              <div class="summary-label">
                {{ t('historyPage.summary.totalTransactions') }}
              </div>

              <div class="summary-value">
                {{ filteredTransactionRows.length }}
              </div>

              <div class="summary-caption">
                {{ selectedDateDisplay }}
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.totalTopups') }}
            </div>

            <div class="summary-value">
              {{ selectedDateTopupCount }}
            </div>

            <div class="summary-caption summary-caption--green">
              {{
                t('historyPage.summary.redeemedCount', {
                  count: selectedDateRedeemedTopupCount,
                })
              }}
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.totalCashOuts') }}
            </div>

            <div class="summary-value">
              {{ selectedDateCashOutCount }}
            </div>

            <div class="summary-caption">
              {{ t('historyPage.summary.cashOutRecords') }}
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card summary-card--value">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.totalTopupValue') }}
            </div>

            <div class="summary-value summary-value--amount">
              {{ selectedDateTopupFiatDisplay }}
            </div>

            <div class="summary-bch-line">
              <img :src="bchLogoUrl" alt="" class="summary-bch-logo" />
              {{ selectedDateTopupBchDisplay }}
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card summary-card--value">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.totalCashOutValue') }}
            </div>

            <div class="summary-value summary-value--amount">
              {{ selectedDateCashOutFiatDisplay }}
            </div>

            <div class="summary-bch-line">
              <img :src="bchLogoUrl" alt="" class="summary-bch-logo" />
              {{ selectedDateCashOutBchDisplay }}
            </div>
          </q-card-section>
        </q-card>
      </section>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9" rounded>
        {{ successMessage }}
      </q-banner>

      <q-banner
        v-if="warningMessage"
        class="bg-orange-1 text-orange-10"
        rounded
      >
        {{ warningMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-card flat bordered class="main-card transactions-card">
        <q-card-section>
          <div class="transactions-card-header">
            <div class="section-heading">
              <div class="section-icon section-icon--dark">
                <q-icon name="receipt_long" />
              </div>

              <div>
                <div class="text-h6">
                  {{ t('historyPage.records.title') }}
                </div>

                <p class="text-grey-7 q-mb-none">
                  {{ t('historyPage.records.subtitle') }}
                </p>
              </div>
            </div>

            <div class="date-filter-card">
              <div class="date-filter-label">
                {{ t('historyPage.filters.date') }}
              </div>

              <div class="date-filter-controls">
                <q-input
                  :model-value="selectedDateDisplay"
                  dense
                  outlined
                  readonly
                  hide-bottom-space
                  class="date-filter-input"
                  :aria-label="t('historyPage.filters.date')"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-date
                          v-model="selectedDatePickerValue"
                          mask="YYYY-MM-DD"
                          today-btn
                        >
                          <div class="row items-center justify-end q-pa-sm">
                            <q-btn
                              v-close-popup
                              flat
                              :label="t('common.close')"
                              no-caps
                            />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>

                <q-btn
                  flat
                  dense
                  class="date-filter-today-button"
                  icon="today"
                  :label="t('historyPage.filters.today')"
                  no-caps
                  :disable="isSelectedDateToday"
                  @click="selectedDate = todayDateKey"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <TransactionHistoryList
            :rows="filteredTransactionRows"
            @select="handleSelectTransaction"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card debug-card">
        <q-expansion-item
          icon="code"
          label="Development voucher tools"
          caption="Legacy Topup record tools kept here temporarily for testing"
        >
          <q-card-section>
            <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
              <template #avatar>
                <q-icon name="construction" />
              </template>

              These tools are still visible during this first Transactions page
              checkpoint so existing Topup testing, recovery, and delivery tools
              remain accessible. They will be moved into the transaction detail
              screen and gated for debug builds in a later checkpoint.
            </q-banner>

            <VoucherHistoryList
              :voucher-records="voucherRecords"
              :checking-redemption-voucher-id="checkingRedemptionVoucherId"
              :checking-funding-voucher-id="checkingFundingVoucherId"
              :reclaiming-voucher-id="reclaimingVoucherId"
              :issuing-replacement-voucher-id="issuingReplacementVoucherId"
              @mark-manual-redemption="handleMarkManualRedemption"
              @clear-manual-redemption="handleClearManualRedemption"
              @check-on-chain-redemption="handleCheckOnChainRedemption"
              @resume-funding="handleResumeFunding"
              @check-funding="handleCheckFunding"
              @delivery-updated="handleDeliveryUpdated"
              @reclaim-voucher="handleReclaimVoucher"
              @issue-replacement="handleIssueReplacement"
            />

            <q-separator class="q-my-md" />

            <div class="dev-actions">
              <q-btn
                class="secondary-button"
                label="Create Test Voucher"
                icon="add"
                outline
                no-caps
                @click="handleCreateTestVoucher"
              />

              <q-btn
                color="negative"
                outline
                label="Clear Test Records"
                icon="delete"
                :disable="voucherRecords.length === 0"
                no-caps
                @click="handleClearTestRecords"
              />

              <q-btn
                class="secondary-button"
                label="Preview Funding Recovery"
                icon="sync_problem"
                outline
                no-caps
                @click="isFundingRecoveryPreviewOpen = true"
              />
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        {{ t('historyPage.safetyNotice') }}
      </q-banner>
    </div>

    <TransactionDetailDialog
      v-model="isTransactionDetailOpen"
      :row="selectedTransactionRow"
      :topup-record="selectedTopupRecord"
      :cash-out-record="selectedCashOutRecord"
    />

    <!--
      DEV-ONLY PREVIEW.

      Deliberately outside history-container so its component hierarchy cannot
      accidentally interact with cards/banners on the History page.

      QDialog is teleported by Quasar anyway, but keeping it here also makes the
      template structure completely unambiguous.
    -->
    <IssueProgressDialog
      v-model="isFundingRecoveryPreviewOpen"
      :steps="fundingRecoveryPreviewSteps"
      :funding-recovery-available="true"
      :is-retrying-funding="isFundingRecoveryPreviewChecking"
      funding-recovery-message="The transaction has been saved safely. Check the same transaction again before continuing. No replacement transaction will be created."
      @retry-funding="handlePreviewFundingRetry"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import TransactionDetailDialog from 'src/components/TransactionDetailDialog.vue';
import TransactionHistoryList from 'src/components/TransactionHistoryList.vue';
import VoucherHistoryList from 'src/components/VoucherHistoryList.vue';
import IssueProgressDialog, {
  type IssueProgressStep,
} from 'src/components/IssueProgressDialog.vue';
import type { CashOutRecord, CashOutStatus } from 'src/types/cash-out';
import type {
  TransactionHistoryRow,
  TransactionHistoryStatusStyle,
} from 'src/types/transaction-history';
import type { VoucherRecord } from 'src/types/voucher';
import { getCashOutRecords } from 'src/services/cash-out-store';
import {
  addVoucherRecord,
  clearVoucherManualRedemption,
  clearVoucherRecords,
  getVoucherRecords,
  markVoucherManuallyRedeemed,
  updateVoucherRedemptionDetection,
} from 'src/services/voucher-store';

import { prepareAndStorePrintedReplacement } from 'src/services/printed-replacement-issue';

import { getFundingSafetyStatus } from 'src/services/funding-safety';
import { createDraftVoucherRecord } from 'src/services/voucher-factory';
import { detectVoucherRedemptionStatus } from 'src/services/voucher-redemption-detector';
import {
  advanceTopupFundingLifecycle,
  reconcileExistingTopupFunding,
} from 'src/services/topup-funding-lifecycle';
import {
  advanceVoucherReclaimLifecycle,
  reconcileExistingVoucherReclaim,
} from 'src/services/voucher-reclaim-lifecycle';
import { formatBchSats } from 'src/services/voucher-pricing';

import type { VoucherReclaimRecoveryAction } from 'src/services/voucher-reclaim-state';
import { topupIcon } from 'src/icons/custom-icons';

const { t } = useI18n({ useScope: 'global' });

const voucherRecords = ref<VoucherRecord[]>([]);
const cashOutRecords = ref<CashOutRecord[]>([]);
const errorMessage = ref('');
const successMessage = ref('');
const warningMessage = ref('');
const checkingRedemptionVoucherId = ref<string | null>(null);
const checkingFundingVoucherId = ref<string | null>(null);
const issuingReplacementVoucherId = ref<string | null>(null);
const reclaimingVoucherId = ref<string | null>(null);
const isFundingRecoveryPreviewOpen = ref(false);

const isFundingRecoveryPreviewChecking = ref(false);
const isTransactionDetailOpen = ref(false);
const selectedTransactionRow = ref<TransactionHistoryRow | null>(null);

const fundingRecoveryPreviewSteps: IssueProgressStep[] = [
  {
    key: 'quote',
    label: 'Confirm locked quote',
    description: 'Use the BCH/GBP quote locked before confirmation.',
    status: 'complete',
  },

  {
    key: 'wallet',
    label: 'Prepare voucher wallet',
    description: 'Use the voucher address prepared before confirmation.',
    status: 'complete',
  },

  {
    key: 'funding',
    label: 'Prepare funding transaction',
    description: 'Build and sign the exact BCH transaction for this Topup.',
    status: 'complete',
  },

  {
    key: 'store',
    label: 'Secure transaction record',
    description:
      'Save the signed transaction and deterministic transaction ID before any broadcast.',
    status: 'complete',
  },

  {
    key: 'broadcast',
    label: 'Submit funding transaction',
    description: 'Submit the exact saved transaction.',
    status: 'complete',
  },

  {
    key: 'confirmFunding',
    label: 'Verify network funding',
    description:
      'Confirm that the exact saved transaction is visible on the BCH network.',
    status: 'error',
  },
];

const todayDateKey = getDateInputValue(new Date());
const selectedDate = ref(todayDateKey);

const isSelectedDateToday = computed(() => selectedDate.value === todayDateKey);

const selectedDateDisplay = computed(() => {
  if (!selectedDate.value) {
    return t('historyPage.filters.noDateSelected');
  }

  return formatSelectedDate(selectedDate.value);
});

const selectedDatePickerValue = computed({
  get: () => selectedDate.value,
  set: (value: string) => {
    selectedDate.value = value;
  },
});

const transactionRows = computed<TransactionHistoryRow[]>(() => {
  const topupRows = voucherRecords.value.map((voucher) =>
    createTopupTransactionRow(voucher)
  );

  const cashOutRows = cashOutRecords.value.map((cashOut) =>
    createCashOutTransactionRow(cashOut)
  );

  return [...topupRows, ...cashOutRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const filteredTransactionRows = computed(() => {
  return transactionRows.value.filter(
    (row) => getDateInputValue(new Date(row.createdAt)) === selectedDate.value
  );
});

const selectedDateTopupRows = computed(() => {
  return filteredTransactionRows.value.filter(
    (row) => row.type === 'topup' && !row.isReplacement
  );
});

const selectedDateCashOutRows = computed(() => {
  return filteredTransactionRows.value.filter((row) => row.type === 'cashout');
});

const selectedDateRedeemedTopupCount = computed(() => {
  return selectedDateTopupRows.value.filter(
    (row) => row.statusStyle === 'redeemed'
  ).length;
});

const selectedDateTopupCount = computed(() => selectedDateTopupRows.value.length);

const selectedDateCashOutCount = computed(
  () => selectedDateCashOutRows.value.length
);

const selectedDateTopupFiatDisplay = computed(() =>
  formatFiatMinorAmount(
    sumFiatMinor(selectedDateTopupRows.value),
    getPrimaryCurrency(selectedDateTopupRows.value)
  )
);

const selectedDateCashOutFiatDisplay = computed(() =>
  formatFiatMinorAmount(
    sumFiatMinor(selectedDateCashOutRows.value),
    getPrimaryCurrency(selectedDateCashOutRows.value)
  )
);

const selectedDateTopupBchDisplay = computed(() =>
  formatBchSats(sumBchSats(selectedDateTopupRows.value))
);

const selectedDateCashOutBchDisplay = computed(() =>
  formatBchSats(sumBchSats(selectedDateCashOutRows.value))
);

const selectedTopupRecord = computed(() => {
  const selectedRow = selectedTransactionRow.value;

  if (!selectedRow || selectedRow.type !== 'topup') {
    return null;
  }

  return (
    voucherRecords.value.find((record) => record.id === selectedRow.recordId) ??
    null
  );
});

const selectedCashOutRecord = computed(() => {
  const selectedRow = selectedTransactionRow.value;

  if (!selectedRow || selectedRow.type !== 'cashout') {
    return null;
  }

  return (
    cashOutRecords.value.find((record) => record.id === selectedRow.recordId) ??
    null
  );
});

async function loadVoucherRecords(): Promise<void> {
  errorMessage.value = '';
  warningMessage.value = '';

  try {
    const [vouchers, cashOuts] = await Promise.all([
      getVoucherRecords(),
      getCashOutRecords(),
    ]);

    voucherRecords.value = vouchers;
    cashOutRecords.value = cashOuts;
  } catch (error) {
    console.error(error);
    errorMessage.value = t('historyPage.messages.couldNotLoadVoucherRecords');
  }
}

function createTopupTransactionRow(voucher: VoucherRecord): TransactionHistoryRow {
  const status = getTopupTransactionStatus(voucher);
  const reference = voucher.serial || voucher.id;

  return {
    id: `topup:${voucher.id}`,
    recordId: voucher.id,
    type: 'topup',
    typeLabel: t('historyPage.transactions.types.topup'),
    typeStyle: 'topup',
    reference,
    shortReference: shortenText(reference, 15, 6),
    createdAt: voucher.createdAt,
    dateDisplay: formatShortDateTime(voucher.createdAt),
    fiatAmountMinor: voucher.fiatAmountMinor,
    fiatCurrency: voucher.fiatCurrency,
    fiatDisplay: formatFiatMinorAmount(
      voucher.fiatAmountMinor,
      voucher.fiatCurrency
    ),
    bchSats: voucher.finalBchSats,
    bchDisplay: formatBchSats(voucher.finalBchSats),
    statusLabel: status.label,
    statusStyle: status.style,
    accessibleLabel: `${t(
      'historyPage.transactions.types.topup'
    )} ${reference}`,
    isReplacement: Boolean(voucher.replacement),
  };
}

function createCashOutTransactionRow(
  cashOut: CashOutRecord
): TransactionHistoryRow {
  const status = getCashOutTransactionStatus(cashOut.status);
  const reference = cashOut.serial || cashOut.id;
  const bchSats = cashOut.bchSatsReceived ?? cashOut.bchSatsRequired;

  return {
    id: `cashout:${cashOut.id}`,
    recordId: cashOut.id,
    type: 'cashout',
    typeLabel: t('historyPage.transactions.types.cashOut'),
    typeStyle: 'cashout',
    reference,
    shortReference: shortenText(reference, 15, 6),
    createdAt: cashOut.createdAt,
    dateDisplay: formatShortDateTime(cashOut.createdAt),
    fiatAmountMinor: cashOut.fiatAmountMinor,
    fiatCurrency: cashOut.fiatCurrency,
    fiatDisplay: formatFiatMinorAmount(
      cashOut.fiatAmountMinor,
      cashOut.fiatCurrency
    ),
    bchSats,
    bchDisplay: formatBchSats(bchSats),
    statusLabel: status.label,
    statusStyle: status.style,
    accessibleLabel: `${t(
      'historyPage.transactions.types.cashOut'
    )} ${reference}`,
    isReplacement: false,
  };
}

function getTopupTransactionStatus(voucher: VoucherRecord): {
  label: string;
  style: TransactionHistoryStatusStyle;
} {
  if (voucher.status === 'reclaimed') {
    return {
      label: t('historyPage.transactions.status.reclaimed'),
      style: 'cancelled',
    };
  }

  if (voucher.status === 'error') {
    return {
      label: t('historyPage.transactions.status.error'),
      style: 'error',
    };
  }

  if (isVoucherRedeemed(voucher)) {
    return {
      label: t('historyPage.transactions.status.redeemed'),
      style: 'redeemed',
    };
  }

  return {
    label: t('historyPage.transactions.status.notRedeemed'),
    style: 'not-redeemed',
  };
}

function getCashOutTransactionStatus(status: CashOutStatus): {
  label: string;
  style: TransactionHistoryStatusStyle;
} {
  if (status === 'completed') {
    return {
      label: t('historyPage.transactions.status.completed'),
      style: 'completed',
    };
  }

  if (status === 'received') {
    return {
      label: t('historyPage.transactions.status.bchReceived'),
      style: 'received',
    };
  }

  if (status === 'awaiting_payment') {
    return {
      label: t('historyPage.transactions.status.awaitingPayment'),
      style: 'awaiting-payment',
    };
  }

  if (status === 'cancelled') {
    return {
      label: t('historyPage.transactions.status.cancelled'),
      style: 'cancelled',
    };
  }

  if (status === 'failed') {
    return {
      label: t('historyPage.transactions.status.failed'),
      style: 'failed',
    };
  }

  return {
    label: t('historyPage.transactions.status.pending'),
    style: 'neutral',
  };
}

function isVoucherRedeemed(voucher: VoucherRecord): boolean {
  return (
    voucher.status === 'redeemed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  );
}

function sumFiatMinor(rows: TransactionHistoryRow[]): number {
  return rows.reduce((total, row) => total + row.fiatAmountMinor, 0);
}

function sumBchSats(rows: TransactionHistoryRow[]): number {
  return rows.reduce((total, row) => total + row.bchSats, 0);
}

function getPrimaryCurrency(rows: TransactionHistoryRow[]): string {
  return rows[0]?.fiatCurrency ?? 'GBP';
}

function getDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatSelectedDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
  }).format(new Date(year, month - 1, day));
}

function formatShortDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFiatMinorAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
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

function handleSelectTransaction(row: TransactionHistoryRow): void {
  selectedTransactionRow.value = row;
  isTransactionDetailOpen.value = true;
}

async function handleCreateTestVoucher(): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const testVoucher = createDraftVoucherRecord(10_000, 'GBP');

    await addVoucherRecord(testVoucher);
    await loadVoucherRecords();

    successMessage.value = t('historyPage.messages.createdTestVoucher', {
      serial: testVoucher.serial,
    });
  } catch (error) {
    console.error(error);
    errorMessage.value = t('historyPage.messages.couldNotCreateTestVoucher');
  }
}

async function handleMarkManualRedemption(payload: {
  voucherId: string;
  txid?: string;
  note?: string;
}): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updatedVoucher = await markVoucherManuallyRedeemed(
      payload.voucherId,
      {
        txid: payload.txid,
        note: payload.note,
      }
    );

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? t('historyPage.messages.markedManualRedemption', {
          serial: updatedVoucher.serial,
        })
      : t('historyPage.messages.couldNotFindVoucherRecordToUpdate');
  } catch (error) {
    console.error(error);
    errorMessage.value = t(
      'historyPage.messages.couldNotMarkVoucherAsManuallyRedeemed'
    );
  }
}

async function handleClearManualRedemption(voucherId: string): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updatedVoucher = await clearVoucherManualRedemption(voucherId);

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? t('historyPage.messages.clearedManualRedemption', {
          serial: updatedVoucher.serial,
        })
      : t('historyPage.messages.couldNotFindVoucherRecordToUpdate');
  } catch (error) {
    console.error(error);
    errorMessage.value = t(
      'historyPage.messages.couldNotClearManualRedemption'
    );
  }
}

async function handleCheckOnChainRedemption(voucherId: string): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';
  checkingRedemptionVoucherId.value = voucherId;

  try {
    const voucher = voucherRecords.value.find(
      (record) => record.id === voucherId
    );

    if (!voucher) {
      errorMessage.value = t(
        'historyPage.messages.couldNotFindVoucherRecordToCheck'
      );
      return;
    }

    const detection = await detectVoucherRedemptionStatus(voucher);
    const updatedVoucher = await updateVoucherRedemptionDetection(
      voucherId,
      detection
    );

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? t('historyPage.messages.checkedOnChainRedemptionStatus', {
          serial: updatedVoucher.serial,
          status: detection.status,
        })
      : t(
          'historyPage.messages.couldNotUpdateVoucherRedemptionDetectionResult'
        );
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('historyPage.messages.couldNotCheckVoucherRedemptionStatus');
  } finally {
    checkingRedemptionVoucherId.value = null;
  }
}

async function handleResumeFunding(voucherId: string): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';
  warningMessage.value = '';

  checkingFundingVoucherId.value = voucherId;

  try {
    /**
     * B5.7 SAFE RESUME.
     *
     * advanceTopupFundingLifecycle() may only reach a broadcast from a state
     * which the persisted funding-state classifier has proved resumable.
     *
     * Even then it:
     *
     * - uses the exact persisted fundingIntent
     * - reconciles the exact txid first
     * - never constructs another transaction
     * - never signs another transaction
     */
    const result = await advanceTopupFundingLifecycle(voucherId);

    await loadVoucherRecords();

    if (result.outcome === 'funded') {
      successMessage.value = `Funding verified for ${result.record.serial}.`;

      return;
    }

    if (result.outcome === 'broadcasted_pending_detection') {
      warningMessage.value =
        `Funding for ${result.record.serial} was submitted, but the exact transaction ` +
        'is still pending network verification. Use Check funding to verify the saved transaction again.';

      return;
    }

    if (result.outcome === 'uncertain') {
      warningMessage.value =
        `The funding submission outcome for ${result.record.serial} is uncertain. ` +
        'Do not submit another transaction. Use Check funding to verify the exact saved transaction.';

      return;
    }

    if (result.outcome === 'definitely_not_broadcast') {
      warningMessage.value =
        `Funding for ${result.record.serial} was definitely not submitted. ` +
        'The exact saved transaction remains available to resume safely.';

      return;
    }

    /**
     * In the current development build this is also the expected result when
     * REAL_BROADCAST_ENABLED remains false.
     */
    if (result.outcome === 'blocked') {
      warningMessage.value =
        `Funding submission for ${result.record.serial} is currently blocked. ` +
        'No transaction was sent and the exact saved transaction remains unchanged.';

      return;
    }
  } catch (error) {
    console.error(error);

    /**
     * The B5.7 state synchronisation may have persisted a terminal error
     * immediately before throwing. Reload so History shows that durable state.
     */
    await loadVoucherRecords();

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not safely resume Topup funding.';
  } finally {
    checkingFundingVoucherId.value = null;
  }
}

async function handleIssueReplacement(
  originalVoucherId: string
): Promise<void> {
  if (issuingReplacementVoucherId.value) {
    return;
  }

  errorMessage.value = '';

  successMessage.value = '';

  warningMessage.value = '';

  issuingReplacementVoucherId.value = originalVoucherId;

  try {
    /**
     * This operation:
     *
     * - derives a new voucher key/address
     * - obtains fresh Treasury UTXOs
     * - signs one exact replacement transaction
     * - persists it
     * - atomically links original → replacement
     *
     * It does NOT broadcast inside the preparation service.
     */
    const result = await prepareAndStorePrintedReplacement(originalVoucherId);

    await loadVoucherRecords();

    const replacement = result.replacementRecord;

    const fundingSafety = getFundingSafetyStatus();

    /**
     * Development guard:
     *
     * Stop after the durable signed transaction has been created.
     */
    if (!fundingSafety.realBroadcastEnabled) {
      warningMessage.value =
        `Replacement Topup ${replacement.serial} was prepared and saved safely. ` +
        'Real BCH broadcasting is disabled, so no replacement funding transaction was sent.';

      return;
    }

    /**
     * Production path:
     *
     * From here onward the existing B5.7 lifecycle owns the exact persisted
     * transaction.
     *
     * It may never construct or sign another replacement transaction.
     */
    const lifecycleResult = await advanceTopupFundingLifecycle(replacement.id);

    await loadVoucherRecords();

    if (lifecycleResult.outcome === 'funded') {
      successMessage.value =
        `Replacement Topup ${replacement.serial} is funded. ` +
        'Print the replacement voucher for the customer from its History record.';

      return;
    }

    if (lifecycleResult.outcome === 'broadcasted_pending_detection') {
      warningMessage.value =
        `Replacement funding for ${replacement.serial} was submitted and is awaiting verification. ` +
        'Use Check funding on the replacement record.';

      return;
    }

    if (lifecycleResult.outcome === 'uncertain') {
      warningMessage.value =
        `Replacement funding for ${replacement.serial} has an uncertain submission outcome. ` +
        'Do not create another replacement. Check the exact saved transaction.';

      return;
    }

    if (lifecycleResult.outcome === 'definitely_not_broadcast') {
      warningMessage.value =
        `Replacement funding for ${replacement.serial} was definitely not submitted. ` +
        'The exact saved transaction may be resumed safely from History.';

      return;
    }

    if (lifecycleResult.outcome === 'blocked') {
      warningMessage.value =
        `Replacement funding for ${replacement.serial} is currently blocked. ` +
        'No BCH was sent and the exact signed transaction remains saved.';

      return;
    }
  } catch (error) {
    console.error(error);

    await loadVoucherRecords();

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not safely prepare the replacement Printed Topup.';
  } finally {
    issuingReplacementVoucherId.value = null;
  }
}

async function handleReclaimVoucher(payload: {
  voucherId: string;
  action: VoucherReclaimRecoveryAction;
}): Promise<void> {
  if (reclaimingVoucherId.value) {
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';
  warningMessage.value = '';

  reclaimingVoucherId.value = payload.voucherId;

  try {
    /**
     * check_same_transaction is completely read-only with respect to BCH.
     */
    if (payload.action === 'check_same_transaction') {
      const result = await reconcileExistingVoucherReclaim(payload.voucherId);

      await loadVoucherRecords();

      if (
        result.reconciliation.status === 'mempool' ||
        result.reconciliation.status === 'confirmed'
      ) {
        successMessage.value = `The original Topup amount for ${result.record.serial} has been reclaimed to Treasury.`;

        return;
      }

      warningMessage.value =
        `The saved reclaim transaction for ${result.record.serial} is not yet positively visible. ` +
        'No new transaction was created or sent.';

      return;
    }

    if (
      payload.action !== 'prepare_and_resume' &&
      payload.action !== 'resume_same_transaction'
    ) {
      throw new Error(
        'This Topup does not currently have a safe Reclaim action.'
      );
    }

    /**
     * prepare_and_resume:
     *   may prepare ONE transaction before the write-ahead boundary.
     *
     * resume_same_transaction:
     *   must use the already-persisted transaction.
     *
     * The lifecycle itself enforces both cases.
     */
    const result = await advanceVoucherReclaimLifecycle(payload.voucherId);

    await loadVoucherRecords();

    if (result.outcome === 'reclaimed') {
      successMessage.value = `The original Topup amount for ${result.record.serial} has been reclaimed to Treasury.`;

      return;
    }

    if (result.outcome === 'blocked') {
      warningMessage.value =
        `The reclaim transaction for ${result.record.serial} is prepared and saved safely, but real BCH broadcasting is disabled. ` +
        'No BCH was sent.';

      return;
    }

    if (result.outcome === 'definitely_not_broadcast') {
      warningMessage.value =
        `The reclaim transaction for ${result.record.serial} was definitely not submitted. ` +
        'The exact saved transaction can be resumed safely.';

      return;
    }

    if (result.outcome === 'uncertain') {
      warningMessage.value =
        `The reclaim submission outcome for ${result.record.serial} is uncertain. ` +
        'Do not create another reclaim transaction. Use Check Reclaim to inspect the exact saved transaction.';

      return;
    }

    if (result.outcome === 'broadcasted_pending_detection') {
      warningMessage.value =
        `The reclaim transaction for ${result.record.serial} was submitted but is still awaiting positive network verification. ` +
        'Use Check Reclaim to verify the exact saved transaction.';

      return;
    }

    warningMessage.value = `The reclaim transaction for ${result.record.serial} remains pending verification.`;
  } catch (error) {
    console.error(error);

    await loadVoucherRecords();

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not safely reclaim the original Topup amount.';
  } finally {
    reclaimingVoucherId.value = null;
  }
}

function handleDeliveryUpdated(voucher: VoucherRecord): void {
  voucherRecords.value = voucherRecords.value.map((record) =>
    record.id === voucher.id ? voucher : record
  );
}

async function handleCheckFunding(voucherId: string): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';
  warningMessage.value = '';

  checkingFundingVoucherId.value = voucherId;

  try {
    /**
     * This is deliberately READ-ONLY with respect to BCH.
     *
     * It checks only the exact deterministic txid already persisted on the
     * voucher record.
     *
     * It does not:
     *
     * - construct another transaction
     * - sign another transaction
     * - broadcast anything
     */
    const result = await reconcileExistingTopupFunding(voucherId);

    await loadVoucherRecords();

    if (
      result.reconciliation.status === 'mempool' ||
      result.reconciliation.status === 'confirmed'
    ) {
      successMessage.value = `Funding verified for ${result.record.serial}.`;

      return;
    }

    warningMessage.value =
      `Funding for ${result.record.serial} is still pending verification. ` +
      'The saved transaction remains unchanged and no new transaction was sent.';
  } catch (error) {
    console.error(error);

    errorMessage.value =
      error instanceof Error ? error.message : 'Could not check Topup funding.';
  } finally {
    checkingFundingVoucherId.value = null;
  }
}

async function handlePreviewFundingRetry(): Promise<void> {
  if (isFundingRecoveryPreviewChecking.value) {
    return;
  }

  isFundingRecoveryPreviewChecking.value = true;

  try {
    /**
     * DEV VISUAL PREVIEW ONLY.
     *
     * No wallet, IndexedDB, Electrum, transaction or funding operation occurs.
     * This short delay merely allows the loading-state design to be inspected.
     */
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1_000);
    });
  } finally {
    isFundingRecoveryPreviewChecking.value = false;
  }
}

async function handleClearTestRecords(): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await clearVoucherRecords();
    await loadVoucherRecords();

    successMessage.value = t(
      'historyPage.messages.clearedAllLocalTestVoucherRecords'
    );
  } catch (error) {
    console.error(error);
    errorMessage.value = t('historyPage.messages.couldNotClearVoucherRecords');
  }
}

onMounted(() => {
  void loadVoucherRecords();
});
</script>

<style lang="scss" scoped>
.history-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.history-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 960px;
  width: 100%;
}

.history-hero,
.main-card,
.summary-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.history-hero {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 24px;
}

.eyebrow {
  color: #4b4b4b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

h1 {
  color: #111111;
  font-size: clamp(32px, 8vw, 48px);
  font-weight: 900;
  letter-spacing: -1.2px;
  line-height: 1.08;
  margin: 0;
}

.intro {
  color: #444444;
  font-size: 16px;
  line-height: 1.45;
  margin: 12px 0 0;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.summary-card {
  overflow: hidden;
}

.summary-card :deep(.q-card__section) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 118px;
  padding: 18px;
}

.summary-card--total :deep(.q-card__section) {
  flex-direction: row;
  gap: 12px;
}

.summary-icon {
  align-items: center;
  background: #111111;
  border-radius: 16px;
  color: #00ce1b;
  display: flex;
  flex: 0 0 46px;
  font-size: 26px;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.summary-label {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.04em;
  line-height: 1.15;
  text-transform: uppercase;
}

.summary-value {
  color: #111111;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.6px;
  line-height: 1;
}

.summary-value--amount {
  font-size: 22px;
  letter-spacing: -0.35px;
}

.summary-caption {
  color: #777777;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}

.summary-caption--green {
  color: #0c5f17;
}

.summary-bch-line {
  align-items: center;
  color: #666666;
  display: inline-flex;
  font-size: 12px;
  font-weight: 850;
  gap: 5px;
  line-height: 1.2;
  white-space: nowrap;
}

.summary-bch-logo {
  border-radius: 999px;
  display: block;
  height: 14px;
  width: 14px;
}

.transactions-card-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.section-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  min-width: 0;
}

.section-icon {
  align-items: center;
  background: #00ce1b;
  border-radius: 16px;
  color: #000000;
  display: flex;
  flex: 0 0 48px;
  font-size: 28px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.section-icon--dark {
  background: #111111;
  color: #00ce1b;
}

.date-filter-card {
  align-items: flex-start;
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 7px;
  padding: 10px;
}

.date-filter-label {
  color: #666666;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.date-filter-controls {
  align-items: center;
  display: flex;
  gap: 8px;
}

.date-filter-input {
  width: 230px;
}

.date-filter-input :deep(.q-field__control) {
  background: #ffffff;
  border-radius: 12px;
  min-height: 36px;
}

.date-filter-input :deep(.q-field__native) {
  font-size: 13px;
  font-weight: 850;
}

.date-filter-today-button {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 999px;
  color: #111111;
  font-size: 12px;
  font-weight: 850;
  min-height: 36px;
  padding: 0 11px;
}

.primary-button,
.secondary-button {
  border-radius: 14px;
  font-weight: 850;
  min-height: 42px;
  padding: 0 18px;
  overflow: hidden;
}

.history-hero .primary-button {
  flex: 0 0 auto;
  min-width: 160px;
  padding-left: 20px;
  padding-right: 20px;
}

.history-hero .primary-button :deep(.q-btn__content) {
  flex-wrap: nowrap;
}

.primary-button {
  background: #00ce1b;
  color: #ffffff;
}

.secondary-button {
  border-color: #222222;
  color: #111111;
}

.main-card {
  overflow: hidden;
}

.main-card :deep(.q-expansion-item__container) {
  border-radius: 24px;
  overflow: hidden;
}

.main-card :deep(.q-focus-helper),
.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper),
.date-filter-today-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.debug-card {
  border-style: dashed;
}

.dev-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card--total {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .history-hero {
    flex-direction: column;
    padding: 22px;
  }

  .history-hero .primary-button,
  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card :deep(.q-card__section) {
    min-height: 0;
  }

  .transactions-card-header {
    flex-direction: column;
  }

  .date-filter-card,
  .date-filter-controls,
  .date-filter-input {
    width: 100%;
  }

  .date-filter-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .date-filter-today-button {
    width: 100%;
  }

  .dev-actions {
    flex-direction: column;
  }
}
</style>
