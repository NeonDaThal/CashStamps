<template>
  <div
    v-if="sessionState.showPrivacyCover"
    class="pin-lock-shell pin-lock-privacy"
  >
    <div class="privacy-brand">
      <img
        :src="bchLogoUrl"
        :alt="t('pinLock.brand.logoAlt')"
        class="privacy-logo"
      />

      <div>
        <div class="privacy-title">
          {{ t('pinLock.brand.title') }}
        </div>
        <div class="privacy-subtitle">
          {{ t('pinLock.privacy.message') }}
        </div>
      </div>
    </div>
  </div>

  <slot v-else-if="canRenderPinProtectedApp" />

  <main v-else class="pin-lock-shell">
    <div class="pin-lock-background-mark pin-lock-background-mark-one" />
    <div class="pin-lock-background-mark pin-lock-background-mark-two" />

    <section class="pin-lock-panel">
      <div v-if="isSetupPreview" class="preview-toolbar">
        <q-badge class="preview-badge">
          {{ t('pinLock.preview.badge') }}
        </q-badge>

        <q-btn
          flat
          dense
          round
          icon="close"
          :aria-label="t('pinLock.preview.close')"
          class="preview-close-button"
          @click="closeSetupPreview"
        />
      </div>

      <header class="pin-lock-brand">
        <div class="brand-logo-frame">
          <img
            :src="bchLogoUrl"
            :alt="t('pinLock.brand.logoAlt')"
            class="brand-logo"
          />
        </div>

        <div class="brand-copy">
          <div class="brand-title">
            {{ t('pinLock.brand.title') }}
          </div>
          <div class="brand-subtitle">
            {{ t('pinLock.brand.subtitle') }}
          </div>
        </div>
      </header>

      <div
        v-if="sessionState.status === 'initializing'"
        class="pin-lock-state pin-lock-state-centred"
      >
        <div class="state-icon state-icon-dark">
          <q-spinner size="34px" color="white" />
        </div>

        <h1 class="pin-lock-title">
          {{ t('pinLock.initializing.title') }}
        </h1>

        <p class="pin-lock-intro">
          {{ t('pinLock.initializing.message') }}
        </p>
      </div>

      <div
        v-else-if="sessionState.status === 'storage_error'"
        class="pin-lock-state"
      >
        <div class="state-icon state-icon-warning">
          <q-icon name="lock_reset" />
        </div>

        <div class="pin-lock-eyebrow">
          {{ t('pinLock.storageError.eyebrow') }}
        </div>

        <h1 class="pin-lock-title">
          {{ t('pinLock.storageError.title') }}
        </h1>

        <p class="pin-lock-intro">
          {{ t('pinLock.storageError.message') }}
        </p>

        <div class="pin-lock-notice pin-lock-notice-warning">
          <q-icon name="warning_amber" />

          <div>
            {{ t('pinLock.storageError.warning') }}
          </div>
        </div>

        <div
          v-if="isDebugBuild && sessionState.debugMessage"
          class="debug-error-box"
        >
          <div class="debug-error-title">
            {{ t('pinLock.storageError.debugTitle') }}
          </div>

          <code>{{ sessionState.debugMessage }}</code>
        </div>

        <q-btn
          unelevated
          no-caps
          rounded
          class="pin-primary-button"
          :label="t('pinLock.storageError.reload')"
          @click="reloadApp"
        />
      </div>

      <div
        v-else-if="sessionState.status === 'setup_success'"
        class="pin-lock-state pin-lock-state-centred"
      >
        <div class="success-ring">
          <q-icon name="check" />
        </div>

        <div class="pin-lock-eyebrow">
          {{ t('pinLock.success.eyebrow') }}
        </div>

        <h1 class="pin-lock-title">
          {{ t('pinLock.success.title') }}
        </h1>

        <p class="pin-lock-intro">
          {{ t('pinLock.success.message') }}
        </p>

        <q-btn
          unelevated
          no-caps
          rounded
          class="pin-primary-button"
          :label="t('pinLock.success.openApp')"
          @click="finishSetupSuccess"
        />
      </div>

      <div v-else-if="isSetupMode" class="pin-lock-state">
        <div class="pin-lock-eyebrow">
          {{
            isConfirmingSetup
              ? t('pinLock.setup.confirmEyebrow')
              : t('pinLock.setup.eyebrow')
          }}
        </div>

        <h1 class="pin-lock-title">
          {{
            isConfirmingSetup
              ? t('pinLock.setup.confirmTitle')
              : t('pinLock.setup.title')
          }}
        </h1>

        <p class="pin-lock-intro">
          {{
            isConfirmingSetup
              ? t('pinLock.setup.confirmMessage')
              : t('pinLock.setup.message')
          }}
        </p>

        <div
          v-if="isSetupPreview"
          class="pin-lock-notice pin-lock-notice-preview"
        >
          <q-icon name="visibility" />

          <div>
            {{ t('pinLock.preview.message') }}
          </div>
        </div>

        <form class="pin-lock-form" @submit.prevent="handlePrimaryAction">
          <div v-if="!isConfirmingSetup" class="pin-length-section">
            <div class="pin-field-label">
              {{ t('pinLock.setup.lengthLabel') }}
            </div>

            <q-btn-toggle
              v-model="selectedPinLength"
              no-caps
              unelevated
              spread
              :disable="isSetupPreview || isSubmitting"
              :options="pinLengthOptions"
              class="pin-length-toggle"
            />

            <div class="pin-field-help">
              {{ t('pinLock.setup.lengthHelp') }}
            </div>
          </div>

          <div class="pin-input-section">
            <div class="pin-field-label">
              {{
                isConfirmingSetup
                  ? t('pinLock.setup.confirmInputLabel')
                  : t('pinLock.setup.inputLabel')
              }}
            </div>

            <div
              class="pin-entry-area"
              :class="{
                'pin-entry-area-focused': isPinFocused,
                'pin-entry-area-error': Boolean(displayFeedback),
                'pin-entry-area-disabled': isInputDisabled,
              }"
              role="group"
              :aria-label="
                isConfirmingSetup
                  ? t('pinLock.setup.confirmInputLabel')
                  : t('pinLock.setup.inputLabel')
              "
              @click="focusPinInput"
            >
              <input
                ref="pinInputRef"
                v-model="pinValue"
                class="pin-native-input"
                type="tel"
                inputmode="numeric"
                pattern="[0-9]*"
                :autocomplete="
                  isConfirmingSetup ? 'new-password' : 'new-password'
                "
                :maxlength="activePinLength"
                :disabled="isInputDisabled"
                :aria-label="
                  isConfirmingSetup
                    ? t('pinLock.setup.confirmInputLabel')
                    : t('pinLock.setup.inputLabel')
                "
                @input="handlePinInput"
                @focus="isPinFocused = true"
                @blur="isPinFocused = false"
                @keydown.enter.prevent="handlePrimaryAction"
              />

              <div class="pin-slots">
                <div
                  v-for="slotNumber in activePinLength"
                  :key="slotNumber"
                  class="pin-slot"
                  :class="{
                    'pin-slot-filled': slotNumber <= pinValue.length,
                    'pin-slot-current':
                      isPinFocused &&
                      slotNumber === pinValue.length + 1 &&
                      !isInputDisabled,
                  }"
                >
                  <span v-if="slotNumber <= pinValue.length" class="pin-dot" />
                </div>
              </div>
            </div>

            <div
              class="pin-feedback"
              :class="{ 'pin-feedback-visible': Boolean(displayFeedback) }"
              aria-live="polite"
            >
              {{ displayFeedback || '\u00A0' }}
            </div>
          </div>

          <div
            v-if="isConfirmingSetup && !isSetupPreview"
            class="setup-back-row"
          >
            <q-btn
              flat
              no-caps
              icon="arrow_back"
              :label="t('pinLock.setup.chooseAgain')"
              class="pin-secondary-button"
              :disable="isSubmitting"
              @click="returnToPinChoice"
            />
          </div>

          <q-btn
            unelevated
            no-caps
            rounded
            type="submit"
            class="pin-primary-button"
            :loading="isSubmitting"
            :disable="isPrimaryActionDisabled"
            :label="primaryActionLabel"
          />
        </form>
      </div>

      <div v-else-if="sessionState.status === 'locked'" class="pin-lock-state">
        <div class="state-icon state-icon-green">
          <q-icon name="lock" />
        </div>

        <div class="pin-lock-eyebrow">
          {{ t('pinLock.unlock.eyebrow') }}
        </div>

        <h1 class="pin-lock-title">
          {{ t('pinLock.unlock.title') }}
        </h1>

        <p class="pin-lock-intro">
          {{
            sessionState.lockReason === 'background_timeout'
              ? t('pinLock.unlock.timeoutMessage')
              : t('pinLock.unlock.message')
          }}
        </p>

        <form class="pin-lock-form" @submit.prevent="handlePrimaryAction">
          <div class="pin-input-section">
            <div class="pin-field-label">
              {{
                t('pinLock.unlock.inputLabel', {
                  length: activePinLength,
                })
              }}
            </div>

            <div
              class="pin-entry-area"
              :class="{
                'pin-entry-area-focused': isPinFocused,
                'pin-entry-area-error': Boolean(displayFeedback),
                'pin-entry-area-disabled': isInputDisabled,
              }"
              role="group"
              :aria-label="
                t('pinLock.unlock.inputLabel', {
                  length: activePinLength,
                })
              "
              @click="focusPinInput"
            >
              <input
                ref="pinInputRef"
                v-model="pinValue"
                class="pin-native-input"
                type="tel"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="current-password"
                :maxlength="activePinLength"
                :disabled="isInputDisabled"
                :aria-label="
                  t('pinLock.unlock.inputLabel', {
                    length: activePinLength,
                  })
                "
                @input="handlePinInput"
                @focus="isPinFocused = true"
                @blur="isPinFocused = false"
                @keydown.enter.prevent="handlePrimaryAction"
              />

              <div class="pin-slots">
                <div
                  v-for="slotNumber in activePinLength"
                  :key="slotNumber"
                  class="pin-slot"
                  :class="{
                    'pin-slot-filled': slotNumber <= pinValue.length,
                    'pin-slot-current':
                      isPinFocused &&
                      slotNumber === pinValue.length + 1 &&
                      !isInputDisabled,
                  }"
                >
                  <span v-if="slotNumber <= pinValue.length" class="pin-dot" />
                </div>
              </div>
            </div>

            <div
              class="pin-feedback"
              :class="{ 'pin-feedback-visible': Boolean(displayFeedback) }"
              aria-live="polite"
            >
              {{ displayFeedback || '\u00A0' }}
            </div>
          </div>

          <q-btn
            unelevated
            no-caps
            rounded
            type="submit"
            class="pin-primary-button"
            :loading="isSubmitting"
            :disable="isPrimaryActionDisabled"
            :label="t('pinLock.unlock.openApp')"
          />
        </form>

        <div class="pin-lock-help">
          <q-btn
            flat
            no-caps
            :label="
              isForgottenPinHelpOpen
                ? t('pinLock.forgotten.hide')
                : t('pinLock.forgotten.show')
            "
            class="pin-help-button"
            @click="isForgottenPinHelpOpen = !isForgottenPinHelpOpen"
          />

          <div v-if="isForgottenPinHelpOpen" class="forgotten-pin-box">
            <q-icon name="info_outline" />

            <div>
              <div class="forgotten-pin-title">
                {{ t('pinLock.forgotten.title') }}
              </div>

              <div class="forgotten-pin-message">
                {{ t('pinLock.forgotten.message') }}
              </div>
            </div>
          </div>

          <q-btn
            v-if="isDebugBuild"
            flat
            no-caps
            icon="visibility"
            :label="t('pinLock.preview.open')"
            class="pin-preview-button"
            @click="openSetupPreview"
          />
        </div>
      </div>

      <div v-else class="pin-lock-state pin-lock-state-centred">
        <div class="state-icon state-icon-dark">
          <q-spinner size="34px" color="white" />
        </div>

        <h1 class="pin-lock-title">
          {{ t('pinLock.initializing.title') }}
        </h1>
      </div>

      <footer class="pin-lock-footer">
        <q-icon name="verified_user" />

        <span>{{ t('pinLock.footer') }}</span>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useI18n } from 'vue-i18n';
