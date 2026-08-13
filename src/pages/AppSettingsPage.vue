<template>
  <q-page padding class="app-settings-page">
    <div class="settings-container">
      <!-- Main App Settings view -->
      <template v-if="activeView === 'main'">
        <section class="settings-hero">
          <div class="settings-hero-icon">
            <q-icon name="settings" />
          </div>

          <div class="settings-hero-copy">
            <div class="settings-eyebrow">
              {{ t('appSettings.hero.eyebrow') }}
            </div>

            <h1>{{ t('appSettings.hero.title') }}</h1>

            <p>
              {{ t('appSettings.hero.intro') }}
            </p>
          </div>
        </section>

        <section
          v-for="group in settingsGroups"
          :key="group.id"
          class="settings-group"
        >
          <div class="settings-group-title">
            {{ t(group.titleKey) }}
          </div>

          <q-card flat bordered class="settings-group-card">
            <q-list separator>
              <q-item
                v-for="item in group.items"
                :key="item.id"
                clickable
                class="settings-item"
                @click="openSettingsItem(item)"
              >
                <q-item-section avatar>
                  <div class="settings-item-icon">
                    <q-icon :name="item.icon" />
                  </div>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="settings-item-title">
                    {{ t(item.titleKey) }}
                  </q-item-label>

                  <q-item-label caption class="settings-item-subtitle">
                    {{ getSettingsItemSubtitle(item) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="chevron_right" class="settings-item-chevron" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </section>
        <footer class="settings-version-footer">
          <div class="settings-version-brand">
            {{ t('appSettings.version.appName') }}
          </div>

          <div class="settings-version-number">
            {{ appVersionDisplay }}
          </div>
        </footer>
      </template>

      <!-- Your Business -->
      <template v-else-if="activeView === 'your-business'">
        <section class="settings-detail-header">
          <q-btn
            flat
            dense
            round
            icon="arrow_back"
            class="settings-back-button"
            :aria-label="t('appSettings.navigation.backToSettings')"
            @click="returnToMainSettings"
          />

          <div class="settings-detail-heading">
            <div class="settings-eyebrow">
              {{ t('appSettings.business.eyebrow') }}
            </div>

            <h1>{{ t('appSettings.business.title') }}</h1>

            <p>
              {{ t('appSettings.business.subtitle') }}
            </p>
          </div>
        </section>

        <q-card flat bordered class="settings-detail-card">
          <q-card-section class="settings-detail-card-section">
            <div class="business-card-heading">
              <div class="business-card-icon">
                <q-icon name="storefront" />
              </div>

              <div>
                <div class="business-card-title">
                  {{ t('appSettings.business.cardTitle') }}
                </div>

                <p class="business-card-copy">
                  {{ t('appSettings.business.cardSubtitle') }}
                </p>
              </div>
            </div>

            <q-input
              v-model="businessNameInput"
              outlined
              clearable
              maxlength="100"
              :label="t('appSettings.business.nameLabel')"
              :hint="t('appSettings.business.nameHint')"
              class="business-name-input"
              @clear="handleClearBusinessNameInput"
              @keyup.enter="saveBusinessName"
            />

            <div class="business-save-row">
              <q-btn
                unelevated
                no-caps
                icon="save"
                class="business-save-button"
                :label="t('appSettings.business.save')"
                :disable="!hasBusinessNameChanges"
                @click="saveBusinessName"
              />
            </div>
          </q-card-section>
        </q-card>
      </template>

      <!-- Generic future section -->
      <template v-else>
        <section class="settings-detail-header">
          <q-btn
            flat
            dense
            round
            icon="arrow_back"
            class="settings-back-button"
            :aria-label="t('appSettings.navigation.backToSettings')"
            @click="returnToMainSettings"
          />

          <div class="settings-detail-heading">
            <div class="settings-eyebrow">
              {{ t('appSettings.comingSoon.eyebrow') }}
            </div>

            <h1>{{ selectedSettingsTitle }}</h1>

            <p>
              {{ selectedSettingsSubtitle }}
            </p>
          </div>
        </section>

        <q-card flat bordered class="coming-soon-card">
          <q-card-section class="coming-soon-content">
            <div class="coming-soon-icon">
              <q-icon :name="selectedSettingsItem?.icon || 'settings'" />
            </div>

            <div class="coming-soon-title">
              {{ t('appSettings.comingSoon.title') }}
            </div>

            <p>
              {{
                t('appSettings.comingSoon.message', {
                  section: selectedSettingsTitle,
                })
              }}
            </p>
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import {
  getAppSettings,
  updateAppSettings,
  type AppSettings,
} from 'src/services/app-settings';

import {
  getInstalledAppVersion,
  type InstalledAppVersion,
} from 'src/services/app-update';

type SettingsView = 'main' | 'your-business' | 'coming-soon';

type SettingsItemDefinition = {
  id: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
};

type SettingsGroupDefinition = {
  id: string;
  titleKey: string;
  items: SettingsItemDefinition[];
};

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

const settingsGroups: SettingsGroupDefinition[] = [
  {
    id: 'business',
    titleKey: 'appSettings.sections.business',
    items: [
      {
        id: 'your-business',
        icon: 'storefront',
        titleKey: 'appSettings.items.yourBusiness.title',
        subtitleKey: 'appSettings.items.yourBusiness.subtitle',
      },
      {
        id: 'your-wallets',
        icon: 'account_balance_wallet',
        titleKey: 'appSettings.items.yourWallets.title',
        subtitleKey: 'appSettings.items.yourWallets.subtitle',
      },
    ],
  },
  {
    id: 'app-security',
    titleKey: 'appSettings.sections.appSecurity',
    items: [
      {
        id: 'privacy-security',
        icon: 'shield',
        titleKey: 'appSettings.items.privacySecurity.title',
        subtitleKey: 'appSettings.items.privacySecurity.subtitle',
      },
      {
        id: 'preferences',
        icon: 'tune',
        titleKey: 'appSettings.items.preferences.title',
        subtitleKey: 'appSettings.items.preferences.subtitle',
      },
      {
        id: 'backup-storage',
        icon: 'backup',
        titleKey: 'appSettings.items.backupStorage.title',
        subtitleKey: 'appSettings.items.backupStorage.subtitle',
      },
    ],
  },
  {
    id: 'hardware',
    titleKey: 'appSettings.sections.hardware',
    items: [
      {
        id: 'printer-settings',
        icon: 'print',
        titleKey: 'appSettings.items.printerSettings.title',
        subtitleKey: 'appSettings.items.printerSettings.subtitle',
      },
      {
        id: 'devices',
        icon: 'devices',
        titleKey: 'appSettings.items.devices.title',
        subtitleKey: 'appSettings.items.devices.subtitle',
      },
    ],
  },
  {
    id: 'regional',
    titleKey: 'appSettings.sections.regional',
    items: [
      {
        id: 'language',
        icon: 'language',
        titleKey: 'appSettings.items.language.title',
        subtitleKey: 'appSettings.items.language.subtitle',
      },
      {
        id: 'currencies',
        icon: 'payments',
        titleKey: 'appSettings.items.currencies.title',
        subtitleKey: 'appSettings.items.currencies.subtitle',
      },
    ],
  },
  {
    id: 'tools-information',
    titleKey: 'appSettings.sections.toolsInformation',
    items: [
      {
        id: 'transaction-checker',
        icon: 'manage_search',
        titleKey: 'appSettings.items.transactionChecker.title',
        subtitleKey: 'appSettings.items.transactionChecker.subtitle',
      },
      {
        id: 'app-info',
        icon: 'info',
        titleKey: 'appSettings.items.appInfo.title',
        subtitleKey: 'appSettings.items.appInfo.subtitle',
      },
    ],
  },
  {
    id: 'help',
    titleKey: 'appSettings.sections.help',
    items: [
      {
        id: 'contact-us',
        icon: 'support_agent',
        titleKey: 'appSettings.items.contactUs.title',
        subtitleKey: 'appSettings.items.contactUs.subtitle',
      },
      {
        id: 'faq',
        icon: 'help_outline',
        titleKey: 'appSettings.items.faq.title',
        subtitleKey: 'appSettings.items.faq.subtitle',
      },
      {
        id: 'privacy-policy',
        icon: 'policy',
        titleKey: 'appSettings.items.privacyPolicy.title',
        subtitleKey: 'appSettings.items.privacyPolicy.subtitle',
      },
    ],
  },
];

const activeView = ref<SettingsView>('main');
const selectedSettingsItem = ref<SettingsItemDefinition | null>(null);

const appSettings = ref<AppSettings>(getAppSettings());
const businessNameInput = ref(appSettings.value.businessName);

const installedAppVersion = ref<InstalledAppVersion | null>(null);

const normalizedBusinessNameInput = computed(() =>
  (businessNameInput.value ?? '').trim()
);

const hasBusinessNameChanges = computed(
  () => normalizedBusinessNameInput.value !== appSettings.value.businessName
);

const selectedSettingsTitle = computed(() => {
  if (!selectedSettingsItem.value) {
    return '';
  }

  return t(selectedSettingsItem.value.titleKey);
});

const selectedSettingsSubtitle = computed(() => {
  if (!selectedSettingsItem.value) {
    return '';
  }

  return t(selectedSettingsItem.value.subtitleKey);
});

const appVersionDisplay = computed(() => {
  const installed = installedAppVersion.value;

  if (!installed) {
    return t('appSettings.version.loading');
  }

  if (installed.packageName === 'web-preview') {
    return t('appSettings.version.webPreview');
  }

  if (!installed.versionName || installed.versionName === 'unknown') {
    return t('appSettings.version.unavailable');
  }

  return t('appSettings.version.versionAndBuild', {
    version: installed.versionName,
    build: installed.versionCode,
  });
});

async function loadInstalledAppVersion(): Promise<void> {
  installedAppVersion.value = await getInstalledAppVersion();
}

function getSettingsItemSubtitle(item: SettingsItemDefinition): string {
  if (item.id === 'your-business' && appSettings.value.businessName) {
    return appSettings.value.businessName;
  }

  return t(item.subtitleKey);
}

function openSettingsItem(item: SettingsItemDefinition): void {
  selectedSettingsItem.value = item;

  if (item.id === 'your-business') {
    businessNameInput.value = appSettings.value.businessName;
    activeView.value = 'your-business';
    return;
  }

  activeView.value = 'coming-soon';
}

function returnToMainSettings(): void {
  businessNameInput.value = appSettings.value.businessName;
  selectedSettingsItem.value = null;
  activeView.value = 'main';
}

function saveBusinessName(): void {
  if (!hasBusinessNameChanges.value) {
    return;
  }

  try {
    const savedSettings = updateAppSettings({
      businessName: normalizedBusinessNameInput.value,
    });

    appSettings.value = savedSettings;
    businessNameInput.value = savedSettings.businessName;

    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: t('appSettings.business.saved'),
      group: false,
      timeout: 1200,
      position: 'top',
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      icon: 'error',
      message: t('appSettings.business.saveFailed'),
      group: false,
      timeout: 2500,
      position: 'top',
    });
  }
}

