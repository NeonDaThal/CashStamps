import { computed, readonly, ref } from 'vue';
import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from '@capacitor/core';
import {
  createDefaultPinLockPolicy,
  type PinLockPolicy,
  type PinLockStorageErrorResult,
  type SetUpPinResult,
  type VerifyPinResult,
} from '../types/pin-lock';
import type {
  PinLockReason,
  PinLockSessionErrorCode,
  PinLockSessionState,
} from '../types/pin-lock-session';
import { checkPinLockSetup, setUpPin, verifyPin } from './pin-lock-service';

type NativeAppState = {
  isActive: boolean;
};

interface NativeAppPlugin {
  getState(): Promise<NativeAppState>;

  addListener(
    eventName: 'appStateChange',
    listenerFunc: (state: NativeAppState) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'pause',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
}

const NativeApp = registerPlugin<NativeAppPlugin>('App');

function createInitialSessionState(): PinLockSessionState {
  return {
    status: 'initializing',
    pinLength: null,
    policy: null,
    lockReason: null,
    backgroundedAt: null,
    isAppActive: true,
    showPrivacyCover: false,
    errorCode: null,
    debugMessage: null,
  };
}

const mutableSessionState = ref<PinLockSessionState>(
  createInitialSessionState()
);

let initializationPromise: Promise<void> | null = null;
let appStateListener: PluginListenerHandle | null = null;
let pauseListener: PluginListenerHandle | null = null;

const intentionalExternalNavigationGraceMs = 3000;

let privacyCoverBypassUntil = 0;
let privacyCoverRestoreTimer: ReturnType<typeof setTimeout> | null = null;

export const pinLockSessionState = readonly(mutableSessionState);

export const canRenderPinProtectedApp = computed((): boolean => {
  return (
    mutableSessionState.value.status === 'unsupported' ||
    mutableSessionState.value.status === 'unlocked'
  );
});

export const shouldShowPinLockScreen = computed((): boolean => {
  const status = mutableSessionState.value.status;

  return (
    status === 'needs_setup' ||
    status === 'setup_success' ||
    status === 'locked' ||
    status === 'storage_error'
  );
});

function patchSessionState(patch: Partial<PinLockSessionState>): void {
  mutableSessionState.value = {
    ...mutableSessionState.value,
    ...patch,
  };
}

function setSessionError(
  errorCode: PinLockSessionErrorCode,
  debugMessage: string
): void {
  patchSessionState({
    status: 'storage_error',
    lockReason: null,
    backgroundedAt: null,
    errorCode,
    debugMessage,
  });
}

function applyStorageError(result: PinLockStorageErrorResult): void {
  setSessionError(result.errorCode, result.debugMessage);
}

function getUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown Android lifecycle error occurred.';
}

function shouldLockAfterBackground(
  backgroundedAt: number,
  policy: PinLockPolicy,
  now: number
): boolean {
  const timeoutMs = policy.backgroundTimeoutMs;

  if (timeoutMs === null) {
    return false;
  }

  const elapsedMs = now - backgroundedAt;

  /**
   * A backwards system-clock change is treated conservatively.
   */
  if (elapsedMs < 0) {
    return true;
  }

  return elapsedMs >= timeoutMs;
}

function isPrivacyCoverTemporarilyBypassed(now = Date.now()): boolean {
  return now <= privacyCoverBypassUntil;
}

function clearPrivacyCoverRestoreTimer(): void {
  if (privacyCoverRestoreTimer) {
    clearTimeout(privacyCoverRestoreTimer);
    privacyCoverRestoreTimer = null;
  }
}

function schedulePrivacyCoverRestore(): void {
  clearPrivacyCoverRestoreTimer();

  const delayMs = Math.max(0, privacyCoverBypassUntil - Date.now()) + 150;

  privacyCoverRestoreTimer = setTimeout(() => {
    privacyCoverRestoreTimer = null;

    const currentState = mutableSessionState.value;

    if (!currentState.isAppActive && !isPrivacyCoverTemporarilyBypassed()) {
      patchSessionState({
        showPrivacyCover: true,
      });
    }
  }, delayMs);
}

