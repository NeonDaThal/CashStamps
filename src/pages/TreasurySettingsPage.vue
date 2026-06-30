<template>
  <q-page padding class="treasury-page">
    <div class="treasury-container">
      <section class="treasury-hero">
        <div class="treasury-hero-heading">
          <div class="treasury-hero-copy">
            <p class="eyebrow">{{ t('treasuryPage.hero.eyebrow') }}</p>
            <h1>{{ t('treasuryPage.hero.title') }}</h1>
          </div>

          <div class="treasury-hero-actions">
            <q-btn
              flat
              dense
              round
              icon="point_of_sale"
              class="treasury-action-button treasury-action-button--topup"
              :aria-label="t('home.sellVoucher')"
              to="/sell-voucher"
            />

            <q-btn
              flat
              dense
              round
              icon="currency_exchange"
              class="treasury-action-button treasury-action-button--cashout"
              :aria-label="t('home.cashOutBch')"
              to="/cash-out"
            />
          </div>
        </div>

        <p class="intro">
          {{ t('treasuryPage.hero.intro') }}
        </p>
      </section>

      <q-card flat bordered class="main-card wallet-status-card">
        <q-card-section>
          <div class="status-heading">
            <div
              :class="[
                'status-icon',
                treasuryWallet.isSetup
                  ? 'status-icon--ready'
                  : 'status-icon--not-ready',
              ]"
            >
              <q-icon name="account_balance_wallet" />
              <span class="status-dot" aria-hidden="true"></span>
            </div>

            <div class="status-heading-copy">
              <div class="text-h6">
                {{ t('treasuryPage.walletStatus.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.walletStatus.subtitle') }}
              </p>
            </div>
          </div>

          <div
            v-if="!treasuryWallet.isSetup"
            class="wallet-setup-prompt q-mt-md"
          >
            <span>{{ t('treasuryPage.walletStatus.notSetupPrompt') }}</span>

            <q-btn
              class="wallet-create-button"
              :label="t('treasuryPage.actions.create')"
              :loading="isSubmitting"
              unelevated
              no-caps
              @click="handleCreateTreasuryWallet"
            />
          </div>

          <section v-else class="wallet-snapshot q-mt-md">
            <div class="wallet-balance-panel">
              <div class="wallet-balance-top">
                <div class="snapshot-label">
                  {{ t('treasuryPage.summary.balance') }}
                </div>

                <q-btn
                  flat
                  dense
                  round
                  icon="refresh"
                  class="balance-refresh-button"
                  :aria-label="t('treasuryPage.actions.refreshBalance')"
                  :loading="isCheckingBalance"
                  @click="handleRefreshBalance"
                />
              </div>

              <div class="wallet-balance-main">
                <span v-if="treasuryBalanceFiatDisplay">
                  {{ treasuryBalanceFiatDisplay }}
                </span>
                <span v-else-if="treasuryBalance">
                  {{ t('treasuryPage.summary.balanceUnavailable') }}
                </span>
                <span v-else>
                  {{ t('treasuryPage.summary.notChecked') }}
                </span>
              </div>

              <div class="wallet-balance-bch">
                <template v-if="treasuryBalance">
                  <img :src="bchLogoUrl" alt="" class="wallet-bch-logo" />
                  {{ formatBchSats(treasuryBalance.balanceSats) }}
                </template>

                <span v-else>—</span>
              </div>
            </div>

            <div class="wallet-snapshot-grid">
              <div class="snapshot-row">
                <span>{{ t('treasuryPage.summary.status') }}</span>

                <strong
                  :class="[
                    'status-pill',
                    treasuryWallet.isSetup
                      ? 'status-pill--ready'
                      : 'status-pill--not-ready',
                  ]"
                >
                  {{
                    treasuryWallet.isSetup
                      ? t('treasuryPage.summary.ready')
                      : t('treasuryPage.summary.notSetUp')
                  }}
                </strong>
              </div>

              <div v-if="treasuryWallet.createdAt" class="snapshot-row">
                <span>{{ t('treasuryPage.details.created') }}</span>
                <strong>{{ formatDateTime(treasuryWallet.createdAt) }}</strong>
              </div>

              <div class="snapshot-row">
                <span>{{ t('treasuryPage.details.treasuryAddress') }}</span>
                <strong
                  class="snapshot-address"
                  :title="treasuryWallet.address"
                >
                  {{ shortTreasuryAddress }}
                </strong>
              </div>
            </div>
          </section>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card cash-on-hand-card">
        <q-card-section>
          <div class="cash-on-hand-heading">
            <div
              :class="[
                'cash-on-hand-icon',
                cashOnHandState.isSetUp
                  ? 'cash-on-hand-icon--ready'
                  : 'cash-on-hand-icon--not-ready',
              ]"
            >
              <q-icon name="payments" />
              <span class="cash-on-hand-dot" aria-hidden="true"></span>
            </div>

            <div class="cash-on-hand-heading-copy">
              <div class="text-h6">
                {{ t('treasuryPage.cashOnHand.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.cashOnHand.subtitle') }}
              </p>
            </div>
          </div>

          <div
            v-if="!cashOnHandState.isSetUp"
            class="cash-on-hand-setup-prompt q-mt-md"
          >
            <div>
              <strong>{{ t('treasuryPage.cashOnHand.notSetUp') }}</strong>
              <span>{{ t('treasuryPage.cashOnHand.notSetUpPrompt') }}</span>
            </div>

            <q-btn
              class="cash-on-hand-setup-button"
              icon="settings"
              :label="t('treasuryPage.cashOnHand.actions.setUp')"
              unelevated
              dense
              no-caps
              @click="openCashOnHandDialog('setup')"
            />
          </div>

          <section v-else class="cash-on-hand-snapshot q-mt-md">
            <div class="cash-balance-panel">
              <div class="snapshot-label snapshot-label--dark">
                {{ t('treasuryPage.cashOnHand.currentBalance') }}
              </div>

              <div
                :class="[
                  'cash-balance-main',
                  {
                    'cash-balance-main--negative': cashOnHandBalanceIsNegative,
                  },
                ]"
              >
                {{ cashOnHandBalanceDisplay }}
              </div>

              <div class="cash-balance-subtitle">
                <span v-if="cashOnHandUpdatedDisplay">
                  {{
                    t('treasuryPage.cashOnHand.lastUpdated', {
                      date: cashOnHandUpdatedDisplay,
                    })
                  }}
                </span>
                <span v-else>
                  {{ t('treasuryPage.cashOnHand.readyForManualTracking') }}
                </span>
              </div>
            </div>

            <div class="cash-on-hand-action-grid">
              <q-btn
                class="cash-on-hand-primary-button cash-on-hand-action-button"
                icon="add"
                :label="t('treasuryPage.cashOnHand.actions.addCash')"
                unelevated
                no-caps
                @click="openCashOnHandDialog('add')"
              />

              <q-btn
                class="cash-on-hand-secondary-button cash-on-hand-action-button"
                icon="remove"
                :label="t('treasuryPage.cashOnHand.actions.withdrawCash')"
                outline
                no-caps
                @click="openCashOnHandDialog('withdraw')"
              />
            </div>

            <div class="wallet-snapshot-grid cash-on-hand-details">
              <div class="snapshot-row">
                <span>{{ t('treasuryPage.summary.status') }}</span>
                <strong class="status-pill status-pill--ready">
                  {{ t('treasuryPage.cashOnHand.setUp') }}
                </strong>
              </div>

              <div class="snapshot-row">
                <span>{{ t('treasuryPage.cashOnHand.currency') }}</span>
                <strong>{{ cashOnHandState.currency }}</strong>
              </div>

              <div v-if="cashOnHandState.createdAt" class="snapshot-row">
                <span>{{ t('treasuryPage.details.created') }}</span>
                <strong>{{ formatDateTime(cashOnHandState.createdAt) }}</strong>
              </div>
            </div>

            <div class="cash-on-hand-clear-row">
              <q-btn
                flat
                color="negative"
                icon="delete_sweep"
                :label="t('treasuryPage.cashOnHand.actions.clear')"
                no-caps
                @click="showClearCashOnHandDialog = true"
              />
            </div>
          </section>
        </q-card-section>
      </q-card>

      <TreasuryTopUpQrCard
        v-if="treasuryWallet.isSetup"
        :treasury-address="treasuryWallet.address"
      />

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

      <q-dialog v-model="cashOnHandDialogVisible">
        <q-card class="cash-on-hand-dialog-card">
          <q-card-section>
            <div class="text-h6">{{ cashOnHandDialogTitle }}</div>
            <p class="text-grey-7 q-mb-none">
              {{ cashOnHandDialogSubtitle }}
            </p>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-list bordered separator class="cash-on-hand-dialog-summary">
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.cashOnHand.dialog.currentCash') }}
                  </q-item-label>
                  <q-item-label>{{
                    cashOnHandDialogCurrentDisplay
                  }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.cashOnHand.dialog.enteredAmount') }}
                  </q-item-label>
                  <q-item-label>{{
                    cashOnHandDialogAmountDisplay
                  }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    {{ t('treasuryPage.cashOnHand.dialog.newCash') }}
                  </q-item-label>
                  <q-item-label class="text-weight-bold">
                    {{ cashOnHandDialogNewDisplay }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-input
              v-model="cashOnHandAmountInput"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              :label="cashOnHandAmountLabel"
              :prefix="cashOnHandCurrencyPrefix"
              outlined
              class="q-mt-md"
              :error="showCashOnHandAmountError"
              :error-message="cashOnHandAmountErrorMessage"
              @keyup.enter="handleSaveCashOnHandDialog"
            />

            <q-input
              v-model="cashOnHandNoteInput"
              :label="t('treasuryPage.cashOnHand.dialog.noteOptional')"
              outlined
              class="q-mt-md"
            />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              flat
              color="grey-8"
              :label="t('common.cancel')"
              no-caps
              @click="resetCashOnHandDialog"
            />

            <q-btn
              class="cash-on-hand-primary-button"
              :label="cashOnHandDialogActionLabel"
              :disable="!isCashOnHandAmountValid"
              :loading="isCashOnHandSubmitting"
              unelevated
              no-caps
              @click="handleSaveCashOnHandDialog"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showClearCashOnHandDialog">
        <q-card class="cash-on-hand-dialog-card">
          <q-card-section>
            <div class="text-h6">
              {{ t('treasuryPage.cashOnHand.clearDialog.title') }}
            </div>
            <p class="text-grey-7 q-mb-none">
              {{ t('treasuryPage.cashOnHand.clearDialog.message') }}
            </p>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-orange-1 text-orange-10" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              {{
                t('treasuryPage.cashOnHand.clearDialog.warning', {
                  amount: cashOnHandBalanceDisplay,
                })
              }}
            </q-banner>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              flat
              color="grey-8"
              :label="t('common.cancel')"
              no-caps
              v-close-popup
            />

            <q-btn
              color="negative"
              :label="t('treasuryPage.cashOnHand.actions.confirmClear')"
              :loading="isClearingCashOnHand"
              no-caps
              @click="handleClearCashOnHand"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import TreasuryTopUpQrCard from 'src/components/TreasuryTopUpQrCard.vue';

import bchLogoUrl from 'src/assets/bch-logo.png';
import type { CashOnHandState } from 'src/types/cash-on-hand';
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
import { PricingService } from 'src/services/pricing-service';
import {
  addToCashOnHand,
  clearCashOnHand,
  getCashOnHandState,
  setUpCashOnHand,
  withdrawFromCashOnHand,
} from 'src/services/cash-on-hand-store';

const { t } = useI18n({ useScope: 'global' });

const SATS_PER_BCH = 100_000_000;
const treasuryFiatCurrency = 'GBP';
const pricingService = new PricingService();

type CashOnHandDialogMode = 'setup' | 'add' | 'withdraw';

const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});

