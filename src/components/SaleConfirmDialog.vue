<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="confirm-card">
      <q-card-section class="dialog-header">
        <div class="header-icon">
          <q-icon name="fact_check" />
        </div>

        <div>
          <div class="text-h5 text-weight-bold">
            {{ t('saleConfirm.title') }}
          </div>
          <p class="text-grey-7 q-mb-none">
            {{ t('saleConfirm.subtitle') }}
          </p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body">
        <q-banner
          :class="
            pricing.isFallbackQuote
              ? 'bg-orange-1 text-orange-10'
              : 'bg-green-1 text-green-10'
          "
          rounded
          class="q-mb-md"
        >
          <template #avatar>
            <q-icon
              :name="pricing.isFallbackQuote ? 'warning' : 'check_circle'"
            />
          </template>

          <span v-if="pricing.isFallbackQuote">
            {{ t('saleConfirm.quoteStatus.fallback') }}
          </span>

          <span v-else>
            {{ t('saleConfirm.quoteStatus.liveLocked') }}
          </span>
        </q-banner>

        <q-banner
          v-if="treasuryWarning"
          class="bg-orange-1 text-orange-10 q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>

          {{ treasuryWarning }}
        </q-banner>

        <section class="summary-grid">
          <div class="summary-tile highlight">
            <div class="summary-label">
              {{ t('saleConfirm.summary.customerPays') }}
            </div>
            <div class="summary-value">
              {{
                formatMinorFiatAmount(
                  pricing.customerPaysMinor,
                  pricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('saleConfirm.summary.voucherValue') }}
            </div>
            <div class="summary-value">
              {{
                formatMinorFiatAmount(
                  pricing.voucherValueMinor,
                  pricing.fiatCurrency
                )
              }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('saleConfirm.summary.bchLoaded') }}
            </div>
            <div class="summary-value">
              {{ formatBchSats(pricing.finalBchSats) }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('saleConfirm.summary.serviceFee') }}
            </div>
            <div class="summary-value">
              {{
                formatMinorFiatAmount(
                  pricing.serviceFeeAmountMinor,
                  pricing.fiatCurrency
                )
              }}
            </div>
          </div>
        </section>

        <q-card flat bordered class="details-card q-mt-md">
          <q-card-section>
            <div class="details-row">
              <span>{{ t('saleConfirm.details.marketRate') }}</span>
              <strong>
                {{ formatMarketRate(pricing.marketRate, pricing.fiatCurrency) }}
              </strong>
            </div>

            <div class="details-row">
              <span>{{ t('saleConfirm.details.quoteSource') }}</span>
              <strong>
                {{ quoteSourceLabel }}
                <q-badge
                  v-if="pricing.isFallbackQuote"
                  color="orange"
                  class="q-ml-sm"
                >
                  {{ t('saleConfirm.details.fallbackBadge') }}
                </q-badge>
              </strong>
            </div>

            <div class="details-row">
              <span>{{ t('saleConfirm.details.quoteTime') }}</span>
              <strong>{{ formatDateTime(pricing.quoteTimestamp) }}</strong>
            </div>

            <div v-if="pricing.quoteExpiresAt" class="details-row">
              <span>{{ t('saleConfirm.details.quoteExpires') }}</span>
              <strong>{{ formatDateTime(pricing.quoteExpiresAt) }}</strong>
            </div>

            <div v-if="treasuryBalanceSats !== undefined" class="details-row">
              <span>{{ t('saleConfirm.details.treasuryBalance') }}</span>
              <strong>{{ formatBchSats(treasuryBalanceSats) }}</strong>
            </div>
          </q-card-section>
        </q-card>

        <q-banner
          v-if="fundingReadiness"
          :class="
            fundingReadiness.status === 'ready'
              ? 'bg-green-1 text-green-10'
              : 'bg-orange-1 text-orange-10'
          "
          rounded
          class="q-mt-md"
        >
          <template #avatar>
            <q-icon
              :name="
                fundingReadiness.status === 'ready' ? 'check_circle' : 'info'
              "
            />
          </template>

          <div v-if="fundingReadiness.status === 'ready'">
            {{ t('saleConfirm.fundingReadiness.ready') }}
          </div>

          <div v-else>
            <div class="text-weight-medium q-mb-xs">
              {{ t('saleConfirm.fundingReadiness.notReady') }}
            </div>

            <div v-for="message in fundingReadiness.messages" :key="message">
              - {{ message }}
            </div>
          </div>
        </q-banner>

        <q-banner class="bg-grey-2 text-grey-9 q-mt-md" rounded>
          <template #avatar>
            <q-icon name="shield" />
          </template>

          {{ t('saleConfirm.safetyNotice') }}
        </q-banner>

        <q-expansion-item
          class="developer-tools q-mt-md"
          icon="code"
          label="Development funding tools"
          caption="Transaction draft, audit, broadcast guard, and UTXO details"
        >
          <q-card flat bordered>
            <q-card-section>
              <q-list dense>
                <q-item-label header>Automatic fee model</q-item-label>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Platform fee</q-item-label>
                    <q-item-label>
                      {{ formatBchSats(feeOutputPlan.platformFeeSats) }}
                      · 50% of service fee
                      <span v-if="feeOutputPlan.platformFeeAddress">
                        · output configured
                      </span>
                      <span v-else> · address not configured yet </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      Merchant service fee share
                    </q-item-label>
                    <q-item-label>
                      {{ formatBchSats(feeOutputPlan.merchantRetainedSats) }}
                      · 50% of service fee · retained by merchant/accounting,
                      not a separate output
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator spaced />

                <q-item-label header>Treasury funding preview</q-item-label>

                <q-banner
                  v-if="transactionPlan"
                  :class="
                    transactionPlan.status === 'valid'
                      ? 'bg-green-1 text-green-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        transactionPlan.status === 'valid'
                          ? 'check_circle'
                          : 'warning'
                      "
                    />
                  </template>

                  <span v-if="transactionPlan.status === 'valid'">
                    Internal transaction plan is valid.
                  </span>

                  <span v-else>
                    Internal transaction plan is not valid yet:
                    {{ transactionPlan.invalidMessage }}
                  </span>
                </q-banner>

                <q-banner
                  v-if="transactionDraftStatus"
                  :class="
                    transactionDraftStatus.status === 'created'
                      ? 'bg-green-1 text-green-10'
                      : 'bg-grey-2 text-grey-9'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        transactionDraftStatus.status === 'created'
                          ? 'check_circle'
                          : 'info'
                      "
                    />
                  </template>

                  <span v-if="transactionDraftStatus.status === 'created'">
                    Transaction draft created. Broadcast is still disabled.
                  </span>

                  <span v-else>
                    Transaction draft not created yet:
                    {{ transactionDraftStatus.errorMessage }}
                  </span>
                </q-banner>

                <q-item v-if="transactionDraftStatus">
                  <q-item-section>
                    <q-item-label caption>Draft generation mode</q-item-label>
                    <q-item-label>
                      {{
                        transactionDraftStatus.broadcastEnabled
                          ? 'Broadcast enabled'
                          : 'Broadcast disabled'
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator spaced />

                <q-item-label header
                  >Developer transaction draft check</q-item-label
                >

                <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
                  <template #avatar>
                    <q-icon name="warning" />
                  </template>

                  Developer-only check. This may create a signed raw transaction
                  draft in memory, but it will not broadcast it and the raw hex
                  is not displayed here.
                </q-banner>

                <q-banner
                  v-if="draftCheckResult"
                  :class="
                    draftCheckResult.status === 'created'
                      ? 'bg-green-1 text-green-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        draftCheckResult.status === 'created'
                          ? 'check_circle'
                          : 'warning'
                      "
                    />
                  </template>

                  <span v-if="draftCheckResult.status === 'created'">
                    Developer transaction draft check created a transaction
                    draft. Broadcast is disabled.
                  </span>

                  <span v-else>
                    Developer transaction draft check did not create a draft:
                    {{ draftCheckResult.errorMessage }}
                  </span>
                </q-banner>

                <q-list
                  v-if="draftCheckResult"
                  dense
                  bordered
                  separator
                  class="q-mb-md"
                >
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Draft status</q-item-label>
                      <q-item-label>
                        {{ draftCheckResult.status }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Broadcast enabled</q-item-label>
                      <q-item-label>
                        {{ draftCheckResult.broadcastEnabled ? 'Yes' : 'No' }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="draftCheckResult.inputCount !== undefined">
                    <q-item-section>
                      <q-item-label caption>Input count</q-item-label>
                      <q-item-label>
                        {{ draftCheckResult.inputCount }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="draftCheckResult.outputCount !== undefined">
                    <q-item-section>
                      <q-item-label caption>Output count</q-item-label>
                      <q-item-label>
                        {{ draftCheckResult.outputCount }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="
                      draftCheckResult.rawTransactionBytesLength !== undefined
                    "
                  >
                    <q-item-section>
                      <q-item-label caption>
                        Raw transaction byte length
                      </q-item-label>
                      <q-item-label>
                        {{ draftCheckResult.rawTransactionBytesLength }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="draftCheckResult.actualFeeSats !== undefined">
                    <q-item-section>
                      <q-item-label caption>Actual fee</q-item-label>
                      <q-item-label>
                        {{ formatBchSats(draftCheckResult.actualFeeSats) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="draftCheckResult.actualChangeSats !== undefined"
                  >
                    <q-item-section>
                      <q-item-label caption>Actual change</q-item-label>
                      <q-item-label>
                        {{ formatBchSats(draftCheckResult.actualChangeSats) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="draftCheckResult.createdAt">
                    <q-item-section>
                      <q-item-label caption>Draft checked</q-item-label>
                      <q-item-label>
                        {{ formatDateTime(draftCheckResult.createdAt) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-banner
                  v-if="draftAudit"
                  :class="
                    draftAudit.status === 'passed'
                      ? 'bg-green-1 text-green-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        draftAudit.status === 'passed'
                          ? 'check_circle'
                          : 'warning'
                      "
                    />
                  </template>

                  <span v-if="draftAudit.status === 'passed'">
                    Transaction draft audit passed.
                  </span>

                  <span v-else> Transaction draft audit failed. </span>
                </q-banner>

                <q-list
                  v-if="draftAudit"
                  dense
                  bordered
                  separator
                  class="q-mb-md"
                >
                  <q-item v-for="check in draftAudit.checks" :key="check.key">
                    <q-item-section avatar>
                      <q-icon
                        :name="check.passed ? 'check_circle' : 'warning'"
                        :color="check.passed ? 'positive' : 'negative'"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ check.message }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Audit checked</q-item-label>
                      <q-item-label>
                        {{ formatDateTime(draftAudit.checkedAt) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-separator spaced />

                <q-item-label header>Pre-broadcast checklist</q-item-label>

                <q-banner
                  v-if="preBroadcastChecklist"
                  :class="
                    preBroadcastChecklist.status === 'passed'
                      ? 'bg-green-1 text-green-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        preBroadcastChecklist.status === 'passed'
                          ? 'check_circle'
                          : 'block'
                      "
                    />
                  </template>

                  <span v-if="preBroadcastChecklist.status === 'passed'">
                    Pre-broadcast checklist passed.
                  </span>

                  <span v-else> Pre-broadcast checklist is blocked. </span>
                </q-banner>

                <q-list
                  v-if="preBroadcastChecklist"
                  dense
                  bordered
                  separator
                  class="q-mb-md"
                >
                  <q-item
                    v-for="check in preBroadcastChecklist.checks"
                    :key="check.key"
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="check.passed ? 'check_circle' : 'block'"
                        :color="check.passed ? 'positive' : 'negative'"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ check.message }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Checklist checked</q-item-label>
                      <q-item-label>
                        {{ formatDateTime(preBroadcastChecklist.checkedAt) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-separator spaced />

                <q-item-label header>Broadcast gate</q-item-label>

                <q-banner
                  :class="
                    broadcastGate.canBroadcast
                      ? 'bg-green-1 text-green-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        broadcastGate.canBroadcast ? 'check_circle' : 'block'
                      "
                    />
                  </template>

                  {{ broadcastGate.message }}
                </q-banner>

                <q-banner
                  v-if="broadcastGuardTestResult"
                  :class="
                    broadcastGuardTestResult.status === 'blocked'
                      ? 'bg-green-1 text-green-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        broadcastGuardTestResult.status === 'blocked'
                          ? 'check_circle'
                          : 'warning'
                      "
                    />
                  </template>

                  <span v-if="broadcastGuardTestResult.status === 'blocked'">
                    Blocked broadcast guard test passed:
                    {{ broadcastGuardTestResult.errorMessage }}
                  </span>

                  <span
                    v-else-if="
                      broadcastGuardTestResult.status === 'broadcasted'
                    "
                  >
                    Unexpected: transaction was broadcast. Txid:
                    {{ broadcastGuardTestResult.txid }}
                  </span>

                  <span v-else>
                    Broadcast test failed:
                    {{ broadcastGuardTestResult.errorMessage }}
                  </span>
                </q-banner>

                <q-list
                  v-if="broadcastGuardTestResult"
                  dense
                  bordered
                  separator
                  class="q-mb-md"
                >
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Broadcast test status</q-item-label>
                      <q-item-label>
                        {{ broadcastGuardTestResult.status }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Broadcast enabled</q-item-label>
                      <q-item-label>
                        {{
                          broadcastGuardTestResult.broadcastEnabled
                            ? 'Yes'
                            : 'No'
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="broadcastGuardTestResult.attemptedAt">
                    <q-item-section>
                      <q-item-label caption>Attempted</q-item-label>
                      <q-item-label>
                        {{
                          formatDateTime(broadcastGuardTestResult.attemptedAt)
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-item>
                  <q-item-section>
                    <q-btn
                      color="negative"
                      label="Real Broadcast Moved To Durable Issue Flow"
                      disable
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-btn
                      color="secondary"
                      outline
                      label="Test Blocked Broadcast Guard"
                      :loading="isTestingBroadcastGuard"
                      :disable="!draftCheckResult"
                      @click="handleTestBlockedBroadcastGuard"
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      This button intentionally calls the broadcast service
                      while the global safety guard is disabled. The expected
                      result is blocked.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      Real Topup broadcast is now reserved for the durable Issue
                      flow. A signed funding intent must be saved to the voucher
                      record before any future broadcast attempt.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator spaced />

                <q-item>
                  <q-item-section>
                    <q-btn
                      color="secondary"
                      outline
                      label="Run Developer Draft Check"
                      :loading="isRunningDraftCheck"
                      :disable="!canRunDraftCheck"
                      @click="handleRunDraftCheck"
                    />
                  </q-item-section>
                </q-item>

                <q-item v-if="!canRunDraftCheck">
                  <q-item-section>
                    <q-item-label caption>
                      Draft check requires a valid internal transaction plan.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <template v-if="treasuryFundingPreview">
                  <q-separator spaced />

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Treasury address</q-item-label>
                      <q-item-label class="text-break">
                        {{ treasuryFundingPreview.treasuryAddress }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Voucher address</q-item-label>
                      <q-item-label class="text-break">
                        {{ treasuryFundingPreview.voucherAddress }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Amount to send</q-item-label>
                      <q-item-label>
                        {{ formatBchSats(treasuryFundingPreview.amountSats) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Selected input total</q-item-label>
                      <q-item-label>
                        {{
                          formatBchSats(
                            treasuryFundingPreview.selectedInputSats
                          )
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Selected UTXOs</q-item-label>
                      <q-item-label>
                        {{ treasuryFundingPreview.selectedUtxos.length }}
                        of {{ treasuryFundingPreview.treasuryUtxoCount }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Estimated network fee</q-item-label>
                      <q-item-label>
                        {{
                          formatBchSats(treasuryFundingPreview.estimatedFeeSats)
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>
                        Estimated total required
                      </q-item-label>
                      <q-item-label>
                        {{
                          formatBchSats(
                            treasuryFundingPreview.estimatedTotalRequiredSats
                          )
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="transactionPlan">
                    <q-item-section>
                      <q-item-label caption>Planned fee output</q-item-label>
                      <q-item-label>
                        Platform fee:
                        {{
                          formatBchSats(transactionPlan.platformFeeOutputSats)
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Estimated change</q-item-label>
                      <q-item-label>
                        {{
                          formatBchSats(
                            treasuryFundingPreview.estimatedChangeSats
                          )
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-banner
                    :class="
                      treasuryFundingPreview.isAffordable
                        ? 'bg-green-1 text-green-10'
                        : 'bg-red-1 text-red-10'
                    "
                    rounded
                    class="q-mt-sm q-mb-md"
                  >
                    <template #avatar>
                      <q-icon
                        :name="
                          treasuryFundingPreview.isAffordable
                            ? 'check_circle'
                            : 'warning'
                        "
                      />
                    </template>

                    <span v-if="treasuryFundingPreview.isAffordable">
                      Treasury appears affordable for this voucher.
                    </span>

                    <span v-else>
                      Treasury does not appear affordable for this voucher.
                    </span>
                  </q-banner>

                  <q-card
                    v-if="treasuryFundingPreview.selectedUtxos.length > 0"
                    flat
                    bordered
                    class="q-mb-md"
                  >
                    <q-card-section>
                      <div class="text-subtitle2 q-mb-sm">
                        Selected UTXO details
                      </div>

                      <q-list dense separator>
                        <q-item
                          v-for="(
                            utxo, index
                          ) in treasuryFundingPreview.selectedUtxos"
                          :key="`${utxo.outpointTransactionHash}:${utxo.outpointIndex}`"
                        >
                          <q-item-section>
                            <q-item-label> UTXO {{ index + 1 }} </q-item-label>

                            <q-item-label caption>
                              Value:
                              {{ formatBchSats(utxo.valueSats) }}
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
                </template>

                <q-banner v-else class="bg-grey-2 text-grey-9 q-mb-md" rounded>
                  Treasury funding preview is not available yet. Set up a
                  treasury wallet and refresh/check balance before live funding
                  is enabled.
                </q-banner>

                <q-separator spaced />

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Quote locked</q-item-label>
                    <q-item-label>
                      <span v-if="pricing.quoteLockedAt">
                        {{ formatDateTime(pricing.quoteLockedAt) }}
                      </span>
                      <span v-else>Not available</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Funding mode</q-item-label>
                    <q-item-label>
                      Development guarded — live broadcast remains protected
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          :label="t('common.cancel')"
          color="grey-8"
          :disable="isSubmitting"
          no-caps
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          class="primary-button"
          :label="t('saleConfirm.actions.issueVoucher')"
          :loading="isSubmitting"
          :disable="!canPrepareFundingIntent"
          unelevated
          no-caps
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { FundingReadinessCheck } from 'src/types/funding-readiness';
import type { PreBroadcastChecklist } from 'src/types/pre-broadcast-checklist';
import type { TreasuryBroadcastGate } from 'src/types/treasury-broadcast-gate';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';
import type { TreasuryTransactionDraftAudit } from 'src/types/treasury-transaction-audit';
import type { TopupPricingV1 } from 'src/services/topup-pricing-v1';
import { auditTreasuryTransactionDraft } from 'src/services/treasury-transaction-audit';
import { broadcastTreasuryTransactionDraft } from 'src/services/treasury-broadcast';
import { createFundingReadinessCheck } from 'src/services/funding-readiness';
import { createPreBroadcastChecklist } from 'src/services/pre-broadcast-checklist';
import { createTreasuryBroadcastGate } from 'src/services/treasury-broadcast-gate';
import {
  createTreasuryTransactionDraftFromPlan,
  createTreasuryTransactionDraftStatusFromPlan,
} from 'src/services/treasury-transaction-draft';
import { createTreasuryTransactionPlanFromPreview } from 'src/services/treasury-transaction-planner';
import { createVoucherFeeOutputPlanV1 } from 'src/services/voucher-fee-plan-v1';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import type { VoucherKeyMetadata } from 'src/types/voucher';
import {
  formatBchSats,
  formatMarketRate,
  formatMinorFiatAmount,
} from 'src/services/voucher-pricing';

const props = defineProps<{
  modelValue: boolean;
  pricing: TopupPricingV1;
  isSubmitting: boolean;
  treasuryWarning?: string;
  treasuryBalanceSats?: number;
  treasuryFundingPreview?: TreasuryFundingPreview | null;
  voucherKeyMetadata?: VoucherKeyMetadata | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  'broadcast-result': [value: TreasuryBroadcastResult | null];
}>();

const { t } = useI18n({ useScope: 'global' });

const isRunningDraftCheck = ref(false);
const isTestingBroadcastGuard = ref(false);
const draftCheckResult = ref<TreasuryTransactionDraft | null>(null);
const draftAudit = ref<TreasuryTransactionDraftAudit | null>(null);
const broadcastGuardTestResult = ref<TreasuryBroadcastResult | null>(null);

const quoteSourceLabel = computed(() => {
  switch (props.pricing.quoteSource) {
    case 'fake_phase_2':
    case 'fake_phase_2_quote':
      return t('saleConfirm.quoteSources.developmentQuote');

    case 'coingecko':
      return 'CoinGecko';

    case 'cached':
      return t('saleConfirm.quoteSources.cachedQuote');

    case 'general_protocols_oracle':
      return 'General Protocols Oracle';

    default:
      return props.pricing.quoteSource;
  }
});

const feeOutputPlan = computed<VoucherFeeOutputPlan>(() =>
  createVoucherFeeOutputPlanV1(props.pricing)
);

const transactionPlan = computed<TreasuryTransactionPlan | null>(() => {
  if (!props.treasuryFundingPreview) {
    return null;
  }

  return createTreasuryTransactionPlanFromPreview(
    props.treasuryFundingPreview,
    {
      platformFeeAddress: feeOutputPlan.value.platformFeeAddress,
      platformFeeSats: feeOutputPlan.value.platformFeeSats,
      bufferReserveAddress: feeOutputPlan.value.bufferReserveAddress,
      bufferReserveSats: feeOutputPlan.value.bufferReserveOutputEnabled
        ? feeOutputPlan.value.bufferReserveSats
        : 0,
    }
  );
});

const transactionDraftStatus = computed<TreasuryTransactionDraft | null>(() => {
  if (!transactionPlan.value) {
    return null;
  }

  return (
    draftCheckResult.value ??
    createTreasuryTransactionDraftStatusFromPlan(transactionPlan.value)
  );
});

const canPrepareFundingIntent = computed(() => {
  return (
    transactionPlan.value?.status === 'valid' &&
    Boolean(props.voucherKeyMetadata?.hasWif) &&
    !props.isSubmitting
  );
});

const fundingReadiness = computed<FundingReadinessCheck | null>(() => {
  return createFundingReadinessCheck({
    treasuryIsSetup: Boolean(props.treasuryFundingPreview?.treasuryAddress),
    treasuryBalanceSats: props.treasuryBalanceSats,
    requiredSats: props.treasuryFundingPreview?.estimatedTotalRequiredSats,
    transactionPlan: transactionPlan.value,
    transactionDraft: transactionDraftStatus.value,
  });
});

const preBroadcastChecklist = computed<PreBroadcastChecklist | null>(() => {
  if (!draftCheckResult.value || !draftAudit.value) {
    return null;
  }

  return createPreBroadcastChecklist({
    treasuryFundingPreview: props.treasuryFundingPreview,
    transactionDraft: draftCheckResult.value,
    transactionDraftAudit: draftAudit.value,
    voucherKeyMetadata: props.voucherKeyMetadata,
  });
});

const broadcastGate = computed<TreasuryBroadcastGate>(() =>
  createTreasuryBroadcastGate(preBroadcastChecklist.value)
);

const canRunDraftCheck = computed(() => {
  return (
    transactionPlan.value?.status === 'valid' && !isRunningDraftCheck.value
  );
});

async function handleRunDraftCheck(): Promise<void> {
  if (!transactionPlan.value || transactionPlan.value.status !== 'valid') {
    return;
  }

  draftCheckResult.value = null;
  draftAudit.value = null;
  broadcastGuardTestResult.value = null;
  isRunningDraftCheck.value = true;

  try {
    draftCheckResult.value = await createTreasuryTransactionDraftFromPlan(
      transactionPlan.value
    );

    draftAudit.value = auditTreasuryTransactionDraft(draftCheckResult.value);
  } catch (error) {
    draftCheckResult.value = {
      status: 'not_created',
      plan: transactionPlan.value,
      broadcastEnabled: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Developer draft check failed.',
      createdAt: new Date().toISOString(),
    };

    draftAudit.value = auditTreasuryTransactionDraft(draftCheckResult.value);
  } finally {
    isRunningDraftCheck.value = false;
  }
}

async function handleTestBlockedBroadcastGuard(): Promise<void> {
  if (!draftCheckResult.value) {
    return;
  }

  broadcastGuardTestResult.value = null;
  isTestingBroadcastGuard.value = true;

  try {
    broadcastGuardTestResult.value = await broadcastTreasuryTransactionDraft(
      draftCheckResult.value
    );
  } catch (error) {
    broadcastGuardTestResult.value = {
      status: 'blocked',

      errorMessage:
        error instanceof Error
          ? error.message
          : 'Broadcast guard test could not complete.',

      broadcastEnabled: false,

      requestAttempted: false,

      attemptedAt: new Date().toISOString(),
    };
  } finally {
    isTestingBroadcastGuard.value = false;
  }
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
</script>

<style lang="scss" scoped>
.confirm-card {
  border-radius: 24px;
  max-width: 95vw;
  width: 620px;
}

.dialog-header {
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

.dialog-body {
  padding: 22px;
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

.developer-tools {
  border: 1px solid #dddddd;
  border-radius: 18px;
  overflow: hidden;
}

.dialog-actions {
  padding: 14px 22px;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 850;
  min-height: 42px;
  padding: 0 18px;
}

@media (max-width: 640px) {
  .dialog-header {
    padding: 18px;
  }

  .dialog-body {
    padding: 18px;
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

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-actions .q-btn {
    width: 100%;
  }
}
</style>
