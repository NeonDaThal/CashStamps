<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="menu-button"
          :aria-label="t('layout.navigation.openMenu')"
          @click="isDrawerOpen = !isDrawerOpen"
        />

        <div class="brand-area cursor-pointer" @click="$router.push('/')">
          <div class="brand-mark">BCH</div>

          <div class="brand-copy">
            <div class="brand-title">{{ t('layout.brand.title') }}</div>
            <div class="brand-subtitle">{{ t('layout.brand.subtitle') }}</div>
          </div>
        </div>

        <q-space />

        <q-btn
          flat
          dense
          rounded
          class="locale-button"
          :label="localeShortLabel"
          :aria-label="t('language.label')"
        >
          <q-tooltip>{{ t('language.label') }}</q-tooltip>

          <q-menu auto-close>
            <q-list style="min-width: 160px">
              <q-item clickable @click="setLocale('en')">
                <q-item-section>{{ t('language.english') }}</q-item-section>
              </q-item>

              <q-item clickable @click="setLocale('es')">
                <q-item-section>{{ t('language.spanish') }}</q-item-section>
              </q-item>

              <q-item clickable @click="setLocale('de')">
                <q-item-section>{{ t('language.german') }}</q-item-section>
              </q-item>

              <q-item clickable @click="setLocale('pt')">
                <q-item-section>{{ t('language.portuguese') }}</q-item-section>
              </q-item>

              <q-item clickable @click="setLocale('zh-HK')">
                <q-item-section>{{ t('language.cantonese') }}</q-item-section>
              </q-item>

              <q-item clickable @click="setLocale('ne-NP')">
                <q-item-section>{{ t('language.nepali') }}</q-item-section>
              </q-item>

              <q-item clickable @click="setLocale('sv-SE')">
                <q-item-section>{{ t('language.swedish') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="isDrawerOpen"
      side="left"
      overlay
      behavior="mobile"
      bordered
      :width="320"
      class="app-drawer"
    >
      <div class="drawer-shell">
        <div class="drawer-top-row">
          <q-btn
            flat
            dense
            round
            icon="close"
            class="drawer-close-button"
            :aria-label="t('layout.navigation.closeMenu')"
            @click="closeDrawer"
          />
        </div>

        <div class="drawer-header">
          <div class="drawer-brand-mark">BCH</div>

          <div class="drawer-heading-copy">
            <div class="drawer-title">{{ t('layout.brand.title') }}</div>
            <div class="drawer-subtitle">
              {{ t('layout.drawer.subtitle') }}
            </div>
          </div>
        </div>

        <div class="drawer-status-row">
          <q-badge class="status-chip status-green">
            {{ t('layout.status.treasury') }}
          </q-badge>
          <q-badge class="status-chip status-grey">
            {{ t('layout.status.printerPending') }}
          </q-badge>
          <q-badge class="status-chip status-dark">
            {{ t('layout.status.devMode') }}
          </q-badge>
        </div>

        <q-separator class="q-my-md" />

        <q-list class="drawer-list">
          <q-item-label header>{{ t('layout.sections.main') }}</q-item-label>

          <q-item clickable exact to="/" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>{{ t('layout.items.home') }}</q-item-section>
          </q-item>

          <q-item clickable to="/sell-voucher" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="point_of_sale" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.sellVoucher') }}
            </q-item-section>
          </q-item>

          <q-item clickable to="/cash-out" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="currency_exchange" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.cashOut') }}
            </q-item-section>
          </q-item>

          <q-item clickable to="/voucher-history" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="receipt_long" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.voucherHistory') }}
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header>
            {{ t('layout.sections.merchantSetup') }}
          </q-item-label>

          <q-item clickable to="/treasury-settings" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="account_balance_wallet" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.treasuryWallet') }}
            </q-item-section>
          </q-item>

          <q-item clickable to="/merchant-reports" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="insert_chart" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.merchantReports') }}
            </q-item-section>
          </q-item>

          <q-item clickable to="/printer-settings" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="print" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.printerSetup') }}
            </q-item-section>
          </q-item>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.items.appSettings') }}</q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header>{{ t('layout.sections.help') }}</q-item-label>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="school" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ t('layout.items.howToSellVoucher') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="qr_code_scanner" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ t('layout.items.howCustomersRedeem') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="help_outline" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.items.faq') }}</q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="support_agent" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.items.support') }}</q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.items.communities') }}</q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="share" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.items.socialMedia') }}</q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header>
            {{ t('layout.sections.advanced') }}
          </q-item-label>

          <q-item disable class="placeholder-item">
            <q-item-section avatar>
              <q-icon name="developer_mode" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ t('layout.items.developerTools') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('layout.common.comingSoon') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition appear enter-active-class="animated fadeIn">
          <Suspense @pending="$q.loading.show()" @resolve="$q.loading.hide()">
            <component :is="Component" />
          </Suspense>
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { SupportedLocale } from '../i18n';
import { saveStoredLocale } from '../i18n/locale-storage';