const treasuryBalance = ref<TreasuryWalletBalance | null>(null);
const treasuryBalanceMarketRate = ref<number | null>(null);
const treasuryBackup = ref<TreasuryWalletBackupInfo | null>(null);
const restoreCheck = ref<TreasuryRestoreCheckResult | null>(null);
const restoreImportResult = ref<TreasuryRestoreImportResult | null>(null);
const restoreMnemonicInput = ref('');

const cashOnHandState = ref<CashOnHandState>({
  isSetUp: false,
  currency: treasuryFiatCurrency,
  balanceMinor: 0,
  movements: [],
});
const cashOnHandDialogMode = ref<CashOnHandDialogMode | null>(null);
const cashOnHandAmountInput = ref('');
const cashOnHandNoteInput = ref('');
const showClearCashOnHandDialog = ref(false);

const feeAddressConfig = ref<FeeAddressConfigStatus>(
  getFeeAddressConfigStatus()
);

const isSubmitting = ref(false);
const isCheckingBalance = ref(false);
const isExportingBackup = ref(false);
const isCheckingRestore = ref(false);
const isImportingRestore = ref(false);
const isCashOnHandSubmitting = ref(false);
const isClearingCashOnHand = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const treasuryBalanceFiatDisplay = computed(() => {
  if (!treasuryBalance.value || treasuryBalanceMarketRate.value === null) {
    return '';
  }

  const balanceBch = treasuryBalance.value.balanceSats / SATS_PER_BCH;
  const balanceFiat = balanceBch * treasuryBalanceMarketRate.value;

  return formatFiatAmount(balanceFiat, treasuryFiatCurrency);
});

