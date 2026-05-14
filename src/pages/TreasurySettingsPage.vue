<template>
  <q-page padding class="treasury-page">
    <div class="treasury-container">
      <section class="treasury-hero">
        <div>
          <p class="eyebrow">Merchant funds</p>
          <h1>Treasury Wallet</h1>
          <p class="intro">
            Manage the BCH wallet used to fund customer voucher receipts.
          </p>
        </div>

        <q-btn
          class="secondary-button"
          label="Sell Voucher"
          icon="point_of_sale"
          to="/sell-voucher"
          outline
          no-caps
        />
      </section>

      <q-card flat bordered class="main-card">
        <q-card-section>
          <div class="status-heading">
            <div class="status-icon">
              <q-icon name="account_balance_wallet" />
            </div>

            <div>
              <div class="text-h6">Wallet status</div>
              <p class="text-grey-7 q-mb-none">
                Check whether the merchant treasury wallet is ready.
              </p>
            </div>
          </div>

          <q-banner
            :class="
              treasuryWallet.isSetup
                ? 'bg-green-1 text-green-10'
                : 'bg-grey-2 text-grey-9'
            "
            rounded
            class="q-mt-md"
          >
            <template #avatar>
              <q-icon
                :name="treasuryWallet.isSetup ? 'check_circle' : 'info'"
              />
            </template>

            <span v-if="treasuryWallet.isSetup">
              Treasury wallet is set up.
            </span>

            <span v-else> No treasury wallet has been set up yet. </span>
          </q-banner>

          <section class="summary-grid q-mt-md">
            <div class="summary-tile highlight">
              <div class="summary-label">Status</div>
              <div class="summary-value">
                {{ treasuryWallet.isSetup ? 'Ready' : 'Not set up' }}
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">Balance</div>
              <div class="summary-value">
                <span v-if="treasuryBalance">
                  {{ formatBchSats(treasuryBalance.balanceSats) }}
                </span>
                <span v-else>Not checked</span>
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">UTXOs</div>
              <div class="summary-value">
                <span v-if="treasuryBalance">
                  {{ treasuryBalance.utxoCount }}
                </span>
                <span v-else>—</span>
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">Last checked</div>
              <div class="summary-value small">
                <span v-if="treasuryBalance">
                  {{ formatDateTime(treasuryBalance.checkedAt) }}
                </span>
                <span v-else>Not checked yet</span>
              </div>
            </div>
          </section>

          <q-card
            v-if="treasuryWallet.isSetup"
            flat
            bordered
            class="details-card q-mt-md"
          >
            <q-card-section>
              <div class="details-row">
                <span>Treasury address</span>
                <strong class="text-break">
                  {{ treasuryWallet.address }}
                </strong>
              </div>

              <div v-if="treasuryWallet.createdAt" class="details-row">
                <span>Created</span>
                <strong>{{ formatDateTime(treasuryWallet.createdAt) }}</strong>
              </div>

              <div v-if="treasuryWallet.updatedAt" class="details-row">
                <span>Updated</span>
                <strong>{{ formatDateTime(treasuryWallet.updatedAt) }}</strong>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="card-actions">
          <q-btn
            v-if="treasuryWallet.isSetup"
            class="secondary-button"
            label="Refresh Balance"
            icon="refresh"
            :loading="isCheckingBalance"
            outline
            no-caps
            @click="handleRefreshBalance"
          />

          <q-btn
            class="primary-button"
            :label="
              treasuryWallet.isSetup ? 'Treasury Wallet Ready' : 'Create Wallet'
            "
            :disable="treasuryWallet.isSetup"
            :loading="isSubmitting"
            unelevated
            no-caps
            @click="handleCreateTreasuryWallet"
          />
        </q-card-actions>
      </q-card>

      <TreasuryTopUpQrCard
        v-if="treasuryWallet.isSetup"
        :treasury-address="treasuryWallet.address"
      />

      <q-card v-if="treasuryBalance" flat bordered class="main-card">
        <q-expansion-item
          icon="account_tree"
          label="UTXO details"
          caption="Advanced read-only treasury outputs"
        >
          <q-card-section>
            <p class="text-grey-7 q-mb-md">
              These are the unspent outputs currently detected for the treasury
              wallet. This section is read-only.
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
        </q-expansion-item>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-expansion-item
          icon="settings"
          label="Funding configuration"
          caption="Fee address readiness for live treasury funding"
        >
          <q-card-section>
            <q-banner
              :class="
                feeAddressConfig.platformFeeAddressValid
                  ? 'bg-green-1 text-green-10'
                  : 'bg-red-1 text-red-10'
              "
              rounded
              class="q-mb-md"
            >
              <template #avatar>
                <q-icon
                  :name="
                    feeAddressConfig.platformFeeAddressValid
                      ? 'check_circle'
                      : 'block'
                  "
                />
              </template>

              <span v-if="feeAddressConfig.platformFeeAddressValid">
                Platform fee address is configured and valid.
              </span>

              <span v-else-if="feeAddressConfig.platformFeeAddressConfigured">
                Platform fee address is configured but invalid:
                {{ feeAddressConfig.platformFeeAddressError }}
              </span>

              <span v-else>
                Platform fee address is not configured. Live funding must stay
                disabled.
              </span>
            </q-banner>

            <q-banner
              :class="
                feeAddressConfig.bufferReserveAddressValid
                  ? 'bg-green-1 text-green-10'
                  : 'bg-grey-2 text-grey-9'
              "
              rounded
              class="q-mb-md"
            >
              <template #avatar>
                <q-icon
                  :name="
                    feeAddressConfig.bufferReserveAddressValid
                      ? 'check_circle'
                      : 'info'
                  "
                />
              </template>

              <span
                v-if="
                  feeAddressConfig.bufferReserveAddressConfigured &&
                  feeAddressConfig.bufferReserveAddress
                "
              >
                Buffer reserve address is configured and valid.
              </span>

              <span v-else>
                Buffer reserve output is optional for MVP and is not currently
                required.
              </span>
            </q-banner>

            <q-list bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Platform fee address</q-item-label>
                  <q-item-label class="text-break">
                    {{
                      feeAddressConfig.platformFeeAddress || 'Not configured'
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption
                    >Platform fee address status</q-item-label
                  >
                  <q-item-label>
                    {{
                      feeAddressConfig.platformFeeAddressValid
                        ? 'Valid'
                        : 'Not ready'
                    }}
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
                  <q-item-label caption>
                    Buffer reserve address status
                  </q-item-label>
                  <q-item-label>
                    {{
                      feeAddressConfig.bufferReserveAddressValid
                        ? 'Valid / not required'
                        : 'Not ready'
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
        </q-expansion-item>
      </q-card>

      <q-card v-if="treasuryWallet.isSetup" flat bordered class="main-card">
        <q-expansion-item
          icon="key"
          label="Wallet backup"
          caption="Sensitive seed backup for development and recovery"
        >
          <q-card-section>
            <q-banner class="bg-red-1 text-red-10 q-mb-md" rounded>
              <template #avatar>
                <q-icon name="dangerous" />
              </template>

              Anyone with this seed phrase can control the treasury BCH. Only
              reveal this in a safe private environment.
            </q-banner>

            <q-list bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Backup status</q-item-label>
                  <q-item-label>
                    {{
                      treasuryBackup
                        ? 'Seed loaded for backup'
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

          <q-card-actions align="right" class="card-actions">
            <q-btn
              v-if="treasuryBackup"
              flat
              color="grey-8"
              label="Hide Seed"
              no-caps
              @click="handleHideTreasuryBackup"
            />

            <q-btn
              color="negative"
              outline
              label="Reveal Seed Backup"
              :loading="isExportingBackup"
              no-caps
              @click="handleRevealTreasuryBackup"
            />
          </q-card-actions>
        </q-expansion-item>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-expansion-item
          icon="restore"
          label="Wallet restore / import"
          caption="Check or import a treasury seed phrase"
        >
          <q-card-section>
            <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              Importing will replace the current local treasury wallet. Do not
              paste a production seed phrase into this development build.
            </q-banner>

            <q-input
              v-model="restoreMnemonicInput"
              type="textarea"
              label="Treasury seed phrase to check/import"
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
                    restoreCheck.matchesCurrentWallet
                      ? 'check_circle'
                      : 'warning'
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

            <q-banner
              v-if="restoreImportResult"
              class="bg-green-1 text-green-10 q-mb-md"
              rounded
            >
              <template #avatar>
                <q-icon name="check_circle" />
              </template>

              Imported treasury wallet into local storage.
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
                      restoreCheck.currentAddress ||
                      'No current treasury wallet'
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

            <q-list
              v-if="restoreImportResult"
              bordered
              separator
              class="q-mt-md"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>Imported address</q-item-label>
                  <q-item-label class="text-break">
                    {{ restoreImportResult.address }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Replaced existing wallet</q-item-label>
                  <q-item-label>
                    {{
                      restoreImportResult.replacedExistingWallet ? 'Yes' : 'No'
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Imported</q-item-label>
                  <q-item-label>
                    {{ formatDateTime(restoreImportResult.importedAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              v-if="restoreCheck || restoreImportResult"
              flat
              color="grey-8"
              label="Clear Restore Tool"
              no-caps
              @click="handleClearRestoreCheck"
            />

            <q-btn
              class="secondary-button"
              label="Check Seed"
              :loading="isCheckingRestore"
              outline
              no-caps
              @click="handleCheckRestoreMnemonic"
            />

            <q-btn
              color="negative"
              label="Import Checked Seed"
              :disable="!restoreCheck"
              :loading="isImportingRestore"
              no-caps
              @click="handleImportCheckedRestoreMnemonic"
            />
          </q-card-actions>
        </q-expansion-item>
      </q-card>

      <q-card v-if="treasuryWallet.isSetup" flat bordered class="main-card">
        <q-expansion-item
          icon="warning"
          label="Danger zone"
          caption="Clear the local treasury wallet"
        >
          <q-card-section>
            <q-banner class="bg-red-1 text-red-10" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              Clearing the local treasury wallet removes this device&apos;s
              saved treasury wallet data. Only do this when you are sure the
              wallet is backed up or no longer needed.
            </q-banner>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              color="negative"
              outline
              label="Clear Treasury Wallet"
              :loading="isSubmitting"
              no-caps
              @click="handleClearTreasuryWallet"
            />
          </q-card-actions>
        </q-expansion-item>
      </q-card>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9" rounded>
        {{ successMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        Development safety mode is still active. Treasury tools are available
        for testing while live merchant operation is being prepared.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import TreasuryTopUpQrCard from 'src/components/TreasuryTopUpQrCard.vue';

import type { FeeAddressConfigStatus } from 'src/types/fee-address-config';
import type {
  TreasuryRestoreCheckResult,
  TreasuryRestoreImportResult,
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
  importTreasuryWalletFromMnemonic,
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
const restoreImportResult = ref<TreasuryRestoreImportResult | null>(null);
const restoreMnemonicInput = ref('');

const feeAddressConfig = ref<FeeAddressConfigStatus>(
  getFeeAddressConfigStatus()
);

const isSubmitting = ref(false);
const isCheckingBalance = ref(false);
const isExportingBackup = ref(false);
const isCheckingRestore = ref(false);
const isImportingRestore = ref(false);
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
  restoreImportResult.value = null;
  isSubmitting.value = true;

  try {
    treasuryWallet.value = await createTreasuryWallet();
    successMessage.value = 'Created treasury wallet.';
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
  restoreImportResult.value = null;
  isSubmitting.value = true;

  try {
    await clearTreasuryWallet();
    await loadTreasuryWallet();
    successMessage.value = 'Cleared treasury wallet.';
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
    successMessage.value = 'Treasury seed backup loaded.';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load treasury backup information.';
  } finally {
    isExportingBackup.value = false;
  }
}

function handleHideTreasuryBackup(): void {
  treasuryBackup.value = null;
  successMessage.value = 'Treasury seed backup hidden.';
}

async function handleCheckRestoreMnemonic(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  restoreCheck.value = null;
  restoreImportResult.value = null;
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

async function handleImportCheckedRestoreMnemonic(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  if (!restoreCheck.value) {
    errorMessage.value = 'Check a treasury seed phrase before importing.';
    return;
  }

  isImportingRestore.value = true;

  try {
    restoreImportResult.value = await importTreasuryWalletFromMnemonic(
      restoreCheck.value.mnemonic
    );

    treasuryBalance.value = null;
    treasuryBackup.value = null;

    await loadTreasuryWallet();

    successMessage.value = 'Imported checked treasury seed into local storage.';
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not import treasury seed.';
  } finally {
    isImportingRestore.value = false;
  }
}

function handleClearRestoreCheck(): void {
  restoreCheck.value = null;
  restoreImportResult.value = null;
  restoreMnemonicInput.value = '';
  successMessage.value = 'Treasury restore tool cleared.';
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

<style lang="scss" scoped>
.treasury-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.treasury-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 760px;
  width: 100%;
}

.treasury-hero,
.main-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.treasury-hero {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 24px;
}

.eyebrow {
  color: #4b4b4b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

h1 {
  color: #111111;
  font-size: clamp(32px, 8vw, 48px);
  font-weight: 900;
  letter-spacing: -1.2px;
  line-height: 1.08;
  margin: 0;
}

.intro {
  color: #444444;
  font-size: 16px;
  line-height: 1.45;
  margin: 12px 0 0;
}

.status-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.status-icon {
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

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
}

.summary-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 16px;
}

.summary-tile.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.summary-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.summary-value {
  color: #111111;
  font-size: 17px;
  font-weight: 850;
  line-height: 1.25;
}

.summary-value.small {
  font-size: 14px;
}

.details-card {
  background: #ffffff;
  border-color: #dddddd;
  border-radius: 18px;
}

.details-row {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 8px 0;
}

.details-row + .details-row {
  border-top: 1px solid #eeeeee;
}

.details-row span {
  color: #666666;
}

.details-row strong {
  color: #111111;
  text-align: right;
}

.primary-button,
.secondary-button {
  border-radius: 14px;
  font-weight: 850;
  min-height: 42px;
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

.card-actions {
  padding: 14px 22px;
}

@media (max-width: 640px) {
  .treasury-hero {
    flex-direction: column;
    padding: 22px;
  }

  .secondary-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .details-row {
    flex-direction: column;
    gap: 4px;
  }

  .details-row strong {
    text-align: left;
  }

  .card-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .card-actions .q-btn {
    width: 100%;
  }
}

.main-card {
  overflow: hidden;
}

.main-card :deep(.q-expansion-item__container) {
  border-radius: 24px;
  overflow: hidden;
}

.main-card :deep(.q-expansion-item__container > .q-item) {
  border-radius: 24px;
  overflow: hidden;
}

.primary-button,
.secondary-button {
  overflow: hidden;
}

.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper),
.main-card :deep(.q-focus-helper) {
  border-radius: inherit;
}
</style>
