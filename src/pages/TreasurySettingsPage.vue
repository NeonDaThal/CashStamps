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

            <div class="wallet-setup-actions">
              <q-btn
                class="wallet-create-button"
                :label="t('treasuryPage.actions.create')"
                :loading="isSubmitting"
                unelevated
                no-caps
                @click="handleCreateTreasuryWallet"
              />

              <q-btn
                class="wallet-restore-button"
                :label="t('treasuryPage.walletTools.restoreImport')"
                outline
                no-caps
                @click="openWalletImportDialog"
              />
            </div>
          </div>

          <section v-else class="wallet-snapshot q-mt-md">
            <div class="wallet-balance-panel">
              <div class="wallet-balance-top">
                <div class="snapshot-label">
                  {{ t('treasuryPage.summary.balance') }}
                </div>

                <div class="wallet-balance-actions">
                  <q-btn
                    flat
                    dense
                    round
                    icon="add"
                    class="balance-action-button balance-action-button--add"
                    :aria-label="t('treasuryPage.walletTools.addFunds')"
                    @click="showTreasuryTopUpDialog = true"
                  />

                  <q-btn
                    flat
                    dense
                    round
                    icon="send"
                    class="balance-action-button balance-action-button--send"
                    :aria-label="t('treasuryPage.walletTools.sendFunds')"
                    @click="openTreasurySendDialog"
                  />

                  <q-btn
                    flat
                    dense
                    round
                    icon="refresh"
                    class="balance-action-button balance-action-button--refresh"
                    :aria-label="t('treasuryPage.actions.refreshBalance')"
                    :loading="isCheckingBalance"
                    @click="handleRefreshBalance"
                  />
                </div>
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

            <div class="wallet-management-actions">
              <q-btn
                flat
                dense
                icon="key"
                class="wallet-management-pill wallet-management-pill--backup"
                :label="t('treasuryPage.walletTools.backup')"
                no-caps
                @click="openWalletBackupDialog"
              />

              <q-btn
                flat
                dense
                icon="file_upload"
                class="wallet-management-pill wallet-management-pill--import"
                :label="t('treasuryPage.walletTools.import')"
                no-caps
                @click="openWalletImportDialog"
              />

              <q-btn
                flat
                dense
                icon="delete"
                class="wallet-management-pill wallet-management-pill--delete"
                :label="t('treasuryPage.walletTools.delete')"
                no-caps
                @click="showDeleteTreasuryWalletDialog = true"
              />
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

          <div
            v-if="
              !cashOnHandState.isSetUp && cashOnHandState.movements.length > 0
            "
            class="cash-on-hand-link-row cash-on-hand-link-row--standalone"
          >
            <q-btn
              flat
              icon="receipt_long"
              class="cash-on-hand-transactions-link"
              :label="t('treasuryPage.cashOnHand.transactions.link')"
              no-caps
              @click="openCashOnHandTransactionsDialog"
            />
          </div>

          <section v-else class="cash-on-hand-snapshot q-mt-md">
            <div class="cash-balance-panel">
              <div class="cash-balance-top">
                <div class="snapshot-label snapshot-label--dark">
                  {{ t('treasuryPage.cashOnHand.currentBalance') }}
                </div>

                <div class="cash-balance-actions">
                  <q-btn
                    flat
                    dense
                    round
                    icon="add"
                    class="cash-balance-action-button cash-balance-action-button--add"
                    :aria-label="t('treasuryPage.cashOnHand.actions.addCash')"
                    @click="openCashOnHandDialog('add')"
                  />

                  <q-btn
                    flat
                    dense
                    round
                    icon="remove"
                    class="cash-balance-action-button cash-balance-action-button--withdraw"
                    :aria-label="
                      t('treasuryPage.cashOnHand.actions.withdrawCash')
                    "
                    @click="openCashOnHandDialog('withdraw')"
                  />
                </div>
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

            <div class="cash-on-hand-link-row">
              <q-btn
                flat
                icon="receipt_long"
                class="cash-on-hand-transactions-link"
                :label="t('treasuryPage.cashOnHand.transactions.link')"
                no-caps
                @click="openCashOnHandTransactionsDialog"
              />

              <q-btn
                flat
                color="negative"
                icon="delete_sweep"
                class="cash-on-hand-clear-link"
                :label="t('treasuryPage.cashOnHand.actions.clear')"
                no-caps
                @click="showClearCashOnHandDialog = true"
              />
            </div>
          </section>
        </q-card-section>
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

      <q-dialog v-model="showTreasuryTopUpDialog">
        <q-card class="treasury-tool-dialog-card">
          <q-card-section class="treasury-tool-dialog-header">
            <div
              class="treasury-tool-dialog-icon treasury-tool-dialog-icon--green"
            >
              <q-icon name="add" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('treasuryPage.walletTools.addFundsTitle') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.walletTools.addFundsSubtitle') }}
              </p>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <TreasuryTopUpQrCard :treasury-address="treasuryWallet.address" />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              flat
              color="grey-8"
              :label="t('common.close')"
              no-caps
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog
        v-model="showTreasurySendDialog"
        maximized
        transition-show="slide-up"
        transition-hide="slide-down"
        @hide="handleTreasurySendDialogHide"
      >
        <q-card class="treasury-send-dialog-card">
          <q-card-section class="treasury-send-header">
            <div class="treasury-send-header-main">
              <div
                class="treasury-tool-dialog-icon treasury-tool-dialog-icon--dark"
              >
                <q-icon name="send" />
              </div>

              <div>
                <div class="text-h6">
                  {{ t('treasuryPage.walletTools.sendFundsTitle') }}
                </div>
                <p class="text-grey-7 q-mb-none">
                  {{ t('treasuryPage.walletTools.sendFundsSubtitle') }}
                </p>
              </div>
            </div>

            <div class="treasury-send-header-actions">
              <TreasurySendQrTools
                v-if="treasurySendStep === 'form'"
                @scanned="handleTreasurySendQrResult"
                @error="handleTreasurySendQrError"
              />

              <q-btn
                flat
                dense
                round
                icon="close"
                class="treasury-send-close-button"
                :aria-label="t('common.close')"
                @click="closeTreasurySendDialog"
              />
            </div>
          </q-card-section>

          <q-card-section class="treasury-send-body">
            <section
              v-if="treasurySendStep === 'form'"
              class="treasury-send-step"
            >
              <div class="treasury-send-form-panel">
                <div class="treasury-send-form-intro">
                  <div class="treasury-send-form-icon">
                    <q-icon name="outbound" />
                  </div>

                  <div>
                    <div class="treasury-send-form-title">
                      {{ t('treasuryPage.walletTools.sendFundsTitle') }}
                    </div>
                    <p>
                      {{ t('treasuryPage.walletTools.sendFundsInstruction') }}
                    </p>
                  </div>
                </div>

                <q-input
                  v-model="treasurySendInput"
                  type="textarea"
                  :label="t('treasuryPage.walletTools.sendAddressLabel')"
                  :placeholder="
                    t('treasuryPage.walletTools.sendAddressPlaceholder')
                  "
                  outlined
                  autogrow
                  class="treasury-send-input"
                  @blur="handleTreasurySendInputBlur"
                />

                <div class="treasury-send-amount-panel">
                  <div class="treasury-send-amount-top">
                    <div>
                      <div class="treasury-send-amount-label">
                        {{ t('treasuryPage.walletTools.sendAmountLabel') }}
                      </div>
                      <div class="treasury-send-available">
                        {{ t('treasuryPage.walletTools.available') }}:
                        {{ treasurySendAvailableFiatDisplay }}
                      </div>
                    </div>

                    <q-btn
                      flat
                      dense
                      class="treasury-send-max-button"
                      :label="t('treasuryPage.walletTools.max')"
                      no-caps
                      :disable="!treasurySendCanUseMax"
                      @click="handleUseTreasurySendMax"
                    />
                  </div>

                  <q-input
                    v-model="treasurySendAmountInput"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    step="0.01"
                    :prefix="treasurySendFiatPrefix"
                    :label="t('treasuryPage.walletTools.sendFiatAmountLabel')"
                    outlined
                    class="treasury-send-input treasury-send-fiat-input"
                    @update:model-value="handleTreasurySendAmountInputChange"
                    @keyup.enter="handleReviewTreasurySend"
                  />

                  <div class="treasury-send-equivalent-row">
                    <span>{{
                      t('treasuryPage.walletTools.bchEquivalent')
                    }}</span>
                    <strong>{{ treasurySendEquivalentBchDisplay }}</strong>
                  </div>

                  <div v-if="treasurySendUseMax" class="treasury-send-max-note">
                    {{ t('treasuryPage.walletTools.maxSelected') }}
                  </div>
                </div>

                <q-banner
                  v-if="temporaryTreasurySendBroadcastEnabled"
                  class="treasury-real-broadcast-banner"
                  rounded
                >
                  <template #avatar>
                    <q-icon name="warning" />
                  </template>

                  {{ t('treasuryPage.walletTools.realBroadcastTestWarning') }}
                </q-banner>

                <q-banner
                  v-if="treasurySendErrorMessage"
                  class="bg-red-1 text-red-10"
                  rounded
                >
                  <template #avatar>
                    <q-icon name="warning" />
                  </template>

                  {{ treasurySendErrorMessage }}
                </q-banner>
              </div>
            </section>

            <section
              v-else-if="treasurySendStep === 'review'"
              class="treasury-send-step"
            >
              <div class="treasury-send-review-title">
                {{ t('treasuryPage.walletTools.reviewSendTitle') }}
              </div>

              <div class="wallet-snapshot-grid treasury-send-review-grid">
                <div class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.sendAmount') }}</span>
                  <strong class="treasury-send-summary-value">
                    <span>{{ treasurySendAmountFiatDisplay }}</span>
                    <small>{{ treasurySendAmountDisplay }}</small>
                  </strong>
                </div>

                <div class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.networkFee') }}</span>
                  <strong class="treasury-send-summary-value">
                    <span>{{ treasurySendFeeFiatDisplay }}</span>
                    <small>{{ treasurySendFeeDisplay }}</small>
                  </strong>
                </div>

                <div class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.totalDebit') }}</span>
                  <strong class="treasury-send-summary-value">
                    <span>{{ treasurySendTotalDebitFiatDisplay }}</span>
                    <small>{{ treasurySendTotalDebitDisplay }}</small>
                  </strong>
                </div>

                <div class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.destination') }}</span>
                  <strong
                    class="snapshot-address"
                    :title="treasurySendDestinationAddress"
                  >
                    {{ shortTreasurySendDestination }}
                  </strong>
                </div>
              </div>

              <q-banner
                v-if="treasurySendErrorMessage"
                class="bg-red-1 text-red-10 q-mt-md"
                rounded
              >
                <template #avatar>
                  <q-icon name="warning" />
                </template>

                {{ treasurySendErrorMessage }}
              </q-banner>

              <q-slide-item
                class="treasury-send-slide q-mt-md"
                left-color="green"
                @left="handleConfirmTreasurySend"
              >
                <template #left>
                  <q-icon name="arrow_forward" />
                </template>

                <q-item>
                  <q-item-section avatar>
                    <div class="treasury-send-slide-thumb">
                      <q-icon name="arrow_forward" />
                    </div>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ t('treasuryPage.walletTools.swipeToSend') }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('treasuryPage.walletTools.swipeToSendCaption') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </section>

            <section
              v-else-if="treasurySendStep === 'sending'"
              class="treasury-send-step treasury-send-pending"
            >
              <q-spinner color="green" size="46px" />
              <div class="treasury-send-review-title">
                {{ t('treasuryPage.walletTools.sending') }}
              </div>
            </section>

            <section v-else class="treasury-send-step treasury-send-sent-state">
              <div class="received-icon-wrap">
                <q-icon name="check" />
              </div>

              <div class="received-title">
                {{ t('treasuryPage.walletTools.sentTitle') }}
              </div>

              <p class="received-subtitle">
                {{ t('treasuryPage.walletTools.sentSubtitle') }}
              </p>

              <div class="wallet-snapshot-grid treasury-send-review-grid">
                <div class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.sendAmount') }}</span>
                  <strong class="treasury-send-summary-value">
                    <span>{{ treasurySendAmountFiatDisplay }}</span>
                    <small>{{ treasurySendAmountDisplay }}</small>
                  </strong>
                </div>

                <div class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.destination') }}</span>
                  <strong
                    class="snapshot-address"
                    :title="treasurySendDestinationAddress"
                  >
                    {{ shortTreasurySendDestination }}
                  </strong>
                </div>

                <div v-if="treasurySendTxid" class="snapshot-row">
                  <span>{{ t('treasuryPage.walletTools.txid') }}</span>
                  <strong class="snapshot-address" :title="treasurySendTxid">
                    {{ shortTreasurySendTxid }}
                  </strong>
                </div>
              </div>

              <div class="treasury-send-copy-actions">
                <q-btn
                  flat
                  dense
                  class="address-copy-pill"
                  icon="content_copy"
                  :label="t('treasuryPage.walletTools.copyDestination')"
                  no-caps
                  @click="copyTreasurySendText(treasurySendDestinationAddress)"
                />

                <q-btn
                  v-if="treasurySendTxid"
                  flat
                  dense
                  class="address-copy-pill"
                  icon="content_copy"
                  :label="t('treasuryPage.walletTools.copyTxid')"
                  no-caps
                  @click="copyTreasurySendText(treasurySendTxid)"
                />
              </div>
            </section>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              v-if="treasurySendStep === 'review'"
              flat
              color="grey-8"
              :label="t('common.back')"
              no-caps
              :disable="isBroadcastingTreasurySend"
              @click="handleEditTreasurySend"
            />

            <q-btn
              v-if="treasurySendStep === 'form'"
              class="primary-button"
              :label="t('treasuryPage.walletTools.reviewSend')"
              :disable="!treasurySendCanReview"
              :loading="isPreparingTreasurySend"
              unelevated
              no-caps
              @click="handleReviewTreasurySend"
            />

            <q-btn
              v-else-if="treasurySendStep === 'sent'"
              class="primary-button"
              :label="t('common.close')"
              unelevated
              no-caps
              @click="closeTreasurySendDialog"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showWalletBackupDialog">
        <q-card class="treasury-tool-dialog-card">
          <q-card-section class="treasury-tool-dialog-header">
            <div
              class="treasury-tool-dialog-icon treasury-tool-dialog-icon--green"
            >
              <q-icon name="key" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('treasuryPage.walletTools.backupTitle') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.walletTools.backupSubtitle') }}
              </p>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="treasury-warning-banner q-mb-md" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              {{ t('treasuryPage.walletTools.backupWarning') }}
            </q-banner>

            <div class="seed-phrase-panel">
              <div class="seed-phrase-label">
                {{ t('treasuryPage.walletBackup.seedPhrase') }}
              </div>

              <div
                :class="[
                  'seed-phrase-box',
                  { 'seed-phrase-box--empty': !treasuryBackup },
                ]"
              >
                <span v-if="treasuryBackup">
                  {{ treasuryBackup.mnemonic }}
                </span>
                <span v-else>
                  {{ t('treasuryPage.walletTools.seedHidden') }}
                </span>
              </div>
            </div>
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
              class="primary-button"
              :label="t('treasuryPage.actions.revealSeedBackup')"
              :loading="isExportingBackup"
              unelevated
              no-caps
              @click="handleRevealTreasuryBackup"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showWalletImportDialog">
        <q-card class="treasury-tool-dialog-card">
          <q-card-section class="treasury-tool-dialog-header">
            <div
              class="treasury-tool-dialog-icon treasury-tool-dialog-icon--green"
            >
              <q-icon name="file_upload" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('treasuryPage.walletTools.importTitle') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.walletTools.importSubtitle') }}
              </p>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="treasury-warning-banner q-mb-md" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              {{ t('treasuryPage.restore.warning') }}
            </q-banner>

            <q-input
              v-model="restoreMnemonicInput"
              type="textarea"
              :label="t('treasuryPage.walletTools.seedPhraseInput')"
              :placeholder="t('treasuryPage.walletTools.seedPhrasePlaceholder')"
              outlined
              autogrow
            />

            <q-banner
              v-if="restoreImportResult"
              class="bg-green-1 text-green-10 q-mt-md"
              rounded
            >
              <template #avatar>
                <q-icon name="check_circle" />
              </template>

              {{ t('treasuryPage.restore.importedIntoLocalStorage') }}
            </q-banner>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="card-actions">
            <q-btn
              flat
              color="grey-8"
              :label="t('common.cancel')"
              no-caps
              @click="closeWalletImportDialog"
            />

            <q-btn
              class="primary-button"
              :label="t('treasuryPage.walletTools.importWallet')"
              :disable="!restoreMnemonicCanImport"
              :loading="isImportingRestore"
              unelevated
              no-caps
              @click="handleImportTreasuryWalletFromInput"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showDeleteTreasuryWalletDialog">
        <q-card class="treasury-tool-dialog-card">
          <q-card-section class="treasury-tool-dialog-header">
            <div
              class="treasury-tool-dialog-icon treasury-tool-dialog-icon--danger"
            >
              <q-icon name="delete" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('treasuryPage.walletTools.deleteTitle') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('treasuryPage.walletTools.deleteSubtitle') }}
              </p>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="treasury-danger-banner" rounded>
              <template #avatar>
                <q-icon name="warning" />
              </template>

              {{ t('treasuryPage.dangerZone.warning') }}
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
              :label="t('treasuryPage.walletTools.deleteWallet')"
              :loading="isSubmitting"
              no-caps
              @click="handleClearTreasuryWallet"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <CashOnHandTransactionsDialog
        v-model="showCashOnHandTransactionsDialog"
        :cash-on-hand-state="cashOnHandState"
        :bch-logo-url="bchLogoUrl"
      />

      <CashOnHandMovementDialog
        v-model="cashOnHandDialogVisible"
        v-model:amount-input="cashOnHandAmountInput"
        :action-type="cashOnHandDialogActionType"
        :title="cashOnHandDialogTitle"
        :subtitle="cashOnHandDialogSubtitle"
        :amount-label="cashOnHandAmountLabel"
        :currency-prefix="cashOnHandCurrencyPrefix"
        :current-display="cashOnHandDialogCurrentDisplay"
        :entered-display="cashOnHandDialogAmountDisplay"
        :new-display="cashOnHandDialogNewDisplay"
        :current-label="t('treasuryPage.cashOnHand.dialog.currentCash')"
        :entered-label="t('treasuryPage.cashOnHand.dialog.enteredAmount')"
        :new-label="t('treasuryPage.cashOnHand.dialog.newCash')"
        :cancel-label="t('common.cancel')"
        :save-label="cashOnHandDialogActionLabel"
        :is-amount-valid="isCashOnHandAmountValid"
        :show-amount-error="showCashOnHandAmountError"
        :amount-error-message="cashOnHandAmountErrorMessage"
        :is-submitting="isCashOnHandSubmitting"
        @cancel="resetCashOnHandDialog"
        @save="handleSaveCashOnHandDialog"
      />

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
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import TreasuryTopUpQrCard from 'src/components/TreasuryTopUpQrCard.vue';
import CashOnHandTransactionsDialog from 'src/components/CashOnHandTransactionsDialog.vue';
import CashOnHandMovementDialog from 'src/components/CashOnHandMovementDialog.vue';
import TreasurySendQrTools from 'src/components/TreasurySendQrTools.vue';

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
  TEMPORARY_REAL_TREASURY_SEND_BROADCAST_ENABLED,
  broadcastTreasurySendDraft,
  createTreasurySendDraft,
  parseTreasurySendTarget,
} from 'src/services/treasury-send';
import type { TreasurySendDraftResult } from 'src/types/treasury-send';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import {
  addToCashOnHand,
  clearCashOnHand,
  getCashOnHandState,
  setUpCashOnHand,
  withdrawFromCashOnHand,
} from 'src/services/cash-on-hand-store';

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