import bchLogoUrl from 'src/assets/bch-logo.png';
import type { PinLength } from '../types/pin-lock';
import {
  canRenderPinProtectedApp,
  finishPinSetupSuccess,
  initializePinLockSession,
  pinLockSessionState,
  submitPinSetup,
  submitPinUnlock,
} from '../services/pin-lock-session';

type NativeAppInfo = {
  id: string;
};

type NativeAppPlugin = {
  getInfo: () => Promise<NativeAppInfo>;
};

type SetupStage = 'choose' | 'confirm';

const NativeApp = registerPlugin<NativeAppPlugin>('App');

const { t } = useI18n({
  useScope: 'global',
});

const sessionState = pinLockSessionState;

const pinInputRef = ref<HTMLInputElement | null>(null);
const pinValue = ref('');
const firstPinValue = ref('');
const selectedPinLength = ref<PinLength>(4);
const setupStage = ref<SetupStage>('choose');

const isSubmitting = ref(false);
const isPinFocused = ref(false);
const feedbackMessage = ref('');
const cooldownUntil = ref<number | null>(null);
const currentTime = ref(Date.now());

const isDebugBuild = ref(false);
const isSetupPreview = ref(false);
const isForgottenPinHelpOpen = ref(false);

let cooldownInterval: ReturnType<typeof setInterval> | null = null;
let setupSuccessTimer: ReturnType<typeof setTimeout> | null = null;

