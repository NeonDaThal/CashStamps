<template>
  <q-page padding class="sell-page">
    <div class="sell-container">
      <section class="sell-hero">
        <div>
          <p class="eyebrow">Merchant checkout</p>
          <h1>Sell BCH Voucher</h1>
          <p class="intro">
            Enter the customer&apos;s cash amount, review the BCH value, issue
            the voucher, and present the receipt QR to the customer.
          </p>
        </div>

        <q-btn
          class="history-button"
          label="Voucher History"
          icon="receipt_long"
          to="/voucher-history"
          outline
          no-caps
        />
      </section>

      <q-card flat bordered class="status-card">
        <q-card-section>
          <div class="row items-start q-col-gutter-md">
            <div class="col">
              <div class="status-heading-row">
                <div class="status-icon">
                  <q-icon name="account_balance_wallet" />
                </div>

                <div>
                  <div class="text-h6">Treasury Wallet</div>
                  <p class="text-grey-7 q-mb-none">
                    This wallet supplies BCH for issued vouchers.
                  </p>
                </div>
              </div>

              <div v-if="treasuryWallet.isSetup" class="q-mt-md">
                <q-badge class="success-badge q-mb-sm"> Ready </q-badge>

                <div class="text-body2 text-break q-mb-xs">
                  <strong>Address:</strong>
                  {{ treasuryWallet.address }}
                </div>

                <div v-if="treasuryBalance" class="text-body2 q-mb-xs">
                  <strong>Balance:</strong>
                  {{ formatBchSats(treasuryBalance.balanceSats) }}
                </div>

                <div v-if="treasuryBalance" class="text-caption text-grey-7">
                  Last checked:
                  {{ formatDateTime(treasuryBalance.checkedAt) }}
                </div>

                <div v-else class="text-body2 text-grey-7">
                  Balance has not been checked yet.
                </div>
              </div>

              <div v-else class="q-mt-md">
                <q-badge color="grey-7" class="q-mb-sm"> Not set up </q-badge>

                <div class="text-body2 text-grey-7">
                  Set up the treasury wallet before live merchant use.
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-auto column q-gutter-sm">
              <q-btn
                class="secondary-button"
                label="Treasury Wallet"
                icon="settings"
                to="/treasury-settings"
                outline
                no-caps
              />

              <q-btn
                v-if="treasuryWallet.isSetup"
                class="secondary-button"
                label="Refresh Balance"
                icon="refresh"
                :loading="isCheckingTreasuryBalance"
                outline
                no-caps
                @click="handleRefreshTreasuryBalance"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="sale-card">
        <q-card-section>
          <div class="section-heading">
            <div>
              <p class="eyebrow">New voucher</p>
              <h2>Enter sale amount</h2>
            </div>

            <q-icon name="point_of_sale" />
          </div>

          <p class="section-copy">
            Add the cash amount the customer is paying. The app will lock a BCH
            quote and show a review screen before issuing the voucher.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <VoucherSaleForm
            :is-submitting="isSubmitting"
            @review-voucher="handleReviewVoucher"
          />
        </q-card-section>
      </q-card>

      <q-card v-if="lastIssuedVoucher" flat bordered class="issued-card">
        <q-card-section>
          <div class="row items-start q-col-gutter-md">
            <div class="col">
              <div class="issued-heading">
                <q-icon name="check_circle" />

                <div>
                  <div class="text-h6">Voucher issued</div>
                  <p class="q-mb-none">
                    The voucher has been saved and the receipt preview is ready
                    for the customer.
                  </p>
                </div>
              </div>

              <q-list dense class="q-mt-md">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Voucher reference</q-item-label>
                    <q-item-label class="text-weight-bold">
                      {{ lastIssuedVoucher.serial }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Customer paid</q-item-label>
                    <q-item-label>
                      {{
                        formatFiatAmount(
                          lastIssuedVoucher.fiatAmountMinor,
                          lastIssuedVoucher.fiatCurrency
                        )
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>BCH loaded</q-item-label>
                    <q-item-label>
                      {{ formatBchSats(lastIssuedVoucher.finalBchSats) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Voucher address</q-item-label>
                    <q-item-label class="text-break">
                      {{ lastIssuedVoucher.address }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-expansion-item
                dense
                class="developer-details q-mt-sm"
                icon="code"
                label="Development details"
              >
                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Derivation index</q-item-label>
                      <q-item-label>
                        {{ lastIssuedVoucher.derivationIndex }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="lastIssuedVoucher.keyMetadata">
                    <q-item-section>
                      <q-item-label caption>WIF export ready</q-item-label>
                      <q-item-label>
                        {{
                          lastIssuedVoucher.keyMetadata.hasWif ? 'Yes' : 'No'
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="lastIssuedVoucher.feeOutputPlan">
                    <q-item-section>
                      <q-item-label caption>Platform fee plan</q-item-label>
                      <q-item-label>
                        {{
                          formatBchSats(
                            lastIssuedVoucher.feeOutputPlan.platformFeeSats
                          )
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Record status</q-item-label>
                      <q-item-label>
                        {{ lastIssuedVoucher.status }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            color="primary"
            label="View History"
            to="/voucher-history"
            no-caps
          />

          <q-btn
            class="primary-button"
            label="Issue Another"
            no-caps
            unelevated
            @click="handleResetLastIssuedVoucher"
          />
        </q-card-actions>
      </q-card>

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

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        Development safety mode is still active. The merchant UX is being
        polished, but live transaction broadcasting remains protected by the
        existing guardrails until explicitly changed.
      </q-banner>

      <SaleConfirmDialog
        v-if="pendingPricing"
        v-model="isConfirmDialogOpen"
        :pricing="pendingPricing"
        :is-submitting="isSubmitting"
        :treasury-warning="treasuryWarning"
        :treasury-balance-sats="treasuryBalance?.balanceSats"
        :treasury-funding-preview="pendingTreasuryFundingPreview"
        :voucher-key-metadata="pendingKeyMetadata"
        @broadcast-result="handleFundingBroadcastResult"
        @confirm="handleCreateDraftVoucher"
      />

      <IssueProgressDialog
        v-model="isProgressDialogOpen"
        :steps="issueProgressSteps"
      />

      <q-dialog v-model="isReceiptPreviewDialogOpen">
        <q-card style="width: 440px; max-width: 95vw">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6">Voucher Receipt</div>
              <div class="text-caption text-grey-7">
                Issue-time receipt preview
              </div>
            </div>

            <q-btn v-close-popup dense flat round icon="close" />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="lastIssuedVoucher">
            <VoucherReceiptPreview :voucher="lastIssuedVoucher" />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn v-close-popup color="primary" flat label="Close" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import IssueProgressDialog, {
  type IssueProgressStep,
} from 'src/components/IssueProgressDialog.vue';
import SaleConfirmDialog from 'src/components/SaleConfirmDialog.vue';
import VoucherReceiptPreview from 'src/components/VoucherReceiptPreview.vue';
import VoucherSaleForm from 'src/components/VoucherSaleForm.vue';
import type {
  TreasuryWalletBalance,
  TreasuryWalletPublicInfo,
} from 'src/types/treasury';
import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import { createTreasuryFundingPreview } from 'src/services/treasury-funding';
import type { VoucherKeyMetadata, VoucherRecord } from 'src/types/voucher';
import { createDraftVoucherRecord } from 'src/services/voucher-factory';
import {
  PricingService,
  PricingUnavailableError,
} from 'src/services/pricing-service';
import {
  calculateVoucherPricingFromLockedQuote,
  formatBchSats,
} from 'src/services/voucher-pricing';
import {
  getTreasuryWalletBalance,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';
import { addVoucherRecord } from 'src/services/voucher-store';
import {
  deriveNextVoucherAddress,
  exportVoucherKeyAtIndex,
  type DerivedVoucherAddress,
} from 'src/services/voucher-wallet';
import { createVoucherFeeOutputPlan } from 'src/services/voucher-fee-plan';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

const pricingService = new PricingService();

const isSubmitting = ref(false);
const isCheckingTreasuryBalance = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');

const isConfirmDialogOpen = ref(false);
const isProgressDialogOpen = ref(false);
const isReceiptPreviewDialogOpen = ref(false);

const pendingFiatAmountMinor = ref(0);
const pendingFiatCurrency = ref('GBP');
const pendingPricing = ref<FakeVoucherPricingQuote | null>(null);
const pendingFeeOutputPlan = ref<VoucherFeeOutputPlan | null>(null);
const pendingTreasuryFundingPreview = ref<TreasuryFundingPreview | null>(null);
const pendingFundingBroadcast = ref<TreasuryBroadcastResult | null>(null);
const pendingVoucherAddress = ref<DerivedVoucherAddress | null>(null);
const pendingKeyMetadata = ref<VoucherKeyMetadata | null>(null);

const lastIssuedVoucher = ref<VoucherRecord | null>(null);

const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});

const treasuryBalance = ref<TreasuryWalletBalance | null>(null);

const treasuryWarning = computed(() => {
  if (!pendingPricing.value) {
    return '';
  }

  if (!treasuryWallet.value.isSetup) {
    return 'Treasury wallet is not set up. Voucher review can continue, but live funding will be blocked until a treasury wallet exists.';
  }

  if (!treasuryBalance.value) {
    return 'Treasury balance has not been checked. Voucher review can continue, but live funding will require a fresh balance check.';
  }

  if (treasuryBalance.value.balanceSats < pendingPricing.value.finalBchSats) {
    return `Treasury balance is too low for this voucher. Required: ${formatBchSats(
      pendingPricing.value.finalBchSats
    )}. Available: ${formatBchSats(treasuryBalance.value.balanceSats)}.`;
  }

  return '';
});

const issueProgressSteps = ref<IssueProgressStep[]>([
  {
    key: 'quote',
    label: 'Confirm locked quote',
    description: 'Use the BCH/GBP quote locked before confirmation.',
    status: 'pending',
  },
  {
    key: 'wallet',
    label: 'Prepare voucher wallet',
    description: 'Use the voucher address prepared before confirmation.',
    status: 'pending',
  },
  {
    key: 'funding',
    label: 'Prepare funding plan',
    description:
      'Check the prepared funding plan while live broadcast remains guarded.',
    status: 'pending',
  },
  {
    key: 'store',
    label: 'Save voucher record',
    description: 'Store the voucher sale record locally.',
    status: 'pending',
  },
]);

async function loadTreasuryWallet(): Promise<void> {
  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();

    if (!treasuryWallet.value.isSetup) {
      treasuryBalance.value = null;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load treasury wallet status.';
  }
}

async function handleRefreshTreasuryBalance(): Promise<void> {
  clearMessages();
  isCheckingTreasuryBalance.value = true;

  try {
    treasuryBalance.value = await getTreasuryWalletBalance();
    successMessage.value = 'Treasury balance refreshed.';
  } catch (error) {
    console.error(error);
    errorMessage.value =
      'Could not refresh treasury balance. Check your connection and try again.';
  } finally {
    isCheckingTreasuryBalance.value = false;
  }
}

function clearMessages(): void {
  successMessage.value = '';
  warningMessage.value = '';
  errorMessage.value = '';
}

function resetIssueProgressSteps(): void {
  issueProgressSteps.value = issueProgressSteps.value.map((step) => ({
    ...step,
    status: 'pending',
  }));
}

function setIssueProgressStepStatus(
  key: string,
  status: IssueProgressStep['status']
): void {
  issueProgressSteps.value = issueProgressSteps.value.map((step) =>
    step.key === key ? { ...step, status } : step
  );
}

function waitForFakeStep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMilliseconds: number,
  timeoutMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMilliseconds);
    }),
  ]);
}

async function handleReviewVoucher(
  fiatAmountMinor: number,
  fiatCurrency: string
): Promise<void> {
  clearMessages();
  lastIssuedVoucher.value = null;
  isReceiptPreviewDialogOpen.value = false;
  pendingPricing.value = null;
  pendingFeeOutputPlan.value = null;
  pendingTreasuryFundingPreview.value = null;
  pendingFundingBroadcast.value = null;
  pendingVoucherAddress.value = null;
  pendingKeyMetadata.value = null;

  if (!Number.isFinite(fiatAmountMinor) || fiatAmountMinor <= 0) {
    errorMessage.value = 'Enter a valid cash amount first.';
    return;
  }

  pendingFiatAmountMinor.value = fiatAmountMinor;
  pendingFiatCurrency.value = fiatCurrency;

  isSubmitting.value = true;

  try {
    await loadTreasuryWallet();

    if (treasuryWallet.value.isSetup) {
      try {
        treasuryBalance.value = await withTimeout(
          getTreasuryWalletBalance(),
          8_000,
          'Treasury balance check timed out.'
        );
      } catch (error) {
        console.error(error);
        treasuryBalance.value = null;
        warningMessage.value =
          'Treasury balance could not be checked. Voucher review can continue, but live funding will require a fresh balance check.';
      }
    }

    const lockedQuote = await pricingService.getLockedQuote(fiatCurrency);

    pendingPricing.value = calculateVoucherPricingFromLockedQuote(
      fiatAmountMinor,
      lockedQuote
    );

    pendingFeeOutputPlan.value = createVoucherFeeOutputPlan(
      pendingPricing.value
    );

    pendingVoucherAddress.value = await deriveNextVoucherAddress();

    try {
      const voucherKey = await exportVoucherKeyAtIndex(
        pendingVoucherAddress.value.derivationIndex
      );

      pendingKeyMetadata.value = {
        hasWif: Boolean(voucherKey.wif),
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(error);
      pendingKeyMetadata.value = {
        hasWif: false,
        checkedAt: new Date().toISOString(),
      };
      warningMessage.value =
        'Voucher key export check failed. Review can continue, but printing/sweeping will require WIF export.';
    }

    if (treasuryWallet.value.isSetup && treasuryWallet.value.address) {
      pendingTreasuryFundingPreview.value = createTreasuryFundingPreview({
        treasuryAddress: treasuryWallet.value.address,
        voucherAddress: pendingVoucherAddress.value.address,
        amountSats: pendingPricing.value.finalBchSats,
        treasuryBalanceSats: treasuryBalance.value?.balanceSats ?? 0,
        treasuryUtxoCount: treasuryBalance.value?.utxoCount ?? 0,
        treasuryUtxos: treasuryBalance.value?.utxos ?? [],
      });
    }

    if (lockedQuote.isFallbackQuote) {
      warningMessage.value =
        'Live pricing was unavailable, so a recent cached quote is being used. Review the quote carefully before issuing.';
    } else if (!warningMessage.value) {
      successMessage.value = 'Live price quote locked successfully.';
    }

    isConfirmDialogOpen.value = true;
  } catch (error) {
    console.error(error);

    if (error instanceof PricingUnavailableError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value =
        'Could not prepare voucher review. Please check the connection and try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
}

function handleResetLastIssuedVoucher(): void {
  clearMessages();
  isReceiptPreviewDialogOpen.value = false;
  lastIssuedVoucher.value = null;
}

function handleFundingBroadcastResult(
  result: TreasuryBroadcastResult | null
): void {
  pendingFundingBroadcast.value = result;
}

async function runFakeIssueProgress(): Promise<void> {
  resetIssueProgressSteps();

  setIssueProgressStepStatus('quote', 'active');
  await waitForFakeStep(350);
  setIssueProgressStepStatus('quote', 'complete');

  setIssueProgressStepStatus('wallet', 'active');
  await waitForFakeStep(350);
  setIssueProgressStepStatus('wallet', 'complete');

  setIssueProgressStepStatus('funding', 'active');
  await waitForFakeStep(350);
  setIssueProgressStepStatus('funding', 'complete');

  setIssueProgressStepStatus('store', 'active');
}

async function handleCreateDraftVoucher(): Promise<void> {
  clearMessages();
  lastIssuedVoucher.value = null;
  isReceiptPreviewDialogOpen.value = false;

  if (!pendingPricing.value) {
    errorMessage.value =
      'No locked quote is available. Please review the voucher again.';
    return;
  }

  if (!pendingVoucherAddress.value) {
    errorMessage.value =
      'No voucher address is available. Please review the voucher again.';
    return;
  }

  isSubmitting.value = true;
  isConfirmDialogOpen.value = false;
  isProgressDialogOpen.value = true;

  try {
    await runFakeIssueProgress();

    const voucher = createDraftVoucherRecord(
      pendingFiatAmountMinor.value,
      pendingFiatCurrency.value,
      pendingPricing.value,
      {
        addressData: {
          derivationIndex: pendingVoucherAddress.value.derivationIndex,
          address: pendingVoucherAddress.value.address,
        },
        keyMetadata: pendingKeyMetadata.value,
        feeOutputPlan: pendingFeeOutputPlan.value,
        treasuryFundingPreview: pendingTreasuryFundingPreview.value,
        fundingBroadcast: pendingFundingBroadcast.value,
      }
    );

    await addVoucherRecord(voucher);

    setIssueProgressStepStatus('store', 'complete');
    await waitForFakeStep(300);

    lastIssuedVoucher.value = voucher;
    pendingPricing.value = null;
    pendingFeeOutputPlan.value = null;
    pendingTreasuryFundingPreview.value = null;
    pendingFundingBroadcast.value = null;
    pendingVoucherAddress.value = null;
    pendingKeyMetadata.value = null;
    isProgressDialogOpen.value = false;
    isReceiptPreviewDialogOpen.value = true;

    await loadTreasuryWallet();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not issue voucher.';
    setIssueProgressStepStatus('store', 'error');
  } finally {
    isSubmitting.value = false;
  }
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

onMounted(() => {
  void loadTreasuryWallet();
});
</script>

<style lang="scss" scoped>
.sell-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.sell-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 760px;
  width: 100%;
}

.sell-hero,
.status-card,
.sale-card,
.issued-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.sell-hero {
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

h1,
h2 {
  color: #111111;
  line-height: 1.08;
  margin: 0;
}

h1 {
  font-size: clamp(32px, 8vw, 48px);
  font-weight: 900;
  letter-spacing: -1.2px;
}

h2 {
  font-size: 26px;
  font-weight: 850;
}

.intro,
.section-copy {
  color: #444444;
  font-size: 16px;
  line-height: 1.45;
  margin: 12px 0 0;
}

.history-button,
.secondary-button {
  border-color: #222222;
  border-radius: 14px;
  color: #111111;
  font-weight: 800;
}

.status-heading-row,
.section-heading,
.issued-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.status-icon,
.section-heading > .q-icon,
.issued-heading > .q-icon {
  align-items: center;
  border-radius: 16px;
  display: flex;
  flex: 0 0 46px;
  font-size: 26px;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.status-icon,
.section-heading > .q-icon {
  background: #f0f0f0;
  color: #00a816;
}

.issued-heading > .q-icon {
  background: #00ce1b;
  color: #000000;
}

.success-badge {
  background: #00ce1b;
  color: #000000;
  font-weight: 800;
}

.sale-card :deep(.q-card__section),
.status-card :deep(.q-card__section),
.issued-card :deep(.q-card__section) {
  padding: 22px;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 800;
}

.developer-details {
  border: 1px solid #dddddd;
  border-radius: 14px;
  overflow: hidden;
}

@media (max-width: 640px) {
  .sell-hero {
    flex-direction: column;
    padding: 22px;
  }

  .history-button {
    width: 100%;
  }
}
</style>