export function preparePinLockExternalNavigation(): void {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  privacyCoverBypassUntil = Date.now() + intentionalExternalNavigationGraceMs;
  schedulePrivacyCoverRestore();
}

function handleAppInactive(): void {
  const currentState = mutableSessionState.value;
  const now = Date.now();
  const shouldBypassPrivacyCover = isPrivacyCoverTemporarilyBypassed(now);

  const backgroundedAt =
    currentState.status === 'unlocked' && currentState.backgroundedAt === null
      ? now
      : currentState.backgroundedAt;

  patchSessionState({
    isAppActive: false,
    showPrivacyCover: !shouldBypassPrivacyCover,
    backgroundedAt,
  });

  if (shouldBypassPrivacyCover) {
    schedulePrivacyCoverRestore();
  }
}

function handleAppActive(): void {
  clearPrivacyCoverRestoreTimer();
  privacyCoverBypassUntil = 0;

  const currentState = mutableSessionState.value;
  const now = Date.now();

  const hasExpired =
    currentState.status === 'unlocked' &&
    currentState.backgroundedAt !== null &&
    currentState.policy !== null &&
    shouldLockAfterBackground(
      currentState.backgroundedAt,
      currentState.policy,
      now
    );

  if (hasExpired) {
    patchSessionState({
      status: 'locked',
      lockReason: 'background_timeout',
      backgroundedAt: null,
      isAppActive: true,
      showPrivacyCover: false,
      errorCode: null,
      debugMessage: null,
    });

    return;
  }

  patchSessionState({
    backgroundedAt: null,
    isAppActive: true,
    showPrivacyCover: false,
  });
}

async function registerLifecycleListeners(): Promise<void> {
  if (appStateListener || pauseListener) {
    return;
  }

  let newAppStateListener: PluginListenerHandle | null = null;
  let newPauseListener: PluginListenerHandle | null = null;

  try {
    newAppStateListener = await NativeApp.addListener(
      'appStateChange',
      (state) => {
        if (state.isActive) {
          handleAppActive();
          return;
        }

        handleAppInactive();
      }
    );

    newPauseListener = await NativeApp.addListener('pause', () => {
      handleAppInactive();
    });

    appStateListener = newAppStateListener;
    pauseListener = newPauseListener;
  } catch (error) {
    if (newAppStateListener) {
      await newAppStateListener.remove();
    }

    if (newPauseListener) {
      await newPauseListener.remove();
    }

    throw error;
  }
}

async function performInitialization(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    patchSessionState({
      status: 'unsupported',
      pinLength: null,
      policy: null,
      lockReason: null,
      backgroundedAt: null,
      isAppActive: true,
      showPrivacyCover: false,
      errorCode: null,
      debugMessage: null,
    });

    return;
  }

  patchSessionState(createInitialSessionState());

  try {
    await registerLifecycleListeners();

    const nativeState = await NativeApp.getState();

    patchSessionState({
      isAppActive: nativeState.isActive,
      showPrivacyCover: !nativeState.isActive,
    });
  } catch (error) {
    setSessionError(
      'lifecycle_unavailable',
      `Could not initialise Android app lifecycle handling: ${getUnknownErrorMessage(
        error
      )}`
    );

    return;
  }

  const setupResult = await checkPinLockSetup();

  if (setupResult.status === 'unsupported') {
    patchSessionState({
      status: 'unsupported',
      pinLength: null,
      policy: null,
      lockReason: null,
      backgroundedAt: null,
      showPrivacyCover: false,
      errorCode: null,
      debugMessage: null,
    });

    return;
  }

  if (setupResult.status === 'storage_error') {
    applyStorageError(setupResult);
    return;
  }

  if (setupResult.status === 'needs_setup') {
    patchSessionState({
      status: 'needs_setup',
      pinLength: null,
      policy: null,
      lockReason: null,
      backgroundedAt: null,
      errorCode: null,
      debugMessage: null,
    });

    return;
  }

  const shouldStartLocked = setupResult.policy.lockOnColdStart;

  const isCurrentlyActive = mutableSessionState.value.isAppActive;

  patchSessionState({
    status: shouldStartLocked ? 'locked' : 'unlocked',
    pinLength: setupResult.pinLength,
    policy: setupResult.policy,
    lockReason: shouldStartLocked ? 'cold_start' : null,
    backgroundedAt:
      !shouldStartLocked && !isCurrentlyActive ? Date.now() : null,
    showPrivacyCover: !isCurrentlyActive,
    errorCode: null,
    debugMessage: null,
  });
}