const shortTreasuryAddress = computed(() => {
  const address = treasuryWallet.value.address;

  if (!address) {
    return '—';
  }

  if (address.length <= 28) {
    return address;
  }

  return `${address.slice(0, 18)}…${address.slice(-8)}`;
});

const cashOnHandBalanceDisplay = computed(() =>
  formatFiatMinorAmount(
    cashOnHandState.value.balanceMinor,
    cashOnHandState.value.currency
  )
);

const cashOnHandBalanceIsNegative = computed(
  () => cashOnHandState.value.balanceMinor < 0
);

const cashOnHandUpdatedDisplay = computed(() => {
  if (!cashOnHandState.value.updatedAt) {
    return '';
  }

  return formatDateTime(cashOnHandState.value.updatedAt);
});

const cashOnHandDialogVisible = computed({
  get: () => cashOnHandDialogMode.value !== null,
  set: (value: boolean) => {
    if (!value) {
      resetCashOnHandDialog();
    }
  },
});

const parsedCashOnHandAmountMinor = computed(() =>
  parseFiatInputToMinor(cashOnHandAmountInput.value)
);

const isCashOnHandAmountValid = computed(() => {
  const amountMinor = parsedCashOnHandAmountMinor.value;

  if (amountMinor === null) {
    return false;
  }

  if (cashOnHandDialogMode.value === 'setup') {
    return amountMinor >= 0;
  }

  if (amountMinor <= 0) {
    return false;
  }

  if (cashOnHandDialogMode.value === 'withdraw') {
    return amountMinor <= cashOnHandState.value.balanceMinor;
  }

  return true;
});