const pinLengthOptions = [
  {
    label: '4',
    value: 4,
  },
  {
    label: '5',
    value: 5,
  },
  {
    label: '6',
    value: 6,
  },
];

const isConfirmingSetup = computed((): boolean => {
  return setupStage.value === 'confirm';
});

const isSetupMode = computed((): boolean => {
  return sessionState.value.status === 'needs_setup' || isSetupPreview.value;
});

const activePinLength = computed<PinLength>(() => {
  if (isSetupMode.value) {
    return selectedPinLength.value;
  }

  return sessionState.value.pinLength ?? 4;
});

const cooldownRemainingMs = computed((): number => {
  if (cooldownUntil.value === null) {
    return 0;
  }

  return Math.max(0, cooldownUntil.value - currentTime.value);
});

const isCooldownActive = computed((): boolean => {
  return cooldownRemainingMs.value > 0;
});

const displayFeedback = computed((): string => {
  if (isCooldownActive.value) {
    const seconds = Math.ceil(cooldownRemainingMs.value / 1000);

    return t('pinLock.errors.cooldown', {
      seconds,
    });
  }

  return feedbackMessage.value;
});

const isInputDisabled = computed((): boolean => {
  return isSubmitting.value || isCooldownActive.value || isSetupPreview.value;
});

