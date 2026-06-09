<template>
  <q-page padding class="merchant-reports-page">
    <div class="merchant-reports-container">
      <section class="reports-hero">
        <div>
          <p class="eyebrow">{{ t('merchantReportsPage.hero.eyebrow') }}</p>
          <h1>{{ t('merchantReportsPage.hero.title') }}</h1>
          <p class="intro">
            {{ t('merchantReportsPage.hero.intro') }}
          </p>
        </div>

        <div class="hero-actions">
          <q-btn
            class="secondary-button"
            :label="t('merchantReportsPage.actions.viewHistory')"
            icon="receipt_long"
            to="/voucher-history"
            outline
            no-caps
          />

          <q-btn
            class="primary-button"
            :label="t('merchantReportsPage.actions.sellVoucher')"
            icon="point_of_sale"
            to="/sell-voucher"
            unelevated
            no-caps
          />
        </div>
      </section>

      <q-card flat bordered class="main-card range-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="date_range" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.range.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.range.subtitle') }}
              </p>
            </div>
          </div>

          <div class="range-toggle-wrap q-mt-md">
            <q-btn-toggle
              v-model="selectedRange"
              :options="rangeOptions"
              class="range-toggle"
              toggle-color="green-6"
              color="white"
              text-color="black"
              unelevated
              no-caps
            />
          </div>
        </q-card-section>
      </q-card>

      <section class="summary-grid">
        <q-card
          v-for="card in summaryCards"
          :key="card.key"
          flat
          bordered
          class="summary-card"
        >
          <q-card-section>
            <div class="summary-top-row">
              <div class="summary-icon">
                <q-icon :name="card.icon" />
              </div>
              <q-badge class="summary-status-badge">
                {{ t('merchantReportsPage.summary.comingSoon') }}
              </q-badge>
            </div>

            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value">—</div>
            <p class="summary-caption">
              {{ card.caption }}
            </p>
          </q-card-section>
        </q-card>
      </section>

      <q-card flat bordered class="main-card target-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="emoji_events" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.targets.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.targets.subtitle') }}
              </p>
            </div>
          </div>

          <div class="target-preview q-mt-md">
            <div class="target-preview-copy">
              <div class="target-label">
                {{ t('merchantReportsPage.targets.progressLabel') }}
              </div>
              <div class="target-value">0%</div>
            </div>

            <q-linear-progress
              :value="0"
              rounded
              size="12px"
              class="target-progress"
            />

            <p class="target-empty-state">
              {{ t('merchantReportsPage.targets.emptyState') }}
            </p>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="bar_chart" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.breakdowns.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.breakdowns.subtitle') }}
              </p>
            </div>
          </div>

          <div class="breakdown-grid q-mt-md">
            <div class="breakdown-tile highlight">
              <div class="breakdown-title">
                {{ t('merchantReportsPage.breakdowns.currencyTitle') }}
              </div>
              <p>{{ t('merchantReportsPage.breakdowns.currencyText') }}</p>
            </div>

            <div class="breakdown-tile">
              <div class="breakdown-title">
                {{ t('merchantReportsPage.breakdowns.flowTitle') }}
              </div>
              <p>{{ t('merchantReportsPage.breakdowns.flowText') }}</p>
            </div>

            <div class="breakdown-tile">
              <div class="breakdown-title">
                {{ t('merchantReportsPage.breakdowns.statusTitle') }}
              </div>
              <p>{{ t('merchantReportsPage.breakdowns.statusText') }}</p>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="main-card">
        <q-card-section>
          <div class="section-heading">
            <div class="section-icon">
              <q-icon name="ios_share" />
            </div>

            <div>
              <div class="text-h6">
                {{ t('merchantReportsPage.reportActions.title') }}
              </div>
              <p class="text-grey-7 q-mb-none">
                {{ t('merchantReportsPage.reportActions.subtitle') }}
              </p>
            </div>
          </div>

          <div class="report-action-grid q-mt-md">
            <q-btn
              v-for="action in reportActions"
              :key="action.key"
              class="report-action-button"
              :label="action.label"
              :icon="action.icon"
              disable
              outline
              no-caps
            >
              <q-tooltip>
                {{ t('merchantReportsPage.reportActions.comingSoon') }}
              </q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>

      <q-banner class="bg-grey-2 text-grey-9" rounded>
        <template #avatar>
          <q-icon name="privacy_tip" />
        </template>

        <strong>{{ t('merchantReportsPage.localFirst.title') }}</strong>
        {{ t('merchantReportsPage.localFirst.message') }}
      </q-banner>

      <q-banner class="bg-green-1 text-green-10" rounded>
        <template #avatar>
          <q-icon name="construction" />
        </template>

        {{ t('merchantReportsPage.nextStepNotice') }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type ReportRange = 'today' | 'week' | 'month' | 'year' | 'allTime';

interface SummaryCard {
  key: string;
  icon: string;
  label: string;
  caption: string;
}

interface ReportAction {
  key: string;
  icon: string;
  label: string;
}

const { t } = useI18n({ useScope: 'global' });

const selectedRange = ref<ReportRange>('today');

const rangeOptions = computed(() => [
  {
    label: t('merchantReportsPage.ranges.today'),
    value: 'today',
  },
  {
    label: t('merchantReportsPage.ranges.week'),
    value: 'week',
  },
  {
    label: t('merchantReportsPage.ranges.month'),
    value: 'month',
  },
  {
    label: t('merchantReportsPage.ranges.year'),
    value: 'year',
  },
  {
    label: t('merchantReportsPage.ranges.allTime'),
    value: 'allTime',
  },
]);

const summaryCards = computed<SummaryCard[]>(() => [
  {
    key: 'total-vouchers',
    icon: 'confirmation_number',
    label: t('merchantReportsPage.summary.totalVouchers'),
    caption: t('merchantReportsPage.summary.totalVouchersCaption'),
  },
  {
    key: 'gross-fiat',
    icon: 'payments',
    label: t('merchantReportsPage.summary.grossFiat'),
    caption: t('merchantReportsPage.summary.grossFiatCaption'),
  },
  {
    key: 'net-fiat',
    icon: 'savings',
    label: t('merchantReportsPage.summary.netFiat'),
    caption: t('merchantReportsPage.summary.netFiatCaption'),
  },
  {
    key: 'bch-loaded',
    icon: 'currency_bitcoin',
    label: t('merchantReportsPage.summary.bchLoaded'),
    caption: t('merchantReportsPage.summary.bchLoadedCaption'),
  },
  {
    key: 'cash-outs',
    icon: 'currency_exchange',
    label: t('merchantReportsPage.summary.cashOutVolume'),
    caption: t('merchantReportsPage.summary.cashOutVolumeCaption'),
  },
  {
    key: 'growth',
    icon: 'trending_up',
    label: t('merchantReportsPage.summary.growth'),
    caption: t('merchantReportsPage.summary.growthCaption'),
  },
]);

const reportActions = computed<ReportAction[]>(() => [
  {
    key: 'print',
    icon: 'print',
    label: t('merchantReportsPage.actions.printReport'),
  },
  {
    key: 'pdf',
    icon: 'picture_as_pdf',
    label: t('merchantReportsPage.actions.exportPdf'),
  },
  {
    key: 'image',
    icon: 'image',
    label: t('merchantReportsPage.actions.saveImage'),
  },
  {
    key: 'share',
    icon: 'share',
    label: t('merchantReportsPage.actions.shareReport'),
  },
]);
</script>

<style lang="scss" scoped>
.merchant-reports-page {
  min-height: 100%;
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.14),
      transparent 32%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
}

