<template>
  <q-form class="voucher-sale-form" @submit.prevent="handleSubmit">
    <div class="amount-field">
      <div class="amount-field-label">
        {{ t('sellForm.customerCashAmount') }}
      </div>

      <q-input
        v-model.number="fiatAmount"
        type="number"
        inputmode="decimal"
        min="0.01"
        step="0.01"
        :aria-label="t('sellForm.customerCashAmount')"
        prefix="£"
        borderless
        :disable="isSubmitting"
        class="amount-input"
      />
    </div>

    <q-card flat bordered class="pricing-card">
      <q-card-section>
        <div class="pricing-header">
          <div>
            <div class="text-subtitle1 text-weight-bold">
              {{ t('sellForm.salePreviewTitle') }}
            </div>
            <div class="text-caption text-grey-7">
              {{ t('sellForm.salePreviewSubtitle') }}
            </div>
          </div>

          <div class="pricing-logo-wrap" aria-hidden="true">
            <img :src="bchLogoUrl" alt="" class="pricing-logo" />
          </div>
        </div>

        <div class="preview-breakdown">
          <div class="preview-line">
            <div class="preview-label">
              {{ t('sellForm.topupAmount') }}
            </div>

            <div class="preview-value">
              {{
                formatMinorFiatAmount(
                  previewPricing.principalMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="preview-line preview-line--subtle">
            <div class="preview-label">
              {{ t('sellForm.serviceFee') }}
            </div>

            <div class="preview-value">
              {{
                formatMinorFiatAmount(
                  previewPricing.serviceFeeAmountMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="preview-line preview-line--primary">
            <div class="preview-label">
              {{ t('sellForm.customerToPay') }}
            </div>

            <div class="preview-value">
              {{
                formatMinorFiatAmount(
                  previewPricing.customerPaysMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="preview-line preview-line--quote">
            <div class="preview-label">
              {{ t('sellForm.quoteSource') }}
            </div>

            <div class="preview-value">
              {{ t('sellForm.lockedAfterReview') }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="action-row">
      <q-btn
        type="submit"
        class="primary-button"
        :label="t('sellForm.reviewVoucher')"
        icon="fact_check"
        :loading="isSubmitting"
        :disable="!canCreateVoucher"
        unelevated
        no-caps
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import { formatMinorFiatAmount } from 'src/services/voucher-pricing';

import { calculateTopupFeeModelV1 } from 'src/services/fee-model';

const { t } = useI18n({ useScope: 'global' });

const emit = defineEmits<{
  reviewVoucher: [fiatAmountMinor: number, fiatCurrency: string];
}>();

const fiatAmount = ref(100);
const fiatCurrency = 'GBP';

defineProps<{
  isSubmitting: boolean;
}>();

const fiatAmountMinor = computed(() => Math.round(fiatAmount.value * 100));

const canCreateVoucher = computed(() => {
  return Number.isFinite(fiatAmount.value) && fiatAmount.value > 0;
});

const previewPricing = computed(() => {
  const amount = Number(fiatAmount.value);

  const principalMinor =
    Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;

  if (principalMinor <= 0) {
    return {
      fiatCurrency: 'GBP',
      principalMinor: 0,
      serviceFeeAmountMinor: 0,
      customerPaysMinor: 0,
    };
  }

  const feeModel = calculateTopupFeeModelV1(principalMinor, 'GBP');

  return {
    fiatCurrency: feeModel.currency,
    principalMinor: feeModel.principalMinor,
    serviceFeeAmountMinor: feeModel.serviceFeeMinor,
    customerPaysMinor: feeModel.customerTotalBeforeNetworkFeeMinor,
  };
});

function handleSubmit(): void {
  if (!canCreateVoucher.value) {
    return;
  }

  emit('reviewVoucher', fiatAmountMinor.value, fiatCurrency);
}
</script>

<style lang="scss" scoped>
.voucher-sale-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.amount-field {
  background: #ffffff;
  border: 2px solid #00ce1b;
  border-radius: 20px;
  padding: 7px 16px 8px;
}

.amount-field-label {
  color: #555555;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.1;
  margin-bottom: 0;
}

.amount-input :deep(.q-field__control) {
  min-height: 34px;
  padding: 0;
}

.amount-input :deep(.q-field__control-container) {
  padding-top: 0;
}

.amount-input :deep(.q-field__native),
.amount-input :deep(.q-field__prefix) {
  color: #111111;
  font-size: 30px;
  font-weight: 950;
  line-height: 1;
}

.amount-input :deep(.q-field__prefix) {
  align-items: center;
  display: flex;
  padding-bottom: 0;
  padding-right: 5px;
  transform: translateY(-3px);
}

.amount-input :deep(.q-field__native) {
  padding: 0;
}

.amount-input :deep(input[type='number']) {
  -moz-appearance: textfield;
  appearance: textfield;
}

.amount-input :deep(input[type='number']::-webkit-inner-spin-button),
.amount-input :deep(input[type='number']::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.pricing-card {
  background: #f7f8f7;
  border-color: #dddddd;
  border-radius: 20px;
}

.pricing-card :deep(.q-card__section) {
  padding: 18px;
}

.pricing-header {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pricing-logo-wrap {
  align-items: center;
  background: #00ce1b;
  border-radius: 50%;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
  display: flex;
  flex: 0 0 42px;
  height: 42px;
  justify-content: center;
  overflow: hidden;
  width: 42px;
}

.pricing-logo {
  border-radius: 50%;
  display: block;
  height: 82%;
  object-fit: contain;
  width: 82%;
}

.preview-breakdown {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  overflow: hidden;
  padding: 2px 14px;
}

.preview-line {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 12px 0;
}

.preview-line + .preview-line {
  border-top: 1px solid #eeeeee;
}

.preview-line--primary {
  padding-top: 13px;
}

.preview-line--subtle {
  color: #777777;
  padding: 9px 0;
}

.preview-line--quote {
  background: transparent;
}

.preview-label {
  color: #666666;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.2;
  min-width: 0;
}

.preview-value {
  color: #111111;
  flex: 0 0 auto;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
}

.preview-line--primary .preview-value {
  font-size: 17px;
  font-weight: 950;
}

.preview-line--subtle .preview-label,
.preview-line--subtle .preview-value {
  color: #777777;
  font-size: 12px;
  font-weight: 800;
}

.preview-line--quote .preview-label,
.preview-line--quote .preview-value {
  color: #777777;
  font-size: 12px;
  font-weight: 800;
}

.action-row {
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #ffffff;
  font-size: 17px;
  font-weight: 850;
  min-height: 48px;
  overflow: hidden;
  padding: 0 22px;
}

.primary-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

@media (max-width: 640px) {
  .amount-field {
    border-radius: 18px;
    padding: 5px 14px 5px;
  }

  .amount-field-label {
    font-size: 12px;
    line-height: 1;
    margin-bottom: 0;
    padding-top: 8px;
  }

  .amount-input :deep(.q-field__control) {
    min-height: 28px;
  }

  .amount-input :deep(.q-field__native),
  .amount-input :deep(.q-field__prefix) {
    font-size: 24px;
    line-height: 1;
  }

  .amount-input :deep(.q-field__prefix) {
    transform: translateY(-2px);
  }

  .preview-breakdown {
    padding: 2px 12px;
  }

  .preview-line {
    gap: 12px;
    padding: 11px 0;
  }

  .preview-label {
    font-size: 12px;
  }

  .preview-value {
    font-size: 14px;
  }

  .preview-line--primary .preview-value {
    font-size: 16px;
  }

  .action-row {
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
  }
}
</style>