const SATS_PER_BCH = 100_000_000;
const treasuryFiatCurrency = 'GBP';
const pricingService = new PricingService();

type CashOnHandDialogMode = 'setup' | 'add' | 'withdraw';
type TreasurySendStep = 'form' | 'review' | 'sending' | 'sent';

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
const showCashOnHandTransactionsDialog = ref(false);
const showTreasuryTopUpDialog = ref(false);
const showTreasurySendDialog = ref(false);
const treasurySendStep = ref<TreasurySendStep>('form');
const treasurySendInput = ref('');
const treasurySendAmountInput = ref('');
const treasurySendUseMax = ref(false);
const treasurySendDraftResult = ref<TreasurySendDraftResult | null>(null);
const treasurySendBroadcastResult = ref<TreasuryBroadcastResult | null>(null);
const treasurySendErrorMessage = ref('');
const showWalletBackupDialog = ref(false);
const showWalletImportDialog = ref(false);
const showDeleteTreasuryWalletDialog = ref(false);

const feeAddressConfig = ref<FeeAddressConfigStatus>(
  getFeeAddressConfigStatus()
);

const isSubmitting = ref(false);
const isCheckingBalance = ref(false);
const isExportingBackup = ref(false);
const isCheckingRestore = ref(false);
const isImportingRestore = ref(false);
const isPreparingTreasurySend = ref(false);
const isBroadcastingTreasurySend = ref(false);
const isCashOnHandSubmitting = ref(false);
const isClearingCashOnHand = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const temporaryTreasurySendBroadcastEnabled =
  TEMPORARY_REAL_TREASURY_SEND_BROADCAST_ENABLED;

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

