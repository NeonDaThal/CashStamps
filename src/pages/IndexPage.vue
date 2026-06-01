<template>
  <q-page padding class="home-page">
    <div class="home-container">
      <section class="hero-card">
        <div class="brand-mark">BCH</div>

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

        <div class="action-grid">
          <q-btn
            class="primary-action"
            :label="t('home.sellVoucher')"
            icon="point_of_sale"
            to="/sell-voucher"
            unelevated
            no-caps
          />

          <q-btn
            class="secondary-action"
            label="Cash-out BCH"
            icon="currency_exchange"
            to="/cash-out"
            unelevated
            no-caps
          />

          <q-btn
            class="secondary-action"
            :label="t('home.voucherHistory')"
            icon="receipt_long"
            to="/voucher-history"
            unelevated
            no-caps
          />

          <q-btn
            class="secondary-action"
            :label="t('home.treasuryWallet')"
            icon="account_balance_wallet"
            to="/treasury-settings"
            unelevated
            no-caps
          />
        </div>
      </section>

      <section class="status-grid">
        <q-card flat bordered class="status-card">
          <q-card-section>
            <div class="status-icon">
              <q-icon name="qr_code_2" />
            </div>

            <div>
              <div class="status-title">
                {{ t('home.status.receipts.title') }}
              </div>
              <div class="status-text">
                {{ t('home.status.receipts.text') }}
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="status-card">
          <q-card-section>
            <div class="status-icon">
              <q-icon name="print" />
            </div>

            <div>
              <div class="status-title">
                {{ t('home.status.printer.title') }}
              </div>
              <div class="status-text">
                {{ t('home.status.printer.text') }}
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="status-card">
          <q-card-section>
            <div class="status-icon">
              <q-icon name="security" />
            </div>

            <div>
              <div class="status-title">
                {{ t('home.status.cashHandling.title') }}
              </div>
              <div class="status-text">
                {{ t('home.status.cashHandling.text') }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
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
.action-card {
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
  background: #00ce1b;
  border-radius: 22px;
  color: #000000;
  display: flex;
  font-size: 22px;
  font-weight: 900;
  height: 72px;
  justify-content: center;
  letter-spacing: -0.5px;
  width: 72px;
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

.action-card {
  padding: 22px;
}

.section-header {
  margin-bottom: 18px;
}

.section-header p {
  color: #666666;
  margin: 6px 0 0;
}

.action-grid {
  display: grid;
  gap: 12px;
}

.primary-action,
.secondary-action {
  border-radius: 18px;
  font-size: 17px;
  font-weight: 800;
  justify-content: flex-start;
  min-height: 62px;
  padding: 0 18px;
}

.primary-action {
  background: #00ce1b;
  color: #000000;
}

.secondary-action {
  background: #202020;
  color: #ffffff;
}

.status-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.status-card {
  background: #ffffff;
  border-color: #dddddd;
  border-radius: 20px;
}

.status-card :deep(.q-card__section) {
  display: flex;
  gap: 12px;
  height: 100%;
  padding: 16px;
}

.status-icon {
  align-items: center;
  background: #f0f0f0;
  border-radius: 14px;
  color: #00a816;
  display: flex;
  flex: 0 0 42px;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.status-title {
  color: #111111;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.2;
}

.status-text {
  color: #666666;
  font-size: 13px;
  line-height: 1.35;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .hero-card {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .brand-mark {
    height: 64px;
    width: 64px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
