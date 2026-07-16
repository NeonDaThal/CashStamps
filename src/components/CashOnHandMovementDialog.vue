<template>
  <q-dialog
    :model-value="modelValue"
    :position="dialogPosition"
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="handleDialogModelUpdate"
  >
    <q-card
      :class="[
        'cash-movement-dialog-card',
        `cash-movement-dialog-card--${actionType}`,
      ]"
    >
      <q-form class="cash-movement-form" @submit.prevent="handleSave">
        <q-card-section class="cash-movement-header">
          <div class="cash-movement-title-row">
            <div class="cash-movement-icon" aria-hidden="true">
              <q-icon :name="dialogIcon" />
            </div>

            <div class="cash-movement-heading-copy">
              <div class="cash-movement-title">
                {{ title }}
              </div>
              <p class="cash-movement-subtitle">
                {{ subtitle }}
              </p>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="cash-movement-body">
          <div class="cash-movement-amount-field">
            <div class="cash-movement-amount-label">
              {{ amountLabel }}
            </div>

            <q-input
              :model-value="amountInput"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              :prefix="currencyPrefix"
              borderless
              hide-bottom-space
              class="cash-movement-amount-input"
              :disable="isSubmitting"
              :error="showAmountError"
              :error-message="amountErrorMessage"
              @update:model-value="handleAmountInput"
              @keyup.enter="handleSave"
            />
          </div>

          <div class="cash-movement-breakdown-card">
            <div class="cash-movement-breakdown-header">
              <div class="cash-movement-breakdown-title">
                {{ currentLabel }}
              </div>
              <div class="cash-movement-breakdown-balance">
                {{ currentDisplay }}
              </div>
            </div>

            <div class="cash-movement-breakdown-list">
              <div class="cash-movement-breakdown-line">
                <span>{{ enteredLabel }}</span>
                <strong>{{ enteredDisplay }}</strong>
              </div>

              <div
                class="cash-movement-breakdown-line cash-movement-breakdown-line--new"
              >
                <span>{{ newLabel }}</span>
                <strong>{{ newDisplay }}</strong>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions class="cash-movement-actions">
          <q-btn
            flat
            color="grey-8"
            :label="cancelLabel"
            no-caps
            :disable="isSubmitting"
            class="cash-movement-cancel-button"
            @click="handleCancel"
          />

          <q-btn
            type="submit"
            class="cash-movement-save-button"
            :label="saveLabel"
            :disable="!isAmountValid"
            :loading="isSubmitting"
            unelevated
            no-caps
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';

type CashMovementDialogActionType = 'setup' | 'add' | 'withdraw';

const props = defineProps<{
  modelValue: boolean;
  actionType: CashMovementDialogActionType;
  title: string;
  subtitle: string;
  amountLabel: string;
  amountInput: string;
  currencyPrefix: string;
  currentDisplay: string;
  enteredDisplay: string;
  newDisplay: string;
  currentLabel: string;
  enteredLabel: string;
  newLabel: string;
  cancelLabel: string;
  saveLabel: string;
  isAmountValid: boolean;
  showAmountError: boolean;
  amountErrorMessage: string;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'update:amountInput': [value: string];
  cancel: [];
  save: [];
}>();

const $q = useQuasar();

const dialogPosition = computed(() => ($q.screen.lt.sm ? 'top' : undefined));

const dialogIcon = computed(() => {
  if (props.actionType === 'withdraw') {
    return 'remove';
  }

  if (props.actionType === 'setup') {
    return 'settings';
  }

  return 'add';
});

function handleDialogModelUpdate(value: boolean): void {
  emit('update:modelValue', value);
}

function handleAmountInput(value: string | number | null): void {
  emit('update:amountInput', value === null ? '' : String(value));
}

