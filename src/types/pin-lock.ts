export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export type PinLength = 4 | 5 | 6;

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Available timeout values for the future App Settings page.
 *
 * The current MVP uses threeHours.
 * A value of 0 means lock on the next foreground/open event.
 */
export const PIN_LOCK_TIMEOUT_MS = {
  everyTime: 0,
  oneHour: ONE_HOUR_MS,
  threeHours: 3 * ONE_HOUR_MS,
  sixHours: 6 * ONE_HOUR_MS,
  twelveHours: 12 * ONE_HOUR_MS,
  twentyFourHours: ONE_DAY_MS,
  twoDays: 2 * ONE_DAY_MS,
  oneWeek: 7 * ONE_DAY_MS,
  oneMonth: 30 * ONE_DAY_MS,
  oneYear: 365 * ONE_DAY_MS,
} as const;

export type PinLockPolicy = {
  schemaVersion: 1;

  /**
   * Whether a fresh Android process/app launch starts locked.
   */
  lockOnColdStart: boolean;

  /**
   * Time spent backgrounded before the app requires the PIN again.
   *
   * null means no background timeout.
   * 0 means lock whenever the app next becomes active.
   */
  backgroundTimeoutMs: number | null;
};

export const createDefaultPinLockPolicy = (): PinLockPolicy => {
  return {
    schemaVersion: 1,
    lockOnColdStart: true,
    backgroundTimeoutMs: PIN_LOCK_TIMEOUT_MS.threeHours,
  };
};

export type PinLockSecureRecord = {
  schemaVersion: 1;
  algorithm: 'PBKDF2-HMAC-SHA256';
  iterations: number;
  saltBase64: string;
  verifierBase64: string;
  pinLength: PinLength;
  createdAt: string;
  updatedAt: string;
  failedAttempts: number;
  lockoutUntil: number | null;
  policy: PinLockPolicy;
};

export type PinLockStorageErrorCode =
  | 'secure_storage_unavailable'
  | 'secure_record_missing'
  | 'secure_record_invalid'
  | 'local_marker_unavailable'
  | 'unknown';

export type PinLockStorageErrorResult = {
  status: 'storage_error';
  errorCode: PinLockStorageErrorCode;
  debugMessage: string;
};

export type PinLockSetupCheckResult =
  | {
      status: 'unsupported';
    }
  | {
      status: 'needs_setup';
    }
  | {
      status: 'configured';
      pinLength: PinLength;
      policy: PinLockPolicy;
    }
  | PinLockStorageErrorResult;

export type SetUpPinResult =
  | {
      status: 'success';
      pinLength: PinLength;
    }
  | {
      status: 'unsupported';
    }
  | {
      status: 'invalid_format';
    }
  | {
      status: 'already_configured';
      pinLength: PinLength;
    }
  | PinLockStorageErrorResult;

export type VerifyPinResult =
  | {
      status: 'success';
    }
  | {
      status: 'unsupported';
    }
  | {
      status: 'invalid_format';
    }
  | {
      status: 'not_configured';
    }
  | {
      status: 'incorrect';
      failedAttempts: number;
      retryAfterMs: number;
      lockoutUntil: number | null;
    }
  | {
      status: 'cooldown';
      retryAfterMs: number;
      lockoutUntil: number;
    }
  | PinLockStorageErrorResult;

export const isSupportedPinLength = (value: number): value is PinLength => {
  return value === 4 || value === 5 || value === 6;
};

export const isValidPinFormat = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};