export function initializePinLockSession(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = performInitialization();
  }

  return initializationPromise;
}

export async function submitPinSetup(pin: string): Promise<SetUpPinResult> {
  const result = await setUpPin(pin);

  if (result.status === 'success') {
    patchSessionState({
      status: 'setup_success',
      pinLength: result.pinLength,
      policy: createDefaultPinLockPolicy(),
      lockReason: null,
      backgroundedAt: null,
      errorCode: null,
      debugMessage: null,
    });

    return result;
  }

  if (result.status === 'storage_error') {
    applyStorageError(result);
    return result;
  }

  if (result.status === 'unsupported') {
    patchSessionState({
      status: 'unsupported',
      pinLength: null,
      policy: null,
      lockReason: null,
      backgroundedAt: null,
      showPrivacyCover: false,
      errorCode: null,
      debugMessage: null,
    });

    return result;
  }

  if (result.status === 'already_configured') {
    const setupResult = await checkPinLockSetup();

    if (setupResult.status === 'configured') {
      patchSessionState({
        status: 'locked',
        pinLength: setupResult.pinLength,
        policy: setupResult.policy,
        lockReason: 'cold_start',
        backgroundedAt: null,
        errorCode: null,
        debugMessage: null,
      });
    } else if (setupResult.status === 'storage_error') {
      applyStorageError(setupResult);
    }

    return result;
  }

  return result;
}

export function finishPinSetupSuccess(): void {
  if (mutableSessionState.value.status !== 'setup_success') {
    return;
  }

  patchSessionState({
    status: 'unlocked',
    lockReason: null,
    backgroundedAt: null,
    errorCode: null,
    debugMessage: null,
  });
}

export async function submitPinUnlock(pin: string): Promise<VerifyPinResult> {
  const result = await verifyPin(pin);

  if (result.status === 'success') {
    patchSessionState({
      status: 'unlocked',
      lockReason: null,
      backgroundedAt: null,
      errorCode: null,
      debugMessage: null,
    });

    return result;
  }

  if (result.status === 'not_configured') {
    patchSessionState({
      status: 'needs_setup',
      pinLength: null,
      policy: null,
      lockReason: null,
      backgroundedAt: null,
      errorCode: null,
      debugMessage: null,
    });

    return result;
  }

  if (result.status === 'storage_error') {
    applyStorageError(result);
    return result;
  }

  if (result.status === 'unsupported') {
    patchSessionState({
      status: 'unsupported',
      pinLength: null,
      policy: null,
      lockReason: null,
      backgroundedAt: null,
      showPrivacyCover: false,
      errorCode: null,
      debugMessage: null,
    });
  }

  return result;
}

export function lockPinSession(
  reason: Exclude<PinLockReason, null> = 'manual'
): void {
  if (
    Capacitor.getPlatform() !== 'android' ||
    mutableSessionState.value.pinLength === null
  ) {
    return;
  }

  patchSessionState({
    status: 'locked',
    lockReason: reason,
    backgroundedAt: null,
    errorCode: null,
    debugMessage: null,
  });
}

export async function disposePinLockSession(): Promise<void> {
  clearPrivacyCoverRestoreTimer();
  privacyCoverBypassUntil = 0;
  if (appStateListener) {
    await appStateListener.remove();
    appStateListener = null;
  }

  if (pauseListener) {
    await pauseListener.remove();
    pauseListener = null;
  }

  initializationPromise = null;
  mutableSessionState.value = createInitialSessionState();
}