const restoreMnemonicCanImport = computed(
  () => restoreMnemonicInput.value.trim().length > 0
);

const treasurySendFiatPrefix = computed(() => {
  if (treasuryFiatCurrency === 'GBP') {
    return '£';
  }

  return treasuryFiatCurrency;
});

const treasurySendFiatAmountMinor = computed(() =>
  parseFiatInputToMinor(treasurySendAmountInput.value)
);

const treasurySendAmountSats = computed(() => {
  if (treasurySendUseMax.value && treasuryBalance.value) {
    return treasuryBalance.value.balanceSats;
  }

  if (
    treasurySendFiatAmountMinor.value === null ||
    !treasuryBalanceMarketRate.value ||
    treasuryBalanceMarketRate.value <= 0
  ) {
    return null;
  }

  const fiatAmount = treasurySendFiatAmountMinor.value / 100;
  const amountBch = fiatAmount / treasuryBalanceMarketRate.value;

  return Math.round(amountBch * SATS_PER_BCH);
});

const treasurySendCanUseMax = computed(
  () =>
    Boolean(treasuryBalance.value?.balanceSats) &&
    Boolean(treasuryBalanceMarketRate.value)
);

const treasurySendCanReview = computed(
  () =>
    treasurySendInput.value.trim().length > 0 &&
    (treasurySendUseMax.value ||
      (treasurySendAmountSats.value !== null &&
        treasurySendAmountSats.value > 0))
);

