import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  createDefaultPinLockPolicy,
  isSupportedPinLength,
  isValidPinFormat,
  type PinLockPolicy,
  type PinLockSecureRecord,
  type PinLockSetupCheckResult,
  type PinLockStorageErrorCode,
  type PinLockStorageErrorResult,
  type SetUpPinResult,
  type VerifyPinResult,
} from '../types/pin-lock';

type NativeSecureStoragePlugin = {
  internalGetItem: (options: {
    prefixedKey: string;
    sync: boolean;
  }) => Promise<{
    data: string | null;
  }>;

  internalSetItem: (options: {
    prefixedKey: string;
    data: string;
    sync: boolean;
    access: number;
  }) => Promise<void>;
};

const NativeSecureStorage =
  registerPlugin<NativeSecureStoragePlugin>('SecureStorage');

const PIN_SETUP_MARKER_STORAGE_KEY = 'bch-topups-pin-lock-configured-v1';

const PIN_SECURE_RECORD_KEY = 'bch-topups-pin-lock:secure-record-v1';

const PIN_ALGORITHM = 'PBKDF2-HMAC-SHA256' as const;
const PIN_PBKDF2_ITERATIONS = 600_000;
const PIN_SALT_BYTE_LENGTH = 16;
const PIN_VERIFIER_BIT_LENGTH = 256;
const PIN_VERIFIER_BYTE_LENGTH = PIN_VERIFIER_BIT_LENGTH / 8;

const MAX_ACCEPTED_PBKDF2_ITERATIONS = 2_000_000;

class PinLockServiceError extends Error {
  public readonly code: PinLockStorageErrorCode;

  public constructor(code: PinLockStorageErrorCode, message: string) {
    super(message);
    this.name = 'PinLockServiceError';
    this.code = code;
  }
}

export const isAndroidPinLockPlatform = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown PIN lock error occurred.';
}

function createStorageErrorResult(
  error: unknown,
  fallbackCode: PinLockStorageErrorCode = 'secure_storage_unavailable'
): PinLockStorageErrorResult {
  return {
    status: 'storage_error',
    errorCode: error instanceof PinLockServiceError ? error.code : fallbackCode,
    debugMessage: getErrorMessage(error),
  };
}

function readSetupMarker(): boolean {
  if (typeof window === 'undefined') {
    throw new PinLockServiceError(
      'local_marker_unavailable',
      'PIN setup marker storage is unavailable.'
    );
  }

  try {
    return (
      window.localStorage.getItem(PIN_SETUP_MARKER_STORAGE_KEY) === 'configured'
    );
  } catch (error) {
    throw new PinLockServiceError(
      'local_marker_unavailable',
      `Could not read the PIN setup marker: ${getErrorMessage(error)}`
    );
  }
}

function writeSetupMarker(): void {
  if (typeof window === 'undefined') {
    throw new PinLockServiceError(
      'local_marker_unavailable',
      'PIN setup marker storage is unavailable.'
    );
  }

  try {
    window.localStorage.setItem(PIN_SETUP_MARKER_STORAGE_KEY, 'configured');
  } catch (error) {
    throw new PinLockServiceError(
      'local_marker_unavailable',
      `Could not save the PIN setup marker: ${getErrorMessage(error)}`
    );
  }
}

async function readSecureRecordString(): Promise<string | null> {
  try {
    const result = await NativeSecureStorage.internalGetItem({
      prefixedKey: PIN_SECURE_RECORD_KEY,
      sync: false,
    });

    return result.data;
  } catch (error) {
    throw new PinLockServiceError(
      'secure_storage_unavailable',
      `Could not read Android secure storage: ${getErrorMessage(error)}`
    );
  }
}

async function writeSecureRecord(record: PinLockSecureRecord): Promise<void> {
  try {
    await NativeSecureStorage.internalSetItem({
      prefixedKey: PIN_SECURE_RECORD_KEY,
      data: JSON.stringify(record),
      sync: false,

      /**
       * The secure-storage plugin's first keychain-access enum
       * value is zero. Android ignores this iOS-only option.
       */
      access: 0,
    });
  } catch (error) {
    throw new PinLockServiceError(
      'secure_storage_unavailable',
      `Could not write Android secure storage: ${getErrorMessage(error)}`
    );
  }
}

function getCryptoApi(): Crypto {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || !cryptoApi.subtle) {
    throw new PinLockServiceError(
      'secure_storage_unavailable',
      'The device cryptography API is unavailable.'
    );
  }

  return cryptoApi;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return copy.buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return window.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function createRandomSalt(): Uint8Array {
  const salt = new Uint8Array(PIN_SALT_BYTE_LENGTH);
  getCryptoApi().getRandomValues(salt);

  return salt;
}

