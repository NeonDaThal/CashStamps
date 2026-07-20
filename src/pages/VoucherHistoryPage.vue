<template>
  <q-page padding class="history-page">
    <div class="history-container">
      <section class="history-hero">
        <div>
          <p class="eyebrow">{{ t('historyPage.hero.eyebrow') }}</p>
          <h1>{{ t('historyPage.hero.title') }}</h1>
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
        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.totalVouchers') }}
            </div>
            <div class="summary-value">{{ voucherRecords.length }}</div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.openActive') }}
            </div>
            <div class="summary-value">{{ activeVoucherCount }}</div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">
              {{ t('historyPage.summary.sweptRedeemed') }}
            </div>
            <div class="summary-value">{{ redeemedVoucherCount }}</div>
          </q-card-section>
        </q-card>
      </section>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9" rounded>
        {{ successMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-card flat bordered class="main-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
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
        </q-card-section>

        <q-separator />

        <q-card-section>
          <VoucherHistoryList
            :voucher-records="voucherRecords"
            :checking-redemption-voucher-id="checkingRedemptionVoucherId"
            @mark-manual-redemption="handleMarkManualRedemption"
            @clear-manual-redemption="handleClearManualRedemption"
            @check-on-chain-redemption="handleCheckOnChainRedemption"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-expansion-item
          icon="code"
          label="Development tools"
          caption="Create or clear local test records"
        >
          <q-card-section>
            <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
              <template #avatar>
                <q-icon name="construction" />
              </template>

              These tools are for local testing only and should not be visible
              in the final merchant-facing history screen.
            </q-banner>

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
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import VoucherHistoryList from 'src/components/VoucherHistoryList.vue';
import type { VoucherRecord } from 'src/types/voucher';
import {
  addVoucherRecord,
  clearVoucherManualRedemption,
  clearVoucherRecords,
  getVoucherRecords,
  markVoucherManuallyRedeemed,
  updateVoucherRedemptionDetection,
} from 'src/services/voucher-store';
import { createDraftVoucherRecord } from 'src/services/voucher-factory';
import { detectVoucherRedemptionStatus } from 'src/services/voucher-redemption-detector';
import topupIconUrl from 'src/assets/icons/topup-icon.svg';

const { t } = useI18n({ useScope: 'global' });
const topupIcon = `img:${topupIconUrl}`;

const voucherRecords = ref<VoucherRecord[]>([]);
const errorMessage = ref('');
const successMessage = ref('');
const checkingRedemptionVoucherId = ref<string | null>(null);

const redeemedVoucherCount = computed(() => {
  return voucherRecords.value.filter((voucher) => {
    return (
      voucher.status === 'redeemed' ||
      Boolean(voucher.manualRedemption) ||
      voucher.redemptionDetection?.status === 'swept'
    );
  }).length;
});

const activeVoucherCount = computed(() => {
  return Math.max(0, voucherRecords.value.length - redeemedVoucherCount.value);
});

async function loadVoucherRecords(): Promise<void> {
  errorMessage.value = '';

  try {
    voucherRecords.value = await getVoucherRecords();
  } catch (error) {
    console.error(error);
    errorMessage.value = t('historyPage.messages.couldNotLoadVoucherRecords');
  }
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
  max-width: 900px;
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
  grid-template-columns: repeat(3, 1fr);
}

.summary-card :deep(.q-card__section) {
  padding: 18px;
}

.summary-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.summary-value {
  color: #111111;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.section-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
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
.secondary-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.dev-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .history-hero {
    flex-direction: column;
    padding: 22px;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .dev-actions {
    flex-direction: column;
  }
}
</style>
