<template>
  <q-page padding class="treasury-page">
    <div class="treasury-container">
      <section class="treasury-hero">
        <div>
          <p class="eyebrow">{{ t('treasuryPage.hero.eyebrow') }}</p>
          <h1>{{ t('treasuryPage.hero.title') }}</h1>
          <p class="intro">
            {{ t('treasuryPage.hero.intro') }}
          </p>
        </div>

        <q-btn
          class="secondary-button"
          :label="t('treasuryPage.actions.sellVoucher')"
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
              <div class="text-h6">
                {{ t('treasuryPage.walletStatus.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.walletStatus.subtitle') }}
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
              {{ t('treasuryPage.walletStatus.setupBanner') }}
            </span>

            <span v-else>
              {{ t('treasuryPage.walletStatus.notSetupBanner') }}
            </span>
          </q-banner>

          <section class="summary-grid q-mt-md">
            <div class="summary-tile highlight">
              <div class="summary-label">
                {{ t('treasuryPage.summary.status') }}
              </div>
              <div class="summary-value">
                {{
                  treasuryWallet.isSetup
                    ? t('treasuryPage.summary.ready')
                    : t('treasuryPage.summary.notSetUp')
                }}
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">
                {{ t('treasuryPage.summary.balance') }}
              </div>
              <div class="summary-value">
                <span v-if="treasuryBalance">
                  {{ formatBchSats(treasuryBalance.balanceSats) }}
                </span>
                <span v-else>{{ t('treasuryPage.summary.notChecked') }}</span>
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">
                {{ t('treasuryPage.summary.utxos') }}
              </div>
              <div class="summary-value">
                <span v-if="treasuryBalance">
                  {{ treasuryBalance.utxoCount }}
                </span>
                <span v-else>—</span>
              </div>
            </div>

            <div class="summary-tile">
              <div class="summary-label">
                {{ t('treasuryPage.summary.lastChecked') }}
              </div>
              <div class="summary-value small">
                <span v-if="treasuryBalance">
                  {{ formatDateTime(treasuryBalance.checkedAt) }}
                </span>
                <span v-else>
                  {{ t('treasuryPage.summary.notCheckedYet') }}
                </span>
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
                <span>{{ t('treasuryPage.details.treasuryAddress') }}</span>
                <strong class="text-break">
                  {{ treasuryWallet.address }}
                </strong>
              </div>

              <div v-if="treasuryWallet.createdAt" class="details-row">
                <span>{{ t('treasuryPage.details.created') }}</span>
                <strong>{{ formatDateTime(treasuryWallet.createdAt) }}</strong>
              </div>

              <div v-if="treasuryWallet.updatedAt" class="details-row">
                <span>{{ t('treasuryPage.details.updated') }}</span>
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
            :label="t('treasuryPage.actions.refreshBalance')"
            icon="refresh"
            :loading="isCheckingBalance"
            outline
            no-caps
            @click="handleRefreshBalance"
          />

          <q-btn
            class="primary-button"
            :label="
              treasuryWallet.isSetup
                ? t('treasuryPage.actions.walletReady')
                : t('treasuryPage.actions.createWallet')
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
          :label="t('treasuryPage.utxoDetails.label')"
          :caption="t('treasuryPage.utxoDetails.caption')"
        >
          <q-card-section>
            <p class="text-grey-7 q-mb-md">
              {{ t('treasuryPage.utxoDetails.description') }}
            </p>

            <q-banner
              v-if="treasuryBalance.utxos.length === 0"
              class="bg-grey-2 text-grey-9"
              rounded
            >
              {{ t('treasuryPage.utxoDetails.noneDetected') }}
            </q-banner>

            <q-list v-else bordered separator>
              <q-item
                v-for="(utxo, index) in treasuryBalance.utxos"
                :key="`${utxo.outpointTransactionHash}:${utxo.outpointIndex}`"
              >
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{
                      t('treasuryPage.utxoDetails.utxoNumber', {
                        number: index + 1,
                      })
                    }}
                  </q-item-label>

                  <q-item-label caption>
                    {{ t('treasuryPage.utxoDetails.value') }}:
                    {{ formatBchSats(utxo.valueSats) }}
                    / {{ utxo.valueSats.toLocaleString() }} sats
                  </q-item-label>

                  <q-item-label caption class="text-break">
                    {{ t('treasuryPage.utxoDetails.tx') }}:
                    {{ utxo.outpointTransactionHash }}
                  </q-item-label>

                  <q-item-label caption>
                    {{ t('treasuryPage.utxoDetails.outputIndex') }}:
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
          :label="t('treasuryPage.fundingConfig.label')"
          :caption="t('treasuryPage.fundingConfig.caption')"
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
                {{ t('treasuryPage.fundingConfig.platformFeeValid') }}
              </span>

              <span v-else-if="feeAddressConfig.platformFeeAddressConfigured">
                {{
                  t('treasuryPage.fundingConfig.platformFeeInvalid', {
                    error: feeAddressConfig.platformFeeAddressError,
                  })
                }}
              </span>

              <span v-else>
                {{ t('treasuryPage.fundingConfig.platformFeeNotConfigured') }}
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
                {{ t('treasuryPage.fundingConfig.bufferReserveValid') }}
              </span>

              <span v-else>
                {{ t('treasuryPage.fundingConfig.bufferReserveOptional') }}
              </span>
            </q-banner>

            <q-list bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.fundingConfig.platformFeeAddress') }}
                  </q-item-label>
                  <q-item-label class="text-break">
                    {{
                      feeAddressConfig.platformFeeAddress ||
                      t('treasuryPage.common.notConfigured')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{
                      t('treasuryPage.fundingConfig.platformFeeAddressStatus')
                    }}
                  </q-item-label>
                  <q-item-label>
                    {{
                      feeAddressConfig.platformFeeAddressValid
                        ? t('treasuryPage.common.valid')
                        : t('treasuryPage.common.notReady')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.fundingConfig.bufferReserveAddress') }}
                  </q-item-label>
                  <q-item-label class="text-break">
                    {{
                      feeAddressConfig.bufferReserveAddress ||
                      t('treasuryPage.common.notConfigured')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{
                      t('treasuryPage.fundingConfig.bufferReserveAddressStatus')
                    }}
                  </q-item-label>
                  <q-item-label>
                    {{
                      feeAddressConfig.bufferReserveAddressValid
                        ? t('treasuryPage.common.validNotRequired')
                        : t('treasuryPage.common.notReady')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.fundingConfig.configChecked') }}
                  </q-item-label>
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
          :label="t('treasuryPage.walletBackup.label')"
          :caption="t('treasuryPage.walletBackup.caption')"
        >
          <q-card-section>
            <q-banner class="bg-red-1 text-red-10 q-mb-md" rounded>
              <template #avatar>
                <q-icon name="dangerous" />
              </template>

              {{ t('treasuryPage.walletBackup.warning') }}
            </q-banner>

            <q-list bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.walletBackup.backupStatus') }}
                  </q-item-label>
                  <q-item-label>
                    {{
                      treasuryBackup
                        ? t('treasuryPage.walletBackup.seedLoaded')
                        : t('treasuryPage.walletBackup.seedNotRevealed')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="treasuryBackup">
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.details.treasuryAddress') }}
                  </q-item-label>
                  <q-item-label class="text-break">
                    {{ treasuryBackup.address }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="treasuryBackup">
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.walletBackup.seedPhrase') }}
                  </q-item-label>
                  <q-item-label class="text-break text-weight-medium">
                    {{ treasuryBackup.mnemonic }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="treasuryBackup">
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.walletBackup.exported') }}
                  </q-item-label>
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
              :label="t('treasuryPage.actions.hideSeed')"
              no-caps
              @click="handleHideTreasuryBackup"
            />

            <q-btn
              color="negative"
              outline
              :label="t('treasuryPage.actions.revealSeedBackup')"
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
          :label="t('treasuryPage.restore.label')"
          :caption="t('treasuryPage.restore.caption')"
        >
          <q-card-section>
            <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              {{ t('treasuryPage.restore.warning') }}
            </q-banner>

            <q-input
              v-model="restoreMnemonicInput"
              type="textarea"
              :label="t('treasuryPage.restore.seedInputLabel')"
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
                {{ t('treasuryPage.restore.matchesCurrentAddress') }}
              </span>

              <span v-else>
                {{ t('treasuryPage.restore.differentAddress') }}
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

              {{ t('treasuryPage.restore.importedIntoLocalStorage') }}
            </q-banner>

            <q-list v-if="restoreCheck" bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.restore.derivedAddress') }}
                  </q-item-label>
                  <q-item-label class="text-break">
                    {{ restoreCheck.derivedAddress }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.restore.currentTreasuryAddress') }}
                  </q-item-label>
                  <q-item-label class="text-break">
                    {{
                      restoreCheck.currentAddress ||
                      t('treasuryPage.restore.noCurrentTreasuryWallet')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.restore.checked') }}
                  </q-item-label>
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
                  <q-item-label caption>
                    {{ t('treasuryPage.restore.importedAddress') }}
                  </q-item-label>
                  <q-item-label class="text-break">
                    {{ restoreImportResult.address }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.restore.replacedExistingWallet') }}
                  </q-item-label>
                  <q-item-label>
                    {{
                      restoreImportResult.replacedExistingWallet
                        ? t('common.yes')
                        : t('common.no')
                    }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.restore.imported') }}
                  </q-item-label>
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
              :label="t('treasuryPage.actions.clearRestoreTool')"
              no-caps
              @click="handleClearRestoreCheck"
            />

            <q-btn
              class="secondary-button"
              :label="t('treasuryPage.actions.checkSeed')"
              :loading="isCheckingRestore"
              outline
              no-caps
              @click="handleCheckRestoreMnemonic"
            />

            <q-btn
              color="negative"
              :label="t('treasuryPage.actions.importCheckedSeed')"
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
          :label="t('treasuryPage.dangerZone.label')"
          :caption="t('treasuryPage.dangerZone.caption')"
        >
          <q-card-section>
            <q-banner class="bg-red-1 text-red-10" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              {{ t('treasuryPage.dangerZone.warning') }}
            </q-banner>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              color="negative"
              outline
              :label="t('treasuryPage.actions.clearTreasuryWallet')"
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

        {{ t('treasuryPage.safetyNotice') }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { t } = useI18n({ useScope: 'global' });

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
    errorMessage.value = t('treasuryPage.messages.couldNotLoadWalletInfo');
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
    successMessage.value = t('treasuryPage.messages.createdWallet');
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.messages.couldNotCreateWallet');
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
    successMessage.value = t('treasuryPage.messages.clearedWallet');
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.messages.couldNotClearWallet');
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
    successMessage.value = t('treasuryPage.messages.balanceRefreshed');
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.messages.couldNotRefreshBalance');
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
    successMessage.value = t('treasuryPage.messages.seedBackupLoaded');
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.messages.couldNotLoadBackupInfo');
  } finally {
    isExportingBackup.value = false;
  }
}

function handleHideTreasuryBackup(): void {
  treasuryBackup.value = null;
  successMessage.value = t('treasuryPage.messages.seedBackupHidden');
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

    successMessage.value = t('treasuryPage.messages.restoreSeedCheckCompleted');
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('treasuryPage.messages.couldNotCheckRestoreSeed');
  } finally {
    isCheckingRestore.value = false;
  }
}

async function handleImportCheckedRestoreMnemonic(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  if (!restoreCheck.value) {
    errorMessage.value = t('treasuryPage.messages.checkSeedBeforeImporting');
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

    successMessage.value = t('treasuryPage.messages.importedCheckedSeed');
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('treasuryPage.messages.couldNotImportSeed');
  } finally {
    isImportingRestore.value = false;
  }
}

function handleClearRestoreCheck(): void {
  restoreCheck.value = null;
  restoreImportResult.value = null;
  restoreMnemonicInput.value = '';
  successMessage.value = t('treasuryPage.messages.restoreToolCleared');
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
