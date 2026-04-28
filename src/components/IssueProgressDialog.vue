<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section>
        <div class="text-h5">Issuing Fake Voucher</div>
        <p class="text-grey-7 q-mb-none">
          Simulating the future voucher issue flow. No BCH is being sent yet.
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list>
          <q-item v-for="step in steps" :key="step.key">
            <q-item-section avatar>
              <q-spinner
                v-if="step.status === 'active'"
                color="primary"
                size="24px"
              />

              <q-icon
                v-else-if="step.status === 'complete'"
                name="check_circle"
                color="positive"
                size="24px"
              />

              <q-icon
                v-else-if="step.status === 'error'"
                name="error"
                color="negative"
                size="24px"
              />

              <q-icon
                v-else
                name="radio_button_unchecked"
                color="grey-5"
                size="24px"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ step.label }}</q-item-label>
              <q-item-label v-if="step.description" caption>
                {{ step.description }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          This is a placeholder progress flow. Real quote locking, BCH funding,
          Electrum detection, and printing will be added in later phases.
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
