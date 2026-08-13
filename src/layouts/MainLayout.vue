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
          class="toolbar-pill-button currency-button"
          :label="selectedCurrencyOption.code"
          aria-label="Currency"
        >
          <q-tooltip>Currency</q-tooltip>

          <q-menu auto-close>
            <q-list style="min-width: 178px">
              <q-item
                v-for="currencyOption in currencyOptions"
                :key="currencyOption.code"
                clickable
                :active="selectedCurrency === currencyOption.code"
                active-class="currency-option-active"
                @click="setCurrency(currencyOption.code)"
              >
                <q-item-section>
                  <q-item-label class="currency-option-main">
                    <span>{{ currencyOption.code }}</span>
                    <span class="currency-option-symbol">
                      {{ currencyOption.symbol }}
                    </span>
                  </q-item-label>
                  <q-item-label caption>
                    {{ currencyOption.name }}
                  </q-item-label>
                </q-item-section>

                <q-item-section
                  v-if="selectedCurrency === currencyOption.code"
                  side
                >
                  <q-icon name="check_circle" color="positive" size="18px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn
          flat
          dense
          rounded
          class="toolbar-pill-button locale-button"
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

              <q-item clickable @click="setLocale('sw')">
                <q-item-section>{{ t('language.swahili') }}</q-item-section>
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
              <q-icon class="drawer-custom-icon" :name="topupIcon" />
            </q-item-section>
            <q-item-section>
              {{ t('layout.items.sellVoucher') }}
            </q-item-section>
          </q-item>

          <q-item clickable to="/cash-out" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon class="drawer-custom-icon" :name="cashoutIcon" />
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

          <q-item clickable to="/app-settings" @click="closeDrawer">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>

            <q-item-section>
              {{ t('layout.items.appSettings') }}
            </q-item-section>
          </q-item>

          <q-item
            clickable
            class="update-check-item"
            :class="{ 'update-check-item--available': hasAvailableUpdate }"
            :disable="isCheckingForUpdates"
            @click="handleCheckForUpdates"
          >
            <q-item-section avatar>
              <q-icon :name="updateDrawerIcon" />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ updateDrawerLabel }}
              </q-item-label>
            </q-item-section>

            <q-item-section v-if="isCheckingForUpdates" side>
              <q-spinner size="18px" />
            </q-item-section>

            <q-item-section v-else-if="hasAvailableUpdate" side>
              <q-badge class="update-available-badge">
                {{ t('layout.update.newBadge') }}
              </q-badge>
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
              <q-icon name="menu_book" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ t('layout.items.howToCashOut') }}
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

    <q-dialog v-model="isUpdateDialogOpen">
      <q-card class="update-dialog-card">
        <q-card-section
          class="update-dialog-hero"
          :class="updateDialogToneClass"
        >
          <div class="update-dialog-icon">
            <q-icon :name="updateDialogIcon" />
          </div>

          <div class="update-dialog-copy">
            <div class="update-dialog-title">
              {{ updateDialogTitle }}
            </div>
            <div class="update-dialog-subtitle">
              {{ updateDialogMessage }}
            </div>
          </div>
        </q-card-section>

        <q-card-section class="update-dialog-body">
          <div class="update-version-grid">
            <div class="update-version-card">
              <div class="update-version-label">
                {{ t('layout.update.installedVersion') }}
              </div>
              <div class="update-version-value">
                {{ updateCheckResult?.installed.versionName ?? '—' }}
              </div>
              <div class="update-version-code">
                {{
                  t('layout.update.versionCode', {
                    code: updateCheckResult?.installed.versionCode ?? '—',
                  })
                }}
              </div>
            </div>

            <div class="update-version-card">
              <div class="update-version-label">
                {{ t('layout.update.latestVersion') }}
              </div>
              <div class="update-version-value">
                {{ updateCheckResult?.latest?.versionName ?? '—' }}
              </div>
              <div class="update-version-code">
                {{
                  t('layout.update.versionCode', {
                    code: updateCheckResult?.latest?.versionCode ?? '—',
                  })
                }}
              </div>
            </div>
          </div>

          <div
            v-if="latestReleaseNotes.length > 0"
            class="update-release-notes"
          >
            <div class="update-section-title">
              {{ t('layout.update.releaseNotes') }}
            </div>

            <ul>
              <li
                v-for="(releaseNote, releaseNoteIndex) in latestReleaseNotes"
                :key="`${releaseNoteIndex}-${releaseNote}`"
              >
                {{ releaseNote }}
              </li>
            </ul>
          </div>

          <div v-if="showUpdateSafetyNotice" class="update-safety-notice">
            <div class="update-section-title">
              {{ t('layout.update.safetyTitle') }}
            </div>
            <div>
              {{ t('layout.update.safetyMessage') }}
            </div>
          </div>

          <div v-if="showUpdateInstallationNotes" class="update-install-notes">
            <div class="update-section-title">
              {{ t('layout.update.installationTitle') }}
            </div>
            <ol>
              <li>{{ t('layout.update.installationStepOpen') }}</li>
              <li>{{ t('layout.update.installationStepAsset') }}</li>
              <li>{{ t('layout.update.installationStepWarning') }}</li>
              <li>{{ t('layout.update.installationStepConfirm') }}</li>
            </ol>
          </div>

          <div
            v-if="updateCheckResult?.latest?.apkSha256"
            class="update-hash-box"
          >
            <div class="update-section-title">
              {{ t('layout.update.verificationHash') }}
            </div>
            <code>{{ updateCheckResult.latest.apkSha256 }}</code>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="update-dialog-actions">
          <q-btn flat rounded :label="t('layout.update.close')" v-close-popup />

          <q-btn
            v-if="canOpenUpdateReleasePage"
            unelevated
            rounded
            class="update-primary-action"
            :label="t('layout.update.downloadUpdate')"
            @click="handleOpenUpdateReleasePage"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { openURL, useQuasar } from 'quasar';