const treasurySendAvailableFiatDisplay = computed(() => {
  if (!treasuryBalance.value || !treasuryBalanceMarketRate.value) {
    return '—';
  }

  return formatSatsAsFiatDisplay(treasuryBalance.value.balanceSats);
});

const treasurySendEquivalentBchDisplay = computed(() => {
  if (
    treasurySendAmountSats.value === null ||
    treasurySendAmountSats.value <= 0
  ) {
    return '—';
  }

  return formatBchSats(treasurySendAmountSats.value);
});

const treasurySendDestinationAddress = computed(
  () => treasurySendDraftResult.value?.destinationAddress ?? ''
);

const treasurySendAmountDisplay = computed(() =>
  treasurySendDraftResult.value?.amountSats
    ? formatBchSats(treasurySendDraftResult.value.amountSats)
    : '—'
);

const treasurySendAmountFiatDisplay = computed(() =>
  treasurySendDraftResult.value?.amountSats !== undefined
    ? formatSatsAsFiatDisplay(treasurySendDraftResult.value.amountSats)
    : '—'
);

const treasurySendFeeDisplay = computed(() =>
  treasurySendDraftResult.value?.actualFeeSats !== undefined
    ? formatBchSats(treasurySendDraftResult.value.actualFeeSats)
    : '—'
);