function handleClearBusinessNameInput(): void {
  businessNameInput.value = '';
}

onMounted(() => {
  void loadInstalledAppVersion();
});
</script>

<style lang="scss" scoped>
.app-settings-page {
  background: radial-gradient(
      circle at top left,
      rgba(0, 206, 27, 0.11),
      transparent 30%
    ),
    linear-gradient(180deg, #f7f8f7 0%, #eeeeee 100%);
  color: #111111;
  min-height: 100%;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
  max-width: 760px;
  padding-bottom: 28px;
  width: 100%;
}

.settings-hero {
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.07);
  display: flex;
  gap: 16px;
  padding: 24px;
}

.settings-hero-icon {
  align-items: center;
  background: #111111;
  border-radius: 18px;
  color: #00ce1b;
  display: flex;
  flex: 0 0 54px;
  font-size: 29px;
  height: 54px;
  justify-content: center;
  width: 54px;
}

.settings-hero-copy {
  min-width: 0;
}

.settings-eyebrow {
  color: #008f13;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.09em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.settings-hero h1,
.settings-detail-heading h1 {
  color: #111111;
  font-size: clamp(30px, 8vw, 42px);
  font-weight: 950;
  letter-spacing: -1px;
  line-height: 1.05;
  margin: 0;
}

.settings-hero p,
.settings-detail-heading p {
  color: #555555;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.45;
  margin: 10px 0 0;
}

.settings-group {
  display: grid;
  gap: 8px;
}

.settings-group-title {
  color: #555555;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 0 6px;
  text-transform: uppercase;
}

.settings-group-card,
.settings-detail-card,
.coming-soon-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.055);
  overflow: hidden;
}

