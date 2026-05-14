<template>
  <q-page padding class="history-page">
    <div class="history-container">
      <section class="history-hero">
        <div>
          <p class="eyebrow">Voucher records</p>
          <h1>Voucher History</h1>
          <p class="intro">
            Review issued BCH vouchers, check redemption status, and access
            development receipt previews while printer testing is still being
            prepared.
          </p>
        </div>

        <q-btn
          class="primary-button"
          label="Sell Voucher"
          icon="point_of_sale"
          to="/sell-voucher"
          unelevated
          no-caps
        />
      </section>

      <section class="summary-grid">
        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">Total vouchers</div>
            <div class="summary-value">{{ voucherRecords.length }}</div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">Open / active</div>
            <div class="summary-value">{{ activeVoucherCount }}</div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="summary-card">
          <q-card-section>
            <div class="summary-label">Swept / redeemed</div>
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
              <div class="text-h6">Voucher records</div>
              <p class="text-grey-7 q-mb-none">
                Customer-facing voucher information appears first. Technical
                funding and testing tools are kept inside each record.
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

        Development safety mode is still active. Receipt preview and redemption
        tools remain available for testing before the final printer flow is
        connected.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

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
    errorMessage.value = 'Could not load voucher records.';
  }
}

async function handleCreateTestVoucher(): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const testVoucher = createDraftVoucherRecord(10_000, 'GBP');

    await addVoucherRecord(testVoucher);
    await loadVoucherRecords();

    successMessage.value = `Created test voucher ${testVoucher.serial}.`;
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not create test voucher.';
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
      ? `Marked ${updatedVoucher.serial} as manually swept/redeemed.`
      : 'Could not find voucher record to update.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not mark voucher as manually redeemed.';
  }
}

async function handleClearManualRedemption(voucherId: string): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updatedVoucher = await clearVoucherManualRedemption(voucherId);

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? `Cleared manual redemption status for ${updatedVoucher.serial}.`
      : 'Could not find voucher record to update.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not clear manual redemption status.';
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
      errorMessage.value = 'Could not find voucher record to check.';
      return;
    }

    const detection = await detectVoucherRedemptionStatus(voucher);
    const updatedVoucher = await updateVoucherRedemptionDetection(
      voucherId,
      detection
    );

    await loadVoucherRecords();

    successMessage.value = updatedVoucher
      ? `Checked on-chain redemption status for ${updatedVoucher.serial}: ${detection.status}.`
      : 'Could not update voucher redemption detection result.';
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not check voucher redemption status.';
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

    successMessage.value = 'Cleared all local test voucher records.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not clear voucher records.';
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
  color: #000000;
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