const isPrimaryActionDisabled = computed((): boolean => {
  return (
    isInputDisabled.value || pinValue.value.length !== activePinLength.value
  );
});

const primaryActionLabel = computed((): string => {
  if (isSetupPreview.value) {
    return t('pinLock.preview.disabledAction');
  }

  if (isConfirmingSetup.value) {
    return t('pinLock.setup.setPin');
  }

  return t('pinLock.setup.continue');
});

function clearFeedback(): void {
  if (!isCooldownActive.value) {
    feedbackMessage.value = '';
  }
}

function focusPinInput(): void {
  if (isInputDisabled.value) {
    return;
  }

  pinInputRef.value?.focus();
}

function handlePinInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const sanitizedValue = input.value
    .replace(/\D/g, '')
    .slice(0, activePinLength.value);

  if (input.value !== sanitizedValue) {
    input.value = sanitizedValue;
  }

  pinValue.value = sanitizedValue;
  clearFeedback();
}

function resetPinEntry(): void {
  pinValue.value = '';
  isPinFocused.value = false;

  void nextTick(() => {
    focusPinInput();
  });
}

function returnToPinChoice(): void {
  if (isSubmitting.value) {
    return;
  }

  setupStage.value = 'choose';
  firstPinValue.value = '';
  feedbackMessage.value = '';
  resetPinEntry();
}