async function derivePinVerifier(
  pin: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const cryptoApi = getCryptoApi();

  const encodedPinBuffer = toArrayBuffer(new TextEncoder().encode(pin));

  const saltBuffer = toArrayBuffer(salt);

  const keyMaterial = await cryptoApi.subtle.importKey(
    'raw',
    encodedPinBuffer,
    {
      name: 'PBKDF2',
    },
    false,
    ['deriveBits']
  );

  const derivedBits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBuffer,
      iterations,
    },
    keyMaterial,
    PIN_VERIFIER_BIT_LENGTH
  );

  return new Uint8Array(derivedBits);
}

function constantTimeBytesEqual(
  first: Uint8Array,
  second: Uint8Array
): boolean {
  const comparisonLength = Math.max(first.length, second.length);

  let difference = first.length ^ second.length;

  for (let index = 0; index < comparisonLength; index += 1) {
    const firstByte = index < first.length ? first[index] : 0;
    const secondByte = index < second.length ? second[index] : 0;

    difference |= firstByte ^ secondByte;
  }

  return difference === 0;
}

function isValidPolicy(value: unknown): value is PinLockPolicy {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const policy = value as Partial<PinLockPolicy>;

  const hasValidTimeout =
    policy.backgroundTimeoutMs === null ||
    (typeof policy.backgroundTimeoutMs === 'number' &&
      Number.isFinite(policy.backgroundTimeoutMs) &&
      policy.backgroundTimeoutMs >= 0);

  return (
    policy.schemaVersion === 1 &&
    typeof policy.lockOnColdStart === 'boolean' &&
    hasValidTimeout
  );
}

function isValidSecureRecord(value: unknown): value is PinLockSecureRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<PinLockSecureRecord>;

  if (
    record.schemaVersion !== 1 ||
    record.algorithm !== PIN_ALGORITHM ||
    typeof record.iterations !== 'number' ||
    !Number.isInteger(record.iterations) ||
    record.iterations < 100_000 ||
    record.iterations > MAX_ACCEPTED_PBKDF2_ITERATIONS ||
    typeof record.saltBase64 !== 'string' ||
    typeof record.verifierBase64 !== 'string' ||
    typeof record.pinLength !== 'number' ||
    !isSupportedPinLength(record.pinLength) ||
    typeof record.createdAt !== 'string' ||
    Number.isNaN(Date.parse(record.createdAt)) ||
    typeof record.updatedAt !== 'string' ||
    Number.isNaN(Date.parse(record.updatedAt)) ||
    typeof record.failedAttempts !== 'number' ||
    !Number.isInteger(record.failedAttempts) ||
    record.failedAttempts < 0 ||
    !isValidPolicy(record.policy)
  ) {
    return false;
  }

  const hasValidLockout =
    record.lockoutUntil === null ||
    (typeof record.lockoutUntil === 'number' &&
      Number.isFinite(record.lockoutUntil) &&
      record.lockoutUntil >= 0);

  if (!hasValidLockout) {
    return false;
  }

  try {
    const salt = base64ToBytes(record.saltBase64);
    const verifier = base64ToBytes(record.verifierBase64);

    return (
      salt.length === PIN_SALT_BYTE_LENGTH &&
      verifier.length === PIN_VERIFIER_BYTE_LENGTH
    );
  } catch (error) {
    return false;
  }
}

function parseSecureRecord(storedValue: string): PinLockSecureRecord {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    throw new PinLockServiceError(
      'secure_record_invalid',
      'The stored PIN security record is not valid JSON.'
    );
  }

  if (!isValidSecureRecord(parsedValue)) {
    throw new PinLockServiceError(
      'secure_record_invalid',
      'The stored PIN security record is invalid.'
    );
  }

  return parsedValue;
}

async function loadSecureRecord(): Promise<PinLockSecureRecord | null> {
  const storedValue = await readSecureRecordString();

  if (storedValue === null) {
    return null;
  }

  return parseSecureRecord(storedValue);
}

function getCooldownDurationMs(failedAttempts: number): number {
  if (failedAttempts < 5) {
    return 0;
  }

  if (failedAttempts === 5) {
    return 30 * 1000;
  }

  if (failedAttempts === 6) {
    return 60 * 1000;
  }

  if (failedAttempts === 7) {
    return 2 * 60 * 1000;
  }

  if (failedAttempts === 8) {
    return 5 * 60 * 1000;
  }

  return 15 * 60 * 1000;
}

async function recordIncorrectAttempt(
  record: PinLockSecureRecord
): Promise<VerifyPinResult> {
  const failedAttempts = record.failedAttempts + 1;
  const retryAfterMs = getCooldownDurationMs(failedAttempts);

  const lockoutUntil = retryAfterMs > 0 ? Date.now() + retryAfterMs : null;

  const updatedRecord: PinLockSecureRecord = {
    ...record,
    failedAttempts,
    lockoutUntil,
    updatedAt: new Date().toISOString(),
  };

  await writeSecureRecord(updatedRecord);

  return {
    status: 'incorrect',
    failedAttempts,
    retryAfterMs,
    lockoutUntil,
  };
}

