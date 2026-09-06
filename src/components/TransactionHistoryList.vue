<template>
  <div class="transaction-history-list">
    <div v-if="rows.length === 0" class="transactions-empty">
      <div class="transactions-empty-icon">
        <q-icon name="receipt_long" />
      </div>

      <div class="transactions-empty-title">
        {{ t('historyPage.transactions.emptyTitle') }}
      </div>

      <p>{{ t('historyPage.transactions.emptySubtitle') }}</p>
    </div>

    <template v-else>
      <div class="transactions-list-meta">
        {{
          t('historyPage.transactions.showing', {
            count: visibleRows.length,
            total: rows.length,
          })
        }}
      </div>

      <div class="transactions-list">
        <button
          v-for="row in visibleRows"
          :key="row.id"
          type="button"
          class="transaction-row"
          :aria-label="row.accessibleLabel"
          @click="emit('select', row)"
        >
          <div class="transaction-row-main">
            <div class="transaction-row-top">
              <span
                :class="[
                  'transaction-type-pill',
                  `transaction-type-pill--${row.typeStyle}`,
                ]"
              >
                {{ row.typeLabel }}
              </span>

              <span class="transaction-date">
                {{ row.dateDisplay }}
              </span>
            </div>

            <div class="transaction-reference-line">
              <span class="transaction-reference-label">
                {{ t('historyPage.transactions.reference') }}
              </span>

              <span class="transaction-reference-value">
                {{ row.shortReference }}
                <q-tooltip>{{ row.reference }}</q-tooltip>
              </span>
            </div>
          </div>

          <div class="transaction-row-values">
            <strong class="transaction-fiat">
              {{ row.fiatDisplay }}
            </strong>

            <span class="transaction-bch">
              <img :src="bchLogoUrl" alt="" class="transaction-bch-logo" />
              {{ row.bchDisplay }}
            </span>

            <span
              :class="[
                'transaction-status-pill',
                `transaction-status-pill--${row.statusStyle}`,
              ]"
            >
              {{ row.statusLabel }}
            </span>
          </div>

          <q-icon name="chevron_right" class="transaction-row-chevron" />
        </button>
      </div>

      <div v-if="canShowMore" class="transactions-pagination-actions">
        <q-btn
          flat
          dense
          class="transactions-soft-button"
          icon="expand_more"
          :label="t('historyPage.transactions.showMore')"
          no-caps
          @click="showMore"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import bchLogoUrl from 'src/assets/bch-logo.png';
import type { TransactionHistoryRow } from 'src/types/transaction-history';

const VISIBLE_INCREMENT = 10;

const props = defineProps<{
  rows: TransactionHistoryRow[];
}>();

const emit = defineEmits<{
  select: [row: TransactionHistoryRow];
}>();

const { t } = useI18n({ useScope: 'global' });

const visibleLimit = ref(VISIBLE_INCREMENT);

const visibleRows = computed(() => props.rows.slice(0, visibleLimit.value));

const canShowMore = computed(() => visibleLimit.value < props.rows.length);

watch(
  () => props.rows,
  () => {
    visibleLimit.value = VISIBLE_INCREMENT;
  }
);

function showMore(): void {
  visibleLimit.value = Math.min(
    visibleLimit.value + VISIBLE_INCREMENT,
    props.rows.length
  );
}
</script>

<style lang="scss" scoped>
.transaction-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transactions-empty {
  align-items: center;
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 22px;
  display: grid;
  justify-items: center;
  padding: 30px 18px;
  text-align: center;
}

.transactions-empty-icon {
  align-items: center;
  background: #111111;
  border-radius: 999px;
  color: #00ce1b;
  display: flex;
  font-size: 34px;
  height: 62px;
  justify-content: center;
  margin-bottom: 12px;
  width: 62px;
}

.transactions-empty-title {
  color: #111111;
  font-size: 18px;
  font-weight: 950;
}

.transactions-empty p {
  color: #666666;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  margin: 5px 0 0;
}

.transactions-list-meta {
  color: #666666;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.transactions-list {
  display: grid;
  gap: 10px;
}

.transaction-row {
  align-items: center;
  appearance: none;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 18px;
  color: inherit;
  cursor: pointer;
  display: grid;
  font-family: inherit;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  padding: 13px 12px 13px 14px;
  text-align: left;
  transition: border-color 160ms ease, box-shadow 160ms ease,
    transform 160ms ease;
  width: 100%;
}

.transaction-row:hover {
  border-color: rgba(0, 206, 27, 0.45);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.transaction-row:focus-visible {
  border-color: #00ce1b;
  box-shadow: 0 0 0 3px rgba(0, 206, 27, 0.18);
  outline: none;
}

.transaction-row-main {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.transaction-row-top {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.transaction-date {
  color: #666666;
  font-size: 12px;
  font-weight: 750;
}

.transaction-reference-line {
  align-items: center;
  display: flex;
  gap: 7px;
  min-width: 0;
}

.transaction-reference-label {
  color: #777777;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.transaction-reference-value {
  color: #111111;
  font-size: 14px;
  font-weight: 950;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-row-values {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.transaction-fiat {
  color: #111111;
  font-size: 16px;
  font-weight: 950;
  line-height: 1.1;
  white-space: nowrap;
}

.transaction-bch {
  align-items: center;
  color: #666666;
  display: inline-flex;
  font-size: 11px;
  font-weight: 850;
  gap: 5px;
  line-height: 1.2;
  white-space: nowrap;
}

.transaction-bch-logo {
  border-radius: 999px;
  display: block;
  height: 14px;
  width: 14px;
}

.transaction-row-chevron {
  color: #9a9a9a;
  font-size: 22px;
}

.transaction-type-pill,
.transaction-status-pill {
  border-radius: 999px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  padding: 5px 8px;
  white-space: nowrap;
}

.transaction-type-pill--topup {
  background: #00ce1b;
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #000000;
}

.transaction-type-pill--cashout {
  background: #111111;
  border: 1px solid #111111;
  color: #00ce1b;
}

.transaction-status-pill--redeemed,
.transaction-status-pill--completed,
.transaction-status-pill--received {
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.35);
  color: #0c5f17;
}

.transaction-status-pill--not-redeemed,
.transaction-status-pill--awaiting-payment,
.transaction-status-pill--neutral {
  background: #f0f0f0;
  border: 1px solid #dddddd;
  color: #555555;
}

.transaction-status-pill--cancelled {
  background: #fff8eb;
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #8a4b00;
}

.transaction-status-pill--failed,
.transaction-status-pill--error {
  background: #fff0f0;
  border: 1px solid rgba(217, 48, 37, 0.25);
  color: #9f1c14;
}

.transactions-pagination-actions {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.transactions-soft-button {
  background: #f7f8f7;
  border: 1px solid #dddddd;
  border-radius: 999px;
  color: #111111;
  font-size: 12px;
  font-weight: 850;
  min-height: 34px;
  padding: 0 12px;
}

.transactions-soft-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

@media (max-width: 640px) {
  .transaction-row {
    align-items: center;
    gap: 9px;
    grid-template-columns: minmax(0, 1fr) max-content;
    padding: 12px;
  }

  .transaction-row-main {
    gap: 7px;
  }

  .transaction-reference-line {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .transaction-reference-value {
    max-width: 100%;
  }

  .transaction-row-values {
    min-width: max-content;
  }

  .transaction-row-chevron {
    display: none;
  }

  .transaction-fiat {
    font-size: 15px;
  }
}
</style>
