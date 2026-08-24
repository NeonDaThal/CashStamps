<template>
  <q-card v-if="voucherRecords.length === 0" flat bordered class="empty-card">
    <q-card-section class="text-center">
      <q-icon name="receipt_long" size="42px" color="grey-6" />
      <div class="text-h6 q-mt-sm">
        {{ t('historyList.empty.title') }}
      </div>
      <p class="text-grey-7 q-mb-none">
        {{ t('historyList.empty.text') }}
      </p>
    </q-card-section>
  </q-card>

  <div v-else class="voucher-list">
    <q-card
      v-for="voucher in voucherRecords"
      :key="voucher.id"
      flat
      bordered
      class="voucher-card"
    >
      <q-card-section>
        <div class="voucher-header">
          <div>
            <div class="voucher-serial">{{ voucher.serial }}</div>
            <q-chip
              v-if="voucher.replacement"
              dense
              class="replacement-chip q-mt-xs"
              icon="autorenew"
            >
              Replacement voucher
            </q-chip>
            <div class="voucher-date">
              {{
                t('historyList.issuedDate', {
                  date: formatDate(voucher.createdAt),
                })
              }}
            </div>
          </div>

          <q-badge :class="getStatusBadgeClass(voucher)">
            {{ getVoucherStatusLabel(voucher) }}
          </q-badge>
        </div>

        <div class="voucher-summary-grid q-mt-md">
          <div class="summary-tile highlight">
            <div class="summary-label">
              {{ t('historyList.summary.customerPaid') }}
            </div>
            <div class="summary-value">
              {{
                formatFiatAmount(voucher.fiatAmountMinor, voucher.fiatCurrency)
              }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('historyList.summary.bchLoaded') }}
            </div>
            <div class="summary-value">
              {{ formatBchSats(voucher.finalBchSats) }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('historyList.summary.redemption') }}
            </div>
            <div class="summary-value">
              {{ getRedemptionLabel(voucher) }}
            </div>
          </div>

          <div class="summary-tile">
            <div class="summary-label">
              {{ t('historyList.summary.quote') }}
            </div>
            <div class="summary-value">
              {{ formatQuoteSource(voucher.quote.source) }}
            </div>
          </div>
        </div>

        <q-card flat bordered class="address-card q-mt-md">
          <q-card-section>
            <div class="address-label">
              {{ t('historyList.address.voucherAddress') }}
            </div>
            <div class="address-value">
              {{ voucher.address || t('historyList.address.notDerivedYet') }}
            </div>
          </q-card-section>
        </q-card>

        <q-banner
          v-if="getFundingRecoveryAction(voucher) !== 'none'"
          class="bg-orange-1 text-orange-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon
              :name="canResumeFunding(voucher) ? 'restart_alt' : 'sync'"
            />
          </template>

          <div class="text-weight-bold">
            {{ getFundingRecoveryTitle(voucher) }}
          </div>

          <div>
            {{ getFundingRecoveryMessage(voucher) }}
          </div>
        </q-banner>

        <q-banner
          v-else-if="getTopupFundingState(voucher).state === 'terminal_error'"
          class="bg-red-1 text-red-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="error" />
          </template>

          <div class="text-weight-bold">
            Funding state requires investigation
          </div>

          <div>
            {{
              voucher.errorMessage ||
              'The saved funding state cannot be continued automatically.'
            }}
          </div>
        </q-banner>

        <q-banner
          v-if="
            voucher.printedRecovery?.resolution === 'replacement_required' &&
            voucher.printedRecovery.reclaimStatus === 'reclaimed'
          "
          class="bg-green-1 text-green-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="check_circle" />
          </template>

          <div class="text-weight-bold">Original Topup amount reclaimed</div>

          <div>
            The failed original Printed voucher has been spent back to the
            Treasury Wallet. Its old WIF no longer controls the reclaimed BCH.
          </div>

          <div
            v-if="voucher.printedRecovery.reclaimTxid"
            class="text-caption q-mt-xs text-break"
          >
            Reclaim transaction:
            {{ voucher.printedRecovery.reclaimTxid }}
          </div>
        </q-banner>

        <q-banner
          v-else-if="
            voucher.printedRecovery?.resolution === 'replacement_required'
          "
          class="bg-orange-1 text-orange-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="currency_exchange" />
          </template>

          <div class="text-weight-bold">Replacement Printed Topup required</div>

          <div>
            The original Printed voucher is permanently locked and must never be
            reprinted or exposed digitally. Its BCH should be reclaimed after
            the replacement Topup has been safely funded.
          </div>

          <q-chip
            class="q-mt-sm"
            color="orange"
            text-color="black"
            icon="account_balance_wallet"
          >
            {{
              voucher.printedRecovery.reclaimStatus === 'uncertain'
                ? 'Reclaim outcome needs checking'
                : voucher.printedRecovery.reclaimStatus === 'in_progress'
                ? 'Reclaim transaction in progress'
                : 'Topup amount needs reclaiming'
            }}
          </q-chip>

          <div v-if="canCreatePrintedReplacement(voucher)" class="q-mt-sm">
            <q-btn
              class="primary-button"
              label="Issue Replacement Topup"
              icon="autorenew"
              unelevated
              no-caps
              :loading="issuingReplacementVoucherId === voucher.id"
              @click="handleOpenReplacementConfirmation(voucher)"
            />
          </div>

          <q-banner
            v-else-if="voucher.printedRecovery?.replacementVoucherId"
            class="bg-green-1 text-green-10 q-mt-sm"
            rounded
          >
            <template #avatar>
              <q-icon name="check_circle" />
            </template>

            Replacement Topup record created. The original voucher remains
            locked.
          </q-banner>

          <div v-if="getReclaimAction(voucher) !== 'none'" class="q-mt-sm">
            <q-btn
              class="secondary-button"
              :label="getReclaimActionLabel(voucher)"
              :icon="getReclaimActionIcon(voucher)"
              outline
              no-caps
              :loading="reclaimingVoucherId === voucher.id"
              @click="handleReclaimAction(voucher)"
            />
          </div>

          <q-banner
            v-if="voucher.printedRecovery.reclaimStatus === 'uncertain'"
            class="bg-red-1 text-red-10 q-mt-sm"
            rounded
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>

            The reclaim transaction may already have been submitted. Do not
            create or sign another reclaim transaction. Use Check Reclaim to
            inspect the exact saved transaction.
          </q-banner>
        </q-banner>

        <q-banner
          v-else-if="
            voucher.delivery?.method === 'printed' &&
            voucher.delivery.status === 'delivery_started' &&
            !voucher.printedRecovery
          "
          class="bg-red-1 text-red-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>

          <div class="text-weight-bold">
            Printed voucher outcome needs checking
          </div>

          <div>
            A print attempt started but no final printer result was safely
            recorded. Another automatic print is blocked.
          </div>
        </q-banner>

        <q-banner
          v-else-if="
            voucher.delivery?.method === 'printed' &&
            voucher.delivery.status === 'uncertain' &&
            !voucher.printedRecovery
          "
          class="bg-red-1 text-red-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>

          <div class="text-weight-bold">Printed voucher outcome uncertain</div>

          <div>
            {{
              voucher.delivery.uncertaintyReason ||
              'Some or all of the physical bearer voucher may already have printed.'
            }}
          </div>

          <div class="text-weight-bold q-mt-xs">
            Do not automatically print another copy.
          </div>
        </q-banner>

        <q-banner
          v-else-if="
            voucher.delivery?.method === 'digital' &&
            voucher.status === 'funded' &&
            voucher.delivery.status === 'delivered'
          "
          class="bg-green-1 text-green-10 q-mt-md"
          rounded
        >
          <template #avatar>
            <q-icon name="qr_code_2" />
          </template>

          Digital voucher has been presented but remains unswept. The same
          Digital voucher may be shown again to the customer.
        </q-banner>

        <PrintedVoucherRecoveryResolution
          v-if="canResolvePrintedVoucherRecovery(voucher)"
          :voucher="voucher"
          @updated="handleDeliveryUpdated"
        />

        <div class="action-row q-mt-md">
          <q-btn
            v-if="canShowDigitalVoucherFromHistory(voucher)"
            class="primary-button"
            label="Show Digital Voucher"
            icon="qr_code_2"
            unelevated
            no-caps
            @click="handleShowDigitalVoucher(voucher)"
          />

          <q-btn
            v-if="canRetryPrintedVoucherFromHistory(voucher)"
            class="primary-button"
            :label="
              voucher.replacement
                ? 'Print Replacement Voucher'
                : 'Retry Printed Voucher'
            "
            icon="print"
            unelevated
            no-caps
            @click="handleRetryPrintedVoucher(voucher)"
          />

          <q-btn
            class="secondary-button"
            :label="t('historyList.actions.checkRedemption')"
            icon="travel_explore"
            outline
            no-caps
            :loading="checkingRedemptionVoucherId === voucher.id"
            @click="emit('checkOnChainRedemption', voucher.id)"
          />
        </div>

        <q-btn
          v-if="canResumeFunding(voucher)"
          class="secondary-button"
          label="Resume funding"
          icon="restart_alt"
          outline
          no-caps
          :loading="checkingFundingVoucherId === voucher.id"
          @click="emit('resumeFunding', voucher.id)"
        />

        <q-btn
          v-else-if="canCheckFunding(voucher)"
          class="secondary-button"
          label="Check funding"
          icon="sync"
          outline
          no-caps
          :loading="checkingFundingVoucherId === voucher.id"
          @click="emit('checkFunding', voucher.id)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="accordion-section">
        <q-expansion-item
          icon="check_circle"
          :label="t('historyList.redemptionTools.label')"
          :caption="t('historyList.redemptionTools.caption')"
          class="history-expansion"
        >
          <q-card flat bordered>
            <q-card-section>
              <q-banner
                v-if="voucher.manualRedemption"
                class="bg-green-1 text-green-10 q-mb-md"
                rounded
              >
                <template #avatar>
                  <q-icon name="check_circle" />
                </template>

                {{ t('historyList.redemptionTools.manualMarked') }}
              </q-banner>

              <q-banner
                v-else-if="voucher.redemptionDetection"
                :class="
                  voucher.redemptionDetection.status === 'funded'
                    ? 'bg-green-1 text-green-10'
                    : voucher.redemptionDetection.status === 'swept'
                    ? 'bg-blue-1 text-blue-10'
                    : voucher.redemptionDetection.status === 'unfunded'
                    ? 'bg-grey-2 text-grey-9'
                    : 'bg-orange-1 text-orange-10'
                "
                rounded
                class="q-mb-md"
              >
                <template #avatar>
                  <q-icon
                    :name="
                      voucher.redemptionDetection.status === 'funded'
                        ? 'account_balance_wallet'
                        : voucher.redemptionDetection.status === 'swept'
                        ? 'check_circle'
                        : voucher.redemptionDetection.status === 'unfunded'
                        ? 'info'
                        : 'warning'
                    "
                  />
                </template>

                {{ voucher.redemptionDetection.message }}
              </q-banner>

              <q-banner v-else class="bg-grey-2 text-grey-9 q-mb-md" rounded>
                <template #avatar>
                  <q-icon name="info" />
                </template>

                {{ t('historyList.redemptionTools.notCheckedYet') }}
              </q-banner>

              <q-list
                v-if="voucher.manualRedemption"
                dense
                bordered
                separator
                class="q-mb-md"
              >
                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.status') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.manualRedemption.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.manualRedemption.txid">
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.sweepTransactionId') }}
                    </q-item-label>
                    <q-item-label class="text-break">
                      {{ voucher.manualRedemption.txid }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.manualRedemption.note">
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.note') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.manualRedemption.note }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.redeemed') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.manualRedemption.redeemedAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-list
                v-if="voucher.redemptionDetection"
                dense
                bordered
                separator
                class="q-mb-md"
              >
                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.detectedStatus') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.redemptionDetection.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.detectedBalance') }}
                    </q-item-label>
                    <q-item-label>
                      {{
                        formatBchSats(voucher.redemptionDetection.balanceSats)
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.detectedUtxos') }}
                    </q-item-label>
                    <q-item-label>
                      {{ voucher.redemptionDetection.utxoCount }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      {{ t('historyList.redemptionTools.checked') }}
                    </q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.redemptionDetection.checkedAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div
                v-if="
                  !voucher.manualRedemption && voucher.status !== 'reclaimed'
                "
                class="row q-col-gutter-sm q-mb-md"
              >
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="redemptionInputs[voucher.id].txid"
                    dense
                    outlined
                    :label="t('historyList.redemptionTools.sweepTxidOptional')"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="redemptionInputs[voucher.id].note"
                    dense
                    outlined
                    :label="t('historyList.redemptionTools.noteOptional')"
                  />
                </div>
              </div>

              <div class="tool-actions">
                <q-btn
                  v-if="
                    !voucher.manualRedemption && voucher.status !== 'reclaimed'
                  "
                  color="positive"
                  outline
                  :label="t('historyList.actions.markAsManuallySwept')"
                  no-caps
                  @click="handleMarkManualRedemption(voucher.id)"
                />

                <q-btn
                  v-if="
                    voucher.manualRedemption && voucher.status !== 'reclaimed'
                  "
                  color="grey-8"
                  outline
                  :label="t('historyList.actions.clearManualSweepStatus')"
                  no-caps
                  @click="emit('clearManualRedemption', voucher.id)"
                />

                <q-btn
                  class="secondary-button"
                  :label="t('historyList.actions.checkOnChainStatus')"
                  icon="travel_explore"
                  outline
                  no-caps
                  :disable="voucher.status === 'reclaimed'"
                  :loading="checkingRedemptionVoucherId === voucher.id"
                  @click="emit('checkOnChainRedemption', voucher.id)"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          icon="code"
          label="Development details"
          caption="Key export checks, fee plan, funding preview, and quote data"
          class="history-expansion"
        >
          <q-card flat bordered>
            <q-card-section>
              <q-banner class="bg-grey-2 text-grey-9 q-mb-md" rounded>
                <template #avatar>
                  <q-icon name="shield" />
                </template>

                Technical information for development and testing. Sensitive
                voucher key tools should be removed or hidden behind developer
                mode before merchant production use.
              </q-banner>

              <q-list
                v-if="voucher.printedRecovery"
                dense
                bordered
                separator
                class="q-mb-md"
              >
                <q-item-label header> Printed recovery audit </q-item-label>

                <q-item>
                  <q-item-section>
                    <q-item-label caption> Resolution </q-item-label>

                    <q-item-label>
                      {{ voucher.printedRecovery.resolution }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      Previous delivery state
                    </q-item-label>

                    <q-item-label>
                      {{ voucher.printedRecovery.previousDeliveryStatus }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption> Resolution time </q-item-label>

                    <q-item-label>
                      {{ formatDate(voucher.printedRecovery.resolvedAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption> Reclaim status </q-item-label>

                    <q-item-label>
                      {{ voucher.printedRecovery.reclaimStatus }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.printedRecovery.reclaimIntent">
                  <q-item-section>
                    <q-item-label caption>
                      Prepared reclaim transaction
                    </q-item-label>

                    <q-item-label class="text-break">
                      {{ voucher.printedRecovery.reclaimIntent.txid }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.printedRecovery.reclaimBroadcast">
                  <q-item-section>
                    <q-item-label caption>
                      Reclaim broadcast state
                    </q-item-label>

                    <q-item-label>
                      {{ voucher.printedRecovery.reclaimBroadcast.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.printedRecovery.reclaimReconciliation">
                  <q-item-section>
                    <q-item-label caption>
                      Reclaim network evidence
                    </q-item-label>

                    <q-item-label>
                      {{ voucher.printedRecovery.reclaimReconciliation.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption> Audit reason </q-item-label>

                    <q-item-label>
                      {{ voucher.printedRecovery.reason }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.printedRecovery.replacementVoucherId">
                  <q-item-section>
                    <q-item-label caption>
                      Replacement voucher ID
                    </q-item-label>

                    <q-item-label class="text-break">
                      {{ voucher.printedRecovery.replacementVoucherId }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.printedRecovery.reclaimTxid">
                  <q-item-section>
                    <q-item-label caption>
                      Reclaim transaction ID
                    </q-item-label>

                    <q-item-label class="text-break">
                      {{ voucher.printedRecovery.reclaimTxid }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-list dense bordered separator class="q-mb-md">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Record status</q-item-label>
                    <q-item-label>
                      {{ voucher.status }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Derivation index</q-item-label>
                    <q-item-label>
                      {{ voucher.derivationIndex }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>WIF ready</q-item-label>
                    <q-item-label>
                      <span v-if="voucher.keyMetadata">
                        {{ voucher.keyMetadata.hasWif ? 'Yes' : 'No' }}
                        · checked
                        {{ formatDate(voucher.keyMetadata.checkedAt) }}
                      </span>
                      <span v-else>Not checked</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Service fee</q-item-label>
                    <q-item-label>
                      {{ formatFee(voucher) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption> BCH miner fee </q-item-label>

                    <q-item-label>
                      {{ formatMinerFee(voucher) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>
                      Customer miner-fee recovery
                    </q-item-label>

                    <q-item-label>
                      {{ formatMinerFeeRecovery(voucher) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-list dense bordered separator class="q-mt-md">
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Market rate</q-item-label>
                    <q-item-label>
                      {{
                        formatMarketRate(
                          voucher.quote.marketRate,
                          voucher.fiatCurrency
                        )
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Quote source</q-item-label>
                    <q-item-label>
                      {{ formatQuoteSource(voucher.quote.source) }}
                      <q-badge
                        v-if="voucher.quote.isFallbackQuote"
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
                    <q-item-label caption>Quote time</q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.quote.marketRateTimestamp) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="voucher.quote.quoteExpiresAt">
                  <q-item-section>
                    <q-item-label caption>Quote expires</q-item-label>
                    <q-item-label>
                      {{ formatDate(voucher.quote.quoteExpiresAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-expansion-item
                dense
                icon="payments"
                label="Fee output plan"
                class="nested-expansion q-mt-md"
              >
                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Fee output plan</q-item-label>
                      <q-item-label>
                        <span v-if="voucher.feeOutputPlan">
                          <template v-if="isTopupFeeModelV1(voucher)">
                            platform
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.platformFeeSats
                              )
                            }}
                            · merchant service fee share
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.merchantRetainedSats
                              )
                            }}
                            · total service fee equivalent
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.totalServiceFeeSats
                              )
                            }}
                          </template>

                          <template v-else>
                            platform
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.platformFeeSats
                              )
                            }}
                            · merchant retained
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.merchantRetainedSats
                              )
                            }}
                            · buffer
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.bufferReserveSats
                              )
                            }}
                            · total
                            {{
                              formatBchSats(
                                voucher.feeOutputPlan.totalServiceFeeSats
                              )
                            }}
                          </template>
                        </span>
                        <span v-else>Not available</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>

              <q-expansion-item
                dense
                icon="account_balance_wallet"
                label="Funding preview"
                class="nested-expansion q-mt-sm"
              >
                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Funding preview</q-item-label>
                      <q-item-label>
                        <span v-if="voucher.treasuryFundingPreview">
                          selected {{ getSelectedUtxoCount(voucher) }} UTXOs ·
                          inputs
                          {{ formatBchSats(getSelectedInputSats(voucher)) }}
                          · fee
                          {{
                            formatBchSats(
                              voucher.treasuryFundingPreview.estimatedFeeSats
                            )
                          }}
                          · total
                          {{
                            formatBchSats(
                              voucher.treasuryFundingPreview
                                .estimatedTotalRequiredSats
                            )
                          }}
                          · change
                          {{
                            formatBchSats(
                              voucher.treasuryFundingPreview.estimatedChangeSats
                            )
                          }}
                          ·
                          {{
                            voucher.treasuryFundingPreview.isAffordable
                              ? 'affordable'
                              : 'not affordable'
                          }}
                        </span>
                        <span v-else>Not available</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>

              <q-expansion-item
                v-if="voucher.fundingBroadcast"
                dense
                icon="send"
                label="Funding broadcast"
                class="nested-expansion q-mt-sm"
              >
                <q-banner
                  :class="
                    voucher.fundingBroadcast.status === 'broadcasted'
                      ? 'bg-green-1 text-green-10'
                      : voucher.fundingBroadcast.status === 'blocked'
                      ? 'bg-orange-1 text-orange-10'
                      : 'bg-red-1 text-red-10'
                  "
                  rounded
                  class="q-mb-md"
                >
                  <template #avatar>
                    <q-icon
                      :name="
                        voucher.fundingBroadcast.status === 'broadcasted'
                          ? 'check_circle'
                          : voucher.fundingBroadcast.status === 'blocked'
                          ? 'block'
                          : 'warning'
                      "
                    />
                  </template>

                  <span
                    v-if="voucher.fundingBroadcast.status === 'broadcasted'"
                  >
                    Real funding transaction was broadcast.
                  </span>

                  <span
                    v-else-if="voucher.fundingBroadcast.status === 'blocked'"
                  >
                    Funding broadcast was blocked.
                  </span>

                  <span v-else> Funding broadcast failed. </span>
                </q-banner>

                <q-list dense bordered separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Status</q-item-label>
                      <q-item-label>
                        {{ voucher.fundingBroadcast.status }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="voucher.fundingBroadcast.txid">
                    <q-item-section>
                      <q-item-label caption
                        >Funding transaction ID</q-item-label
                      >
                      <q-item-label class="text-break">
                        {{ voucher.fundingBroadcast.txid }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="voucher.fundingBroadcast.errorMessage">
                    <q-item-section>
                      <q-item-label caption>Broadcast message</q-item-label>
                      <q-item-label>
                        {{ voucher.fundingBroadcast.errorMessage }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Broadcast enabled</q-item-label>
                      <q-item-label>
                        {{
                          voucher.fundingBroadcast.broadcastEnabled
                            ? 'Yes'
                            : 'No'
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Attempted</q-item-label>
                      <q-item-label>
                        {{ formatDate(voucher.fundingBroadcast.attemptedAt) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </div>

  <q-dialog
    v-model="isReclaimConfirmationOpen"
    persistent
    @hide="handleReclaimConfirmationHide"
  >
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6 text-weight-bold">
          Reclaim original Topup amount?
        </div>

        <div class="text-grey-8 q-mt-sm">
          This recovery spends the failed original Printed voucher's BCH back to
          the Treasury Wallet.
        </div>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          <template #avatar>
            <q-icon name="warning" />
          </template>

          <div class="text-weight-bold">
            Only continue after the replacement Topup has been funded for the
            customer.
          </div>

          <div class="q-mt-xs">
            The app will spend only the exact original Topup funding output. It
            will not sweep unrelated BCH which may have been sent to the same
            voucher address.
          </div>
        </q-banner>

        <q-banner
          v-if="
            reclaimConfirmationVoucher &&
            getReclaimAction(reclaimConfirmationVoucher) ===
              'resume_same_transaction'
          "
          class="bg-grey-2 text-grey-9 q-mt-md"
          rounded
        >
          An exact signed reclaim transaction is already saved. Resume Reclaim
          will use that same transaction only. It will not create or sign
          another reclaim transaction.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          color="grey-8"
          label="Go Back"
          no-caps
          :disable="
            Boolean(
              reclaimConfirmationVoucher &&
                reclaimingVoucherId === reclaimConfirmationVoucher.id
            )
          "
          @click="isReclaimConfirmationOpen = false"
        />

        <q-btn
          class="primary-button"
          label="Confirm Reclaim"
          icon="account_balance_wallet"
          unelevated
          no-caps
          :loading="
            Boolean(
              reclaimConfirmationVoucher &&
                reclaimingVoucherId === reclaimConfirmationVoucher.id
            )
          "
          @click="handleConfirmReclaim"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="isReplacementConfirmationOpen"
    persistent
    @hide="handleReplacementConfirmationHide"
  >
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6 text-weight-bold">
          Issue replacement Printed Topup?
        </div>

        <div class="text-grey-8 q-mt-sm">
          This creates a brand-new voucher address and WIF and funds it with the
          same BCH amount owed to the customer.
        </div>

        <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          <template #avatar>
            <q-icon name="warning" />
          </template>

          <div class="text-weight-bold">
            The original voucher remains funded until it is reclaimed.
          </div>

          <div class="q-mt-xs">
            Treasury will temporarily fund the replacement as well. No second
            platform or service fee will be charged, and the replacement will
            not count as another customer sale.
          </div>
        </q-banner>

        <q-banner class="bg-grey-2 text-grey-9 q-mt-md" rounded>
          The replacement remains permanently Printed. It can never expose its
          WIF through the Digital delivery route.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          color="grey-8"
          label="Go Back"
          no-caps
          :disable="
            Boolean(
              replacementConfirmationVoucher &&
                issuingReplacementVoucherId ===
                  replacementConfirmationVoucher.id
            )
          "
          @click="isReplacementConfirmationOpen = false"
        />

        <q-btn
          class="primary-button"
          label="Issue Replacement Topup"
          icon="autorenew"
          unelevated
          no-caps
          :loading="
            Boolean(
              replacementConfirmationVoucher &&
                issuingReplacementVoucherId ===
                  replacementConfirmationVoucher.id
            )
          "
          @click="handleConfirmReplacement"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="isDigitalDeliveryDialogOpen"
    persistent
    @hide="handleDeliveryDialogHide"
  >
    <q-card style="width: 460px; max-width: 95vw">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Digital Topup</div>

          <div class="text-caption text-grey-7">
            Same funded Digital voucher
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="selectedDeliveryVoucher">
        <DigitalVoucherDelivery
          :voucher="selectedDeliveryVoucher"
          @updated="handleDeliveryUpdated"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="grey-8"
          label="Close for now"
          no-caps
          @click="isDigitalDeliveryDialogOpen = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="isPrintedDeliveryDialogOpen"
    persistent
    @hide="handleDeliveryDialogHide"
  >
    <q-card style="width: 500px; max-width: 95vw">
      <q-card-section v-if="selectedDeliveryVoucher">
        <PrintedVoucherDelivery
          :voucher="selectedDeliveryVoucher"
          @updated="handleDeliveryUpdated"
          @close="isPrintedDeliveryDialogOpen = false"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import DigitalVoucherDelivery from 'src/components/DigitalVoucherDelivery.vue';

import PrintedVoucherDelivery from 'src/components/PrintedVoucherDelivery.vue';
import PrintedVoucherRecoveryResolution from 'src/components/PrintedVoucherRecoveryResolution.vue';
import type { VoucherRecord, VoucherQuoteSource } from 'src/types/voucher';
import { formatBchSats, formatMarketRate } from 'src/services/voucher-pricing';
import {
  getTopupRecordValues,
  isTopupFeeModelV1,
} from 'src/services/topup-record-values';

import {
  canRetryPrintedVoucherFromHistory,
  canShowDigitalVoucherFromHistory,
} from 'src/services/voucher-delivery-history';

import { canCreatePrintedReplacement } from 'src/services/voucher-replacement';
import {
  getVoucherReclaimRecoveryAction,
  type VoucherReclaimRecoveryAction,
} from 'src/services/voucher-reclaim-state';

import { canResolvePrintedVoucherRecovery } from 'src/services/voucher-printed-recovery';

import {
  getTopupFundingState,
  type TopupFundingRecoveryAction,
} from 'src/services/topup-funding-state';

type VoucherStatusKey =
  | 'redeemed'
  | 'reclaimed'
  | 'funded'
  | 'funding'
  | 'error'
  | 'issued';

const props = defineProps<{
  voucherRecords: VoucherRecord[];

  checkingRedemptionVoucherId?: string | null;

  checkingFundingVoucherId?: string | null;

  issuingReplacementVoucherId?: string | null;
  reclaimingVoucherId?: string | null;
}>();

const emit = defineEmits<{
  markManualRedemption: [
    payload: {
      voucherId: string;
      txid?: string;
      note?: string;
    }
  ];

  clearManualRedemption: [voucherId: string];

  checkOnChainRedemption: [voucherId: string];

  resumeFunding: [voucherId: string];
  checkFunding: [voucherId: string];
  deliveryUpdated: [voucher: VoucherRecord];
  issueReplacement: [voucherId: string];
  reclaimVoucher: [
    payload: {
      voucherId: string;
      action: VoucherReclaimRecoveryAction;
    }
  ];
}>();

const { t } = useI18n({ useScope: 'global' });

const redemptionInputs = reactive<
  Record<string, { txid: string; note: string }>
>({});

const isDigitalDeliveryDialogOpen = ref(false);

const isPrintedDeliveryDialogOpen = ref(false);

const selectedDeliveryVoucher = ref<VoucherRecord | null>(null);
const replacementConfirmationVoucher = ref<VoucherRecord | null>(null);

const isReplacementConfirmationOpen = ref(false);

const reclaimConfirmationVoucher = ref<VoucherRecord | null>(null);

const isReclaimConfirmationOpen = ref(false);

function getLinkedReplacementVoucher(
  voucher: VoucherRecord
): VoucherRecord | undefined {
  const replacementVoucherId = voucher.printedRecovery?.replacementVoucherId;

  if (!replacementVoucherId) {
    return undefined;
  }

  return props.voucherRecords.find(
    (record) => record.id === replacementVoucherId
  );
}

function getReclaimAction(
  voucher: VoucherRecord
): VoucherReclaimRecoveryAction {
  return getVoucherReclaimRecoveryAction(
    voucher,
    getLinkedReplacementVoucher(voucher)
  );
}

function getReclaimActionLabel(voucher: VoucherRecord): string {
  const action = getReclaimAction(voucher);

  if (action === 'prepare_and_resume') {
    return 'Reclaim Topup Amount';
  }

  if (action === 'resume_same_transaction') {
    return 'Resume Reclaim';
  }

  if (action === 'check_same_transaction') {
    return 'Check Reclaim';
  }

  return 'Reclaim Unavailable';
}

function getReclaimActionIcon(voucher: VoucherRecord): string {
  const action = getReclaimAction(voucher);

  if (action === 'check_same_transaction') {
    return 'sync';
  }

  if (action === 'resume_same_transaction') {
    return 'restart_alt';
  }

  return 'account_balance_wallet';
}

function handleReclaimAction(voucher: VoucherRecord): void {
  const action = getReclaimAction(voucher);

  if (action === 'none') {
    return;
  }

  /**
   * Read-only reconciliation needs no money-moving confirmation.
   */
  if (action === 'check_same_transaction') {
    emit('reclaimVoucher', {
      voucherId: voucher.id,
      action,
    });

    return;
  }

  reclaimConfirmationVoucher.value = voucher;

  isReclaimConfirmationOpen.value = true;
}

function handleConfirmReclaim(): void {
  const voucher = reclaimConfirmationVoucher.value;

  if (!voucher) {
    return;
  }

  const action = getReclaimAction(voucher);

  if (action !== 'prepare_and_resume' && action !== 'resume_same_transaction') {
    return;
  }

  emit('reclaimVoucher', {
    voucherId: voucher.id,
    action,
  });

  isReclaimConfirmationOpen.value = false;

  reclaimConfirmationVoucher.value = null;
}

function handleReclaimConfirmationHide(): void {
  reclaimConfirmationVoucher.value = null;
}

function ensureRedemptionInputs(): void {
  props.voucherRecords.forEach((voucher) => {
    if (!redemptionInputs[voucher.id]) {
      redemptionInputs[voucher.id] = {
        txid: '',
        note: '',
      };
    }
  });
}

watch(
  () => props.voucherRecords,
  () => {
    ensureRedemptionInputs();
  },
  {
    immediate: true,
    deep: true,
  }
);

function handleMarkManualRedemption(voucherId: string): void {
  const input = redemptionInputs[voucherId] ?? {
    txid: '',
    note: '',
  };

  emit('markManualRedemption', {
    voucherId,
    txid: input.txid.trim() || undefined,
    note: input.note.trim() || undefined,
  });
}

function handleShowDigitalVoucher(voucher: VoucherRecord): void {
  if (!canShowDigitalVoucherFromHistory(voucher)) {
    return;
  }

  selectedDeliveryVoucher.value = voucher;

  isDigitalDeliveryDialogOpen.value = true;
}

function handleRetryPrintedVoucher(voucher: VoucherRecord): void {
  if (!canRetryPrintedVoucherFromHistory(voucher)) {
    return;
  }

  selectedDeliveryVoucher.value = voucher;

  isPrintedDeliveryDialogOpen.value = true;
}

function handleDeliveryUpdated(voucher: VoucherRecord): void {
  selectedDeliveryVoucher.value = voucher;

  emit('deliveryUpdated', voucher);
}

function handleDeliveryDialogHide(): void {
  selectedDeliveryVoucher.value = null;
}

function handleOpenReplacementConfirmation(voucher: VoucherRecord): void {
  if (!canCreatePrintedReplacement(voucher)) {
    return;
  }

  replacementConfirmationVoucher.value = voucher;

  isReplacementConfirmationOpen.value = true;
}

function handleConfirmReplacement(): void {
  const voucher = replacementConfirmationVoucher.value;

  if (!voucher) {
    return;
  }

  emit('issueReplacement', voucher.id);

  isReplacementConfirmationOpen.value = false;

  replacementConfirmationVoucher.value = null;
}

function handleReplacementConfirmationHide(): void {
  replacementConfirmationVoucher.value = null;
}

function getFundingRecoveryAction(
  voucher: VoucherRecord
): TopupFundingRecoveryAction {
  return getTopupFundingState(voucher).recoveryAction;
}

function canResumeFunding(voucher: VoucherRecord): boolean {
  return getFundingRecoveryAction(voucher) === 'resume_same_transaction';
}

function canCheckFunding(voucher: VoucherRecord): boolean {
  return getFundingRecoveryAction(voucher) === 'check_same_transaction';
}

function getFundingRecoveryTitle(voucher: VoucherRecord): string {
  if (canResumeFunding(voucher)) {
    return 'Funding can be resumed safely';
  }

  return 'Funding verification pending';
}

function getFundingRecoveryMessage(voucher: VoucherRecord): string {
  if (canResumeFunding(voucher)) {
    return (
      'The exact signed transaction has been saved safely. ' +
      'Resume funding will first check that same transaction and may then ' +
      'submit that exact saved transaction. No replacement transaction will be created.'
    );
  }

  return (
    'The transaction may already have been submitted. ' +
    'Only the exact saved transaction will be checked again. ' +
    'No transaction will be created, signed or broadcast.'
  );
}

function getVoucherStatusKey(voucher: VoucherRecord): VoucherStatusKey {
  if (voucher.status === 'reclaimed') {
    return 'reclaimed';
  }
  if (
    voucher.status === 'redeemed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  ) {
    return 'redeemed';
  }

  if (
    voucher.status === 'funded' ||
    voucher.redemptionDetection?.status === 'funded'
  ) {
    return 'funded';
  }

  if (voucher.status === 'funding') {
    return 'funding';
  }

  if (voucher.status === 'error') {
    return 'error';
  }

  return 'issued';
}

function getVoucherStatusLabel(voucher: VoucherRecord): string {
  const status = getVoucherStatusKey(voucher);

  if (status === 'reclaimed') {
    return 'Reclaimed';
  }

  if (status === 'funding') {
    return 'Funding verification';
  }

  return t(`historyList.status.${status}`);
}

function getRedemptionLabel(voucher: VoucherRecord): string {
  if (voucher.status === 'reclaimed') {
    return 'Reclaimed to Treasury';
  }
  if (voucher.manualRedemption) {
    return t('historyList.redemption.manualSwept');
  }

  if (voucher.redemptionDetection?.status === 'swept') {
    return t('historyList.redemption.swept');
  }

  if (voucher.redemptionDetection?.status === 'funded') {
    return t('historyList.redemption.funded');
  }

  if (voucher.redemptionDetection?.status === 'unfunded') {
    return t('historyList.redemption.unfunded');
  }

  return t('historyList.redemption.notChecked');
}

function getStatusBadgeClass(voucher: VoucherRecord): string {
  return `status-badge ${getVoucherStatusKey(voucher)}`;
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatFee(voucher: VoucherRecord): string {
  const values = getTopupRecordValues(voucher);

  if (values.serviceFeeMinor === 0) {
    return 'None';
  }

  const feeAmount = formatFiatAmount(
    values.serviceFeeMinor,
    voucher.fiatCurrency
  );

  if (values.model === 'topup_v1') {
    return feeAmount;
  }

  const feePercent = `${voucher.fee.basisPoints / 100}%`;

  return `${feePercent} / ${feeAmount}`;
}

function formatMinerFee(voucher: VoucherRecord): string {
  const values = getTopupRecordValues(voucher);

  if (
    values.networkFeeStatus === 'final' &&
    values.actualMinerFeeSats !== null
  ) {
    return `${formatBchSats(
      values.actualMinerFeeSats
    )} · actual signed transaction fee`;
  }

  if (
    values.networkFeeStatus === 'estimated' &&
    values.estimatedMinerFeeSats !== null
  ) {
    return `${formatBchSats(values.estimatedMinerFeeSats)} · estimate only`;
  }

  if (values.networkFeeStatus === 'not_calculated') {
    return 'Not calculated';
  }

  return 'Not available for this record';
}

function formatMinerFeeRecovery(voucher: VoucherRecord): string {
  const values = getTopupRecordValues(voucher);

  if (values.customerNetworkFeeRecoveryMinor === null) {
    return 'Not available for this record';
  }

  const formattedAmount = formatFiatAmount(
    values.customerNetworkFeeRecoveryMinor,
    voucher.fiatCurrency
  );

  if (values.customerNetworkFeeRecoveryMinor === 0) {
    return `${formattedAmount} · merchant absorbs miner fee`;
  }

  return `${formattedAmount} · recovered from customer`;
}

function getSelectedUtxoCount(voucher: VoucherRecord): number {
  return voucher.treasuryFundingPreview?.selectedUtxos?.length ?? 0;
}

function getSelectedInputSats(voucher: VoucherRecord): number {
  return (
    voucher.treasuryFundingPreview?.selectedInputSats ??
    voucher.treasuryFundingPreview?.treasuryBalanceSats ??
    0
  );
}

function formatQuoteSource(source: VoucherQuoteSource): string {
  const labels: Record<VoucherQuoteSource, string> = {
    general_protocols_oracle: 'GP Oracle',
    coingecko: 'CoinGecko',
    cached: t('historyList.quoteSources.cached'),
    manual: t('historyList.quoteSources.manual'),
    unknown: t('historyList.quoteSources.unknown'),
  };

  return labels[source];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
</script>

<style lang="scss" scoped>
.empty-card,
.voucher-card {
  border-radius: 22px;
}

.voucher-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.voucher-card {
  background: #ffffff;
  border-color: #dddddd;
  overflow: hidden;
}

.voucher-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.voucher-serial {
  color: #111111;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.voucher-date {
  color: #666666;
  font-size: 13px;
  margin-top: 4px;
}

.replacement-chip {
  background: #eeeeee;
  color: #111111;
  font-size: 11px;
  font-weight: 850;
}

.status-badge {
  border-radius: 999px;
  color: #000000;
  font-weight: 850;
  padding: 6px 10px;
}

.status-badge.issued {
  background: #eeeeee;
}

.status-badge.funded {
  background: #00ce1b;
}

.status-badge.funding {
  background: #fff3cd;
  color: #7a5200;
}

.status-badge.redeemed {
  background: #d8ecff;
  color: #0b4f8a;
}

.status-badge.reclaimed {
  background: #e4f7e7;
  color: #176b2d;
}

.status-badge.error {
  background: #ffe1e1;
  color: #b00020;
}

.voucher-summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, 1fr);
}

.summary-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 14px;
}

.summary-tile.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.summary-label,
.address-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.summary-value {
  color: #111111;
  font-size: 15px;
  font-weight: 850;
  line-height: 1.25;
}

.address-card {
  background: #f7f8f7;
  border-color: #dddddd;
  border-radius: 18px;
}

.address-card :deep(.q-card__section) {
  padding: 14px;
}

.address-value {
  color: #111111;
  font-size: 13px;
  font-weight: 700;
  word-break: break-all;
}

.action-row,
.tool-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.primary-button,
.secondary-button {
  border-radius: 14px;
  font-weight: 850;
  min-height: 42px;
  overflow: hidden;
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

.accordion-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-expansion,
.nested-expansion {
  border: 1px solid #dddddd;
  border-radius: 18px;
  overflow: hidden;
}

.history-expansion :deep(.q-expansion-item__container),
.nested-expansion :deep(.q-expansion-item__container) {
  border-radius: 18px;
  overflow: hidden;
}

.history-expansion :deep(.q-focus-helper),
.nested-expansion :deep(.q-focus-helper),
.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.receipt-dialog-card {
  border-radius: 22px;
  max-width: 95vw;
  width: 440px;
}

@media (max-width: 820px) {
  .voucher-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .voucher-header {
    flex-direction: column;
  }

  .voucher-summary-grid {
    grid-template-columns: 1fr;
  }

  .action-row,
  .tool-actions {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button,
  .tool-actions .q-btn {
    width: 100%;
  }
}
</style>