function finishSetupSuccess(): void {
  if (setupSuccessTimer) {
    clearTimeout(setupSuccessTimer);
    setupSuccessTimer = null;
  }

  finishPinSetupSuccess();
}

function startCooldown(until: number): void {
  cooldownUntil.value = until;
  currentTime.value = Date.now();

  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }

  cooldownInterval = setInterval(() => {
    currentTime.value = Date.now();

    if (
      cooldownUntil.value !== null &&
      currentTime.value >= cooldownUntil.value
    ) {
      cooldownUntil.value = null;

      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }

      feedbackMessage.value = '';
      resetPinEntry();
    }
  }, 500);
}

async function handleSetupAction(): Promise<void> {
  if (pinValue.value.length !== activePinLength.value || isSetupPreview.value) {
    return;
  }

  if (!isConfirmingSetup.value) {
    firstPinValue.value = pinValue.value;
    setupStage.value = 'confirm';
    feedbackMessage.value = '';
    resetPinEntry();
    return;
  }

  if (pinValue.value !== firstPinValue.value) {
    feedbackMessage.value = t('pinLock.errors.pinMismatch');
    resetPinEntry();
    return;
  }

  isSubmitting.value = true;
  feedbackMessage.value = '';

  try {
    const result = await submitPinSetup(pinValue.value);

    if (result.status === 'invalid_format') {
      feedbackMessage.value = t('pinLock.errors.invalidFormat');
      resetPinEntry();
    }

    if (result.status === 'already_configured') {
      feedbackMessage.value = t('pinLock.errors.alreadyConfigured');
      resetPinEntry();
    }
  } finally {
    isSubmitting.value = false;
  }
}

async function handleUnlockAction(): Promise<void> {
  if (
    pinValue.value.length !== activePinLength.value ||
    isCooldownActive.value
  ) {
    return;
  }

  isSubmitting.value = true;
  feedbackMessage.value = '';

  try {
    const result = await submitPinUnlock(pinValue.value);

    if (result.status === 'incorrect') {
      feedbackMessage.value = t('pinLock.errors.incorrectPin');

      if (result.lockoutUntil !== null && result.retryAfterMs > 0) {
        startCooldown(result.lockoutUntil);
      }

      resetPinEntry();
      return;
    }

    if (result.status === 'cooldown') {
      startCooldown(result.lockoutUntil);
      resetPinEntry();
      return;
    }

    if (result.status === 'invalid_format') {
      feedbackMessage.value = t('pinLock.errors.invalidFormat');
      resetPinEntry();
    }
  } finally {
    isSubmitting.value = false;
  }
}

async function handlePrimaryAction(): Promise<void> {
  if (isPrimaryActionDisabled.value) {
    return;
  }

  if (isSetupMode.value) {
    await handleSetupAction();
    return;
  }

  if (sessionState.value.status === 'locked') {
    await handleUnlockAction();
  }
}

function openSetupPreview(): void {
  if (!isDebugBuild.value) {
    return;
  }

  isSetupPreview.value = true;
  setupStage.value = 'choose';
  selectedPinLength.value = 4;
  pinValue.value = '';
  firstPinValue.value = '';
  feedbackMessage.value = '';
  isForgottenPinHelpOpen.value = false;
}