const $router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });
const $q = useQuasar();

const isDrawerOpen = ref(false);

const localeShortLabel = computed((): string => {
  const localeValue = locale.value;
  const localeMain = localeValue.substring(0, 2);

  if (localeMain === 'es') {
    return 'ES';
  }

  if (localeMain === 'de') {
    return 'DE';
  }

  if (localeMain === 'pt') {
    return 'PT';
  }

  if (localeValue === 'zh-HK' || localeMain === 'zh') {
    return 'HK';
  }

  if (localeValue === 'ne-NP' || localeMain === 'ne') {
    return 'NP';
  }

  if (localeValue === 'sv-SE' || localeMain === 'sv') {
    return 'SE';
  }

  return 'EN';
});

const setLocale = (newLocale: SupportedLocale) => {
  locale.value = newLocale;
  saveStoredLocale(newLocale);
};

function closeDrawer(): void {
  isDrawerOpen.value = false;
}
</script>

<style lang="scss" scoped>
.app-header {
  background: #111111;
  color: #ffffff;
}

.app-toolbar {
  min-height: 62px;
  padding-left: 10px;
  padding-right: 10px;
}

.menu-button {
  color: #ffffff;
  margin-right: 8px;
}

.brand-area {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.brand-mark,
.drawer-brand-mark {
  align-items: center;
  background: #00ce1b;
  color: #000000;
  display: flex;
  font-weight: 900;
  justify-content: center;
  letter-spacing: -0.4px;
}

.brand-mark {
  border-radius: 12px;
  flex: 0 0 42px;
  font-size: 15px;
  height: 42px;
  width: 42px;
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.3px;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-subtitle {
  color: #bdbdbd;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.locale-button {
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-weight: 900;
  min-width: 46px;
  overflow: hidden;
}

.locale-button :deep(.q-focus-helper),
.menu-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.app-drawer {
  background: #f7f8f7;
  color: #111111;
}

.drawer-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 18px;
}

.drawer-header {
  align-items: center;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 12px;
  padding: 16px;
}

.drawer-top-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.drawer-heading-copy {
  flex: 1;
  min-width: 0;
}

.drawer-close-button {
  color: #111111;
  margin-left: auto;
  overflow: hidden;
}

.drawer-close-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.drawer-brand-mark {
  border-radius: 16px;
  flex: 0 0 58px;
  font-size: 20px;
  height: 58px;
  width: 58px;
}

.drawer-title {
  color: #111111;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.4px;
  line-height: 1.1;
}

.drawer-subtitle {
  color: #666666;
  font-size: 13px;
  font-weight: 700;
  margin-top: 4px;
}

.drawer-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.status-chip {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 850;
  padding: 6px 9px;
}

.status-green {
  background: #00ce1b;
  color: #000000;
}

.status-grey {
  background: #eeeeee;
  color: #333333;
}

.status-dark {
  background: #111111;
  color: #ffffff;
}

.drawer-list {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  overflow: hidden;
}

.drawer-list :deep(.q-item) {
  border-radius: 14px;
  margin: 4px 8px;
  min-height: 48px;
}

.drawer-list :deep(.q-item__label--header) {
  color: #555555;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 16px 16px 8px;
  text-transform: uppercase;
}

.drawer-list :deep(.q-focus-helper) {
  border-radius: inherit;
}

.drawer-list :deep(.q-router-link--active) {
  background: rgba(0, 206, 27, 0.14);
  color: #111111;
  font-weight: 850;
}

.drawer-list :deep(.q-router-link--active .q-icon) {
  color: #00a816;
}

.placeholder-item {
  opacity: 0.62;
}

@media (max-width: 430px) {
  .brand-title {
    font-size: 15px;
    max-width: 180px;
  }

  .brand-subtitle {
    display: none;
  }

  .brand-mark {
    flex-basis: 38px;
    height: 38px;
    width: 38px;
  }
}
</style>
