<template>
  <q-page padding class="sell-page">
    <div class="sell-container">
      <section class="sell-hero">
        <div class="section-heading hero-heading">
          <div>
            <p class="eyebrow">{{ t('sellPage.hero.eyebrow') }}</p>
            <h1>{{ t('sellPage.hero.title') }}</h1>
          </div>

          <div class="hero-action-icons">
            <q-btn
              flat
              dense
              round
              icon="account_balance_wallet"
              class="hero-icon-button"
              :aria-label="t('sellPage.treasury.title')"
              @click="isTreasuryDialogOpen = true"
            >
              <q-badge
                floating
                rounded
                :class="
                  treasuryWallet.isSetup
                    ? 'quick-action-status-ready'
                    : 'quick-action-status-muted'
                "
              />
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="receipt_long"
              class="hero-icon-button"
              :aria-label="t('home.voucherHistory')"
              to="/voucher-history"
            />
          </div>
        </div>

        <p class="intro">
          {{ t('sellPage.hero.intro') }}
        </p>

        <div class="hero-form-wrap">
          <VoucherSaleForm
            :is-submitting="isSubmitting"
            @review-voucher="handleReviewVoucher"
          />
        </div>
      </section>

      <q-card v-if="lastIssuedVoucher" flat bordered class="issued-card">
        <q-card-section>
          <div class="row items-start q-col-gutter-md">
            <div class="col">
              <div class="issued-heading">
                <q-icon name="check_circle" />

                <div>
                  <div class="text-h6">
                    {{ t('sellPage.issued.title') }}
                  </div>
                  <p class="q-mb-none">
                    {{ t('sellPage.issued.subtitle') }}
                  </p>
                </div>
              </div>

              <q-list dense class="q-mt-md">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.issued.voucherReference') }}
                    </q-item-label>
                    <q-item-label class="text-weight-bold">
                      {{ lastIssuedVoucher.serial }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellForm.topupAmount') }}
                    </q-item-label>
                    <q-item-label>
                      {{
                        formatFiatAmount(
                          getTopupRecordValues(lastIssuedVoucher)
                            .principalMinor,
                          lastIssuedVoucher.fiatCurrency
                        )
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellForm.serviceFee') }}
                    </q-item-label>
                    <q-item-label>
                      {{
                        formatFiatAmount(
                          getTopupRecordValues(lastIssuedVoucher)
                            .serviceFeeMinor,
                          lastIssuedVoucher.fiatCurrency
                        )
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellForm.customerToPay') }}
                    </q-item-label>
                    <q-item-label class="text-weight-bold">
                      {{
                        formatFiatAmount(
                          getTopupRecordValues(lastIssuedVoucher)
                            .customerPaysMinor,
                          lastIssuedVoucher.fiatCurrency
                        )
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.issued.bchLoaded') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatBchSats(lastIssuedVoucher.finalBchSats) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.issued.voucherAddress') }}
                    </q-item-label>
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
                :label="t('sellPage.developerDetails.title')"
              >
                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>
                        {{ t('sellPage.developerDetails.derivationIndex') }}
                      </q-item-label>
                      <q-item-label>
                        {{ lastIssuedVoucher.derivationIndex }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="lastIssuedVoucher.keyMetadata">
                    <q-item-section>
                      <q-item-label caption>
                        {{ t('sellPage.developerDetails.wifExportReady') }}
                      </q-item-label>
                      <q-item-label>
                        {{
                          lastIssuedVoucher.keyMetadata.hasWif
                            ? t('common.yes')
                            : t('common.no')
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="lastIssuedVoucher.feeOutputPlan">
                    <q-item-section>
                      <q-item-label caption>
                        {{ t('sellPage.developerDetails.platformFeePlan') }}
                      </q-item-label>
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
                      <q-item-label caption>
                        {{ t('sellPage.developerDetails.recordStatus') }}
                      </q-item-label>
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
            :label="t('sellForm.viewHistory')"
            to="/voucher-history"
            no-caps
          />

          <q-btn
            class="primary-button"
            :label="t('sellPage.issued.issueAnother')"
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

        {{ t('sellPage.safetyNotice') }}
      </q-banner>

      <q-dialog v-model="isTreasuryDialogOpen">
        <q-card class="treasury-dialog-card">
          <q-card-section class="row items-center justify-between">
            <div class="treasury-dialog-title-row">
              <div class="status-icon">
                <q-icon name="account_balance_wallet" />
              </div>

              <div>
                <div class="text-h6">
                  {{ t('sellPage.treasury.title') }}
                </div>
                <p class="text-grey-7 q-mb-none">
                  {{ t('sellPage.treasury.subtitle') }}
                </p>
              </div>
            </div>

            <q-btn v-close-popup dense flat round icon="close" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div v-if="treasuryWallet.isSetup">
              <q-badge class="success-badge q-mb-md">
                {{ t('sellPage.treasury.ready') }}
              </q-badge>

              <q-list bordered separator class="dialog-info-list">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.treasury.address') }}
                    </q-item-label>
                    <q-item-label class="text-break">
                      {{ treasuryWallet.address }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="treasuryBalance">
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.treasury.balance') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatBchSats(treasuryBalance.balanceSats) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="treasuryBalance">
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.treasury.lastChecked') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatDateTime(treasuryBalance.checkedAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-else>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('sellPage.treasury.balance') }}
                    </q-item-label>
                    <q-item-label>
                      {{ t('sellPage.treasury.balanceNotChecked') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div v-else>
              <q-badge color="grey-7" class="q-mb-md">
                {{ t('sellPage.treasury.notSetUp') }}
              </q-badge>

              <p class="text-grey-7 q-mb-none">
                {{ t('sellPage.treasury.setUpBeforeUse') }}
              </p>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="treasury-dialog-actions">
            <q-btn
              class="secondary-button"
              :label="t('sellPage.treasury.title')"
              icon="settings"
              to="/treasury-settings"
              outline
              no-caps
              v-close-popup
            />

            <q-btn
              v-if="treasuryWallet.isSetup"
              class="primary-button"
              :label="t('sellPage.treasury.refreshBalance')"
              icon="refresh"
              :loading="isCheckingTreasuryBalance"
              no-caps
              unelevated
              @click="handleRefreshTreasuryBalance"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

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
              <div class="text-h6">
                {{ t('sellPage.receiptDialog.title') }}
              </div>
              <div class="text-caption text-grey-7">
                {{ t('sellPage.receiptDialog.subtitle') }}
              </div>
            </div>

            <q-btn v-close-popup dense flat round icon="close" />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="lastIssuedVoucher">
            <VoucherReceiptPreview :voucher="lastIssuedVoucher" />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              color="primary"
              flat
              :label="t('common.close')"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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
import { formatBchSats } from 'src/services/voucher-pricing';
import {
  calculateTopupPricingV1FromLockedQuote,
  createTopupFeeModelV1Snapshot,
  type TopupPricingV1,
} from 'src/services/topup-pricing-v1';
import {
  getTreasuryWalletBalance,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';
import {
  addVoucherRecordIdempotently,
  getVoucherRecordByIssueOperationId,
} from 'src/services/voucher-store';
import {
  createTopupIssueOperationId,
  prepareTopupFundingIntent,
} from 'src/services/topup-issue-operation';
import { recordTopupSaleCashReceived } from 'src/services/cash-on-hand-store';
import {
  deriveNextVoucherAddress,
  exportVoucherKeyAtIndex,
  type DerivedVoucherAddress,
} from 'src/services/voucher-wallet';
import { createVoucherFeeOutputPlanV1 } from 'src/services/voucher-fee-plan-v1';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import { getTopupRecordValues } from 'src/services/topup-record-values';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import { TOPUP_PRICE_QUOTE_TTL_MILLISECONDS } from 'src/services/pricing-config';
import { getTopupQuoteIssueSafety } from 'src/services/topup-issue-safety';
import { getFundingSafetyStatus } from 'src/services/funding-safety';

import { advanceTopupFundingLifecycle } from 'src/services/topup-funding-lifecycle';

const { t, locale } = useI18n({ useScope: 'global' });

const pricingService = new PricingService();

const isSubmitting = ref(false);
const isCheckingTreasuryBalance = ref(false);
const isIssueOperationRunning = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');

const isConfirmDialogOpen = ref(false);
const isProgressDialogOpen = ref(false);
const isReceiptPreviewDialogOpen = ref(false);
const isTreasuryDialogOpen = ref(false);

const pendingPricing = ref<TopupPricingV1 | null>(null);
const pendingFeeOutputPlan = ref<VoucherFeeOutputPlan | null>(null);
const pendingTreasuryFundingPreview = ref<TreasuryFundingPreview | null>(null);
const pendingFundingBroadcast = ref<TreasuryBroadcastResult | null>(null);
const pendingVoucherAddress = ref<DerivedVoucherAddress | null>(null);
const pendingKeyMetadata = ref<VoucherKeyMetadata | null>(null);
const pendingIssueOperationId = ref<string | null>(null);

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
    return t('sellPage.messages.treasuryNotSetUpWarning');
  }

  if (!treasuryBalance.value) {
    return t('sellPage.messages.treasuryBalanceNotCheckedWarning');
  }

  const estimatedRequiredSats =
    pendingTreasuryFundingPreview.value?.estimatedTotalRequiredSats;

  if (
    estimatedRequiredSats !== undefined &&
    treasuryBalance.value.balanceSats < estimatedRequiredSats
  ) {
    return t('sellPage.messages.treasuryBalanceTooLow', {
      required: formatBchSats(estimatedRequiredSats),
      available: formatBchSats(treasuryBalance.value.balanceSats),
    });
  }

  return '';
});

function createIssueProgressSteps(): IssueProgressStep[] {
  return [
    {
      key: 'quote',
      label: t('sellPage.issueSteps.quote.label'),
      description: t('sellPage.issueSteps.quote.description'),
      status: 'pending',
    },

    {
      key: 'wallet',
      label: t('sellPage.issueSteps.wallet.label'),
      description: t('sellPage.issueSteps.wallet.description'),
      status: 'pending',
    },

    {
      key: 'funding',
      label: t('sellPage.issueSteps.funding.label'),
      description: t('sellPage.issueSteps.funding.description'),
      status: 'pending',
    },

    {
      key: 'store',
      label: t('sellPage.issueSteps.store.label'),
      description: t('sellPage.issueSteps.store.description'),
      status: 'pending',
    },

    {
      key: 'broadcast',
      label: t('sellPage.issueSteps.broadcast.label'),
      description: t('sellPage.issueSteps.broadcast.description'),
      status: 'pending',
    },

    {
      key: 'confirmFunding',
      label: t('sellPage.issueSteps.confirmFunding.label'),
      description: t('sellPage.issueSteps.confirmFunding.description'),
      status: 'pending',
    },
  ];
}

const issueProgressSteps = ref<IssueProgressStep[]>(createIssueProgressSteps());

function updateIssueProgressStepTranslations(): void {
  const translatedSteps = createIssueProgressSteps();

  issueProgressSteps.value = issueProgressSteps.value.map((step) => {
    const translatedStep = translatedSteps.find(
      (nextStep) => nextStep.key === step.key
    );

    if (!translatedStep) {
      return step;
    }

    return {
      ...step,
      label: translatedStep.label,
      description: translatedStep.description,
    };
  });
}

watch(locale, () => {
  updateIssueProgressStepTranslations();
});

async function loadTreasuryWallet(): Promise<void> {
  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();

    if (!treasuryWallet.value.isSetup) {
      treasuryBalance.value = null;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = t('sellPage.messages.couldNotLoadTreasuryWallet');
  }
}

async function handleRefreshTreasuryBalance(): Promise<void> {
  clearMessages();
  isCheckingTreasuryBalance.value = true;

  try {
    treasuryBalance.value = await getTreasuryWalletBalance();
    successMessage.value = t('sellPage.messages.treasuryBalanceRefreshed');
  } catch (error) {
    console.error(error);
    errorMessage.value = t('sellPage.messages.couldNotRefreshTreasuryBalance');
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

function waitForUiDelay(milliseconds: number): Promise<void> {
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
  pendingIssueOperationId.value = null;
  pendingTreasuryFundingPreview.value = null;
  pendingFundingBroadcast.value = null;
  pendingVoucherAddress.value = null;
  pendingKeyMetadata.value = null;

  if (!Number.isFinite(fiatAmountMinor) || fiatAmountMinor <= 0) {
    errorMessage.value = t('sellPage.messages.enterValidCashAmount');
    return;
  }

  isSubmitting.value = true;

  try {
    await loadTreasuryWallet();

    if (treasuryWallet.value.isSetup) {
      try {
        treasuryBalance.value = await withTimeout(
          getTreasuryWalletBalance(),
          8_000,
          t('sellPage.messages.treasuryBalanceCheckTimedOut')
        );
      } catch (error) {
        console.error(error);
        treasuryBalance.value = null;
        warningMessage.value = t(
          'sellPage.messages.treasuryBalanceCouldNotBeCheckedWarning'
        );
      }
    }

    const lockedQuote = await pricingService.getLockedQuote(fiatCurrency, {
      ttlMilliseconds: TOPUP_PRICE_QUOTE_TTL_MILLISECONDS,
    });

    pendingPricing.value = calculateTopupPricingV1FromLockedQuote(
      fiatAmountMinor,
      lockedQuote
    );

    pendingFeeOutputPlan.value = createVoucherFeeOutputPlanV1(
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
      warningMessage.value = t('sellPage.messages.voucherKeyExportFailed');
    }

    if (treasuryWallet.value.isSetup && treasuryWallet.value.address) {
      pendingTreasuryFundingPreview.value = createTreasuryFundingPreview({
        treasuryAddress: treasuryWallet.value.address,
        voucherAddress: pendingVoucherAddress.value.address,

        amountSats: pendingPricing.value.finalBchSats,

        platformFeeSats: pendingFeeOutputPlan.value.platformFeeSats,

        bufferReserveSats: 0,

        treasuryBalanceSats: treasuryBalance.value?.balanceSats ?? 0,

        treasuryUtxoCount: treasuryBalance.value?.utxoCount ?? 0,

        treasuryUtxos: treasuryBalance.value?.utxos ?? [],
      });
    }

    pendingIssueOperationId.value = createTopupIssueOperationId();

    if (lockedQuote.isFallbackQuote) {
      warningMessage.value = t('sellPage.messages.fallbackQuoteWarning');
    } else if (!warningMessage.value) {
      successMessage.value = t('sellPage.messages.liveQuoteLocked');
    }

    isConfirmDialogOpen.value = true;
  } catch (error) {
    console.error(error);

    if (error instanceof PricingUnavailableError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = t('sellPage.messages.couldNotPrepareReview');
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

async function recordCashOnHandForIssuedTopup(
  voucher: VoucherRecord
): Promise<void> {
  try {
    await recordTopupSaleCashReceived({
      amountMinor: voucher.fiatAmountMinor,
      currency: voucher.fiatCurrency,
      relatedRecordId: voucher.id,
      note: `Topup ${voucher.serial}`,
      createdAt: voucher.createdAt,
    });
  } catch (error) {
    console.error(error);

    warningMessage.value =
      'The Topup was issued, but Cash on Hand could not be updated automatically.';
  }
}

async function handleCreateDraftVoucher(): Promise<void> {
  /**
   * First line of double-submit protection.
   *
   * If an Issue operation is already running, a second call is ignored.
   */
  if (isIssueOperationRunning.value) {
    return;
  }

  clearMessages();

  lastIssuedVoucher.value = null;
  isReceiptPreviewDialogOpen.value = false;

  /**
   * Capture the exact Review state before async work begins.
   *
   * Once Issue starts, later UI/ref changes must not alter the financial
   * values being used by this operation.
   */
  const pricing = pendingPricing.value;
  const voucherAddress = pendingVoucherAddress.value;
  const feeOutputPlan = pendingFeeOutputPlan.value;
  const treasuryFundingPreview = pendingTreasuryFundingPreview.value;
  const issueOperationId = pendingIssueOperationId.value;

  /**
   * These failures mean Review was incomplete, so they happen before the
   * progress dialog begins.
   */
  if (!pricing) {
    errorMessage.value = t('sellPage.messages.noLockedQuote');

    return;
  }

  if (!voucherAddress) {
    errorMessage.value = t('sellPage.messages.noVoucherAddress');

    return;
  }

  if (!issueOperationId) {
    errorMessage.value = t('sellPage.messages.noIssueOperation');

    return;
  }

  if (!feeOutputPlan || !treasuryFundingPreview) {
    errorMessage.value = t('sellPage.messages.fundingIntentNotReady');

    return;
  }

  isIssueOperationRunning.value = true;
  isSubmitting.value = true;

  isConfirmDialogOpen.value = false;

  resetIssueProgressSteps();

  isProgressDialogOpen.value = true;

  /**
   * The currently-running real operation.
   *
   * If an exception occurs, this tells the dialog which step should receive
   * the red error state.
   */
  let activeIssueProgressStep:
    | 'quote'
    | 'wallet'
    | 'funding'
    | 'store'
    | 'broadcast'
    | 'confirmFunding' = 'quote';

  /**
   * True when this Issue action discovers an already-saved voucher instead
   * of creating another record.
   */
  let reusedExistingVoucher = false;

  try {
    /**
     * ================================================================
     * DURABLE IDEMPOTENCY RECOVERY
     * ================================================================
     *
     * If this exact merchant Issue operation has already crossed the durable
     * persistence boundary, reuse that record.
     *
     * We must never create or sign a second transaction for the same Issue
     * operation.
     */
    const existingVoucher = await getVoucherRecordByIssueOperationId(
      issueOperationId
    );

    let savedVoucher: VoucherRecord;

    if (existingVoucher) {
      reusedExistingVoucher = true;

      /**
       * These stages already happened before the durable record was created.
       */
      setIssueProgressStepStatus('quote', 'complete');

      setIssueProgressStepStatus('wallet', 'complete');

      setIssueProgressStepStatus('funding', 'complete');

      setIssueProgressStepStatus('store', 'complete');

      savedVoucher = existingVoucher;
    } else {
      /**
       * ================================================================
       * STEP 1 — CONFIRM LOCKED QUOTE
       * ================================================================
       */
      activeIssueProgressStep = 'quote';

      setIssueProgressStepStatus('quote', 'active');

      const quoteIssueSafety = getTopupQuoteIssueSafety(pricing);

      if (quoteIssueSafety.status !== 'valid') {
        throw new Error(t('sellPage.messages.quoteExpired'));
      }

      setIssueProgressStepStatus('quote', 'complete');

      /**
       * ================================================================
       * STEP 2 — PREPARE VOUCHER WALLET
       * ================================================================
       *
       * The wallet was derived during Review. Here we verify that the exact
       * address/derivation information still exists.
       */
      activeIssueProgressStep = 'wallet';

      setIssueProgressStepStatus('wallet', 'active');

      if (!voucherAddress.address || voucherAddress.derivationIndex < 0) {
        throw new Error(t('sellPage.messages.noVoucherAddress'));
      }

      setIssueProgressStepStatus('wallet', 'complete');

      /**
       * ================================================================
       * STEP 3 — PREPARE EXACT FUNDING TRANSACTION
       * ================================================================
       *
       * This creates:
       *
       * - exact treasury inputs
       * - exact voucher/platform/change outputs
       * - signed raw transaction
       * - actual miner fee
       * - deterministic transaction ID
       *
       * NOTHING is broadcast here.
       */
      activeIssueProgressStep = 'funding';

      setIssueProgressStepStatus('funding', 'active');

      const fundingIntent = await prepareTopupFundingIntent({
        operationId: issueOperationId,

        treasuryFundingPreview,

        feeOutputPlan,
      });

      /**
       * Signing can take time, so verify the locked quote once more before
       * allowing the signed transaction to become durable.
       *
       * It is still safe to abort here because nothing has been broadcast.
       */
      const finalQuoteIssueSafety = getTopupQuoteIssueSafety(pricing);

      if (finalQuoteIssueSafety.status !== 'valid') {
        throw new Error(t('sellPage.messages.quoteExpired'));
      }

      setIssueProgressStepStatus('funding', 'complete');

      /**
       * ================================================================
       * STEP 4 — SECURE DURABLE TRANSACTION RECORD
       * ================================================================
       */
      activeIssueProgressStep = 'store';

      setIssueProgressStepStatus('store', 'active');

      const feeModelSnapshot = createTopupFeeModelV1Snapshot(pricing, {
        estimatedNetworkFeeSats: treasuryFundingPreview.estimatedFeeSats,
      });

      const voucher = createDraftVoucherRecord(
        pricing.customerPaysMinor,
        pricing.fiatCurrency,
        pricing,
        {
          addressData: {
            derivationIndex: voucherAddress.derivationIndex,

            address: voucherAddress.address,
          },

          keyMetadata: pendingKeyMetadata.value,

          feeModel: feeModelSnapshot,

          feeOutputPlan,

          treasuryFundingPreview,

          issueOperationId,

          fundingIntent,
        }
      );

      /**
       * ================================================================
       * CRITICAL WRITE-AHEAD BOUNDARY
       * ================================================================
       *
       * After this succeeds we have durably stored:
       *
       * - one Issue operation ID
       * - one exact signed transaction
       * - one exact deterministic txid
       *
       * Only this persisted transaction may ever be broadcast.
       */
      const savedResult = await addVoucherRecordIdempotently(voucher);

      savedVoucher = savedResult.record;

      reusedExistingVoucher = !savedResult.created;

      setIssueProgressStepStatus('store', 'complete');
    }

    /**
     * ================================================================
     * DEVELOPMENT SAFETY BOUNDARY
     * ================================================================
     *
     * While real broadcasting is globally disabled, stop here.
     *
     * We deliberately DO NOT call the funding lifecycle service at all.
     * That means this development flow cannot accidentally submit BCH.
     *
     * The progress dialog explicitly shows that both network stages were
     * skipped rather than pretending they succeeded.
     */
    const fundingSafety = getFundingSafetyStatus();

    if (!fundingSafety.realBroadcastEnabled) {
      setIssueProgressStepStatus('broadcast', 'skipped');

      setIssueProgressStepStatus('confirmFunding', 'skipped');

      /**
       * Preserve the existing development/testing accounting behaviour while
       * live broadcast remains intentionally disabled.
       *
       * B5.7 will later finalise production funding/failure semantics.
       */
      await recordCashOnHandForIssuedTopup(savedVoucher);

      /**
       * Leave the four completed ticks plus two skipped network stages visible
       * briefly so the merchant can see exactly what happened.
       */
      await waitForUiDelay(300);

      lastIssuedVoucher.value = savedVoucher;

      /**
       * Clear the completed Review/Issue state.
       */
      pendingPricing.value = null;

      pendingFeeOutputPlan.value = null;

      pendingTreasuryFundingPreview.value = null;

      pendingFundingBroadcast.value = null;

      pendingVoucherAddress.value = null;

      pendingKeyMetadata.value = null;

      pendingIssueOperationId.value = null;

      isProgressDialogOpen.value = false;

      isReceiptPreviewDialogOpen.value = true;

      if (reusedExistingVoucher) {
        warningMessage.value = t(
          'sellPage.messages.issueOperationAlreadySaved'
        );
      }

      await loadTreasuryWallet();

      return;
    }

    /**
     * ================================================================
     * STEP 5 / STEP 6 — DURABLE BCH FUNDING LIFECYCLE
     * ================================================================
     *
     * This branch is unreachable while REAL_BROADCAST_ENABLED is false.
     *
     * Once intentionally enabled later, the lifecycle:
     *
     * 1. reconciles the exact saved txid BEFORE any broadcast;
     * 2. broadcasts only fundingIntent.rawTransactionHex if required;
     * 3. persists the broadcast result;
     * 4. reconciles the same txid again;
     * 5. never creates or signs a replacement transaction.
     */
    activeIssueProgressStep = 'broadcast';

    setIssueProgressStepStatus('broadcast', 'active');

    const lifecycleResult = await advanceTopupFundingLifecycle(
      savedVoucher.id,
      undefined,
      (phase) => {
        /**
         * The pre-broadcast reconciliation belongs to the submission stage:
         * we first check whether this exact transaction is already visible
         * before deciding whether another submission is necessary.
         */
        if (phase === 'pre_broadcast_reconciliation' || phase === 'broadcast') {
          activeIssueProgressStep = 'broadcast';

          setIssueProgressStepStatus('broadcast', 'active');

          return;
        }

        /**
         * A post-broadcast reconciliation means transaction submission has
         * finished and we're now checking network visibility.
         */
        setIssueProgressStepStatus('broadcast', 'complete');

        activeIssueProgressStep = 'confirmFunding';

        setIssueProgressStepStatus('confirmFunding', 'active');
      }
    );

    pendingFundingBroadcast.value = lifecycleResult.broadcastResult ?? null;

    savedVoucher = lifecycleResult.record;

    switch (lifecycleResult.outcome) {
      case 'funded': {
        /**
         * If no broadcast result exists, pre-broadcast reconciliation found
         * the exact transaction already on the network.
         *
         * In that case we truthfully show that a new submission was skipped.
         */
        if (lifecycleResult.broadcastResult) {
          setIssueProgressStepStatus('broadcast', 'complete');
        } else {
          setIssueProgressStepStatus('broadcast', 'skipped');
        }

        setIssueProgressStepStatus('confirmFunding', 'complete');

        break;
      }

      case 'blocked': {
        activeIssueProgressStep = 'broadcast';

        setIssueProgressStepStatus('broadcast', 'error');

        setIssueProgressStepStatus('confirmFunding', 'skipped');

        throw new Error(
          lifecycleResult.broadcastResult?.errorMessage ??
            'Funding transaction broadcast was blocked.'
        );
      }

      case 'definitely_not_broadcast': {
        activeIssueProgressStep = 'broadcast';

        setIssueProgressStepStatus('broadcast', 'error');

        setIssueProgressStepStatus('confirmFunding', 'skipped');

        throw new Error(
          lifecycleResult.broadcastResult?.errorMessage ??
            'Funding transaction was not submitted to the BCH network.'
        );
      }

      case 'broadcasted_pending_detection': {
        setIssueProgressStepStatus('broadcast', 'complete');

        activeIssueProgressStep = 'confirmFunding';

        setIssueProgressStepStatus('confirmFunding', 'error');

        throw new Error(
          'The funding transaction was submitted successfully, but the exact transaction is not yet visible during reconciliation. The saved transaction must be checked again before proceeding.'
        );
      }

      case 'uncertain': {
        /**
         * The request was attempted but its network outcome could not be
         * proven, and reconciliation still cannot see the exact txid.
         *
         * This MUST NOT trigger construction of another transaction.
         */
        setIssueProgressStepStatus('broadcast', 'error');

        activeIssueProgressStep = 'confirmFunding';

        setIssueProgressStepStatus('confirmFunding', 'error');

        throw new Error(
          'The funding broadcast outcome is uncertain. The exact saved transaction must be reconciled before any further funding action.'
        );
      }
    }

    /**
     * Only positive network evidence reaches this point when real broadcasting
     * is enabled.
     */
    await recordCashOnHandForIssuedTopup(savedVoucher);

    await waitForUiDelay(300);

    lastIssuedVoucher.value = savedVoucher;

    pendingPricing.value = null;

    pendingFeeOutputPlan.value = null;

    pendingTreasuryFundingPreview.value = null;

    pendingFundingBroadcast.value = null;

    pendingVoucherAddress.value = null;

    pendingKeyMetadata.value = null;

    pendingIssueOperationId.value = null;

    isProgressDialogOpen.value = false;

    isReceiptPreviewDialogOpen.value = true;

    if (reusedExistingVoucher) {
      warningMessage.value = t('sellPage.messages.issueOperationAlreadySaved');
    }

    await loadTreasuryWallet();
  } catch (error) {
    console.error(error);

    /**
     * During B5 development, expose the exact internal error so safety-path
     * failures can be diagnosed accurately.
     *
     * These will become merchant-safe messages before release.
     */
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('sellPage.messages.couldNotIssueVoucher');

    /**
     * Ensure the operation that actually failed is no longer left spinning.
     *
     * Once there is no active step and at least one error, the progress dialog
     * becomes dismissible via its X/backdrop.
     */
    setIssueProgressStepStatus(activeIssueProgressStep, 'error');
  } finally {
    isSubmitting.value = false;

    isIssueOperationRunning.value = false;
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
.issued-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.sell-hero {
  padding: 24px;
}

.hero-heading {
  justify-content: space-between;
}

.hero-action-icons {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.hero-icon-button {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  border-radius: 14px;
  color: #111111;
  height: 42px;
  overflow: hidden;
  width: 42px;
}

.hero-icon-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.hero-form-wrap {
  margin-top: 20px;
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
  max-width: 660px;
}

.quick-action-status-ready,
.quick-action-status-muted {
  height: 10px;
  min-height: 10px;
  min-width: 10px;
  padding: 0;
  right: 6px;
  top: 6px;
  width: 10px;
}

.quick-action-status-ready {
  background: #00ce1b;
}

.quick-action-status-muted {
  background: #8a8a8a;
}

.status-heading-row,
.section-heading,
.issued-heading,
.treasury-dialog-title-row {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.status-icon,
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

.status-icon {
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

.issued-card :deep(.q-card__section) {
  padding: 22px;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #ffffff;
  font-weight: 800;
}

.secondary-button {
  border-color: #222222;
  border-radius: 14px;
  color: #111111;
  font-weight: 800;
}

.developer-details {
  border: 1px solid #dddddd;
  border-radius: 14px;
  overflow: hidden;
}

.treasury-dialog-card {
  border-radius: 24px;
  max-width: 95vw;
  width: 560px;
}

.treasury-dialog-card :deep(.q-card__section) {
  padding: 22px;
}

.dialog-info-list {
  border-radius: 16px;
  overflow: hidden;
}

.treasury-dialog-actions {
  gap: 10px;
  padding: 14px 22px 18px;
}

@media (max-width: 640px) {
  .sell-hero {
    padding: 22px;
  }

  .hero-heading {
    align-items: flex-start;
  }

  .hero-action-icons {
    padding-top: 2px;
  }

  .treasury-dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .treasury-dialog-actions .q-btn {
    width: 100%;
  }
}
</style>
