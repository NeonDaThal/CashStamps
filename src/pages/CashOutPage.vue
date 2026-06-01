<template>
  <q-page padding class="cash-out-page">
    <div class="cash-out-container">
      <section class="cash-out-hero">
        <div class="section-heading hero-heading">
          <div>
            <p class="eyebrow">Cash-out BCH</p>
            <h1>Cash-out BCH</h1>
          </div>

          <div class="hero-action-icons">
            <q-btn
              flat
              dense
              round
              icon="account_balance_wallet"
              class="hero-icon-button"
              aria-label="Treasury wallet"
              to="/treasury-settings"
            >
              <q-badge
                floating
                rounded
                :class="
                  treasuryWallet.isSetup
                    ? 'quick-action-status-ready'
                    : 'quick-action-status-muted'
                "
              />
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="receipt_long"
              class="hero-icon-button"
              aria-label="Voucher history"
              to="/voucher-history"
            />
          </div>
        </div>

        <p class="intro">
          Enter the cash amount the customer wants to receive. The app will
          calculate how much BCH they must send to the merchant treasury.
        </p>

        <q-form
          class="cash-out-form q-mt-lg"
          @submit.prevent="handlePrepareCashOut"
        >
          <q-input
            v-model="cashAmountInput"
            outlined
            inputmode="decimal"
            type="number"
            min="0"
            step="0.01"
            label="Cash amount to pay out"
            prefix="£"
            :disable="isSubmitting"
            class="amount-input"
          />

          <q-banner class="bg-orange-1 text-orange-10 q-mt-md" rounded>
            <template #avatar>
              <q-icon name="warning" />
            </template>

            Do not give cash to the customer at this stage. Cash is only paid
            after BCH has been detected.
          </q-banner>

          <div class="form-actions q-mt-lg">
            <q-btn
              class="primary-button"
              type="submit"
              label="Lock cash-out quote"
              icon="lock"
              no-caps
              unelevated
              :loading="isSubmitting"
              :disable="!canPrepareCashOut"
            />
          </div>
        </q-form>
      </section>

      <q-card v-if="lastPreparedCashOut" flat bordered class="prepared-card">
        <q-card-section>
          <div class="prepared-heading">
            <q-icon name="pending_actions" />

            <div>
              <div class="text-h6">Cash-out prepared</div>
              <p class="q-mb-none">
                This is a Step 2 test record. Payment QR and automatic BCH
                detection will be added next.
              </p>
            </div>
          </div>

          <q-list dense class="q-mt-md">
            <q-item>
              <q-item-section>
                <q-item-label caption>Reference</q-item-label>
                <q-item-label class="text-weight-bold">
                  {{ lastPreparedCashOut.serial }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Cash customer receives</q-item-label>
                <q-item-label>
                  {{
                    formatFiatAmount(
                      lastPreparedCashOut.fiatAmountMinor,
                      lastPreparedCashOut.fiatCurrency
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>BCH customer must send</q-item-label>
                <q-item-label>
                  {{ formatBchAmount(lastPreparedCashOut.bchSatsRequired) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption
                  >Fiat equivalent customer sends</q-item-label
                >
                <q-item-label>
                  {{
                    formatFiatAmount(
                      lastPreparedCashOut.customerSendsFiatEquivalentMinor,
                      lastPreparedCashOut.fiatCurrency
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Locked exchange rate</q-item-label>
                <q-item-label>
                  {{
                    formatRate(
                      lastPreparedCashOut.quote.marketRate,
                      lastPreparedCashOut.fiatCurrency
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Total service fee / spread</q-item-label>
                <q-item-label>
                  {{
                    formatFiatAmount(
                      lastPreparedCashOut.fee.totalServiceFeeAmountMinor,
                      lastPreparedCashOut.fiatCurrency
                    )
                  }}
                  ({{
                    formatPercent(
                      lastPreparedCashOut.fee.totalServiceFeeBasisPoints
                    )
                  }})
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Treasury receiving address</q-item-label>
                <q-item-label class="text-break">
                  {{ lastPreparedCashOut.treasuryReceivingAddress }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Status</q-item-label>
                <q-item-label>
                  {{ lastPreparedCashOut.status }}
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
            label="View history"
            to="/voucher-history"
            no-caps
          />

          <q-btn
            class="primary-button"
            label="Prepare another"
            no-caps
            unelevated
            @click="handleResetPreparedCashOut"
          />
        </q-card-actions>
      </q-card>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9" rounded>
        {{ successMessage }}
      </q-banner>

      <q-banner
        v-if="warningMessage"
        class="bg-orange-1 text-orange-10"
        rounded
      >
        {{ warningMessage }}
      </q-banner>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="shield" />
        </template>

        Customer BCH must be detected before the merchant gives out cash.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { CashOutRecord } from 'src/types/cash-out';
import {
  calculateCashOutPricingFromLockedQuote,
  formatCashOutBasisPointsAsPercent,
  formatCashOutBchSats,
  formatCashOutMarketRate,
  formatCashOutMinorFiatAmount,
} from 'src/services/cash-out-pricing';
import { addCashOutRecord } from 'src/services/cash-out-store';
import {
  PricingService,
  PricingUnavailableError,
} from 'src/services/pricing-service';
import { getTreasuryWalletPublicInfo } from 'src/services/treasury-wallet';
import type { TreasuryWalletPublicInfo } from 'src/types/treasury';

const pricingService = new PricingService();

const cashAmountInput = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const errorMessage = ref('');

const lastPreparedCashOut = ref<CashOutRecord | null>(null);

const treasuryWallet = ref<TreasuryWalletPublicInfo>({
  address: '',
  createdAt: '',
  updatedAt: '',
  isSetup: false,
});

const canPrepareCashOut = computed(() => {
  const amountMinor = parseCashAmountInputToMinor(cashAmountInput.value);
  return amountMinor > 0 && !isSubmitting.value;
});

function clearMessages(): void {
  successMessage.value = '';
  warningMessage.value = '';
  errorMessage.value = '';
}

function parseCashAmountInputToMinor(value: string): number {
  const normalisedValue = value.trim();

  if (!normalisedValue) {
    return 0;
  }

  const parsedAmount = Number(normalisedValue);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return 0;
  }

  return Math.round(parsedAmount * 100);
}

function generateId(): string {
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  return `cash-out-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateSerial(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');

  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `CO-${datePart}-${randomPart}`;
}

async function loadTreasuryWallet(): Promise<void> {
  try {
    treasuryWallet.value = await getTreasuryWalletPublicInfo();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Could not load treasury wallet.';
  }
}

async function handlePrepareCashOut(): Promise<void> {
  clearMessages();
  lastPreparedCashOut.value = null;

  const fiatAmountMinor = parseCashAmountInputToMinor(cashAmountInput.value);

  if (!Number.isFinite(fiatAmountMinor) || fiatAmountMinor <= 0) {
    errorMessage.value = 'Enter a valid cash amount.';
    return;
  }

  isSubmitting.value = true;

  try {
    await loadTreasuryWallet();

    if (!treasuryWallet.value.isSetup || !treasuryWallet.value.address) {
      errorMessage.value =
        'Set up the merchant treasury wallet before preparing a cash-out.';
      return;
    }

    const lockedQuote = await pricingService.getLockedQuote('GBP');
    const pricing = calculateCashOutPricingFromLockedQuote(
      fiatAmountMinor,
      lockedQuote
    );

    const now = new Date().toISOString();

    const cashOutRecord: CashOutRecord = {
      id: generateId(),
      serial: generateSerial(),

      createdAt: now,
      updatedAt: now,

      fiatCurrency: pricing.fiatCurrency,
      fiatAmountMinor: pricing.fiatAmountMinor,

      customerSendsFiatEquivalentMinor:
        pricing.customerSendsFiatEquivalentMinor,

      marketBchSats: pricing.marketBchSats,
      bchSatsRequired: pricing.bchSatsRequired,

      quote: {
        source: pricing.quoteSource,
        fiatCurrency: pricing.fiatCurrency,
        marketRate: pricing.marketRate,
        marketRateTimestamp: pricing.quoteTimestamp,
        quoteLockedAt: pricing.quoteLockedAt,
        quoteExpiresAt: pricing.quoteExpiresAt,
        isFallbackQuote: pricing.isFallbackQuote,
      },

      fee: pricing.fee,

      treasuryReceivingAddress: treasuryWallet.value.address,

      status: 'awaiting_payment',
    };

    await addCashOutRecord(cashOutRecord);

    lastPreparedCashOut.value = cashOutRecord;

    if (lockedQuote.isFallbackQuote) {
      warningMessage.value =
        'Fallback quote used. Check the rate carefully before continuing.';
    } else {
      successMessage.value =
        'Cash-out quote locked and test record saved. Payment QR/detection comes next.';
    }
  } catch (error) {
    console.error(error);

    if (error instanceof PricingUnavailableError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'Could not prepare cash-out.';
    }
  } finally {
    isSubmitting.value = false;
  }
}

function handleResetPreparedCashOut(): void {
  clearMessages();
  lastPreparedCashOut.value = null;
  cashAmountInput.value = '';
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return formatCashOutMinorFiatAmount(amountMinor, currency);
}

function formatBchAmount(sats: number): string {
  return formatCashOutBchSats(sats);
}

function formatRate(marketRate: number, currency: string): string {
  return formatCashOutMarketRate(marketRate, currency);
}

function formatPercent(basisPoints: number): string {
  return formatCashOutBasisPointsAsPercent(basisPoints);
}

onMounted(() => {
  void loadTreasuryWallet();
});
</script>

<style lang="scss" scoped>
.cash-out-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.cash-out-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 760px;
  width: 100%;
}

.cash-out-hero,
.prepared-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.cash-out-hero {
  padding: 24px;
}

.hero-heading {
  justify-content: space-between;
}

.hero-action-icons {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.hero-icon-button {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  border-radius: 14px;
  color: #111111;
  height: 42px;
  overflow: hidden;
  width: 42px;
}

.hero-icon-button :deep(.q-focus-helper) {
  border-radius: inherit;
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
  max-width: 660px;
}

.cash-out-form {
  display: flex;
  flex-direction: column;
}

.amount-input :deep(.q-field__control) {
  border-radius: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.quick-action-status-ready,
.quick-action-status-muted {
  height: 10px;
  min-height: 10px;
  min-width: 10px;
  padding: 0;
  right: 6px;
  top: 6px;
  width: 10px;
}

.quick-action-status-ready {
  background: #00ce1b;
}

.quick-action-status-muted {
  background: #8a8a8a;
}

.section-heading,
.prepared-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.prepared-heading > .q-icon {
  align-items: center;
  background: #00ce1b;
  border-radius: 16px;
  color: #000000;
  display: flex;
  flex: 0 0 46px;
  font-size: 26px;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.prepared-card :deep(.q-card__section) {
  padding: 22px;
}

.primary-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #ffffff;
  font-weight: 800;
}

@media (max-width: 640px) {
  .cash-out-hero {
    padding: 22px;
  }

  .hero-heading {
    align-items: flex-start;
  }

  .hero-action-icons {
    padding-top: 2px;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions .q-btn {
    width: 100%;
  }
}
</style>
