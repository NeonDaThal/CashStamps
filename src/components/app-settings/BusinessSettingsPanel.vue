<template>
  <div class="business-settings-panel">
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { updateAppSettings, type AppSettings } from 'src/services/app-settings';

const props = defineProps<{
  businessName: string;
}>();

const emit = defineEmits<{
  back: [];
  saved: [settings: AppSettings];
}>();

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

const businessNameInput = ref(props.businessName);

const normalizedBusinessNameInput = computed(() =>
  (businessNameInput.value ?? '').trim()
);

const hasBusinessNameChanges = computed(
  () => normalizedBusinessNameInput.value !== props.businessName
);

function saveBusinessName(): void {
  if (!hasBusinessNameChanges.value) {
    return;
  }

  try {
    const savedSettings = updateAppSettings({
      businessName: normalizedBusinessNameInput.value,
    });

    businessNameInput.value = savedSettings.businessName;
    emit('saved', savedSettings);

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
</script>

<style lang="scss" scoped>
.business-settings-panel {
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

.settings-detail-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.055);
  overflow: hidden;
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

@media (max-width: 600px) {
  .business-settings-panel {
    gap: 18px;
  }

  .settings-detail-heading h1 {
    font-size: 30px;
  }

  .settings-detail-heading p {
    font-size: 14px;
  }

  .settings-detail-card-section {
    padding: 18px;
  }

  .business-save-button {
    width: 100%;
  }
}
</style>