export async function checkPinLockSetup(): Promise<PinLockSetupCheckResult> {
  if (!isAndroidPinLockPlatform()) {
    return {
      status: 'unsupported',
    };
  }

  try {
    const setupMarkerExists = readSetupMarker();
    const secureRecord = await loadSecureRecord();

    if (!secureRecord) {
      if (setupMarkerExists) {
        return {
          status: 'storage_error',
          errorCode: 'secure_record_missing',
          debugMessage:
            'The app remembers that a PIN was configured, but its secure PIN record is missing.',
        };
      }

      return {
        status: 'needs_setup',
      };
    }

    /**
     * If the secure record exists but the non-secret marker is
     * missing, safely repair the marker.
     */
    if (!setupMarkerExists) {
      writeSetupMarker();
    }

    return {
      status: 'configured',
      pinLength: secureRecord.pinLength,
      policy: secureRecord.policy,
    };
  } catch (error) {
    return createStorageErrorResult(error);
  }
}

export async function setUpPin(pin: string): Promise<SetUpPinResult> {
  if (!isAndroidPinLockPlatform()) {
    return {
      status: 'unsupported',
    };
  }

  if (!isValidPinFormat(pin)) {
    return {
      status: 'invalid_format',
    };
  }

  const setupCheck = await checkPinLockSetup();

  if (setupCheck.status === 'configured') {
    return {
      status: 'already_configured',
      pinLength: setupCheck.pinLength,
    };
  }

  if (setupCheck.status === 'storage_error') {
    return setupCheck;
  }

  if (setupCheck.status === 'unsupported') {
    return setupCheck;
  }

  try {
    const salt = createRandomSalt();
    const verifier = await derivePinVerifier(pin, salt, PIN_PBKDF2_ITERATIONS);

    const now = new Date().toISOString();

    const secureRecord: PinLockSecureRecord = {
      schemaVersion: 1,
      algorithm: PIN_ALGORITHM,
      iterations: PIN_PBKDF2_ITERATIONS,
      saltBase64: bytesToBase64(salt),
      verifierBase64: bytesToBase64(verifier),
      pinLength: pin.length as 4 | 5 | 6,
      createdAt: now,
      updatedAt: now,
      failedAttempts: 0,
      lockoutUntil: null,
      policy: createDefaultPinLockPolicy(),
    };

    /**
     * Save the encrypted record first. The non-secret marker is
     * only written after secure storage succeeds.
     */
    await writeSecureRecord(secureRecord);
    writeSetupMarker();

    return {
      status: 'success',
      pinLength: secureRecord.pinLength,
    };
  } catch (error) {
    return createStorageErrorResult(error);
  }
}

export async function verifyPin(pin: string): Promise<VerifyPinResult> {
  if (!isAndroidPinLockPlatform()) {
    return {
      status: 'unsupported',
    };
  }

  if (!isValidPinFormat(pin)) {
    return {
      status: 'invalid_format',
    };
  }

  try {
    const setupMarkerExists = readSetupMarker();
    const secureRecord = await loadSecureRecord();

    if (!secureRecord) {
      if (setupMarkerExists) {
        return {
          status: 'storage_error',
          errorCode: 'secure_record_missing',
          debugMessage:
            'The app remembers that a PIN was configured, but its secure PIN record is missing.',
        };
      }

      return {
        status: 'not_configured',
      };
    }

    if (!setupMarkerExists) {
      writeSetupMarker();
    }

    const now = Date.now();

    if (secureRecord.lockoutUntil !== null && secureRecord.lockoutUntil > now) {
      return {
        status: 'cooldown',
        retryAfterMs: secureRecord.lockoutUntil - now,
        lockoutUntil: secureRecord.lockoutUntil,
      };
    }

    const salt = base64ToBytes(secureRecord.saltBase64);

    const submittedVerifier = await derivePinVerifier(
      pin,
      salt,
      secureRecord.iterations
    );

    const storedVerifier = base64ToBytes(secureRecord.verifierBase64);

    const isCorrect = constantTimeBytesEqual(submittedVerifier, storedVerifier);

    if (!isCorrect) {
      return await recordIncorrectAttempt(secureRecord);
    }

    if (secureRecord.failedAttempts > 0 || secureRecord.lockoutUntil !== null) {
      await writeSecureRecord({
        ...secureRecord,
        failedAttempts: 0,
        lockoutUntil: null,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      status: 'success',
    };
  } catch (error) {
    return createStorageErrorResult(error);
  }
}