import type { SupportedLocale } from '../i18n';
import { saveStoredLocale } from '../i18n/locale-storage';
import {
  checkForAppUpdate,
  readCachedAppUpdateResult,
  runAutomaticAppUpdateCheck,
  type AppUpdateCheckResult,
} from '../services/app-update';
import { preparePinLockExternalNavigation } from '../services/pin-lock-session';
import { cashoutIcon, topupIcon } from 'src/icons/custom-icons';

type SupportedCurrency = 'GBP' | 'USD' | 'EUR';

type CurrencyOption = {
  code: SupportedCurrency;
  name: string;
  symbol: string;
};

const currencyStorageKey = 'bch-voucher-display-currency';

const currencyOptions: CurrencyOption[] = [
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
  },
];

const defaultCurrency: SupportedCurrency = 'GBP';

const $router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });
const $q = useQuasar();

const isDrawerOpen = ref(false);
const isCheckingForUpdates = ref(false);
const isUpdateDialogOpen = ref(false);
const updateCheckResult = ref<AppUpdateCheckResult | null>(null);
const availableUpdateResult = ref<AppUpdateCheckResult | null>(
  readCachedAppUpdateResult()
);

function readStoredCurrency(): SupportedCurrency {
  if (typeof window === 'undefined') {
    return defaultCurrency;
  }

  const storedCurrency = window.localStorage.getItem(currencyStorageKey);

  const isSupportedCurrency = currencyOptions.some(
    (currencyOption) => currencyOption.code === storedCurrency
  );

  if (isSupportedCurrency) {
    return storedCurrency as SupportedCurrency;
  }

  return defaultCurrency;
}

const selectedCurrency = ref<SupportedCurrency>(readStoredCurrency());

const selectedCurrencyOption = computed((): CurrencyOption => {
  return (
    currencyOptions.find(
      (currencyOption) => currencyOption.code === selectedCurrency.value
    ) ?? currencyOptions[0]
  );
});

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

  if (localeValue === 'sw' || localeMain === 'sw') {
    return 'SW';
  }

  return 'EN';
});

const hasAvailableUpdate = computed((): boolean => {
  return availableUpdateResult.value?.status === 'update_available';
});

const updateDrawerLabel = computed((): string => {
  if (hasAvailableUpdate.value) {
    return t('layout.items.updateAvailable');
  }

  return t('layout.items.checkForUpdates');
});

const updateDrawerIcon = computed((): string => {
  if (hasAvailableUpdate.value) {
    return 'system_update_alt';
  }

  return 'system_update';
});

const updateDialogTitle = computed((): string => {
  const status = updateCheckResult.value?.status;

  if (status === 'update_available') {
    return t('layout.update.updateAvailableTitle');
  }

  if (status === 'installed_newer_than_public') {
    return t('layout.update.installedNewerTitle');
  }

  if (status === 'unsupported_platform' || status === 'package_mismatch') {
    return t('layout.update.unsupportedTitle');
  }

  if (status === 'check_failed') {
    return t('layout.update.failedTitle');
  }

  return t('layout.update.upToDateTitle');
});