function closeSetupPreview(): void {
  isSetupPreview.value = false;
  setupStage.value = 'choose';
  selectedPinLength.value = 4;
  pinValue.value = '';
  firstPinValue.value = '';
  feedbackMessage.value = '';

  void nextTick(() => {
    focusPinInput();
  });
}

function reloadApp(): void {
  window.location.reload();
}

async function detectDebugBuild(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    isDebugBuild.value = false;
    return;
  }

  try {
    const appInfo = await NativeApp.getInfo();

    isDebugBuild.value = appInfo.id.endsWith('.debug');
  } catch (error) {
    isDebugBuild.value = false;
  }
}

watch(selectedPinLength, () => {
  if (!isSetupMode.value) {
    return;
  }

  firstPinValue.value = '';
  setupStage.value = 'choose';
  feedbackMessage.value = '';
  pinValue.value = '';
});

watch(
  () => sessionState.value.status,
  (status) => {
    pinValue.value = '';
    feedbackMessage.value = '';
    cooldownUntil.value = null;
    isForgottenPinHelpOpen.value = false;

    if (status === 'needs_setup') {
      setupStage.value = 'choose';
      firstPinValue.value = '';
      selectedPinLength.value = 4;
    }

    if (status === 'setup_success') {
      if (setupSuccessTimer) {
        clearTimeout(setupSuccessTimer);
      }

      setupSuccessTimer = setTimeout(() => {
        finishPinSetupSuccess();
        setupSuccessTimer = null;
      }, 1600);
    }

    if (status === 'needs_setup' || status === 'locked') {
      void nextTick(() => {
        focusPinInput();
      });
    }
  }
);

onMounted(async () => {
  await initializePinLockSession();
  await detectDebugBuild();

  if (
    sessionState.value.status === 'needs_setup' ||
    sessionState.value.status === 'locked'
  ) {
    await nextTick();
    focusPinInput();
  }
});

onBeforeUnmount(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }

  if (setupSuccessTimer) {
    clearTimeout(setupSuccessTimer);
  }
});
</script>

