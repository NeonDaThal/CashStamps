<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="!canDismiss"
    @update:model-value="handleModelUpdate"
  >
    <q-card class="progress-card">
      <q-card-section class="progress-header">
        <div class="header-icon">
          <q-icon name="receipt_long" />
        </div>

        <div class="progress-heading">
          <div class="text-h5 text-weight-bold">
            {{ t('issueProgress.title') }}
          </div>

          <p class="text-grey-7 q-mb-none">
            {{ t('issueProgress.subtitle') }}
          </p>
        </div>

        <q-btn
          v-if="canDismiss"
          flat
          dense
          round
          icon="close"
          class="close-button"
          :aria-label="t('common.close')"
          @click="requestClose"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="progress-body">
        <!--
          EXCEPTIONAL FUNDING RECOVERY

          Deliberately comes BEFORE the progress rows so the merchant sees the
          recovery action immediately without scrolling.
        -->
        <q-card
          v-if="fundingRecoveryAvailable"
          flat
          bordered
          class="funding-recovery-card q-mb-md"
        >
          <q-card-section class="recovery-section">
            <div class="recovery-heading-row">
              <div class="recovery-icon">
                <q-icon name="sync_problem" size="28px" />
              </div>

              <div class="recovery-content">
                <div class="recovery-title">
                  Funding verification is taking longer than expected
                </div>

                <div class="recovery-message">
                  {{
                    fundingRecoveryMessage ||
                    'The transaction has been saved safely. Check the same transaction again before continuing. No replacement transaction will be created.'
                  }}
                </div>
              </div>
            </div>

            <q-btn
              class="recovery-button q-mt-md"
              label="Check funding again"
              icon="sync"
              unelevated
              no-caps
              :loading="isRetryingFunding"
              :disable="isRetryingFunding"
              @click="emit('retryFunding')"
            />
          </q-card-section>
        </q-card>

        <!--
          NORMAL PROGRESS INFORMATION

          Still visible underneath recovery so the merchant can see precisely
          which stage failed.
        -->
        <q-list class="progress-list">
          <q-item v-for="step in steps" :key="step.key" class="progress-item">
            <q-item-section avatar>
              <div
                class="step-icon"
                :class="{
                  active: step.status === 'active',

                  complete: step.status === 'complete',

                  skipped: step.status === 'skipped',

                  error: step.status === 'error',
                }"
              >
                <q-spinner
                  v-if="step.status === 'active'"
                  color="black"
                  size="22px"
                />

                <q-icon
                  v-else-if="step.status === 'complete'"
                  name="check"
                  size="22px"
                />

                <q-icon
                  v-else-if="step.status === 'skipped'"
                  name="remove"
                  size="22px"
                />

                <q-icon
                  v-else-if="step.status === 'error'"
                  name="error"
                  size="22px"
                />

                <q-icon v-else name="radio_button_unchecked" size="22px" />
              </div>
            </q-item-section>

            <q-item-section>
              <q-item-label class="step-label">
                {{ step.label }}
              </q-item-label>

              <q-item-label v-if="step.description" caption>
                {{ step.description }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner class="bg-grey-2 text-grey-9 q-mt-md" rounded>
          <template #avatar>
            <q-icon name="shield" />
          </template>

          {{ t('issueProgress.safetyModeNotice') }}
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export type IssueProgressStepStatus =
  | 'pending'
  | 'active'
  | 'complete'
  | 'skipped'
  | 'error';

export interface IssueProgressStep {
  key: string;
  label: string;
  description?: string;
  status: IssueProgressStepStatus;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    steps: IssueProgressStep[];

    /**
     * Only true when a durable funding transaction already exists and the
     * safe operation available to the merchant is to reconcile that SAME
     * transaction again.
     */
    fundingRecoveryAvailable?: boolean;

    isRetryingFunding?: boolean;

    fundingRecoveryMessage?: string;
  }>(),
  {
    fundingRecoveryAvailable: false,

    isRetryingFunding: false,

    fundingRecoveryMessage: '',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];

  retryFunding: [];
}>();

const { t } = useI18n({
  useScope: 'global',
});

const hasActiveStep = computed(() =>
  props.steps.some((step) => step.status === 'active')
);

const hasErrorStep = computed(() =>
  props.steps.some((step) => step.status === 'error')
);

/**
 * While an Issue operation or funding reconciliation is running, the dialog
 * is intentionally locked.
 *
 * If an operation terminates with an error, the merchant may close it.
 * Successful operations are closed automatically by the parent flow.
 */
const canDismiss = computed(
  () => hasErrorStep.value && !hasActiveStep.value && !props.isRetryingFunding
);

function requestClose(): void {
  if (!canDismiss.value) {
    return;
  }

  emit('update:modelValue', false);
}

function handleModelUpdate(value: boolean): void {
  if (!value && canDismiss.value) {
    emit('update:modelValue', false);
  }
}
</script>

<style lang="scss" scoped>
.progress-card {
  border-radius: 24px;
  max-width: 95vw;
  width: 520px;
}

.progress-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  padding: 22px;
}

.progress-heading {
  flex: 1 1 auto;
  min-width: 0;
}

.close-button {
  flex: 0 0 auto;
  margin-left: auto;
}

.header-icon {
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

.progress-body {
  padding: 22px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
}

.step-icon {
  align-items: center;
  background: #eeeeee;
  border-radius: 999px;
  color: #777777;
  display: flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.step-icon.active,
.step-icon.complete {
  background: #00ce1b;
  color: #000000;
}

.step-icon.skipped {
  background: #eeeeee;
  color: #777777;
}

.step-icon.error {
  background: #ffe1e1;
  color: #b00020;
}

.step-label {
  color: #111111;
  font-weight: 850;
}

.funding-recovery-card {
  background: #fff7df;
  border-color: #e8c76a;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
  color: #5d4300;
  overflow: hidden;
}

.recovery-section {
  padding: 18px;
}

.recovery-heading-row {
  align-items: flex-start;
  display: flex;
  gap: 12px;
}

.recovery-icon {
  align-items: center;
  background: #ffe8a3;
  border-radius: 999px;
  color: #6f5000;
  display: flex;
  flex: 0 0 42px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.recovery-content {
  flex: 1 1 auto;
  min-width: 0;
}

.recovery-title {
  color: #111111;
  font-size: 16px;
  font-weight: 850;
  line-height: 1.3;
}

.recovery-message {
  color: #594b24;
  line-height: 1.45;
  margin-top: 5px;
}

.recovery-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
  min-height: 42px;
  padding: 0 18px;
}

.recovery-content {
  width: 100%;
}

.recovery-title {
  color: #111111;
  font-size: 16px;
  font-weight: 850;
  line-height: 1.3;
}

.recovery-message {
  color: #594b24;
  line-height: 1.45;
  margin-top: 5px;
}

.recovery-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
  min-height: 42px;
  padding: 0 18px;
}

@media (max-width: 640px) {
  .progress-header,
  .progress-body {
    padding: 18px;
  }

  .recovery-button {
    width: 100%;
  }
}
</style>
