<template>
  <q-card flat bordered class="recovery-card q-mt-md">
    <q-card-section>
      <div class="recovery-heading">
        Printed voucher requires physical confirmation
      </div>

      <div class="recovery-copy q-mt-xs">
        Printing started, but the app cannot safely prove whether a complete
        usable voucher was produced. Check the physical printer before choosing
        an option.
      </div>

      <div class="recovery-actions q-mt-md">
        <q-btn
          class="confirm-button"
          icon="check_circle"
          label="Confirm: Voucher Printed Correctly"
          unelevated
          no-caps
          :disable="isResolving"
          @click="openResolution('confirmed_printed')"
        />

        <q-btn
          class="failed-button"
          icon="report_problem"
          label="No Usable Voucher Printed"
          outline
          no-caps
          :disable="isResolving"
          @click="openResolution('replacement_required')"
        />
      </div>

      <q-banner
        v-if="errorMessage"
        class="bg-red-1 text-red-10 q-mt-md"
        rounded
      >
        <template #avatar>
          <q-icon name="error" />
        </template>

        {{ errorMessage }}
      </q-banner>
    </q-card-section>
  </q-card>

  <q-dialog v-model="isConfirmationOpen" persistent>
    <q-card style="width: 500px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6 text-weight-bold">
          {{ confirmationTitle }}
        </div>

        <div class="text-grey-8 q-mt-sm">
          {{ confirmationMessage }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          color="grey-8"
          label="Go Back"
          no-caps
          :disable="isResolving"
          @click="isConfirmationOpen = false"
        />

        <q-btn
          class="confirm-action"
          :label="confirmationButtonLabel"
          unelevated
          no-caps
          :loading="isResolving"
          @click="handleConfirmResolution"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import type {
  VoucherPrintedRecoveryResolution,
  VoucherRecord,
} from 'src/types/voucher';

import { resolveStoredPrintedVoucherRecovery } from 'src/services/voucher-store';

const props = defineProps<{
  voucher: VoucherRecord;
}>();

const emit = defineEmits<{
  updated: [voucher: VoucherRecord];
}>();

const isConfirmationOpen = ref(false);

const isResolving = ref(false);

const pendingResolution = ref<VoucherPrintedRecoveryResolution | null>(null);

const errorMessage = ref('');

const confirmationTitle = computed(() => {
  return pendingResolution.value === 'confirmed_printed'
    ? 'Confirm the voucher printed correctly?'
    : 'Confirm that no usable voucher exists?';
});

const confirmationMessage = computed(() => {
  if (pendingResolution.value === 'confirmed_printed') {
    return (
      'Only continue if you have physically checked the printer and a ' +
      'complete usable voucher exists for the customer. This permanently ' +
      'marks the Printed voucher as delivered and ordinary reprinting will remain blocked.'
    );
  }

  return (
    'Only continue if there is no complete usable customer voucher. ' +
    'The original WIF will remain permanently blocked from reprinting or ' +
    'Digital exposure. This record will be marked as requiring a replacement ' +
    'Topup and the original BCH amount will need to be reclaimed to Treasury. ' +
    'No BCH moves during this confirmation step.'
  );
});

const confirmationButtonLabel = computed(() => {
  return pendingResolution.value === 'confirmed_printed'
    ? 'Confirm Printed Correctly'
    : 'Confirm No Usable Voucher';
});

function openResolution(resolution: VoucherPrintedRecoveryResolution): void {
  errorMessage.value = '';

  pendingResolution.value = resolution;

  isConfirmationOpen.value = true;
}

async function handleConfirmResolution(): Promise<void> {
  const resolution = pendingResolution.value;

  if (!resolution) {
    return;
  }

  isResolving.value = true;

  errorMessage.value = '';

  try {
    const updatedVoucher = await resolveStoredPrintedVoucherRecovery(
      props.voucher.id,
      resolution
    );

    if (!updatedVoucher) {
      throw new Error('Could not find the Printed Topup record.');
    }

    emit('updated', updatedVoucher);

    isConfirmationOpen.value = false;
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not resolve the Printed voucher state.';
  } finally {
    isResolving.value = false;
  }
}
</script>

<style scoped>
.recovery-card {
  border-color: #e0a100;
  border-radius: 18px;
}

.recovery-heading {
  color: #111111;
  font-size: 16px;
  font-weight: 900;
}

.recovery-copy {
  color: #555555;
  line-height: 1.45;
}

.recovery-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.confirm-button,
.confirm-action {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
}

.failed-button {
  border-radius: 14px;
  color: #9a5c00;
  font-weight: 850;
}

@media (max-width: 640px) {
  .recovery-actions {
    flex-direction: column;
  }

  .recovery-actions .q-btn {
    width: 100%;
  }
}
</style>
