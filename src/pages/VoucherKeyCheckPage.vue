<template>
  <q-page padding>
    <div class="q-mx-auto" style="max-width: 760px">
      <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="warning" />
        </template>

        Developer-only check. This page tests whether the app can export a
        sweepable voucher WIF/private key from a derived voucher wallet. Do not
        use this as merchant UI.
      </q-banner>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h4 q-mb-xs">Voucher Key Capability Check</div>
          <p class="text-grey-7 q-mb-none">
            Test whether a derived voucher wallet can expose sweepable WIF data.
            Full WIF is not displayed here.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-input
            v-model.number="derivationIndex"
            type="number"
            min="0"
            step="1"
            label="Derivation index to check"
            outlined
            class="q-mb-md"
          />

          <q-banner
            v-if="result"
            :class="
              result.wifExportAvailable
                ? 'bg-green-1 text-green-10'
                : 'bg-red-1 text-red-10'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="result.wifExportAvailable ? 'check_circle' : 'warning'"
              />
            </template>

            <span v-if="result.wifExportAvailable">
              WIF export appears to be available for this derived voucher
              wallet.
            </span>

            <span v-else>
              WIF export is not available through the current wallet wrapper
              yet.
            </span>
          </q-banner>

          <q-list v-if="result" bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>Derivation index</q-item-label>
                <q-item-label>
                  {{ result.derivationIndex }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Address</q-item-label>
                <q-item-label class="text-break">
                  {{ result.address }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>WIF export available</q-item-label>
                <q-item-label>
                  {{ result.wifExportAvailable ? 'Yes' : 'No' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="result.redactedWif">
              <q-item-section>
                <q-item-label caption>Redacted WIF</q-item-label>
                <q-item-label>
                  {{ result.redactedWif }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="result.errorMessage">
              <q-item-section>
                <q-item-label caption>Error</q-item-label>
                <q-item-label class="text-negative">
                  {{ result.errorMessage }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            color="primary"
            label="Voucher History"
            to="/voucher-history"
          />

          <q-btn
            color="primary"
            label="Run WIF Check"
            :loading="isChecking"
            @click="handleRunCheck"
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

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mt-md" rounded>
        {{ errorMessage }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { exportVoucherKeyAtIndex } from 'src/services/voucher-wallet';
import { redactSensitiveKey } from 'src/services/voucher-key-redaction';

interface VoucherKeyCheckResult {
  derivationIndex: number;
  address: string;
  wifExportAvailable: boolean;
  redactedWif: string;
  errorMessage: string;
}

const derivationIndex = ref(0);
const isChecking = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const result = ref<VoucherKeyCheckResult | null>(null);

async function handleRunCheck(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  result.value = null;

  if (!Number.isFinite(derivationIndex.value) || derivationIndex.value < 0) {
    errorMessage.value = 'Enter a valid derivation index.';
    return;
  }

  isChecking.value = true;

  try {
    const voucherKey = await exportVoucherKeyAtIndex(
      Math.floor(derivationIndex.value)
    );

    result.value = {
      derivationIndex: voucherKey.derivationIndex,
      address: voucherKey.address,
      wifExportAvailable: Boolean(voucherKey.wif),
      redactedWif: redactSensitiveKey(voucherKey.wif),
      errorMessage: '',
    };

    successMessage.value = 'Voucher key capability check completed.';
  } catch (error) {
    console.error(error);

    result.value = {
      derivationIndex: Math.floor(derivationIndex.value),
      address: '',
      wifExportAvailable: false,
      redactedWif: '',
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Unknown WIF export check error.',
    };

    errorMessage.value =
      'WIF export is not available through the current wallet wrapper yet.';
  } finally {
    isChecking.value = false;
  }
}
</script>
