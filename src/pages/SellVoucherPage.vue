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
import { ref } from 'vue';

import IssueProgressDialog, {
  type IssueProgressStep,
} from 'src/components/IssueProgressDialog.vue';
import SaleConfirmDialog from 'src/components/SaleConfirmDialog.vue';
import VoucherSaleForm from 'src/components/VoucherSaleForm.vue';
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
import { addVoucherRecord } from 'src/services/voucher-store';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';

const pricingService = new PricingService();

const isSubmitting = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');

const isConfirmDialogOpen = ref(false);
const isProgressDialogOpen = ref(false);

const pendingFiatAmountMinor = ref(0);
const pendingFiatCurrency = ref('GBP');
const pendingPricing = ref<FakeVoucherPricingQuote | null>(null);

const lastIssuedVoucher = ref<VoucherRecord | null>(null);

const issueProgressSteps = ref<IssueProgressStep[]>([
  {
    key: 'quote',
    label: 'Use locked quote',
    description: 'Use the BCH/GBP quote locked before confirmation.',
    status: 'pending',
  },
  {
    key: 'wallet',
    label: 'Derive placeholder voucher wallet',
    description: 'Real child wallet derivation is added later.',
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

async function handleReviewVoucher(
  fiatAmountMinor: number,
  fiatCurrency: string
): Promise<void> {
  clearMessages();
  lastIssuedVoucher.value = null;
  pendingPricing.value = null;

  if (!Number.isFinite(fiatAmountMinor) || fiatAmountMinor <= 0) {
    errorMessage.value = 'Enter a valid cash amount first.';
    return;
  }

  pendingFiatAmountMinor.value = fiatAmountMinor;
  pendingFiatCurrency.value = fiatCurrency;

  isSubmitting.value = true;

  try {
    const lockedQuote = await pricingService.getLockedQuote(fiatCurrency);

    pendingPricing.value = calculateVoucherPricingFromLockedQuote(
      fiatAmountMinor,
      lockedQuote
    );

    if (lockedQuote.isFallbackQuote) {
      warningMessage.value =
        'Live pricing was unavailable, so a recent cached quote is being used. Review the quote carefully before issuing.';
    } else {
      successMessage.value = 'Live price quote locked successfully.';
    }

    isConfirmDialogOpen.value = true;
  } catch (error) {
    console.error(error);

    if (error instanceof PricingUnavailableError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value =
        'Could not fetch a valid price quote. Please check the connection and try again.';
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

  isSubmitting.value = true;
  isConfirmDialogOpen.value = false;
  isProgressDialogOpen.value = true;

  try {
    await runFakeIssueProgress();

    const voucher = createDraftVoucherRecord(
      pendingFiatAmountMinor.value,
      pendingFiatCurrency.value,
      pendingPricing.value
    );

    await addVoucherRecord(voucher);

    setIssueProgressStepStatus('store', 'complete');
    await waitForFakeStep(300);

    lastIssuedVoucher.value = voucher;
    pendingPricing.value = null;
    isProgressDialogOpen.value = false;
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
</script>