.settings-group-card :deep(.q-separator) {
  background: #eeeeee;
  margin-left: 72px;
}

.settings-item {
  min-height: 72px;
  padding: 10px 14px;
}

.settings-item :deep(.q-focus-helper) {
  border-radius: 0;
}

.settings-item-icon {
  align-items: center;
  background: #f0f4f0;
  border: 1px solid #e1e5e1;
  border-radius: 14px;
  color: #00a816;
  display: flex;
  font-size: 23px;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.settings-item-title {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
}

.settings-item-subtitle {
  color: #666666;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 3px;
}

.settings-item-chevron {
  color: #9a9a9a;
  flex: 0 0 auto;
  font-size: 22px;
}

.settings-detail-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  padding: 6px 2px 0;
}

.settings-back-button {
  background: #ffffff;
  border: 1px solid #dddddd;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.06);
  color: #111111;
  flex: 0 0 auto;
  margin-top: 2px;
}

.settings-back-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.settings-detail-heading {
  min-width: 0;
}

.settings-detail-card-section {
  display: grid;
  gap: 22px;
  padding: 22px;
}

.business-card-heading {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.business-card-icon {
  align-items: center;
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.3);
  border-radius: 15px;
  color: #00a816;
  display: flex;
  flex: 0 0 46px;
  font-size: 25px;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.business-card-title {
  color: #111111;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.2;
}

.business-card-copy {
  color: #666666;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  margin: 5px 0 0;
}

.business-name-input :deep(.q-field__control) {
  border-radius: 18px;
}

.business-save-row {
  display: flex;
  justify-content: flex-end;
}

.business-save-button {
  background: #00ce1b;
  border-radius: 14px;
  color: #000000;
  font-weight: 900;
  min-height: 44px;
  padding: 0 20px;
}

.business-save-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.business-save-button.q-btn--disabled {
  background: #e5e5e5;
  color: #777777;
  opacity: 1 !important;
}

.coming-soon-content {
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 38px 24px;
  text-align: center;
}

.coming-soon-icon {
  align-items: center;
  background: #111111;
  border-radius: 20px;
  color: #00ce1b;
  display: flex;
  font-size: 32px;
  height: 64px;
  justify-content: center;
  width: 64px;
}

.coming-soon-title {
  color: #111111;
  font-size: 21px;
  font-weight: 950;
  margin-top: 18px;
}

.coming-soon-content p {
  color: #666666;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.45;
  margin: 7px 0 0;
  max-width: 420px;
}

.settings-version-footer {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 16px 2px;
  text-align: center;
}

.settings-version-brand {
  color: #555555;
  font-size: 12px;
  font-weight: 850;
}

.settings-version-number {
  color: #8a8a8a;
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 600px) {
  .settings-container {
    gap: 18px;
  }

  .settings-hero {
    padding: 20px;
  }

  .settings-hero-icon {
    border-radius: 16px;
    flex-basis: 48px;
    font-size: 26px;
    height: 48px;
    width: 48px;
  }

  .settings-hero h1,
  .settings-detail-heading h1 {
    font-size: 30px;
  }

  .settings-hero p,
  .settings-detail-heading p {
    font-size: 14px;
  }

  .settings-item {
    min-height: 70px;
    padding-left: 12px;
    padding-right: 10px;
  }

  .settings-detail-card-section {
    padding: 18px;
  }

  .business-save-button {
    width: 100%;
  }
}
</style>