const showCashOnHandAmountError = computed(
  () =>
    cashOnHandAmountInput.value.trim().length > 0 &&
    !isCashOnHandAmountValid.value
);

const cashOnHandAmountErrorMessage = computed(() => {
  const amountMinor = parsedCashOnHandAmountMinor.value;

  if (amountMinor === null) {
    return t('treasuryPage.cashOnHand.errors.enterValidAmount');
  }

  if (cashOnHandDialogMode.value !== 'setup' && amountMinor <= 0) {
    return t('treasuryPage.cashOnHand.errors.enterPositiveAmount');
  }

  if (
    cashOnHandDialogMode.value === 'withdraw' &&
    amountMinor > cashOnHandState.value.balanceMinor
  ) {
    return t('treasuryPage.cashOnHand.errors.withdrawTooMuch');
  }

  return '';
});

const cashOnHandCurrencyPrefix = computed(() => {
  if (cashOnHandState.value.currency === 'GBP') {
    return '£';
  }

  return cashOnHandState.value.currency;
});

const cashOnHandAmountLabel = computed(() => {
  if (cashOnHandDialogMode.value === 'setup') {
    return t('treasuryPage.cashOnHand.dialog.startingAmount');
  }

  if (cashOnHandDialogMode.value === 'withdraw') {
    return t('treasuryPage.cashOnHand.dialog.amountToWithdraw');
  }

  return t('treasuryPage.cashOnHand.dialog.amountToAdd');
});

