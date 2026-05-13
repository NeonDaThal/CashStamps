<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card class="progress-card">
      <q-card-section class="progress-header">
        <div class="header-icon">
          <q-icon name="receipt_long" />
        </div>

        <div>
          <div class="text-h5 text-weight-bold">Issuing Voucher</div>
          <p class="text-grey-7 q-mb-none">
            Preparing the voucher record and receipt for the customer.
          </p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="progress-body">
        <q-list class="progress-list">
          <q-item v-for="step in steps" :key="step.key" class="progress-item">
            <q-item-section avatar>
              <div
                class="step-icon"
                :class="{
                  active: step.status === 'active',
                  complete: step.status === 'complete',
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

          Development safety mode is active. Voucher issuing can be tested while
          live broadcasting remains protected by the existing guardrails.
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
export type IssueProgressStepStatus =
  | 'pending'
  | 'active'
  | 'complete'
  | 'error';

export interface IssueProgressStep {
  key: string;
  label: string;
  description?: string;
  status: IssueProgressStepStatus;
}

defineProps<{
  modelValue: boolean;
  steps: IssueProgressStep[];
}>();
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

.step-icon.active {
  background: #00ce1b;
  color: #000000;
}

.step-icon.complete {
  background: #00ce1b;
  color: #000000;
}

.step-icon.error {
  background: #ffe1e1;
  color: #b00020;
}

.step-label {
  color: #111111;
  font-weight: 850;
}

@media (max-width: 640px) {
  .progress-header,
  .progress-body {
    padding: 18px;
  }
}
</style>
