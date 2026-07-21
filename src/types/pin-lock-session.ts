import type {
  PinLength,
  PinLockPolicy,
  PinLockStorageErrorCode,
} from './pin-lock';

export type PinLockSessionStatus =
  | 'initializing'
  | 'unsupported'
  | 'needs_setup'
  | 'setup_success'
  | 'locked'
  | 'unlocked'
  | 'storage_error';

export type PinLockReason =
  | 'cold_start'
  | 'background_timeout'
  | 'manual'
  | null;

export type PinLockSessionErrorCode =
  | PinLockStorageErrorCode
  | 'lifecycle_unavailable';

export type PinLockSessionState = {
  status: PinLockSessionStatus;
  pinLength: PinLength | null;
  policy: PinLockPolicy | null;
  lockReason: PinLockReason;

  /**
   * Timestamp recorded when an unlocked app enters the background.
   * This is deliberately kept only in process memory.
   */
  backgroundedAt: number | null;

  /**
   * Current native Android activity state.
   */
  isAppActive: boolean;

  /**
   * The future root PIN gate will use this to conceal app content
   * as soon as Android pauses.
   */
  showPrivacyCover: boolean;

  errorCode: PinLockSessionErrorCode | null;
  debugMessage: string | null;
};