const cashOnHandDialogTitle = computed(() => {
  if (cashOnHandDialogMode.value === 'setup') {
    return t('treasuryPage.cashOnHand.dialog.setupTitle');
  }

  if (cashOnHandDialogMode.value === 'withdraw') {
    return t('treasuryPage.cashOnHand.dialog.withdrawTitle');
  }

  return t('treasuryPage.cashOnHand.dialog.addTitle');
});

const cashOnHandDialogSubtitle = computed(() => {
  if (cashOnHandDialogMode.value === 'setup') {
    return t('treasuryPage.cashOnHand.dialog.setupSubtitle');
  }

  if (cashOnHandDialogMode.value === 'withdraw') {
    return t('treasuryPage.cashOnHand.dialog.withdrawSubtitle');
  }

  return t('treasuryPage.cashOnHand.dialog.addSubtitle');
});

const cashOnHandDialogActionLabel = computed(() => {
  if (cashOnHandDialogMode.value === 'setup') {
    return t('treasuryPage.cashOnHand.actions.saveSetup');
  }

  if (cashOnHandDialogMode.value === 'withdraw') {
    return t('treasuryPage.cashOnHand.actions.saveWithdraw');
  }

  return t('treasuryPage.cashOnHand.actions.saveAdd');
});

const cashOnHandDialogCurrentDisplay = computed(() => {
  if (cashOnHandDialogMode.value === 'setup') {
    return formatFiatMinorAmount(0, treasuryFiatCurrency);
  }

  return cashOnHandBalanceDisplay.value;
});

const cashOnHandDialogAmountDisplay = computed(() => {
  const amountMinor = parsedCashOnHandAmountMinor.value;

  if (amountMinor === null) {
    return '—';
  }

  const currency = cashOnHandState.value.isSetUp
    ? cashOnHandState.value.currency
    : treasuryFiatCurrency;

  return formatFiatMinorAmount(amountMinor, currency);
});

const cashOnHandDialogNewDisplay = computed(() => {
  const amountMinor = parsedCashOnHandAmountMinor.value;

  if (amountMinor === null) {
    return '—';
  }

  const currency = cashOnHandState.value.isSetUp
    ? cashOnHandState.value.currency
    : treasuryFiatCurrency;

  if (cashOnHandDialogMode.value === 'setup') {
    return formatFiatMinorAmount(amountMinor, currency);
  }

  if (cashOnHandDialogMode.value === 'withdraw') {
    return formatFiatMinorAmount(
      cashOnHandState.value.balanceMinor - amountMinor,
      currency
    );
  }

  return formatFiatMinorAmount(
    cashOnHandState.value.balanceMinor + amountMinor,
    currency
  );
});

async function loadTreasuryWallet(): Promise<void> {
  errorMessage.value = '';

  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();
    feeAddressConfig.value = getFeeAddressConfigStatus();

    if (!treasuryWallet.value.isSetup) {
      treasuryBalance.value = null;
      treasuryBalanceMarketRate.value = null;
      treasuryBackup.value = null;
      return;
    }

    await refreshTreasuryBalance({ showSuccess: false });
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.messages.couldNotLoadWalletInfo');
  }
}

