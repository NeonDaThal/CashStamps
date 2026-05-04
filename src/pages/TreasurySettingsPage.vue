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

      <q-card flat bordered class="q-mb-md">
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

            <q-item v-if="treasuryBalance">
              <q-item-section>
                <q-item-label caption>Balance</q-item-label>
                <q-item-label>
                  {{ formatBchSats(treasuryBalance.balanceSats) }}
                  / {{ treasuryBalance.balanceSats.toLocaleString() }} sats
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryBalance">
              <q-item-section>
                <q-item-label caption>UTXOs</q-item-label>
                <q-item-label>
                  {{ treasuryBalance.utxoCount }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryBalance">
              <q-item-section>
                <q-item-label caption>Balance checked</q-item-label>
                <q-item-label>
                  {{ formatDateTime(treasuryBalance.checkedAt) }}
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

          <q-card v-if="treasuryBalance" flat bordered class="q-mt-md">
            <q-card-section>
              <div class="text-h6 q-mb-sm">Read-only UTXO details</div>

              <p class="text-grey-7 q-mb-md">
                These are the unspent outputs currently detected for the
                treasury wallet. This is read-only and does not build or
                broadcast a transaction.
              </p>

              <q-banner
                v-if="treasuryBalance.utxos.length === 0"
                class="bg-grey-2 text-grey-9"
                rounded
              >
                No treasury UTXOs detected.
              </q-banner>

              <q-list v-else bordered separator>
                <q-item
                  v-for="(utxo, index) in treasuryBalance.utxos"
                  :key="`${utxo.outpointTransactionHash}:${utxo.outpointIndex}`"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      UTXO {{ index + 1 }}
                    </q-item-label>

                    <q-item-label caption>
                      Value:
                      {{ formatBchSats(utxo.valueSats) }}
                      / {{ utxo.valueSats.toLocaleString() }} sats
                    </q-item-label>

                    <q-item-label caption class="text-break">
                      Tx:
                      {{ utxo.outpointTransactionHash }}
                    </q-item-label>

                    <q-item-label caption>
                      Output index:
                      {{ utxo.outpointIndex }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
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
            v-if="treasuryWallet.isSetup"
            color="secondary"
            outline
            label="Refresh Balance"
            :loading="isCheckingBalance"
            @click="handleRefreshBalance"
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

      <q-card v-if="treasuryWallet.isSetup" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h5 q-mb-xs">Development Treasury Backup</div>
          <p class="text-grey-7 q-mb-none">
            This proves the treasury seed can be exported for backup. Production
            backup UX must be stricter before real merchant use.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner class="bg-red-1 text-red-10 q-mb-md" rounded>
            <template #avatar>
              <q-icon name="dangerous" />
            </template>

            Anyone with this seed phrase can control the treasury BCH. Only
            reveal this in a safe private environment. Do not use this MVP
            wallet with real funds.
          </q-banner>

          <q-list bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>Backup status</q-item-label>
                <q-item-label>
                  {{
                    treasuryBackup
                      ? 'Seed loaded for development backup'
                      : 'Seed not revealed'
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryBackup">
              <q-item-section>
                <q-item-label caption>Treasury address</q-item-label>
                <q-item-label class="text-break">
                  {{ treasuryBackup.address }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryBackup">
              <q-item-section>
                <q-item-label caption>Seed phrase</q-item-label>
                <q-item-label class="text-break text-weight-medium">
                  {{ treasuryBackup.mnemonic }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="treasuryBackup">
              <q-item-section>
                <q-item-label caption>Exported</q-item-label>
                <q-item-label>
                  {{ formatDateTime(treasuryBackup.exportedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            v-if="treasuryBackup"
            flat
            color="grey-8"
            label="Hide Seed"
            @click="handleHideTreasuryBackup"
          />

          <q-btn
            color="negative"
            outline
            label="Reveal Development Seed Backup"
            :loading="isExportingBackup"
            @click="handleRevealTreasuryBackup"
          />
        </q-card-actions>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h5 q-mb-xs">Development Treasury Restore Check</div>
          <p class="text-grey-7 q-mb-none">
            Paste a treasury seed phrase to check which treasury address it
            derives. This does not replace the current wallet.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
            <template #avatar>
              <q-icon name="warning" />
            </template>

            This is a check-only restore tool. It will not overwrite the current
            treasury wallet. Do not paste a real production seed phrase into
            this MVP test app.
          </q-banner>

          <q-input
            v-model="restoreMnemonicInput"
            type="textarea"
            label="Treasury seed phrase to check"
            outlined
            autogrow
            class="q-mb-md"
          />

          <q-banner
            v-if="restoreCheck"
            :class="
              restoreCheck.matchesCurrentWallet
                ? 'bg-green-1 text-green-10'
                : 'bg-orange-1 text-orange-10'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="
                  restoreCheck.matchesCurrentWallet ? 'check_circle' : 'warning'
                "
              />
            </template>

            <span v-if="restoreCheck.matchesCurrentWallet">
              This seed derives the current treasury address.
            </span>

            <span v-else>
              This seed derives a different treasury address.
            </span>
          </q-banner>

          <q-list v-if="restoreCheck" bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>Derived address</q-item-label>
                <q-item-label class="text-break">
                  {{ restoreCheck.derivedAddress }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Current treasury address</q-item-label>
                <q-item-label class="text-break">
                  {{
                    restoreCheck.currentAddress || 'No current treasury wallet'
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Checked</q-item-label>
                <q-item-label>
                  {{ formatDateTime(restoreCheck.checkedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            v-if="restoreCheck"
            flat
            color="grey-8"
            label="Clear Restore Check"
            @click="handleClearRestoreCheck"
          />

          <q-btn
            color="primary"
            outline
            label="Check Restore Seed"
            :loading="isCheckingRestore"
            @click="handleCheckRestoreMnemonic"
          />
        </q-card-actions>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h5 q-mb-xs">Automatic Fee Address Configuration</div>
          <p class="text-grey-7 q-mb-none">
            Real funding must stay disabled until the required fee collection
            addresses are configured.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner
            :class="
              feeAddressConfig.platformFeeAddressConfigured
                ? 'bg-green-1 text-green-10'
                : 'bg-red-1 text-red-10'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="
                  feeAddressConfig.platformFeeAddressConfigured
                    ? 'check_circle'
                    : 'block'
                "
              />
            </template>

            <span v-if="feeAddressConfig.platformFeeAddressConfigured">
              Platform fee address is configured.
            </span>

            <span v-else>
              Platform fee address is not configured. Real funding must stay
              disabled.
            </span>
          </q-banner>

          <q-banner
            :class="
              feeAddressConfig.bufferReserveAddressConfigured
                ? 'bg-green-1 text-green-10'
                : 'bg-red-1 text-red-10'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="
                  feeAddressConfig.bufferReserveAddressConfigured
                    ? 'check_circle'
                    : 'block'
                "
              />
            </template>

            <span v-if="feeAddressConfig.bufferReserveAddressConfigured">
              Buffer reserve address is configured.
            </span>

            <span v-else>
              Buffer reserve address is not configured. Real funding must stay
              disabled while buffer output is enabled.
            </span>
          </q-banner>

          <q-list bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>Platform fee address</q-item-label>
                <q-item-label class="text-break">
                  {{ feeAddressConfig.platformFeeAddress || 'Not configured' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Buffer reserve address</q-item-label>
                <q-item-label class="text-break">
                  {{
                    feeAddressConfig.bufferReserveAddress || 'Not configured'
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Config checked</q-item-label>
                <q-item-label>
                  {{ formatDateTime(feeAddressConfig.checkedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
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

import type { FeeAddressConfigStatus } from 'src/types/fee-address-config';
import type {
  TreasuryRestoreCheckResult,
  TreasuryWalletBackupInfo,
  TreasuryWalletBalance,
  TreasuryWalletPublicInfo,
} from 'src/types/treasury';
import {
  checkTreasuryRestoreMnemonic,
  clearTreasuryWallet,
  createTreasuryWallet,
  getTreasuryWalletBackupInfo,
  getTreasuryWalletBalance,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';
import { formatBchSats } from 'src/services/voucher-pricing';
import { getFeeAddressConfigStatus } from 'src/services/fee-address-config';

const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});

const treasuryBalance = ref<TreasuryWalletBalance | null>(null);
const treasuryBackup = ref<TreasuryWalletBackupInfo | null>(null);
const restoreCheck = ref<TreasuryRestoreCheckResult | null>(null);
const restoreMnemonicInput = ref('');

const feeAddressConfig = ref<FeeAddressConfigStatus>(
  getFeeAddressConfigStatus()
);

const isSubmitting = ref(false);
const isCheckingBalance = ref(false);
const isExportingBackup = ref(false);
const isCheckingRestore = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

async function loadTreasuryWallet(): Promise<void> {
  errorMessage.value = '';

  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();
    feeAddressConfig.value = getFeeAddressConfigStatus();

    if (!treasuryWallet.value.isSetup) {
      treasuryBalance.value = null;
      treasuryBackup.value = null;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load treasury wallet information.';
  }
}

async function handleCreateTreasuryWallet(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  treasuryBalance.value = null;
  treasuryBackup.value = null;
  restoreCheck.value = null;
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
  treasuryBalance.value = null;
  treasuryBackup.value = null;
  restoreCheck.value = null;
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

async function handleRefreshBalance(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  isCheckingBalance.value = true;

  try {
    treasuryBalance.value = await getTreasuryWalletBalance();
    successMessage.value = 'Treasury balance refreshed.';
  } catch (error) {
    console.error(error);
    errorMessage.value =
      'Could not refresh treasury balance. Check your connection and try again.';
  } finally {
    isCheckingBalance.value = false;
  }
}

async function handleRevealTreasuryBackup(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  isExportingBackup.value = true;

  try {
    treasuryBackup.value = await getTreasuryWalletBackupInfo();
    successMessage.value = 'Development treasury seed backup loaded.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load treasury backup information.';
  } finally {
    isExportingBackup.value = false;
  }
}

function handleHideTreasuryBackup(): void {
  treasuryBackup.value = null;
  successMessage.value = 'Development treasury seed backup hidden.';
}

async function handleCheckRestoreMnemonic(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  restoreCheck.value = null;
  isCheckingRestore.value = true;

  try {
    restoreCheck.value = await checkTreasuryRestoreMnemonic(
      restoreMnemonicInput.value
    );

    successMessage.value = 'Treasury restore seed check completed.';
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not check treasury restore seed.';
  } finally {
    isCheckingRestore.value = false;
  }
}

function handleClearRestoreCheck(): void {
  restoreCheck.value = null;
  restoreMnemonicInput.value = '';
  successMessage.value = 'Treasury restore check cleared.';
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
