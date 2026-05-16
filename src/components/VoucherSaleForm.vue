<template>
  <q-form class="voucher-sale-form" @submit.prevent="handleSubmit">
    <q-input
      v-model.number="fiatAmount"
      type="number"
      min="1"
      step="1"
      :label="t('sellForm.customerCashAmount')"
      prefix="£"
      outlined
      :disable="isSubmitting"
      class="amount-input"
    />

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

          <q-icon name="currency_bitcoin" />
        </div>

        <div class="preview-grid">
          <div class="preview-item highlight">
            <div class="preview-label">
              {{ t('sellForm.customerPays') }}
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

          <div class="preview-item">
            <div class="preview-label">
              {{ t('sellForm.serviceFee') }}
            </div>
            <div class="preview-value">
              {{
                formatBasisPointsAsPercent(previewPricing.serviceFeeBasisPoints)
              }}
              —
              {{
                formatMinorFiatAmount(
                  previewPricing.serviceFeeAmountMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="preview-item">
            <div class="preview-label">
              {{ t('sellForm.voucherValueBeforeQuote') }}
            </div>
            <div class="preview-value">
              {{
                formatMinorFiatAmount(
                  previewPricing.voucherValueMinor,
                  previewPricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="preview-item">
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

      <q-btn
        class="secondary-button"
        :label="t('sellForm.viewHistory')"
        icon="receipt_long"
        to="/voucher-history"
        outline
        no-caps
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  calculateFakeVoucherPricing,
  formatBasisPointsAsPercent,
  formatMinorFiatAmount,
} from 'src/services/voucher-pricing';

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

const previewPricing = computed(() =>
  calculateFakeVoucherPricing(fiatAmountMinor.value, fiatCurrency)
);

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

.amount-input :deep(.q-field__control) {
  border-radius: 16px;
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

.pricing-header .q-icon {
  align-items: center;
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  display: flex;
  flex: 0 0 42px;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.preview-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
}

.preview-item {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 14px;
}

.preview-item.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.preview-label {
  color: #666666;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.preview-value {
  color: #111111;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
}

.action-row {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.primary-button,
.secondary-button {
  border-radius: 14px;
  font-weight: 800;
  min-height: 46px;
  padding: 0 18px;
}

.primary-button {
  background: #00ce1b;
  color: #000000;
}

.secondary-button {
  border-color: #222222;
  color: #111111;
}

@media (max-width: 640px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
