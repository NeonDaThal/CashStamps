<template>
  <q-form class="voucher-sale-form" @submit.prevent="handleSubmit">
    <div class="amount-field">
      <div class="amount-field-label">
        {{ t('sellForm.customerCashAmount') }}
      </div>

      <q-input
        :model-value="fiatAmount"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        :aria-label="t('sellForm.customerCashAmount')"
        prefix="£"
        borderless
        :disable="isSubmitting"
        class="amount-input"
        @update:model-value="handleAmountInput"
        @blur="handleAmountBlur"
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
import { calculateTopupFeeModelV1 } from 'src/services/fee-model';
import { formatMinorFiatAmount } from 'src/services/voucher-pricing';

const { t } = useI18n({ useScope: 'global' });

const emit = defineEmits<{
  reviewVoucher: [fiatAmountMinor: number, fiatCurrency: string];
}>();

defineProps<{
  isSubmitting: boolean;
}>();

/**
 * Keep fiat entry as text while the merchant is typing.
 *
 * A JavaScript number cannot preserve a trailing zero:
 *
 *   91.50 -> 91.5
 *
 * Keeping the input as text allows monetary formatting to remain intact while
 * all financial calculations continue to use integer minor units.
 */
const fiatAmount = ref('100.00');
const fiatCurrency = 'GBP';

function parseFiatAmountMinor(value: string): number {
  if (!/^\d+(?:\.\d{0,2})?$/.test(value)) {
    return 0;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

const fiatAmountMinor = computed(() => parseFiatAmountMinor(fiatAmount.value));

const canCreateVoucher = computed(() => fiatAmountMinor.value > 0);

const previewPricing = computed(() => {
  const principalMinor = fiatAmountMinor.value;

  if (principalMinor <= 0) {
    return {
      fiatCurrency,
      principalMinor: 0,
      serviceFeeAmountMinor: 0,
      customerPaysMinor: 0,
    };
  }

  const feeModel = calculateTopupFeeModelV1(principalMinor, fiatCurrency);

  return {
    fiatCurrency: feeModel.currency,
    principalMinor: feeModel.principalMinor,
    serviceFeeAmountMinor: feeModel.serviceFeeMinor,
    customerPaysMinor: feeModel.customerTotalBeforeNetworkFeeMinor,
  };
});

function handleAmountInput(value: string | number | null): void {
  let nextValue = String(value ?? '');

  /**
   * Support a decimal comma pasted/typed by users whose keyboard provides it,
   * while storing the canonical decimal separator internally.
   */
  nextValue = nextValue.replace(',', '.');

  /**
   * Money entry only accepts digits and one decimal point.
   */
  nextValue = nextValue.replace(/[^\d.]/g, '');

  const firstDecimalIndex = nextValue.indexOf('.');

  if (firstDecimalIndex >= 0) {
    const wholePart = nextValue.slice(0, firstDecimalIndex);
    const decimalPart = nextValue
      .slice(firstDecimalIndex + 1)
      .replace(/\./g, '')
      .slice(0, 2);

    nextValue = `${wholePart}.${decimalPart}`;
  }

  /**
   * Make ".50" become "0.50".
   */
  if (nextValue.startsWith('.')) {
    nextValue = `0${nextValue}`;
  }

  fiatAmount.value = nextValue;
}

function handleAmountBlur(): void {
  const value = fiatAmount.value;

  if (!value) {
    return;
  }

  if (/^\d+$/.test(value)) {
    fiatAmount.value = `${value}.00`;
    return;
  }

  if (/^\d+\.$/.test(value)) {
    fiatAmount.value = `${value}00`;
    return;
  }

  if (/^\d+\.\d$/.test(value)) {
    fiatAmount.value = `${value}0`;
  }
}

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
