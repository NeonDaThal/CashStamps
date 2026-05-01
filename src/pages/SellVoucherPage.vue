<template>
  <q-page padding>
    <div class="q-mx-auto" style="max-width: 760px">
      <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="info" />
        </template>

        Phase 3 has started. This screen now locks a real BCH/GBP quote before
        confirmation, but funding is still fake and no BCH is sent yet.
      </q-banner>

      <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="warning" />
        </template>

        Development note: voucher addresses are now derived from a local test
        mnemonic stored in browser storage. This is acceptable for MVP testing
        only. Secure storage and merchant wallet setup will be hardened before
        real funds are used.
      </q-banner>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-start q-col-gutter-md">
            <div class="col">
              <div class="text-h6">Treasury wallet status</div>

              <p class="text-grey-7 q-mb-sm">
                The treasury wallet will later fund issued BCH vouchers.
              </p>

              <div v-if="treasuryWallet.isSetup">
                <q-badge color="positive" class="q-mb-sm"> Set up </q-badge>

                <div class="text-body2 text-break q-mb-xs">
                  <strong>Address:</strong>
                  {{ treasuryWallet.address }}
                </div>

                <div v-if="treasuryBalance" class="text-body2 q-mb-xs">
                  <strong>Balance:</strong>
                  {{ formatBchSats(treasuryBalance.balanceSats) }}
                  / {{ treasuryBalance.balanceSats.toLocaleString() }} sats
                </div>

                <div v-if="treasuryBalance" class="text-body2 q-mb-xs">
                  <strong>UTXOs:</strong>
                  {{ treasuryBalance.utxoCount }}
                </div>

                <div v-if="treasuryBalance" class="text-caption text-grey-7">
                  Last checked:
                  {{ formatDateTime(treasuryBalance.checkedAt) }}
                </div>

                <div v-else class="text-body2 text-grey-7">
                  Balance has not been checked yet.
                </div>
              </div>

              <div v-else>
                <q-badge color="grey-7" class="q-mb-sm"> Not set up </q-badge>

                <div class="text-body2 text-grey-7">
                  Create a local test treasury wallet before real funding is
                  added.
                </div>
              </div>
            </div>

            <div class="col-auto column q-gutter-sm">
              <q-btn
                flat
                color="primary"
                label="Treasury Settings"
                to="/treasury-settings"
              />

              <q-btn
                v-if="treasuryWallet.isSetup"
                outline
                color="secondary"
                label="Refresh Balance"
                :loading="isCheckingTreasuryBalance"
                @click="handleRefreshTreasuryBalance"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h4 q-mb-xs">Sell BCH Voucher</div>
          <p class="text-grey-7 q-mb-none">
            Enter the customer&apos;s cash amount to review a real BCH quote and
            create a test voucher record.
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

      <q-card v-if="lastIssuedVoucher" flat bordered class="q-mt-md bg-green-1">
        <q-card-section>
          <div class="row items-start q-col-gutter-md">
            <div class="col">
              <div class="text-h6 text-green-10">
                Fake voucher issued successfully
              </div>

              <p class="text-green-10 q-mb-sm">
                This test voucher has been saved locally. No BCH was sent.
              </p>

              <div class="text-body2">
                <strong>Voucher reference:</strong>
                {{ lastIssuedVoucher.serial }}
              </div>

              <div class="text-body2">
                <strong>Customer paid:</strong>
                {{
                  formatFiatAmount(
                    lastIssuedVoucher.fiatAmountMinor,
                    lastIssuedVoucher.fiatCurrency
                  )
                }}
              </div>

              <div class="text-body2">
                <strong>Estimated BCH loaded:</strong>
                {{ formatBchSats(lastIssuedVoucher.finalBchSats) }}
              </div>

              <div class="text-body2">
                <strong>Voucher address:</strong>
                {{ lastIssuedVoucher.address }}
              </div>

              <div class="text-body2">
                <strong>Derivation index:</strong>
                {{ lastIssuedVoucher.derivationIndex }}
              </div>

              <div class="text-body2">
                <strong>Status:</strong>
                {{ lastIssuedVoucher.status }}
              </div>
            </div>

            <div class="col-auto">
              <q-icon name="check_circle" color="positive" size="42px" />
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
          />

          <q-btn
            color="primary"
            label="Issue Another"
            @click="handleResetLastIssuedVoucher"
          />
        </q-card-actions>
      </q-card>

      <q-banner
        v-if="successMessage"
        class="bg-green-1 text-green-9 q-mt-md"
        rounded
      >
        {{ successMessage }}
      </q-banner>

      <q-banner
        v-if="warningMessage"
        class="bg-orange-1 text-orange-10 q-mt-md"
        rounded
      >
        {{ warningMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mt-md" rounded>
        {{ errorMessage }}
      </q-banner>

      <SaleConfirmDialog
        v-if="pendingPricing"
        v-model="isConfirmDialogOpen"
        :pricing="pendingPricing"
        :is-submitting="isSubmitting"
        :treasury-warning="treasuryWarning"
        :treasury-balance-sats="treasuryBalance?.balanceSats"
        :treasury-funding-preview="pendingTreasuryFundingPreview"
        @confirm="handleCreateDraftVoucher"
      />

      <IssueProgressDialog
        v-model="isProgressDialogOpen"
        :steps="issueProgressSteps"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import IssueProgressDialog, {
  type IssueProgressStep,
} from 'src/components/IssueProgressDialog.vue';
import SaleConfirmDialog from 'src/components/SaleConfirmDialog.vue';
import VoucherSaleForm from 'src/components/VoucherSaleForm.vue';
import type {
  TreasuryWalletBalance,
  TreasuryWalletPublicInfo,
} from 'src/types/treasury';
import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import { createTreasuryFundingPreview } from 'src/services/treasury-funding';
import type { VoucherRecord } from 'src/types/voucher';
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
  type DerivedVoucherAddress,
} from 'src/services/voucher-wallet';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';

const pricingService = new PricingService();

const isSubmitting = ref(false);
const isCheckingTreasuryBalance = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');

const isConfirmDialogOpen = ref(false);
const isProgressDialogOpen = ref(false);

const pendingFiatAmountMinor = ref(0);
const pendingFiatCurrency = ref('GBP');
const pendingPricing = ref<FakeVoucherPricingQuote | null>(null);
const pendingTreasuryFundingPreview = ref<TreasuryFundingPreview | null>(null);
const pendingVoucherAddress = ref<DerivedVoucherAddress | null>(null);

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
    return 'Treasury wallet is not set up. Fake issuing can continue, but real funding will be blocked until a treasury wallet exists.';
  }

  if (!treasuryBalance.value) {
    return 'Treasury balance has not been checked. Fake issuing can continue, but real funding will require a fresh balance check.';
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
    label: 'Use locked quote',
    description: 'Use the BCH/GBP quote locked before confirmation.',
    status: 'pending',
  },
  {
    key: 'wallet',
    label: 'Use derived voucher wallet',
    description: 'Use the voucher address prepared before confirmation.',
    status: 'pending',
  },
  {
    key: 'funding',
    label: 'Simulate treasury funding',
    description: 'No BCH is sent yet.',
    status: 'pending',
  },
  {
    key: 'store',
    label: 'Save voucher record',
    description: 'Store the test voucher in local browser storage.',
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
  pendingPricing.value = null;
  pendingTreasuryFundingPreview.value = null;
  pendingVoucherAddress.value = null;

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
          'Treasury balance could not be checked. Fake issuing can continue, but real funding will require a fresh balance check.';
      }
    }

    const lockedQuote = await pricingService.getLockedQuote(fiatCurrency);

    pendingPricing.value = calculateVoucherPricingFromLockedQuote(
      fiatAmountMinor,
      lockedQuote
    );

    pendingVoucherAddress.value = await deriveNextVoucherAddress();

    if (treasuryWallet.value.isSetup && treasuryWallet.value.address) {
      pendingTreasuryFundingPreview.value = createTreasuryFundingPreview({
        treasuryAddress: treasuryWallet.value.address,
        voucherAddress: pendingVoucherAddress.value.address,
        amountSats: pendingPricing.value.finalBchSats,
        treasuryBalanceSats: treasuryBalance.value?.balanceSats ?? 0,
        treasuryUtxoCount: treasuryBalance.value?.utxoCount ?? 0,
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
  lastIssuedVoucher.value = null;
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
        treasuryFundingPreview: pendingTreasuryFundingPreview.value,
      }
    );

    await addVoucherRecord(voucher);

    setIssueProgressStepStatus('store', 'complete');
    await waitForFakeStep(300);

    lastIssuedVoucher.value = voucher;
    pendingPricing.value = null;
    pendingTreasuryFundingPreview.value = null;
    pendingVoucherAddress.value = null;
    isProgressDialogOpen.value = false;

    await loadTreasuryWallet();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not create fake voucher.';
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