.merchant-reports-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 960px;
  width: 100%;
}

.reports-hero,
.main-card,
.summary-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.reports-hero {
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
  max-width: 620px;
}

.hero-actions {
  align-items: stretch;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
}

.section-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.section-icon {
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

.primary-button,
.secondary-button,
.report-action-button {
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

.secondary-button,
.report-action-button {
  border-color: #222222;
  color: #111111;
}

.range-card :deep(.q-card__section) {
  padding: 18px;
}

.range-toggle-wrap {
  overflow-x: auto;
  padding-bottom: 2px;
}

.range-toggle {
  border: 1px solid #dddddd;
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;
}

.range-toggle :deep(.q-btn) {
  font-weight: 850;
  min-height: 42px;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.summary-card :deep(.q-card__section) {
  padding: 18px;
}

.summary-top-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.summary-icon {
  align-items: center;
  background: rgba(0, 206, 27, 0.14);
  border-radius: 14px;
  color: #00a816;
  display: flex;
  font-size: 24px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.summary-status-badge {
  background: #eeeeee;
  border-radius: 999px;
  color: #444444;
  font-size: 11px;
  font-weight: 850;
  padding: 5px 8px;
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
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}

.summary-caption {
  color: #666666;
  font-size: 13px;
  line-height: 1.35;
  margin: 10px 0 0;
}

.target-preview {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 16px;
}

.target-preview-copy {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.target-label {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.target-value {
  color: #111111;
  font-size: 18px;
  font-weight: 900;
}

.target-progress {
  color: #00ce1b;
}

.target-empty-state {
  color: #555555;
  line-height: 1.45;
  margin: 12px 0 0;
}

.breakdown-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.breakdown-tile {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 18px;
  padding: 16px;
}

.breakdown-tile.highlight {
  border-color: rgba(0, 206, 27, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.12);
}

.breakdown-title {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
  margin-bottom: 8px;
}

.breakdown-tile p {
  color: #555555;
  line-height: 1.45;
  margin: 0;
}

.report-action-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, 1fr);
}

.main-card {
  overflow: hidden;
}

.main-card :deep(.q-card__section) {
  padding: 18px;
}

.primary-button :deep(.q-focus-helper),
.secondary-button :deep(.q-focus-helper),
.report-action-button :deep(.q-focus-helper),
.main-card :deep(.q-focus-helper) {
  border-radius: inherit;
}

@media (max-width: 800px) {
  .reports-hero {
    flex-direction: column;
    padding: 22px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions .q-btn {
    width: 100%;
  }

  .summary-grid,
  .breakdown-grid {
    grid-template-columns: 1fr;
  }

  .report-action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 460px) {
  .report-action-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
  }
}
</style>