const updateDialogMessage = computed((): string => {
  const status = updateCheckResult.value?.status;

  if (status === 'update_available') {
    return t('layout.update.updateAvailableMessage');
  }

  if (status === 'installed_newer_than_public') {
    return t('layout.update.installedNewerMessage');
  }

  if (status === 'unsupported_platform' || status === 'package_mismatch') {
    return t('layout.update.unsupportedMessage');
  }

  if (status === 'check_failed') {
    return t('layout.update.failedMessage');
  }

  return t('layout.update.upToDateMessage');
});

const updateDialogIcon = computed((): string => {
  const status = updateCheckResult.value?.status;

  if (status === 'update_available') {
    return 'system_update';
  }

  if (status === 'installed_newer_than_public') {
    return 'science';
  }

  if (status === 'check_failed') {
    return 'wifi_off';
  }

  if (status === 'unsupported_platform' || status === 'package_mismatch') {
    return 'info';
  }

  return 'check_circle';
});

const updateDialogToneClass = computed((): string => {
  const status = updateCheckResult.value?.status;

  if (status === 'update_available') {
    return 'update-dialog-available';
  }

  if (status === 'check_failed') {
    return 'update-dialog-error';
  }

  if (status === 'installed_newer_than_public') {
    return 'update-dialog-test';
  }

  return 'update-dialog-ok';
});

const latestReleaseNotes = computed((): string[] => {
  return updateCheckResult.value?.latest?.releaseNotes ?? [];
});

const canOpenUpdateReleasePage = computed((): boolean => {
  return (
    updateCheckResult.value?.status === 'update_available' &&
    Boolean(updateCheckResult.value.latest?.releasePageUrl)
  );
});

const showUpdateSafetyNotice = computed((): boolean => {
  return updateCheckResult.value?.status === 'update_available';
});

const showUpdateInstallationNotes = computed((): boolean => {
  return updateCheckResult.value?.status === 'update_available';
});

onMounted(() => {
  window.setTimeout(() => {
    void handleAutomaticUpdateCheck();
  }, 1200);
});

const setLocale = (newLocale: SupportedLocale) => {
  locale.value = newLocale;
  saveStoredLocale(newLocale);
};

const setCurrency = (newCurrency: SupportedCurrency) => {
  selectedCurrency.value = newCurrency;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(currencyStorageKey, newCurrency);
  }
};

function closeDrawer(): void {
  isDrawerOpen.value = false;
}

function syncAvailableUpdateResult(result: AppUpdateCheckResult): void {
  if (result.status === 'update_available') {
    availableUpdateResult.value = result;
    return;
  }

  if (result.status !== 'check_failed') {
    availableUpdateResult.value = null;
  }
}

async function handleAutomaticUpdateCheck(): Promise<void> {
  try {
    const automaticCheckResult = await runAutomaticAppUpdateCheck();

    if (automaticCheckResult) {
      syncAvailableUpdateResult(automaticCheckResult);
    }
  } catch (error) {
    console.warn('Automatic update check failed', error);
  }
}

async function handleCheckForUpdates(): Promise<void> {
  if (isCheckingForUpdates.value) {
    return;
  }

  closeDrawer();

  if (availableUpdateResult.value?.status === 'update_available') {
    updateCheckResult.value = availableUpdateResult.value;
    isUpdateDialogOpen.value = true;
    return;
  }

  isCheckingForUpdates.value = true;

  $q.loading.show({
    message: t('layout.update.checking'),
  });

  try {
    const manualCheckResult = await checkForAppUpdate();
    updateCheckResult.value = manualCheckResult;
    syncAvailableUpdateResult(manualCheckResult);
    isUpdateDialogOpen.value = true;
  } finally {
    isCheckingForUpdates.value = false;
    $q.loading.hide();
  }
}

function handleOpenUpdateReleasePage(): void {
  const releasePageUrl = updateCheckResult.value?.latest?.releasePageUrl;

  if (!releasePageUrl) {
    return;
  }

  try {
    preparePinLockExternalNavigation();
    openURL(releasePageUrl);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('layout.update.openFailed'),
    });
  }
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

.toolbar-pill-button {
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-weight: 900;
  min-width: 46px;
  overflow: hidden;
}

.currency-button {
  margin-right: 8px;
  min-width: 58px;
}

.locale-button {
  min-width: 46px;
}

.toolbar-pill-button :deep(.q-focus-helper),
.menu-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.currency-option-main {
  align-items: center;
  display: flex;
  font-weight: 900;
  gap: 8px;
}