const treasurySendFeeFiatDisplay = computed(() =>
  treasurySendDraftResult.value?.actualFeeSats !== undefined
    ? formatSatsAsFiatDisplay(treasurySendDraftResult.value.actualFeeSats)
    : '—'
);

const treasurySendTotalDebitSats = computed(() => {
  if (
    treasurySendDraftResult.value?.amountSats === undefined ||
    treasurySendDraftResult.value?.actualFeeSats === undefined
  ) {
    return null;
  }

  return (
    treasurySendDraftResult.value.amountSats +
    treasurySendDraftResult.value.actualFeeSats
  );
});

const treasurySendTotalDebitDisplay = computed(() =>
  treasurySendTotalDebitSats.value !== null
    ? formatBchSats(treasurySendTotalDebitSats.value)
    : '—'
);

const treasurySendTotalDebitFiatDisplay = computed(() =>
  treasurySendTotalDebitSats.value !== null
    ? formatSatsAsFiatDisplay(treasurySendTotalDebitSats.value)
    : '—'
);

const treasurySendTxid = computed(
  () => treasurySendBroadcastResult.value?.txid ?? ''
);

const shortTreasurySendDestination = computed(() =>
  shortenText(treasurySendDestinationAddress.value, 22, 10)
);

const shortTreasurySendTxid = computed(() =>
  shortenText(treasurySendTxid.value, 18, 8)
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

const cashOnHandDialogActionType = computed(
  () => cashOnHandDialogMode.value ?? 'add'
);

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
    showDeleteTreasuryWalletDialog.value = false;
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

function openWalletBackupDialog(): void {
  successMessage.value = '';
  errorMessage.value = '';
  showWalletBackupDialog.value = true;
}

function openWalletImportDialog(): void {
  successMessage.value = '';
  errorMessage.value = '';
  restoreCheck.value = null;
  restoreImportResult.value = null;
  restoreMnemonicInput.value = '';
  showWalletImportDialog.value = true;
}

function closeWalletImportDialog(): void {
  showWalletImportDialog.value = false;
  restoreCheck.value = null;
  restoreImportResult.value = null;
  restoreMnemonicInput.value = '';
}

async function handleImportTreasuryWalletFromInput(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  if (!restoreMnemonicCanImport.value) {
    errorMessage.value = t('treasuryPage.messages.checkSeedBeforeImporting');
    return;
  }

  isCheckingRestore.value = true;
  isImportingRestore.value = true;
  restoreCheck.value = null;
  restoreImportResult.value = null;

  try {
    restoreCheck.value = await checkTreasuryRestoreMnemonic(
      restoreMnemonicInput.value
    );

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
    isCheckingRestore.value = false;
    isImportingRestore.value = false;
  }
}

function openTreasurySendDialog(): void {
  resetTreasurySendDialogState();
  showTreasurySendDialog.value = true;
}

function resetTreasurySendDialogState(): void {
  treasurySendStep.value = 'form';
  treasurySendInput.value = '';
  treasurySendAmountInput.value = '';
  treasurySendUseMax.value = false;
  treasurySendDraftResult.value = null;
  treasurySendBroadcastResult.value = null;
  treasurySendErrorMessage.value = '';
  isPreparingTreasurySend.value = false;
  isBroadcastingTreasurySend.value = false;
}

async function closeTreasurySendDialog(): Promise<void> {
  const shouldRefreshBalance = treasurySendStep.value === 'sent';

  showTreasurySendDialog.value = false;

  if (shouldRefreshBalance) {
    await refreshTreasuryBalance({ showSuccess: false });
  }

  resetTreasurySendDialogState();
}

async function handleTreasurySendDialogHide(): Promise<void> {
  if (treasurySendStep.value === 'sent') {
    await refreshTreasuryBalance({ showSuccess: false });
  }

  resetTreasurySendDialogState();
}

function handleTreasurySendInputBlur(): void {
  applyPaymentUriAmountIfPresent();
}

function applyPaymentUriAmountIfPresent(): void {
  try {
    const target = parseTreasurySendTarget(treasurySendInput.value);

    if (target.amountSats !== undefined) {
      treasurySendUseMax.value = false;
      treasurySendAmountInput.value = formatSatsAsFiatInput(target.amountSats);
    }
  } catch {
    // Do not show validation errors while the merchant is still typing.
  }
}

function handleTreasurySendAmountInputChange(): void {
  treasurySendUseMax.value = false;
}

function handleUseTreasurySendMax(): void {
  if (!treasuryBalance.value || !treasuryBalanceMarketRate.value) {
    return;
  }

  treasurySendUseMax.value = true;
  treasurySendAmountInput.value = formatSatsAsFiatInput(
    treasuryBalance.value.balanceSats
  );
}

function handleTreasurySendQrResult(value: string): void {
  const scannedValue = value.trim();

  if (!scannedValue) {
    treasurySendErrorMessage.value = t(
      'treasuryPage.walletTools.errors.noQrValue'
    );
    return;
  }

  treasurySendErrorMessage.value = '';
  treasurySendUseMax.value = false;
  treasurySendInput.value = scannedValue;
  applyPaymentUriAmountIfPresent();
}

function handleTreasurySendQrError(message: string): void {
  treasurySendErrorMessage.value = message;

  $q.notify({
    type: 'negative',
    message,
  });
}

async function handleReviewTreasurySend(): Promise<void> {
  treasurySendErrorMessage.value = '';
  treasurySendDraftResult.value = null;
  treasurySendBroadcastResult.value = null;

  const amountSats = treasurySendAmountSats.value;

  if (!treasurySendUseMax.value && (amountSats === null || amountSats <= 0)) {
    treasurySendErrorMessage.value = t(
      'treasuryPage.walletTools.errors.enterValidAmount'
    );
    return;
  }

  isPreparingTreasurySend.value = true;

  try {
    const target = parseTreasurySendTarget(treasurySendInput.value);
    const draftResult = await createTreasurySendDraft({
      destinationAddress: target.address,
      amountSats: amountSats ?? 0,
      sendMax: treasurySendUseMax.value,
    });

    treasurySendDraftResult.value = draftResult;

    if (draftResult.status !== 'ready') {
      treasurySendErrorMessage.value =
        draftResult.errorMessage ??
        t('treasuryPage.walletTools.errors.couldNotCreateDraft');
      return;
    }

    treasurySendStep.value = 'review';
  } catch (error) {
    console.error(error);
    treasurySendErrorMessage.value =
      error instanceof Error
        ? error.message
        : t('treasuryPage.walletTools.errors.couldNotCreateDraft');
  } finally {
    isPreparingTreasurySend.value = false;
  }
}

function handleEditTreasurySend(): void {
  treasurySendStep.value = 'form';
  treasurySendDraftResult.value = null;
  treasurySendBroadcastResult.value = null;
  treasurySendErrorMessage.value = '';
}

async function handleConfirmTreasurySend(): Promise<void> {
  treasurySendErrorMessage.value = '';

  if (
    treasurySendDraftResult.value?.status !== 'ready' ||
    !treasurySendDraftResult.value.draft
  ) {
    treasurySendErrorMessage.value = t(
      'treasuryPage.walletTools.errors.couldNotCreateDraft'
    );
    return;
  }

  treasurySendStep.value = 'sending';
  isBroadcastingTreasurySend.value = true;

  try {
    const broadcastResult = await broadcastTreasurySendDraft(
      treasurySendDraftResult.value.draft
    );

    treasurySendBroadcastResult.value = broadcastResult;

    if (broadcastResult.status !== 'broadcasted') {
      treasurySendStep.value = 'review';
      treasurySendErrorMessage.value =
        broadcastResult.errorMessage ??
        t('treasuryPage.walletTools.errors.broadcastFailed');
      return;
    }

    treasurySendStep.value = 'sent';
  } catch (error) {
    console.error(error);
    treasurySendStep.value = 'review';
    treasurySendErrorMessage.value =
      error instanceof Error
        ? error.message
        : t('treasuryPage.walletTools.errors.broadcastFailed');
  } finally {
    isBroadcastingTreasurySend.value = false;
  }
}

async function copyTreasurySendText(value: string): Promise<void> {
  if (!value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(value);

    $q.notify({
      type: 'positive',
      message: t('treasuryPage.walletTools.copied'),
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message: t('treasuryTopUpQr.copyFailed'),
    });
  }
}

function shortenText(
  value: string,
  startLength: number,
  endLength: number
): string {
  if (!value) {
    return '—';
  }

  if (value.length <= startLength + endLength + 1) {
    return value;
  }

  return `${value.slice(0, startLength)}…${value.slice(-endLength)}`;
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

async function openCashOnHandTransactionsDialog(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  await loadCashOnHand();

  showCashOnHandTransactionsDialog.value = true;
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

function formatSatsAsFiatDisplay(sats: number): string {
  if (!treasuryBalanceMarketRate.value) {
    return '—';
  }

  const amountBch = sats / SATS_PER_BCH;
  return formatFiatAmount(
    amountBch * treasuryBalanceMarketRate.value,
    treasuryFiatCurrency
  );
}

function formatSatsAsFiatInput(sats: number): string {
  if (!treasuryBalanceMarketRate.value) {
    return '';
  }

  const amountBch = sats / SATS_PER_BCH;
  const amountFiat = amountBch * treasuryBalanceMarketRate.value;

  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(amountFiat);
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

watch(treasurySendInput, () => {
  applyPaymentUriAmountIfPresent();
});

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

.wallet-setup-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.wallet-create-button,
.wallet-restore-button {
  border-radius: 999px;
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 850;
  min-height: 34px;
  padding: 0 14px;
}

.wallet-create-button {
  background: #00ce1b;
  color: #000000;
}

.wallet-restore-button {
  border-color: #111111;
  color: #111111;
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

.wallet-balance-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.balance-action-button {
  background: rgba(255, 255, 255, 0.1);
  height: 34px;
  width: 34px;
}

.balance-action-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.balance-action-button--add,
.balance-action-button--send,
.balance-action-button--refresh {
  color: #00ce1b;
}

.balance-action-button--send :deep(.q-icon) {
  font-size: 20px;
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

.wallet-management-actions {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, 1fr);
}

.wallet-management-pill {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 850;
  min-height: 34px;
  padding: 0 8px;
}

.wallet-management-pill--backup,
.wallet-management-pill--import {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  color: #0c5f17;
}

.wallet-management-pill--delete {
  background: #fff0f0;
  border: 1px solid rgba(217, 48, 37, 0.25);
  color: #9f1c14;
}

.wallet-management-pill :deep(.q-focus-helper) {
  border-radius: inherit;
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
  border-color: #dddddd;
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

.cash-balance-top {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.cash-balance-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.cash-balance-action-button {
  background: rgba(17, 17, 17, 0.08);
  height: 34px;
  width: 34px;
}

.cash-balance-action-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.cash-balance-action-button--add {
  color: #00a816;
}

.cash-balance-action-button--withdraw {
  color: #111111;
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

.cash-on-hand-link-row {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.cash-on-hand-link-row--standalone {
  justify-content: flex-start;
  margin-top: 10px;
}

.cash-on-hand-transactions-link,
.cash-on-hand-clear-link {
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.cash-on-hand-transactions-link {
  color: #0c5f17;
}

.cash-on-hand-transactions-link :deep(.q-icon) {
  color: #00a816;
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

.treasury-tool-dialog-card {
  border-radius: 22px;
  max-width: 500px;
  width: calc(100vw - 32px);
}

.treasury-send-form-panel {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  display: grid;
  gap: 14px;
  padding: 16px;
}

.treasury-send-form-intro {
  align-items: flex-start;
  background: linear-gradient(135deg, #eaffed 0%, #ffffff 100%);
  border: 1px solid rgba(0, 206, 27, 0.32);
  border-radius: 18px;
  display: flex;
  gap: 12px;
  padding: 14px;
}

.treasury-send-form-icon {
  align-items: center;
  background: #111111;
  border-radius: 14px;
  color: #00ce1b;
  display: flex;
  flex: 0 0 42px;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.treasury-send-form-title {
  color: #111111;
  font-size: 17px;
  font-weight: 950;
  line-height: 1.15;
}

.treasury-send-form-intro p {
  color: #444444;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.35;
  margin: 5px 0 0;
}

.treasury-send-input :deep(.q-field__control) {
  border-radius: 18px;
}

.treasury-send-amount-panel {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  display: grid;
  gap: 10px;
  padding: 14px;
}

.treasury-send-amount-top {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.treasury-send-amount-label {
  color: #111111;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.2;
}

.treasury-send-available {
  color: #666666;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.25;
  margin-top: 3px;
}

.treasury-send-max-button {
  background: #111111;
  border-radius: 999px;
  color: #00ce1b;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 900;
  min-height: 32px;
  padding: 0 12px;
}

.treasury-send-fiat-input :deep(.q-field__native) {
  font-size: 26px;
  font-weight: 950;
}

.treasury-send-equivalent-row {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.treasury-send-equivalent-row span,
.treasury-send-max-note {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.treasury-send-equivalent-row strong {
  color: #0c5f17;
  font-size: 13px;
  font-weight: 900;
  text-align: right;
}

.treasury-real-broadcast-banner {
  background: #fff8eb;
  color: #8a4b00;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.treasury-send-dialog-card {
  border-radius: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.treasury-send-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 560px;
  width: 100%;
}

.treasury-send-header-main {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  min-width: 0;
}

.treasury-send-header-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.treasury-send-close-button {
  background: #f0f0f0;
  color: #111111;
  flex: 0 0 auto;
}

.treasury-send-body {
  flex: 1 1 auto;
  margin: 0 auto;
  max-width: 560px;
  width: 100%;
}

.treasury-send-step {
  display: grid;
  gap: 14px;
}

.treasury-send-review-title {
  color: #111111;
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.15;
}

.treasury-send-review-grid {
  margin-top: 0;
}

.treasury-send-summary-value {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.treasury-send-summary-value small {
  color: #0c5f17;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.2;
}

.treasury-send-slide {
  background: linear-gradient(135deg, #00ce1b 0%, #0aa91e 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(0, 206, 27, 0.22);
  color: #000000;
  overflow: hidden;
}

.treasury-send-slide :deep(.q-item) {
  min-height: 68px;
}

.treasury-send-slide :deep(.q-item__label) {
  color: #000000;
  font-weight: 950;
}

.treasury-send-slide :deep(.q-item__label--caption) {
  color: rgba(0, 0, 0, 0.68);
  font-weight: 800;
}

.treasury-send-slide-thumb {
  align-items: center;
  background: #000000;
  border-radius: 999px;
  color: #00ce1b;
  display: flex;
  font-size: 22px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.treasury-send-pending,
.treasury-send-sent-state {
  align-items: center;
  justify-items: center;
  padding: 18px 0;
  text-align: center;
}

.treasury-send-sent-state .wallet-snapshot-grid {
  justify-self: stretch;
  width: 100%;
}

.treasury-send-copy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.address-copy-pill {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  border-radius: 999px;
  color: #0c5f17;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 850;
  min-height: 32px;
  padding: 0 10px;
}

.address-copy-pill :deep(.q-focus-helper) {
  border-radius: inherit;
}

.received-icon-wrap {
  align-items: center;
  animation: received-pop 360ms ease-out;
  background: #00ce1b;
  border-radius: 999px;
  color: #000000;
  display: flex;
  font-size: 44px;
  height: 78px;
  justify-content: center;
  width: 78px;
}

.received-title {
  color: #111111;
  font-size: 28px;
  font-weight: 950;
  line-height: 1.05;
  margin-top: 14px;
}

.received-subtitle {
  color: #444444;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.35;
  margin: 8px 0 0;
}

@keyframes received-pop {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }

  70% {
    opacity: 1;
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
  }
}

.treasury-tool-dialog-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.treasury-tool-dialog-icon {
  align-items: center;
  border-radius: 14px;
  display: flex;
  flex: 0 0 46px;
  font-size: 25px;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.treasury-tool-dialog-icon--green {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  color: #00a816;
}

.treasury-tool-dialog-icon--dark {
  background: #111111;
  color: #00ce1b;
}

.treasury-tool-dialog-icon--danger {
  background: #fff0f0;
  border: 1px solid rgba(217, 48, 37, 0.25);
  color: #d93025;
}

.treasury-tool-note {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  color: #444444;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.35;
  padding: 14px;
}

.treasury-warning-banner {
  background: #fff8eb;
  color: #8a4b00;
}

.treasury-danger-banner {
  background: #fff0f0;
  color: #9f1c14;
}

.seed-phrase-panel {
  display: grid;
  gap: 8px;
}

.seed-phrase-label {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.seed-phrase-box {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  color: #111111;
  font-size: 17px;
  font-weight: 850;
  line-height: 1.45;
  min-height: 92px;
  padding: 14px;
  word-break: break-word;
}

.seed-phrase-box--empty {
  align-items: center;
  color: #777777;
  display: flex;
  font-size: 14px;
  font-weight: 750;
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

  .wallet-setup-actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .wallet-create-button,
  .wallet-restore-button {
    width: 100%;
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

  .wallet-management-actions {
    gap: 6px;
  }

  .wallet-management-pill {
    font-size: 11px;
    padding: 0 6px;
  }

  .treasury-send-form-panel {
    padding: 14px;
  }

  .treasury-send-form-intro,
  .treasury-send-amount-top {
    align-items: stretch;
    flex-direction: column;
  }

  .treasury-send-max-button {
    width: 100%;
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
.wallet-create-button :deep(.q-focus-helper),
.wallet-restore-button :deep(.q-focus-helper),
.cash-on-hand-primary-button :deep(.q-focus-helper),
.cash-on-hand-secondary-button :deep(.q-focus-helper),
.cash-on-hand-secondary-button :deep(.q-focus-helper),
.main-card :deep(.q-focus-helper) {
  border-radius: inherit;
}
</style>