function handleCancel(): void {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleSave(): void {
  if (!props.isAmountValid || props.isSubmitting) {
    return;
  }

  emit('save');
}
</script>

<style lang="scss" scoped>
.cash-movement-dialog-card {
  background: #ffffff;
  border-radius: 26px !important;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  clip-path: inset(0 round 26px);
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  max-width: 500px;
  overflow: hidden;
  width: calc(100vw - 32px);
}

.cash-movement-form {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cash-movement-header {
  background: linear-gradient(135deg, #eaffed 0%, #ffffff 100%);
  border-bottom: 1px solid rgba(0, 206, 27, 0.22);
  padding: 20px;
}

.cash-movement-title-row {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.cash-movement-icon {
  align-items: center;
  background: #ffffff;
  border-radius: 16px;
  border: solid 3px #00ce1b;
  color: #00ce1b;
  display: flex;
  flex: 0 0 48px;
  font-size: 27px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.cash-movement-dialog-card--withdraw .cash-movement-icon {
  background: #ffffff;
  border: 3px solid #00ce1b;
  color: #00ce1b;
}

.cash-movement-dialog-card--setup .cash-movement-icon {
  background: #ffffff;
  border: 3px solid #00ce1b;
  color: #00ce1b;
}

.cash-movement-heading-copy {
  min-width: 0;
}

.cash-movement-title {
  color: #111111;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.25px;
  line-height: 1.1;
  margin-top: 2px;
}

.cash-movement-subtitle {
  color: #4d4d4d;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.35;
  margin: 2px 0 0;
}

.cash-movement-body {
  display: grid;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px 20px;
}

.cash-movement-amount-field {
  background: #ffffff;
  border: 2px solid #00ce1b;
  border-radius: 22px;
  box-shadow: 0 10px 22px rgba(0, 206, 27, 0.11);
  padding: 6px 16px 5px;
}

.cash-movement-amount-label {
  color: #555555;
  font-size: 13px;
  font-weight: 850;
  line-height: 1;
  padding-top: 3px;
}

.cash-movement-amount-input {
  margin-top: -3px;
}

.cash-movement-amount-input :deep(.q-field__control) {
  min-height: 28px;
  padding: 0;
}

.cash-movement-amount-input :deep(.q-field__control-container) {
  padding-top: 0;
}

.cash-movement-amount-input :deep(.q-field__native),
.cash-movement-amount-input :deep(.q-field__prefix) {
  color: #111111;
  font-size: 30px;
  font-weight: 950;
  line-height: 1;
}

.cash-movement-amount-input :deep(.q-field__prefix) {
  align-items: center;
  display: flex;
  padding-bottom: 0;
  padding-right: 5px;
  transform: translateY(-2px);
}

.cash-movement-amount-input :deep(.q-field__native) {
  padding: 0;
}

.cash-movement-amount-input :deep(.q-field__bottom) {
  font-size: 12px;
  font-weight: 750;
  padding-left: 0;
  padding-top: 4px;
}

.cash-movement-amount-input :deep(input[type='number']) {
  -moz-appearance: textfield;
}

.cash-movement-amount-input
  :deep(input[type='number']::-webkit-inner-spin-button),
.cash-movement-amount-input
  :deep(input[type='number']::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.cash-movement-breakdown-card {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 20px;
  overflow: hidden;
}

.cash-movement-breakdown-header {
  align-items: flex-start;
  background: linear-gradient(135deg, #111111 0%, #202020 100%);
  color: #ffffff;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 15px 16px;
}

.cash-movement-breakdown-title {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.cash-movement-breakdown-balance {
  color: #00ce1b;
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.1;
  text-align: right;
  white-space: nowrap;
}

.cash-movement-breakdown-list {
  background: #ffffff;
  padding: 2px 14px;
}

.cash-movement-breakdown-line {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 12px 0;
}

.cash-movement-breakdown-line + .cash-movement-breakdown-line {
  border-top: 1px solid #eeeeee;
}

.cash-movement-breakdown-line span {
  color: #666666;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.2;
}

.cash-movement-breakdown-line strong {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
}

.cash-movement-breakdown-line--new strong {
  color: #0c5f17;
  font-size: 17px;
  font-weight: 950;
}

.cash-movement-actions {
  align-items: center;
  background: #ffffff;
  display: grid;
  flex: 0 0 auto;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  justify-content: center;
  padding: 14px 20px 18px;
}

.cash-movement-cancel-button,
.cash-movement-save-button {
  border-radius: 14px;
  font-weight: 850;
  min-height: 44px;
  overflow: hidden;
  padding: 0 18px;
  width: 100%;
  font-size: 14px;
}

.cash-movement-save-button {
  background: #00ce1b;
  color: #000000;
}

.cash-movement-cancel-button :deep(.q-focus-helper),
.cash-movement-save-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

@media (max-width: 640px) {
  .cash-movement-dialog-card {
    border-radius: 24px !important;
    clip-path: inset(0 round 24px);
    margin-top: max(10px, env(safe-area-inset-top));
    max-height: calc(100dvh - 24px);
    overflow: hidden;
    width: calc(100vw - 20px);
  }

  .cash-movement-form {
    border-radius: inherit;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .cash-movement-header {
    padding: 14px 16px 13px;
  }

  .cash-movement-title-row {
    gap: 11px;
  }

  .cash-movement-icon {
    border-radius: 14px;
    flex-basis: 42px;
    font-size: 23px;
    height: 42px;
    width: 42px;
  }

  .cash-movement-title {
    font-size: 20px;
  }

  .cash-movement-subtitle {
    font-size: 12px;
    line-height: 1.3;
    margin-top: 5px;
  }

  .cash-movement-body {
    gap: 12px;
    overflow-y: visible;
    padding: 12px 16px 14px;
  }

  .cash-movement-amount-field {
    border-radius: 18px;
    padding: 4px 13px 3px;
  }

  .cash-movement-amount-label {
    font-size: 12px;
    padding-top: 8px;
  }

  .cash-movement-amount-input {
    margin-top: -6px;
  }

  .cash-movement-amount-input :deep(.q-field__control) {
    min-height: 28px;
  }

  .cash-movement-amount-input :deep(.q-field__native),
  .cash-movement-amount-input :deep(.q-field__prefix) {
    font-size: 24px;
  }

  .cash-movement-amount-input :deep(.q-field__prefix) {
    transform: translateY(-2.5px);
  }

  .cash-movement-breakdown-header {
    padding: 12px 13px;
  }

  .cash-movement-breakdown-title {
    font-size: 11px;
  }

  .cash-movement-breakdown-balance {
    font-size: 15px;
  }

  .cash-movement-breakdown-list {
    padding: 1px 12px;
  }

  .cash-movement-breakdown-line {
    gap: 10px;
    padding: 9px 0;
  }

  .cash-movement-breakdown-line span {
    font-size: 12px;
  }

  .cash-movement-breakdown-line strong {
    font-size: 13px;
  }

  .cash-movement-breakdown-line--new strong {
    font-size: 15px;
  }

  .cash-movement-actions {
    gap: 10px;
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px 14px;
  }

  .cash-movement-cancel-button,
  .cash-movement-save-button {
    min-height: 42px;
    padding: 0 10px;
  }
}
</style>
