<template>
  <q-page padding>
    <div class="q-mx-auto" style="max-width: 760px">
      <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="warning" />
        </template>

        Development note: this treasury wallet is stored locally for MVP
        testing. Do not use this with real funds yet.
      </q-banner>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h4 q-mb-xs">Treasury Wallet</div>
          <p class="text-grey-7 q-mb-none">
            Set up the merchant treasury wallet that will later fund BCH
            vouchers.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner
            :class="
              treasuryWallet.isSetup
                ? 'bg-green-1 text-green-10'
                : 'bg-grey-2 text-grey-9'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="treasuryWallet.isSetup ? 'check_circle' : 'info'"
              />
            </template>

            <span v-if="treasuryWallet.isSetup">
              Local test treasury wallet is set up.
            </span>

            <span v-else>
              No local test treasury wallet has been set up yet.
            </span>
          </q-banner>

          <q-list bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>Status</q-item-label>
                <q-item-label>
                  {{ treasuryWallet.isSetup ? 'Set up' : 'Not set up' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryWallet.isSetup">
              <q-item-section>
                <q-item-label caption>Treasury address</q-item-label>
                <q-item-label class="text-break">
                  {{ treasuryWallet.address }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryWallet.createdAt">
              <q-item-section>
                <q-item-label caption>Created</q-item-label>
                <q-item-label>
                  {{ formatDateTime(treasuryWallet.createdAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryWallet.updatedAt">
              <q-item-section>
                <q-item-label caption>Updated</q-item-label>
                <q-item-label>
                  {{ formatDateTime(treasuryWallet.updatedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            v-if="treasuryWallet.isSetup"
            color="negative"
            outline
            label="Clear Test Treasury Wallet"
            :loading="isSubmitting"
            @click="handleClearTreasuryWallet"
          />

          <q-btn
            color="primary"
            :label="
              treasuryWallet.isSetup
                ? 'Treasury Wallet Already Set Up'
                : 'Create Test Treasury Wallet'
            "
            :disable="treasuryWallet.isSetup"
            :loading="isSubmitting"
            @click="handleCreateTreasuryWallet"
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
import { onMounted, ref } from 'vue';

import type { TreasuryWalletPublicInfo } from 'src/types/treasury';
import {
  clearTreasuryWallet,
  createTreasuryWallet,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';

const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});

const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

async function loadTreasuryWallet(): Promise<void> {
  errorMessage.value = '';

  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load treasury wallet information.';
  }
}

async function handleCreateTreasuryWallet(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    treasuryWallet.value = await createTreasuryWallet();
    successMessage.value = 'Created local test treasury wallet.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not create treasury wallet.';
  } finally {
    isSubmitting.value = false;
  }
}

async function handleClearTreasuryWallet(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await clearTreasuryWallet();
    await loadTreasuryWallet();
    successMessage.value = 'Cleared local test treasury wallet.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not clear treasury wallet.';
  } finally {
    isSubmitting.value = false;
  }
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

onMounted(() => {
  void loadTreasuryWallet();
});
</script>