async function handleCreateTreasuryWallet(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  treasuryBalance.value = null;
  treasuryBalanceMarketRate.value = null;
  treasuryBackup.value = null;
  restoreCheck.value = null;
  restoreImportResult.value = null;
  isSubmitting.value = true;

  try {
    treasuryWallet.value = await createTreasuryWallet();
    await refreshTreasuryBalance({ showSuccess: false });
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
  treasuryBalanceMarketRate.value = null;
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

async function refreshTreasuryBalance(
  options = { showSuccess: true }
): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  isCheckingBalance.value = true;

  try {
    treasuryBalance.value = await getTreasuryWalletBalance();

    try {
      const quote = await pricingService.getLockedQuote(treasuryFiatCurrency);
      treasuryBalanceMarketRate.value = quote.marketRate;
    } catch (error) {
      console.error(error);
      treasuryBalanceMarketRate.value = null;
    }

    if (options.showSuccess) {
      successMessage.value = t('treasuryPage.messages.balanceRefreshed');
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.messages.couldNotRefreshBalance');
  } finally {
    isCheckingBalance.value = false;
  }
}

async function handleRefreshBalance(): Promise<void> {
  await refreshTreasuryBalance();
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
    treasuryBalanceMarketRate.value = null;
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

async function loadCashOnHand(): Promise<void> {
  errorMessage.value = '';

  try {
    cashOnHandState.value = await getCashOnHandState();
  } catch (error) {
    console.error(error);
    errorMessage.value = t('treasuryPage.cashOnHand.messages.couldNotLoad');
  }
}

function openCashOnHandDialog(mode: CashOnHandDialogMode): void {
  successMessage.value = '';
  errorMessage.value = '';
  cashOnHandDialogMode.value = mode;
  cashOnHandAmountInput.value = '';
  cashOnHandNoteInput.value = '';
}

function resetCashOnHandDialog(): void {
  cashOnHandDialogMode.value = null;
  cashOnHandAmountInput.value = '';
  cashOnHandNoteInput.value = '';
}

async function handleSaveCashOnHandDialog(): Promise<void> {
  if (!isCashOnHandAmountValid.value || !cashOnHandDialogMode.value) {
    return;
  }

  const amountMinor = parsedCashOnHandAmountMinor.value;

  if (amountMinor === null) {
    return;
  }

  successMessage.value = '';
  errorMessage.value = '';
  isCashOnHandSubmitting.value = true;

  const note = cashOnHandNoteInput.value.trim() || undefined;

  try {
    if (cashOnHandDialogMode.value === 'setup') {
      cashOnHandState.value = await setUpCashOnHand({
        amountMinor,
        currency: treasuryFiatCurrency,
        note,
      });
      successMessage.value = t('treasuryPage.cashOnHand.messages.setUp');
    } else if (cashOnHandDialogMode.value === 'add') {
      cashOnHandState.value = await addToCashOnHand({
        amountMinor,
        currency: cashOnHandState.value.currency,
        note,
      });
      successMessage.value = t('treasuryPage.cashOnHand.messages.added');
    } else {
      cashOnHandState.value = await withdrawFromCashOnHand({
        amountMinor,
        currency: cashOnHandState.value.currency,
        note,
      });
      successMessage.value = t('treasuryPage.cashOnHand.messages.withdrawn');
    }

    resetCashOnHandDialog();
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('treasuryPage.cashOnHand.messages.couldNotSave');
  } finally {
    isCashOnHandSubmitting.value = false;
  }
}

async function handleClearCashOnHand(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';
  isClearingCashOnHand.value = true;

  try {
    cashOnHandState.value = await clearCashOnHand(
      t('treasuryPage.cashOnHand.clearDialog.clearNote')
    );
    showClearCashOnHandDialog.value = false;
    successMessage.value = t('treasuryPage.cashOnHand.messages.cleared');
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('treasuryPage.cashOnHand.messages.couldNotClear');
  } finally {
    isClearingCashOnHand.value = false;
  }
}

function parseFiatInputToMinor(value: string): number | null {
  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(/^(\d+)(?:\.(\d{0,2}))?$/);

  if (!match) {
    return null;
  }

  const majorUnits = Number.parseInt(match[1] ?? '0', 10);
  const minorUnits = Number.parseInt((match[2] ?? '').padEnd(2, '0'), 10);
  const amountMinor = majorUnits * 100 + minorUnits;

  return Number.isSafeInteger(amountMinor) ? amountMinor : null;
}

function formatFiatMinorAmount(amountMinor: number, currency: string): string {
  return formatFiatAmount(amountMinor / 100, currency);
}

function formatFiatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

onMounted(() => {
  void loadTreasuryWallet();
  void loadCashOnHand();
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.treasury-hero-heading {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.treasury-hero-copy {
  min-width: 0;
}

.treasury-hero-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  padding-top: 2px;
}

.treasury-action-button {
  border-radius: 14px;
  height: 42px;
  overflow: hidden;
  width: 42px;
}

.treasury-action-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.treasury-action-button--topup {
  background: #00ce1b;
  color: #000000;
}

.treasury-action-button--cashout {
  background: #111111;
  color: #00ce1b;
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

.status-heading-copy {
  min-width: 0;
}

.status-icon {
  align-items: center;
  background: #f0f0f0;
  border: 1px solid #dddddd;
  border-radius: 14px;
  color: #00a816;
  display: flex;
  flex: 0 0 46px;
  font-size: 26px;
  height: 46px;
  justify-content: center;
  position: relative;
  width: 46px;
}

.status-dot {
  border: 2px solid #ffffff;
  border-radius: 999px;
  height: 12px;
  position: absolute;
  right: 6px;
  top: 6px;
  width: 12px;
}

.status-icon--ready .status-dot {
  background: #00ce1b;
}

.status-icon--not-ready .status-dot {
  background: #d93025;
}

.wallet-setup-prompt {
  align-items: center;
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  color: #333333;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 12px 14px;
}

.wallet-setup-prompt span {
  font-size: 14px;
  font-weight: 750;
  line-height: 1.3;
}

.wallet-create-button {
  background: #00ce1b;
  border-radius: 999px;
  color: #000000;
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 850;
  min-height: 34px;
  padding: 0 14px;
}

.wallet-snapshot {
  display: grid;
  gap: 14px;
}

.wallet-balance-panel {
  background: #111111;
  border-radius: 22px;
  color: #ffffff;
  padding: 16px;
}

.wallet-balance-top {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.snapshot-label {
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.balance-refresh-button {
  background: rgba(255, 255, 255, 0.1);
  color: #00ce1b;
  height: 34px;
  width: 34px;
}

.wallet-balance-main {
  color: #ffffff;
  font-size: 32px;
  font-weight: 950;
  letter-spacing: -0.6px;
  line-height: 1.05;
  margin-top: 8px;
}

.wallet-balance-bch {
  align-items: center;
  color: #00ce1b;
  display: inline-flex;
  font-size: 13px;
  font-weight: 850;
  gap: 6px;
  line-height: 1.2;
  margin-top: 7px;
}

.wallet-bch-logo {
  border-radius: 999px;
  display: block;
  height: 16px;
  width: 16px;
}

.wallet-snapshot-grid {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 2px 14px;
}

.snapshot-row {
  align-items: center;
  display: grid;
  gap: 14px;
  grid-template-columns: max-content minmax(0, 1fr);
  padding: 11px 0;
}

.snapshot-row + .snapshot-row {
  border-top: 1px solid #e8e8e8;
}

.snapshot-row span {
  color: #666666;
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
}

.snapshot-row strong {
  color: #111111;
  font-size: 13px;
  font-weight: 850;
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill {
  border-radius: 999px;
  justify-self: end;
  padding: 5px 10px;
}

.status-pill--ready {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.45);
  color: #0c5f17;
}

.status-pill--not-ready {
  background: #fff0f0;
  border: 1px solid rgba(217, 48, 37, 0.35);
  color: #9f1c14;
}

.snapshot-address {
  direction: ltr;
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

.cash-on-hand-card {
  border-color: rgba(0, 206, 27, 0.32);
}

.cash-on-hand-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.cash-on-hand-heading-copy {
  min-width: 0;
}

.cash-on-hand-icon {
  align-items: center;
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  border-radius: 14px;
  color: #0c5f17;
  display: flex;
  flex: 0 0 46px;
  font-size: 26px;
  height: 46px;
  justify-content: center;
  position: relative;
  width: 46px;
}

.cash-on-hand-dot {
  border: 2px solid #ffffff;
  border-radius: 999px;
  height: 12px;
  position: absolute;
  right: 6px;
  top: 6px;
  width: 12px;
}

.cash-on-hand-icon--ready .cash-on-hand-dot {
  background: #00ce1b;
}

.cash-on-hand-icon--not-ready .cash-on-hand-dot {
  background: #f59e0b;
}

.cash-on-hand-setup-prompt {
  align-items: center;
  background: linear-gradient(135deg, #fff8eb 0%, #f7f8f7 100%);
  border: 1px solid rgba(245, 158, 11, 0.34);
  border-radius: 18px;
  color: #333333;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 14px;
}

.cash-on-hand-setup-prompt div {
  display: grid;
  gap: 3px;
}

.cash-on-hand-setup-prompt strong {
  color: #111111;
  font-size: 14px;
  font-weight: 900;
}

.cash-on-hand-setup-prompt span {
  color: #666666;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.cash-on-hand-snapshot {
  display: grid;
  gap: 14px;
}

.cash-balance-panel {
  background: linear-gradient(135deg, #eaffed 0%, #ffffff 100%);
  border: 1px solid rgba(0, 206, 27, 0.32);
  border-radius: 22px;
  color: #111111;
  padding: 16px;
}

.snapshot-label--dark {
  color: rgba(17, 17, 17, 0.62);
}

.cash-balance-main {
  color: #111111;
  font-size: 32px;
  font-weight: 950;
  letter-spacing: -0.6px;
  line-height: 1.05;
  margin-top: 8px;
}

.cash-balance-main--negative {
  color: #ff002f;
}

.cash-balance-subtitle {
  color: #0c5f17;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
  margin-top: 7px;
}

.cash-on-hand-action-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.cash-on-hand-primary-button,
.cash-on-hand-secondary-button {
  border-radius: 14px;
  font-size: 13px;
  font-weight: 850;
  min-height: 40px;
  padding: 0 16px;
}

.cash-on-hand-primary-button {
  background: #00ce1b;
  color: #000000;
}

.cash-on-hand-setup-button {
  background: #fff8eb;
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 999px;
  color: #8a4b00;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 850;
  min-height: 30px;
  padding: 0 10px;
}

.cash-on-hand-secondary-button {
  border-color: #111111;
  color: #111111;
}

.cash-on-hand-action-button {
  min-height: 46px;
}

.cash-on-hand-clear-row {
  display: flex;
  justify-content: flex-end;
}

.cash-on-hand-clear-row .q-btn {
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.cash-on-hand-dialog-card {
  border-radius: 22px;
  max-width: 440px;
  width: calc(100vw - 32px);
}

.cash-on-hand-dialog-summary {
  border-radius: 16px;
  overflow: hidden;
}

.cash-on-hand-primary-button :deep(.q-focus-helper),
.cash-on-hand-secondary-button :deep(.q-focus-helper),
.cash-on-hand-setup-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

@media (max-width: 640px) {
  .treasury-hero {
    padding: 22px;
  }

  .treasury-hero-heading {
    align-items: flex-start;
  }

  .treasury-hero-actions {
    padding-top: 1px;
  }

  .treasury-action-button {
    height: 40px;
    width: 40px;
  }

  .secondary-button {
    width: 100%;
  }

  .wallet-setup-prompt {
    align-items: stretch;
    flex-direction: column;
  }

  .cash-on-hand-setup-prompt {
    align-items: center;
    flex-direction: row;
  }

  .wallet-create-button {
    width: 100%;
  }

  .cash-on-hand-action-grid {
    grid-template-columns: 1fr;
  }

  .cash-balance-panel {
    padding: 14px;
  }

  .cash-balance-main {
    font-size: 28px;
  }

  .wallet-balance-panel {
    padding: 14px;
  }

  .wallet-balance-main {
    font-size: 28px;
  }

  .snapshot-row {
    gap: 10px;
  }

  .snapshot-row span,
  .snapshot-row strong {
    font-size: 12px;
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
.cash-on-hand-primary-button :deep(.q-focus-helper),
.cash-on-hand-secondary-button :deep(.q-focus-helper),
.cash-on-hand-secondary-button :deep(.q-focus-helper),
.main-card :deep(.q-focus-helper) {
  border-radius: inherit;
}
</style>