.currency-option-symbol {
  align-items: center;
  background: rgba(0, 206, 27, 0.14);
  border-radius: 999px;
  color: #008f13;
  display: inline-flex;
  font-size: 12px;
  font-weight: 900;
  height: 22px;
  justify-content: center;
  min-width: 22px;
  padding: 0 7px;
}

.currency-option-active {
  background: rgba(0, 206, 27, 0.12);
  color: #111111;
  font-weight: 850;
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

.drawer-custom-icon {
  font-size: 28px;
  height: 28px;
  width: 28px;
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
  background: #00ce1b24;
  color: #111111;
  font-weight: 850;
}

.drawer-list :deep(.q-router-link--active .q-icon) {
  color: #00a816;
}

.placeholder-item {
  opacity: 0.62;
}

.update-check-item {
  border: 1px solid transparent;
}

.update-check-item :deep(.q-icon) {
  color: #00a816;
}

.update-check-item--available {
  background: #ffffff;
  border-color: #00ce1b;
  box-shadow: 0 6px 14px rgba(0, 206, 27, 0.12);
  color: #00a816;
  font-weight: 900;
}

.update-check-item--available :deep(.q-icon) {
  color: #00a816;
}

.update-check-item--available :deep(.q-item__label) {
  color: #00a816;
  font-weight: 950;
}

.update-available-badge {
  background: #00ce1b;
  border-radius: 999px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 950;
  padding: 4px 8px;
  text-transform: uppercase;
}

.update-dialog-card {
  border-radius: 26px;
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  max-width: 430px;
  overflow: hidden;
  width: calc(100vw - 32px);
}

.update-dialog-hero {
  align-items: center;
  color: #111111;
  display: flex;
  flex: 0 0 auto;
  gap: 14px;
  padding: 20px;
}

.update-dialog-ok {
  background: linear-gradient(135deg, #e9f8eb, #ffffff);
}

.update-dialog-available {
  background: linear-gradient(135deg, #00ce1b, #cfffda);
}

.update-dialog-error {
  background: linear-gradient(135deg, #fff1f1, #ffffff);
}

.update-dialog-test {
  background: linear-gradient(135deg, #eef3ff, #ffffff);
}

.update-dialog-icon {
  align-items: center;
  background: #111111;
  border-radius: 18px;
  color: #ffffff;
  display: flex;
  flex: 0 0 48px;
  font-size: 26px;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.update-dialog-copy {
  min-width: 0;
}

.update-dialog-title {
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.update-dialog-subtitle {
  color: #444444;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  margin-top: 5px;
}

.update-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px 4px;
}

.update-version-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.update-version-card {
  background: #f7f8f7;
  border: 1px solid #e2e2e2;
  border-radius: 18px;
  padding: 12px;
}

.update-version-label {
  color: #666666;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.update-version-value {
  color: #111111;
  font-size: 14px;
  font-weight: 950;
  margin-top: 5px;
  word-break: break-word;
}

.update-version-code {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  margin-top: 3px;
}

.update-release-notes,
.update-safety-notice,
.update-install-notes,
.update-hash-box {
  border-radius: 18px;
  margin-top: 12px;
  padding: 12px;
}

.update-release-notes {
  background: #f7f8f7;
  border: 1px solid #e2e2e2;
}

.update-release-notes ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.update-release-notes li {
  color: #333333;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 5px;
}

.update-safety-notice {
  background: rgba(0, 206, 27, 0.1);
  border: 1px solid rgba(0, 206, 27, 0.24);
  color: #222222;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.35;
}

.update-install-notes {
  background: #ffffff;
  border: 1px solid #e2e2e2;
  color: #333333;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.update-install-notes ol {
  margin: 8px 0 0;
  padding-left: 18px;
}

.update-install-notes li {
  margin-bottom: 5px;
}

.update-hash-box {
  background: #111111;
  color: #ffffff;
}

.update-hash-box code {
  display: block;
  font-size: 11px;
  line-height: 1.4;
  margin-top: 7px;
  white-space: normal;
  word-break: break-all;
}

.update-section-title {
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.update-dialog-actions {
  flex: 0 0 auto;
  padding: 12px 16px 18px;
}

.update-primary-action {
  background: #00ce1b;
  color: #ffffff;
  font-weight: 950;
  padding-left: 20px;
  padding-right: 20px;
}

@media (max-width: 430px) {
  .brand-title {
    font-size: 15px;
    max-width: 135px;
  }

  .brand-subtitle {
    display: none;
  }

  .brand-mark {
    flex-basis: 38px;
    height: 38px;
    width: 38px;
  }

  .update-version-grid {
    grid-template-columns: 1fr;
  }
}
</style>
