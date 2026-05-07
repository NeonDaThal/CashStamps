<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 620px; max-width: 95vw">
      <q-card-section>
        <div class="text-h5">Confirm Voucher Issue</div>
        <p class="text-grey-7 q-mb-none">
          Review the locked quote and pricing breakdown before creating this
          test voucher.
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section>
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
            Live pricing was unavailable, so a recent cached quote is being
            used. Review the quote carefully before issuing.
          </span>

          <span v-else> Live price quote locked successfully. </span>
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

        <q-banner
          v-if="fundingReadiness"
          :class="
            fundingReadiness.status === 'ready'
              ? 'bg-green-1 text-green-10'
              : 'bg-red-1 text-red-10'
          "
          rounded
          class="q-mb-md"
        >
          <template #avatar>
            <q-icon
              :name="
                fundingReadiness.status === 'ready' ? 'check_circle' : 'block'
              "
            />
          </template>

          <div v-if="fundingReadiness.status === 'ready'">
            Real funding readiness check passed. Broadcast is still disabled in
            this build.
          </div>

          <div v-else>
            <div class="text-weight-medium q-mb-xs">
              Real funding is not ready yet.
            </div>

            <div v-for="message in fundingReadiness.messages" :key="message">
              - {{ message }}
            </div>
          </div>
        </q-banner>

        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label caption>Customer pays</q-item-label>
              <q-item-label>
                {{
                  formatMinorFiatAmount(
                    pricing.customerPaysMinor,
                    pricing.fiatCurrency
                  )
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Service fee</q-item-label>
              <q-item-label>
                {{ formatBasisPointsAsPercent(pricing.serviceFeeBasisPoints) }}
                —
                {{
                  formatMinorFiatAmount(
                    pricing.serviceFeeAmountMinor,
                    pricing.fiatCurrency
                  )
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Voucher value</q-item-label>
              <q-item-label>
                {{
                  formatMinorFiatAmount(
                    pricing.voucherValueMinor,
                    pricing.fiatCurrency
                  )
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item>
            <q-item-section>
              <q-item-label caption>Market rate</q-item-label>
              <q-item-label>
                {{ formatMarketRate(pricing.marketRate, pricing.fiatCurrency) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Estimated BCH loaded</q-item-label>
              <q-item-label>
                {{ formatBchSats(pricing.finalBchSats) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="treasuryBalanceSats !== undefined">
            <q-item-section>
              <q-item-label caption>Treasury balance</q-item-label>
              <q-item-label>
                {{ formatBchSats(treasuryBalanceSats) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header> Automatic fee model </q-item-label>

          <q-item>
            <q-item-section>
              <q-item-label caption>Platform fee</q-item-label>
              <q-item-label>
                {{ formatBchSats(feeOutputPlan.platformFeeSats) }}
                /
                {{
                  formatBasisPointsAsPercent(
                    feeOutputPlan.platformFeeBasisPoints
                  )
                }}
                <span v-if="feeOutputPlan.platformFeeAddress">
                  · output configured
                </span>
                <span v-else> · address not configured yet </span>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Merchant retained spread</q-item-label>
              <q-item-label>
                {{ formatBchSats(feeOutputPlan.merchantRetainedSats) }}
                /
                {{
                  formatBasisPointsAsPercent(
                    feeOutputPlan.merchantRetainedBasisPoints
                  )
                }}
                · retained by merchant/accounting, not a separate output
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Buffer reserve</q-item-label>
              <q-item-label>
                {{ formatBchSats(feeOutputPlan.bufferReserveSats) }}
                /
                {{
                  formatBasisPointsAsPercent(
                    feeOutputPlan.bufferReserveBasisPoints
                  )
                }}
                <span
                  v-if="
                    feeOutputPlan.bufferReserveOutputEnabled &&
                    feeOutputPlan.bufferReserveAddress
                  "
                >
                  · output configured
                </span>
                <span v-else-if="feeOutputPlan.bufferReserveOutputEnabled">
                  · address not configured yet
                </span>
                <span v-else> · tracked only, no separate output for MVP </span>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header> Dry-run treasury funding preview </q-item-label>

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
              Internal transaction plan is valid for dry-run purposes.
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

          <q-item-label header>
            Developer transaction draft check
          </q-item-label>

          <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
            <template #avatar>
              <q-icon name="warning" />
            </template>

            Developer-only check. This may create a signed raw transaction draft
            in memory, but it will not broadcast it and the raw hex is not
            displayed here.
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
              Developer transaction draft check created a transaction draft.
              Broadcast is disabled.
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
              v-if="draftCheckResult.rawTransactionBytesLength !== undefined"
            >
              <q-item-section>
                <q-item-label caption>Raw transaction byte length</q-item-label>
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

            <q-item v-if="draftCheckResult.actualChangeSats !== undefined">
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
                  draftAudit.status === 'passed' ? 'check_circle' : 'warning'
                "
              />
            </template>

            <span v-if="draftAudit.status === 'passed'">
              Transaction draft audit passed.
            </span>

            <span v-else> Transaction draft audit failed. </span>
          </q-banner>

          <q-list v-if="draftAudit" dense bordered separator class="q-mb-md">
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

          <q-item-label header> Pre-broadcast checklist </q-item-label>

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

          <q-item-label header> Broadcast gate </q-item-label>

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
                :name="broadcastGate.canBroadcast ? 'check_circle' : 'block'"
              />
            </template>

            {{ broadcastGate.message }}
          </q-banner>

          <q-banner
            v-if="realBroadcastResult"
            :class="
              realBroadcastResult.status === 'broadcasted'
                ? 'bg-green-1 text-green-10'
                : 'bg-red-1 text-red-10'
            "
            rounded
            class="q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="
                  realBroadcastResult.status === 'broadcasted'
                    ? 'check_circle'
                    : 'warning'
                "
              />
            </template>

            <span v-if="realBroadcastResult.status === 'broadcasted'">
              Real funding transaction broadcasted. Txid:
              {{ realBroadcastResult.txid }}
            </span>

            <span v-else>
              Real funding transaction was not broadcast:
              {{ realBroadcastResult.errorMessage }}
            </span>
          </q-banner>

          <q-list
            v-if="realBroadcastResult"
            dense
            bordered
            separator
            class="q-mb-md"
          >
            <q-item>
              <q-item-section>
                <q-item-label caption>Real broadcast status</q-item-label>
                <q-item-label>
                  {{ realBroadcastResult.status }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Broadcast enabled</q-item-label>
                <q-item-label>
                  {{ realBroadcastResult.broadcastEnabled ? 'Yes' : 'No' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="realBroadcastResult.txid">
              <q-item-section>
                <q-item-label caption>Transaction ID</q-item-label>
                <q-item-label class="text-break">
                  {{ realBroadcastResult.txid }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Attempted</q-item-label>
                <q-item-label>
                  {{ formatDateTime(realBroadcastResult.attemptedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

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

            <span v-else-if="broadcastGuardTestResult.status === 'broadcasted'">
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
                  {{ broadcastGuardTestResult.broadcastEnabled ? 'Yes' : 'No' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="broadcastGuardTestResult.attemptedAt">
              <q-item-section>
                <q-item-label caption>Attempted</q-item-label>
                <q-item-label>
                  {{ formatDateTime(broadcastGuardTestResult.attemptedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-item>
            <q-item-section>
              <q-btn
                color="negative"
                label="Broadcast Real Funding Transaction"
                :disable="!broadcastGate.canBroadcast"
                :loading="isBroadcastingRealFunding"
                @click="handleBroadcastRealFundingTransaction"
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
                This button intentionally calls the broadcast service while the
                global safety guard is disabled. The expected result is blocked.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>
                The real broadcast button is intentionally disabled until the
                pre-broadcast checklist passes and the global guard is
                explicitly enabled.
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
                  {{ formatBchSats(treasuryFundingPreview.selectedInputSats) }}
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
                  {{ formatBchSats(treasuryFundingPreview.estimatedFeeSats) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Estimated total required</q-item-label>
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
                <q-item-label caption>Planned fee outputs</q-item-label>
                <q-item-label>
                  Platform fee:
                  {{ formatBchSats(transactionPlan.platformFeeOutputSats) }}
                  · Buffer reserve:
                  {{ formatBchSats(transactionPlan.bufferReserveOutputSats) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Estimated change</q-item-label>
                <q-item-label>
                  {{
                    formatBchSats(treasuryFundingPreview.estimatedChangeSats)
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
                Treasury appears affordable for this voucher in dry-run preview.
              </span>

              <span v-else>
                Treasury does not appear affordable for this voucher in dry-run
                preview.
              </span>
            </q-banner>

            <q-card
              v-if="treasuryFundingPreview.selectedUtxos.length > 0"
              flat
              bordered
              class="q-mb-md"
            >
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">Selected UTXO details</div>

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
            Treasury funding preview is not available yet. Set up a treasury
            wallet and refresh/check balance before real funding is enabled.
          </q-banner>

          <q-separator spaced />

          <q-item>
            <q-item-section>
              <q-item-label caption>Quote source</q-item-label>
              <q-item-label>
                {{ quoteSourceLabel }}
                <q-badge
                  v-if="pricing.isFallbackQuote"
                  color="orange"
                  class="q-ml-sm"
                >
                  fallback
                </q-badge>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Quote timestamp</q-item-label>
              <q-item-label>
                {{ formatDateTime(pricing.quoteTimestamp) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="pricing.quoteLockedAt">
            <q-item-section>
              <q-item-label caption>Quote locked</q-item-label>
              <q-item-label>
                {{ formatDateTime(pricing.quoteLockedAt) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="pricing.quoteExpiresAt">
            <q-item-section>
              <q-item-label caption>Quote expires</q-item-label>
              <q-item-label>
                {{ formatDateTime(pricing.quoteExpiresAt) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item>
            <q-item-section>
              <q-item-label caption>Funding mode</q-item-label>
              <q-item-label>Fake only — no BCH will be sent yet</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          This is still a dry-run only. No transaction is broadcast. Any future
          raw transaction draft must be treated as sensitive and only broadcast
          after explicit confirmation in a later phase.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="grey-8"
          :disable="isSubmitting"
          @click="emit('update:modelValue', false)"
        />

        <q-btn
          color="primary"
          label="Confirm Fake Issue"
          :loading="isSubmitting"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import type { FundingReadinessCheck } from 'src/types/funding-readiness';
import type { PreBroadcastChecklist } from 'src/types/pre-broadcast-checklist';
import type { TreasuryBroadcastGate } from 'src/types/treasury-broadcast-gate';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';
import type { TreasuryTransactionDraftAudit } from 'src/types/treasury-transaction-audit';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';
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
import { createVoucherFeeOutputPlan } from 'src/services/voucher-fee-plan';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import type { VoucherKeyMetadata } from 'src/types/voucher';
import {
  formatBasisPointsAsPercent,
  formatBchSats,
  formatMarketRate,
  formatMinorFiatAmount,
} from 'src/services/voucher-pricing';

const props = defineProps<{
  modelValue: boolean;
  pricing: FakeVoucherPricingQuote;
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

const isRunningDraftCheck = ref(false);
const isTestingBroadcastGuard = ref(false);
const isBroadcastingRealFunding = ref(false);
const draftCheckResult = ref<TreasuryTransactionDraft | null>(null);
const draftAudit = ref<TreasuryTransactionDraftAudit | null>(null);
const broadcastGuardTestResult = ref<TreasuryBroadcastResult | null>(null);
const realBroadcastResult = ref<TreasuryBroadcastResult | null>(null);

const quoteSourceLabel = computed(() => {
  const labels: Record<FakeVoucherPricingQuote['quoteSource'], string> = {
    fake_phase_2_quote: 'Fake Phase 2 quote',
    coingecko: 'CoinGecko',
    cached: 'Cached quote',
    general_protocols_oracle: 'General Protocols Oracle',
  };

  return labels[props.pricing.quoteSource];
});

const feeOutputPlan = computed<VoucherFeeOutputPlan>(() =>
  createVoucherFeeOutputPlan(props.pricing)
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
  realBroadcastResult.value = null;
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
      status: 'failed',
      broadcastEnabled: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Blocked broadcast guard test failed.',
      attemptedAt: new Date().toISOString(),
    };
  } finally {
    isTestingBroadcastGuard.value = false;
  }
}

async function handleBroadcastRealFundingTransaction(): Promise<void> {
  if (!draftCheckResult.value || !broadcastGate.value.canBroadcast) {
    return;
  }

  realBroadcastResult.value = null;
  isBroadcastingRealFunding.value = true;

  try {
    realBroadcastResult.value = await broadcastTreasuryTransactionDraft(
      draftCheckResult.value
    );

    emit('broadcast-result', realBroadcastResult.value);
  } catch (error) {
    realBroadcastResult.value = {
      status: 'failed',
      broadcastEnabled: true,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Real funding broadcast failed.',
      attemptedAt: new Date().toISOString(),
    };

    emit('broadcast-result', realBroadcastResult.value);
  } finally {
    isBroadcastingRealFunding.value = false;
  }
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
</script>
