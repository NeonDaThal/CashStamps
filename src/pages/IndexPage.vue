<template>
  <q-page padding class="home-page">
    <div class="home-container">
      <section class="hero-card">
        <div class="brand-mark">
          <img :src="bchLogoUrl" :alt="t('home.logoAlt')" />
        </div>

        <div>
          <p class="eyebrow">{{ t('home.eyebrow') }}</p>
          <h1>{{ t('home.title') }}</h1>
          <p class="intro">
            {{ t('home.intro') }}
          </p>
        </div>
      </section>

      <section class="action-card">
        <div class="section-header">
          <h2>{{ t('home.actionTitle') }}</h2>
          <p>{{ t('home.actionSubtitle') }}</p>
        </div>

        <div class="main-action-grid">
          <q-btn
            class="main-action-button"
            :label="t('home.sellVoucher')"
            icon="point_of_sale"
            to="/sell-voucher"
            unelevated
            no-caps
          />

          <q-btn
            class="main-action-button"
            :label="t('home.cashOutBch')"
            icon="currency_exchange"
            to="/cash-out"
            unelevated
            no-caps
          />
        </div>

        <div class="secondary-action-grid">
          <q-btn
            class="secondary-action-button"
            :label="t('home.voucherHistory')"
            icon="receipt_long"
            to="/voucher-history"
            unelevated
            no-caps
          />

          <q-btn
            class="secondary-action-button"
            :label="t('home.treasuryWallet')"
            icon="account_balance_wallet"
            to="/treasury-settings"
            unelevated
            no-caps
          />
        </div>
      </section>

      <section class="glance-card">
        <div class="section-header">
          <h2>{{ t('home.glance.title') }}</h2>
          <p>{{ t('home.glance.subtitle') }}</p>
        </div>

        <div class="glance-grid">
          <q-card flat bordered class="glance-stat">
            <q-card-section>
              <div class="glance-icon">
                <q-icon name="add_card" />
              </div>

              <div class="glance-content">
                <div class="glance-label">
                  {{ t('home.glance.topups') }}
                </div>
                <div class="glance-number">{{ topupStats.count }}</div>
                <div class="glance-value">
                  {{ formatFiatAmount(topupStats.valueMinor) }}
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="glance-stat">
            <q-card-section>
              <div class="glance-icon">
                <q-icon name="currency_exchange" />
              </div>

              <div class="glance-content">
                <div class="glance-label">
                  {{ t('home.glance.cashOuts') }}
                </div>
                <div class="glance-number">{{ cashOutStats.count }}</div>
                <div class="glance-value">
                  {{ formatFiatAmount(cashOutStats.valueMinor) }}
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="glance-stat total">
            <q-card-section>
              <div class="glance-icon">
                <q-icon name="summarize" />
              </div>

              <div class="glance-content">
                <div class="glance-label">
                  {{ t('home.glance.totalActions') }}
                </div>
                <div class="glance-number">{{ totalStats.count }}</div>
                <div class="glance-value">
                  {{ formatFiatAmount(totalStats.valueMinor) }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import bchLogoUrl from 'src/assets/bch-logo.png';
import { getCashOutRecords } from 'src/services/cash-out-store';
import { getVoucherRecords } from 'src/services/voucher-store';
import type { CashOutRecord } from 'src/types/cash-out';
import type { VoucherRecord } from 'src/types/voucher';

const { t } = useI18n({ useScope: 'global' });

const voucherRecords = ref<VoucherRecord[]>([]);
const cashOutRecords = ref<CashOutRecord[]>([]);
const todayDateKey = getLocalDateKey(new Date().toISOString());

onMounted(() => {
  void loadHomeStats();
});

async function loadHomeStats(): Promise<void> {
  const [loadedVoucherRecords, loadedCashOutRecords] = await Promise.all([
    getVoucherRecords(),
    getCashOutRecords(),
  ]);

  voucherRecords.value = loadedVoucherRecords;
  cashOutRecords.value = loadedCashOutRecords;
}

function getLocalDateKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const todaysTopupRecords = computed(() =>
  voucherRecords.value.filter((record) => {
    const isToday = getLocalDateKey(record.createdAt) === todayDateKey;
    const isCountableStatus =
      record.status !== 'draft' && record.status !== 'error';

    return isToday && isCountableStatus;
  })
);

const todaysCashOutRecords = computed(() =>
  cashOutRecords.value.filter((record) => {
    const isToday = getLocalDateKey(record.createdAt) === todayDateKey;
    const isCountableStatus =
      record.status !== 'draft' &&
      record.status !== 'cancelled' &&
      record.status !== 'failed';

    return isToday && isCountableStatus;
  })
);

const statsCurrency = computed(
  () =>
    todaysTopupRecords.value[0]?.fiatCurrency ??
    todaysCashOutRecords.value[0]?.fiatCurrency ??
    'GBP'
);

const topupStats = computed(() => ({
  count: todaysTopupRecords.value.length,
  valueMinor: todaysTopupRecords.value.reduce(
    (total, record) => total + record.fiatAmountMinor,
    0
  ),
}));

const cashOutStats = computed(() => ({
  count: todaysCashOutRecords.value.length,
  valueMinor: todaysCashOutRecords.value.reduce(
    (total, record) => total + record.fiatAmountMinor,
    0
  ),
}));

const totalStats = computed(() => ({
  count: topupStats.value.count + cashOutStats.value.count,
  valueMinor: topupStats.value.valueMinor + cashOutStats.value.valueMinor,
}));

function formatFiatAmount(amountMinor: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: statsCurrency.value,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${statsCurrency.value} ${(amountMinor / 100).toFixed(2)}`;
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.18),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.home-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 760px;
  width: 100%;
}

.hero-card,
.action-card,
.glance-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.hero-card {
  display: grid;
  gap: 18px;
  grid-template-columns: auto 1fr;
  padding: 24px;
}

.brand-mark {
  align-items: center;
  display: flex;
  flex: 0 0 72px;
  height: 72px;
  justify-content: center;
  width: 72px;
}

.brand-mark img {
  display: block;
  height: 62px;
  object-fit: contain;
  width: 72px;
  margin-top: 28px;
}

.eyebrow {
  color: #4b4b4b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

h1,
h2 {
  color: #111111;
  line-height: 1.08;
  margin: 0;
}

h1 {
  font-size: clamp(32px, 8vw, 52px);
  font-weight: 900;
  letter-spacing: -1.4px;
}

h2 {
  font-size: 24px;
  font-weight: 850;
}

.intro {
  color: #444444;
  font-size: 16px;
  line-height: 1.45;
  margin: 12px 0 0;
}

.action-card,
.glance-card {
  padding: 22px;
}

.section-header {
  margin-bottom: 18px;
}

.section-header p {
  color: #666666;
  margin: 6px 0 0;
}

.main-action-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 60px;
}

.main-action-button {
  background: #00ce1b;
  border-radius: 18px;
  box-shadow: 0 8px 16px rgba(0, 168, 22, 0.18);
  color: #000000;
  font-size: 19px;
  font-weight: 850;
  justify-content: flex-start;
  min-height: 57px;
  padding: 0 16px;
}

.main-action-button :deep(.q-btn__content) {
  gap: 8px;
}

.main-action-button :deep(.q-icon) {
  font-size: 27px;
}

.secondary-action-grid {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 24px;
}

.secondary-action-button {
  background: #ffffff;
  border: 1px solid #d8d8d8;
  border-radius: 999px;
  color: #333333;
  flex: 0 1 158px;
  font-size: 14px;
  font-weight: 800;
  min-height: 44px;
  padding: 0 14px;
}

.secondary-action-button :deep(.q-btn__content) {
  gap: 7px;
}

.secondary-action-button :deep(.q-icon) {
  color: #00a816;
  font-size: 20px;
}

.glance-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.glance-stat {
  background: #ffffff;
  border-color: #dddddd;
  border-radius: 20px;
}

.glance-stat.total {
  background: #111111;
  border-color: #111111;
  color: #ffffff;
}

.glance-stat :deep(.q-card__section) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
}

.glance-icon {
  align-items: center;
  background: #f0f0f0;
  border-radius: 14px;
  color: #00a816;
  display: flex;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.glance-stat.total .glance-icon {
  background: rgba(255, 255, 255, 0.12);
  color: #00e31e;
}

.glance-label {
  color: #555555;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.2;
}

.glance-stat.total .glance-label {
  color: rgba(255, 255, 255, 0.72);
}

.glance-number {
  color: #111111;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  line-height: 1;
  margin-top: 8px;
}

.glance-stat.total .glance-number {
  color: #ffffff;
}

.glance-value {
  color: #666666;
  font-size: 13px;
  font-weight: 800;
  margin-top: 4px;
}

.glance-stat.total .glance-value {
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 640px) {
  .hero-card {
    --mobile-hero-logo-size: 48px;

    align-items: center;
    column-gap: 8px;
    grid-template-columns: var(--mobile-hero-logo-size) minmax(0, 1fr);
    padding: 22px;
    padding-top: 30px;
    padding-bottom: 30px;
    row-gap: 0;
  }

  .hero-card > div:not(.brand-mark) {
    display: contents;
  }

  .brand-mark {
    align-self: center;
    flex-basis: var(--mobile-hero-logo-size);
    grid-column: 1;
    grid-row: 1 / span 2;
    height: var(--mobile-hero-logo-size);
    width: var(--mobile-hero-logo-size);
  }

  .brand-mark img {
    height: var(--mobile-hero-logo-size);
    margin-top: 15px;
    margin-right: 10px;
    width: var(--mobile-hero-logo-size);
  }

  .eyebrow {
    align-self: end;
    grid-column: 2;
    grid-row: 1;
    margin: 0 0 3px;
  }

  h1 {
    align-self: start;
    grid-column: 2;
    grid-row: 2;
  }

  .intro {
    grid-column: 1 / -1;
    grid-row: 3;
    margin: 15px 0 0;
  }

  .main-action-grid {
    grid-template-columns: 1fr;
  }

  .main-action-button {
    justify-content: center;
    min-height: 50px;
    font-size: 17px;
  }

  .main-action-button :deep(.q-btn__content) {
    display: flex;
    gap: 6px;
    justify-content: center;
    width: 100%;
  }

  .main-action-button :deep(.q-icon) {
    font-size: 24px;
  }

  .main-action-button :deep(.block) {
    text-align: center;
  }

  .main-action-grid .main-action-button:first-child :deep(.q-btn__content) {
    gap: 1px;
  }

  .main-action-grid .main-action-button:nth-child(2) {
    background: #111111;
    color: #00ce1b;
  }

  .main-action-grid .main-action-button:nth-child(2) :deep(.q-icon) {
    color: #00ce1b;
  }

  .secondary-action-grid {
    gap: 8px;
  }

  .secondary-action-button {
    flex: 0 1 132px;
    font-size: 13px;
    min-height: 40px;
    padding: 0 10px;
  }

  .secondary-action-button :deep(.q-icon) {
    font-size: 18px;
  }

  .glance-grid {
    gap: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .glance-stat {
    border-radius: 16px;
  }

  .glance-stat :deep(.q-card__section) {
    gap: 10px;
    padding: 10px 8px;
  }

  .glance-icon {
    border-radius: 10px;
    font-size: 22px;
    height: 35px;
    width: 35px;
  }

  .glance-label {
    font-size: 15px;
    line-height: 1.1;
  }

  .glance-number {
    font-size: 23px;
    letter-spacing: -0.5px;
    margin-top: 13px;
  }

  .glance-value {
    font-size: 13px;
    line-height: 1.15;
    margin-top: 5px;
  }
}

@media (max-width: 380px) {
  .main-action-button {
    font-size: 17px;
    padding: 0 12px;
  }

  .secondary-action-grid {
    gap: 7px;
  }

  .secondary-action-button {
    flex: 0 1 122px;
    font-size: 12px;
    min-height: 38px;
    padding: 0 8px;
  }

  .secondary-action-button :deep(.q-icon) {
    font-size: 17px;
  }
  .glance-grid {
    gap: 6px;
  }

  .glance-stat :deep(.q-card__section) {
    padding: 9px 6px;
  }

  .glance-icon {
    font-size: 16px;
    height: 28px;
    width: 28px;
  }

  .glance-label {
    font-size: 10px;
  }

  .glance-number {
    font-size: 21px;
  }

  .glance-value {
    font-size: 10px;
  }
}
</style>