<style lang="scss" scoped>
.pin-lock-shell {
  align-items: center;
  background: radial-gradient(
      circle at top right,
      rgba(0, 206, 27, 0.17),
      transparent 34%
    ),
    linear-gradient(155deg, #070807 0%, #111311 56%, #050505 100%);
  color: #ffffff;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  padding: max(20px, env(safe-area-inset-top)) 18px
    max(20px, env(safe-area-inset-bottom));
  position: relative;
  width: 100%;
}

.pin-lock-background-mark {
  border: 1px solid rgba(0, 206, 27, 0.1);
  border-radius: 50%;
  pointer-events: none;
  position: absolute;
}

.pin-lock-background-mark-one {
  height: 360px;
  right: -190px;
  top: -150px;
  width: 360px;
}

.pin-lock-background-mark-two {
  bottom: -230px;
  height: 440px;
  left: -240px;
  width: 440px;
}

.pin-lock-panel {
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 30px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
  color: #111111;
  max-width: 440px;
  overflow: hidden;
  padding: 22px;
  position: relative;
  width: 100%;
  z-index: 1;
}

.pin-lock-brand {
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 18px;
}

.brand-logo-frame {
  align-items: center;
  background: #00ce1b;
  border-radius: 17px;
  display: flex;
  flex: 0 0 54px;
  height: 54px;
  justify-content: center;
  overflow: hidden;
  width: 54px;
}

.brand-logo {
  display: block;
  height: 42px;
  object-fit: contain;
  width: 42px;
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  color: #111111;
  font-size: 19px;
  font-weight: 950;
  letter-spacing: -0.45px;
  line-height: 1.08;
}

.brand-subtitle {
  color: #666666;
  font-size: 12px;
  font-weight: 800;
  margin-top: 4px;
}

.pin-lock-state {
  display: flex;
  flex-direction: column;
}

.pin-lock-state-centred {
  align-items: center;
  text-align: center;
}

.pin-lock-eyebrow {
  color: #009914;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.13em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.pin-lock-title {
  color: #111111;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  line-height: 1.04;
  margin: 0;
}

.pin-lock-intro {
  color: #555555;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.5;
  margin: 12px 0 0;
}

.state-icon {
  align-items: center;
  border-radius: 22px;
  display: flex;
  font-size: 30px;
  height: 62px;
  justify-content: center;
  margin-bottom: 18px;
  width: 62px;
}

.state-icon-dark {
  background: #111111;
  color: #ffffff;
}

.state-icon-green {
  background: #00ce1b;
  color: #050505;
}

.state-icon-warning {
  background: #fff0cf;
  color: #7a4c00;
}

.success-ring {
  align-items: center;
  background: #00ce1b;
  border: 8px solid rgba(0, 206, 27, 0.16);
  border-radius: 50%;
  color: #000000;
  display: flex;
  font-size: 38px;
  height: 86px;
  justify-content: center;
  margin-bottom: 20px;
  width: 86px;
}

.pin-lock-form {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
}

.pin-length-section {
  margin-bottom: 22px;
}

.pin-field-label {
  color: #222222;
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 9px;
}

.pin-field-help {
  color: #777777;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
  margin-top: 8px;
}

.pin-length-toggle {
  background: #eef0ee;
  border: 1px solid #dfe3df;
  border-radius: 16px;
  overflow: hidden;
}

.pin-length-toggle :deep(.q-btn) {
  color: #555555;
  font-size: 16px;
  font-weight: 950;
  min-height: 48px;
}

.pin-length-toggle :deep(.q-btn--active) {
  background: #111111;
  color: #ffffff;
}

.pin-entry-area {
  background: #f4f5f4;
  border: 2px solid transparent;
  border-radius: 22px;
  cursor: text;
  padding: 17px 14px;
  position: relative;
  transition: border-color 0.16s ease, background 0.16s ease,
    box-shadow 0.16s ease;
}

.pin-entry-area-focused {
  background: #ffffff;
  border-color: #00ce1b;
  box-shadow: 0 0 0 4px rgba(0, 206, 27, 0.13);
}

.pin-entry-area-error {
  border-color: #d94949;
}

.pin-entry-area-disabled {
  cursor: default;
  opacity: 0.72;
}

.pin-native-input {
  height: 1px;
  left: 50%;
  opacity: 0.01;
  pointer-events: none;
  position: absolute;
  top: 50%;
  width: 1px;
}

.pin-slots {
  display: flex;
  gap: 9px;
  justify-content: center;
}

.pin-slot {
  align-items: center;
  background: #ffffff;
  border: 1px solid #d5d9d5;
  border-radius: 14px;
  display: flex;
  height: 54px;
  justify-content: center;
  transition: border-color 0.16s ease, transform 0.16s ease,
    background 0.16s ease;
  width: 48px;
}

.pin-slot-current {
  border-color: #00ce1b;
  transform: translateY(-1px);
}

.pin-slot-filled {
  background: #111111;
  border-color: #111111;
}

.pin-dot {
  background: #00ce1b;
  border-radius: 50%;
  height: 12px;
  width: 12px;
}

.pin-feedback {
  color: #b42318;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  min-height: 34px;
  opacity: 0;
  padding: 7px 3px 0;
  transition: opacity 0.15s ease;
}

.pin-feedback-visible {
  opacity: 1;
}

.pin-primary-button {
  background: #111111;
  color: #ffffff;
  font-size: 15px;
  font-weight: 950;
  min-height: 52px;
  width: 100%;
}

.pin-primary-button.q-btn--disabled {
  opacity: 0.48 !important;
}

.setup-back-row {
  display: flex;
  justify-content: center;
  margin: -5px 0 10px;
}

.pin-secondary-button {
  color: #555555;
  font-weight: 850;
}

.pin-lock-help {
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.pin-help-button,
.pin-preview-button {
  color: #555555;
  font-size: 12px;
  font-weight: 850;
}

.pin-preview-button {
  color: #007f11;
  margin-top: 2px;
}

.forgotten-pin-box {
  align-items: flex-start;
  background: #f5f6f5;
  border: 1px solid #e1e3e1;
  border-radius: 17px;
  color: #444444;
  display: flex;
  font-size: 12px;
  gap: 10px;
  line-height: 1.45;
  margin: 4px 0 8px;
  padding: 12px;
  width: 100%;
}

.forgotten-pin-box .q-icon {
  color: #008f13;
  flex: 0 0 auto;
  font-size: 20px;
}

.forgotten-pin-title {
  color: #222222;
  font-weight: 950;
  margin-bottom: 3px;
}

.pin-lock-notice {
  align-items: flex-start;
  border-radius: 17px;
  display: flex;
  font-size: 12px;
  font-weight: 750;
  gap: 10px;
  line-height: 1.45;
  margin-top: 18px;
  padding: 12px;
}

.pin-lock-notice .q-icon {
  flex: 0 0 auto;
  font-size: 20px;
}

.pin-lock-notice-warning {
  background: #fff7e8;
  border: 1px solid #f0d6a3;
  color: #63400a;
}

.pin-lock-notice-preview {
  background: rgba(0, 206, 27, 0.09);
  border: 1px solid rgba(0, 206, 27, 0.26);
  color: #244529;
}

.preview-toolbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: -4px 0 14px;
}

.preview-badge {
  background: #111111;
  border-radius: 999px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.08em;
  padding: 6px 9px;
  text-transform: uppercase;
}

.preview-close-button {
  color: #444444;
}

.debug-error-box {
  background: #111111;
  border-radius: 17px;
  color: #ffffff;
  margin: 14px 0 18px;
  padding: 12px;
}

.debug-error-title {
  color: #00ce1b;
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.08em;
  margin-bottom: 7px;
  text-transform: uppercase;
}

.debug-error-box code {
  display: block;
  font-size: 10px;
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
}

.pin-lock-footer {
  align-items: center;
  border-top: 1px solid #e8e8e8;
  color: #777777;
  display: flex;
  font-size: 11px;
  font-weight: 750;
  gap: 7px;
  justify-content: center;
  margin-top: 22px;
  padding-top: 16px;
  text-align: center;
}

.pin-lock-footer .q-icon {
  color: #00a816;
  font-size: 17px;
}

.pin-lock-privacy {
  justify-content: flex-start;
}

.privacy-brand {
  align-items: center;
  display: flex;
  gap: 13px;
  margin: auto;
}

.privacy-logo {
  background: #00ce1b;
  border-radius: 18px;
  height: 58px;
  object-fit: contain;
  padding: 8px;
  width: 58px;
}

.privacy-title {
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.4px;
}

.privacy-subtitle {
  color: #b8b8b8;
  font-size: 12px;
  font-weight: 750;
  margin-top: 4px;
}

@media (max-width: 390px) {
  .pin-lock-shell {
    padding-left: 12px;
    padding-right: 12px;
  }

  .pin-lock-panel {
    border-radius: 25px;
    padding: 18px;
  }

  .pin-lock-title {
    font-size: 27px;
  }

  .pin-slot {
    border-radius: 12px;
    height: 50px;
    width: 43px;
  }

  .pin-slots {
    gap: 7px;
  }
}

@media (max-height: 700px) {
  .pin-lock-shell {
    align-items: flex-start;
    overflow-y: auto;
  }

  .pin-lock-panel {
    margin-bottom: 10px;
    margin-top: 10px;
  }

  .pin-lock-brand {
    margin-bottom: 18px;
    padding-bottom: 14px;
  }

  .pin-lock-form {
    margin-top: 18px;
  }
}
</style>
