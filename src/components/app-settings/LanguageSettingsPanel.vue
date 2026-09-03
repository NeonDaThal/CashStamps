<template>
  <div class="language-settings-panel">
    <section class="settings-detail-header">
      <q-btn
        flat
        dense
        round
        icon="arrow_back"
        class="settings-back-button"
        :aria-label="t('appSettings.navigation.backToSettings')"
        @click="emit('back')"
      />

      <div class="settings-detail-heading">
        <div class="settings-eyebrow">
          {{ t('appSettings.sections.regional') }}
        </div>

        <h1>{{ t('appSettings.items.language.title') }}</h1>

        <p>
          {{ t('appSettings.language.prompt') }}
        </p>
      </div>
    </section>

    <q-card flat bordered class="language-selector-card">
      <q-list
        separator
        class="language-list"
        role="radiogroup"
        :aria-label="t('appSettings.language.prompt')"
      >
        <q-item
          v-for="localeOption in localeOptions"
          :key="localeOption.value"
          clickable
          class="language-option"
          :class="{
            'language-option--selected': localeOption.value === currentLocale,
          }"
          role="radio"
          :aria-checked="localeOption.value === currentLocale"
          @click="setAppLocale(localeOption.value)"
        >
          <q-item-section avatar>
            <div class="language-code">
              {{ localeOption.toolbarLabel }}
            </div>
          </q-item-section>

          <q-item-section>
            <q-item-label class="language-option-name">
              {{ t(localeOption.labelKey) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-icon
              v-if="localeOption.value === currentLocale"
              name="check_circle"
              class="language-selected-icon"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-card flat bordered class="language-info-card">
      <q-card-section class="language-info-content">
        <div class="language-info-icon">
          <q-icon name="info_outline" />
        </div>

        <p>
          {{ t('appSettings.language.toolbarHint') }}
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getLocaleOption, localeOptions, type SupportedLocale } from 'src/i18n';

import { saveStoredLocale } from 'src/i18n/locale-storage';

const emit = defineEmits<{
  back: [];
}>();

const { t, locale } = useI18n({ useScope: 'global' });

const currentLocale = computed<SupportedLocale>(() => {
  return getLocaleOption(locale.value).value;
});

function setAppLocale(newLocale: SupportedLocale): void {
  if (locale.value === newLocale) {
    return;
  }

  locale.value = newLocale;
  saveStoredLocale(newLocale);
}
</script>

<style lang="scss" scoped>
.language-settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.settings-eyebrow {
  color: #008f13;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.09em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.settings-detail-heading h1 {
  color: #111111;
  font-size: clamp(30px, 8vw, 42px);
  font-weight: 950;
  letter-spacing: -1px;
  line-height: 1.05;
  margin: 0;
}

.settings-detail-heading p {
  color: #555555;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.45;
  margin: 10px 0 0;
}

.language-selector-card,
.language-info-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.055);
  overflow: hidden;
}

.language-list :deep(.q-separator) {
  background: #eeeeee;
  margin-left: 72px;
}

.language-option :deep(.q-item__section--avatar) {
  min-width: 56px;
}

.language-option {
  min-height: 76px;
  padding: 10px 16px;
  transition: background 140ms ease;
}

.language-option :deep(.q-focus-helper) {
  border-radius: 0;
}

.language-option--selected {
  background: rgba(0, 206, 27, 0.08);
}

.language-code {
  align-items: center;
  background: #f0f4f0;
  border: 1px solid #e1e5e1;
  border-radius: 999px;
  color: #008f13;
  display: flex;
  font-size: 11px;
  font-weight: 950;
  height: 32px;
  justify-content: center;
  letter-spacing: 0.04em;
  min-width: 40px;
  padding: 0 9px;
}

.language-option--selected .language-code {
  background: #111111;
  border-color: #111111;
  color: #00ce1b;
}

.language-option-name {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
}

.language-selected-icon {
  color: #00a816;
  font-size: 25px;
}

.language-info-card {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.045);
}

.language-info-content {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  padding: 18px 20px;
}

.language-info-icon {
  align-items: center;
  background: #eaffed;
  border: 1px solid rgba(0, 206, 27, 0.28);
  border-radius: 12px;
  color: #00a816;
  display: flex;
  flex: 0 0 36px;
  font-size: 20px;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.language-info-content p {
  color: #5f5f5f;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
  margin: 1px 0 0;
}

@media (max-width: 600px) {
  .language-settings-panel {
    gap: 18px;
  }

  .settings-detail-heading h1 {
    font-size: 30px;
  }

  .settings-detail-heading p {
    font-size: 14px;
  }

  .language-option {
    min-height: 72px;
    padding-left: 12px;
    padding-right: 12px;
  }

  .language-info-content {
    padding: 16px;
  }
}
</style>
