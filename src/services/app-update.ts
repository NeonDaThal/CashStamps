import { Capacitor, registerPlugin } from '@capacitor/core';

export const appUpdateMetadataUrl =
  'https://raw.githubusercontent.com/NeonDaThal/bitcoin-cash-topup-releases/refs/heads/main/update.json';

const expectedAndroidPackageName = 'app.bitcoincashtopup.android';
const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
const lastAutomaticCheckStorageKey = 'bch-topup-app-update-last-auto-check-at';
const lastInstalledVersionCodeStorageKey =
  'bch-topup-app-update-last-installed-version-code';
const cachedAvailableUpdateStorageKey =
  'bch-topup-app-update-cached-available-result';

type NativeAppInfo = {
  name: string;
  id: string;
  version: string;
  build: string;
};

type NativeAppPlugin = {
  getInfo: () => Promise<NativeAppInfo>;
};

const NativeApp = registerPlugin<NativeAppPlugin>('App');

export type AppUpdateCheckStatus =
  | 'up_to_date'
  | 'update_available'
  | 'installed_newer_than_public'
  | 'unsupported_platform'
  | 'package_mismatch'
  | 'check_failed';

export type InstalledAppVersion = {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  build: string;
};

export type AppUpdateReleaseMetadata = {
  versionCode: number;
  versionName: string;
  releaseTag: string;
  releaseTitle: string;
  releaseDate: string;
  releasePageUrl: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSha256: string;
  signingCertificateSha256: string;
  isPrerelease: boolean;
  releaseNotes: string[];
};

export type AppUpdateMetadata = {
  schemaVersion: number;
  appName: string;
  androidAppLabel: string;
  platform: string;
  packageName: string;
  releaseChannel: string;
  latest: AppUpdateReleaseMetadata;
  minimumSupportedVersionCode: number;
  mandatoryUpdate: boolean;
  updateMessage: string;
  installWarning: string;
};

export type AppUpdateCheckResult = {
  status: AppUpdateCheckStatus;
  installed: InstalledAppVersion;
  metadata?: AppUpdateMetadata;
  latest?: AppUpdateReleaseMetadata;
  errorMessage?: string;
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function readStoredNumber(storageKey: string): number | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const storedValue = storage.getItem(storageKey);

  if (!storedValue) {
    return null;
  }

  const parsedValue = Number.parseInt(storedValue, 10);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function parseVersionCode(build: string): number {
  const parsedBuildNumber = Number.parseInt(build, 10);

  if (Number.isFinite(parsedBuildNumber)) {
    return parsedBuildNumber;
  }

  return 0;
}

function validateUpdateMetadata(
  metadata: AppUpdateMetadata
): AppUpdateMetadata {
  if (!metadata.latest) {
    throw new Error('Update metadata is missing latest release details.');
  }

  if (typeof metadata.latest.versionCode !== 'number') {
    throw new Error('Update metadata latest.versionCode is invalid.');
  }

  if (!metadata.latest.versionName) {
    throw new Error('Update metadata latest.versionName is missing.');
  }

  if (!metadata.latest.releasePageUrl) {
    throw new Error('Update metadata latest.releasePageUrl is missing.');
  }

  return metadata;
}

function saveAvailableUpdateResult(result: AppUpdateCheckResult): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (result.status === 'update_available') {
    storage.setItem(cachedAvailableUpdateStorageKey, JSON.stringify(result));
    return;
  }

  storage.removeItem(cachedAvailableUpdateStorageKey);
}

function recordUpdateCheckResult(result: AppUpdateCheckResult): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(lastAutomaticCheckStorageKey, Date.now().toString());
  storage.setItem(
    lastInstalledVersionCodeStorageKey,
    result.installed.versionCode.toString()
  );

  saveAvailableUpdateResult(result);
}

export function readCachedAppUpdateResult(): AppUpdateCheckResult | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const storedValue = storage.getItem(cachedAvailableUpdateStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedResult = JSON.parse(storedValue) as AppUpdateCheckResult;

    if (
      parsedResult.status === 'update_available' &&
      parsedResult.latest?.releasePageUrl
    ) {
      return parsedResult;
    }
  } catch (error) {
    storage.removeItem(cachedAvailableUpdateStorageKey);
  }

  return null;
}

async function getInstalledAppVersion(): Promise<InstalledAppVersion> {
  if (Capacitor.getPlatform() !== 'android') {
    return {
      appName: 'Bitcoin Cash Topup',
      packageName: 'web-preview',
      versionName: 'web-preview',
      versionCode: 0,
      build: '0',
    };
  }

  try {
    const appInfo = await NativeApp.getInfo();

    return {
      appName: appInfo.name,
      packageName: appInfo.id,
      versionName: appInfo.version,
      versionCode: parseVersionCode(appInfo.build),
      build: appInfo.build,
    };
  } catch (error) {
    return {
      appName: 'Bitcoin Cash Topup',
      packageName: 'unknown-android-app',
      versionName: 'unknown',
      versionCode: 0,
      build: '0',
    };
  }
}

async function fetchUpdateMetadata(): Promise<AppUpdateMetadata> {
  const cacheBustedUrl = `${appUpdateMetadataUrl}?t=${Date.now()}`;
  const response = await fetch(cacheBustedUrl, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Update metadata request failed: ${response.status}`);
  }

  const metadata = (await response.json()) as AppUpdateMetadata;

  return validateUpdateMetadata(metadata);
}

async function checkForAppUpdateWithInstalledVersion(
  installed: InstalledAppVersion
): Promise<AppUpdateCheckResult> {
  try {
    const metadata = await fetchUpdateMetadata();
    const latest = metadata.latest;

    if (metadata.packageName !== expectedAndroidPackageName) {
      return {
        status: 'package_mismatch',
        installed,
        metadata,
        latest,
      };
    }

    if (
      Capacitor.getPlatform() !== 'android' ||
      installed.packageName !== expectedAndroidPackageName
    ) {
      return {
        status: 'unsupported_platform',
        installed,
        metadata,
        latest,
      };
    }

    if (latest.versionCode > installed.versionCode) {
      return {
        status: 'update_available',
        installed,
        metadata,
        latest,
      };
    }

    if (latest.versionCode < installed.versionCode) {
      return {
        status: 'installed_newer_than_public',
        installed,
        metadata,
        latest,
      };
    }

    return {
      status: 'up_to_date',
      installed,
      metadata,
      latest,
    };
  } catch (error) {
    return {
      status: 'check_failed',
      installed,
      errorMessage:
        error instanceof Error ? error.message : 'Could not check for updates.',
    };
  }
}

export async function checkForAppUpdate(): Promise<AppUpdateCheckResult> {
  const installed = await getInstalledAppVersion();
  const result = await checkForAppUpdateWithInstalledVersion(installed);

  recordUpdateCheckResult(result);

  return result;
}

export async function runAutomaticAppUpdateCheck(): Promise<AppUpdateCheckResult | null> {
  const installed = await getInstalledAppVersion();
  const lastAutomaticCheckAt = readStoredNumber(lastAutomaticCheckStorageKey);
  const lastInstalledVersionCode = readStoredNumber(
    lastInstalledVersionCodeStorageKey
  );
  const now = Date.now();

  const hasNeverChecked = lastAutomaticCheckAt === null;
  const isDailyCheckDue =
    lastAutomaticCheckAt === null ||
    now - lastAutomaticCheckAt >= oneDayInMilliseconds;
  const installedVersionChanged =
    lastInstalledVersionCode !== null &&
    lastInstalledVersionCode !== installed.versionCode;

  if (!hasNeverChecked && !isDailyCheckDue && !installedVersionChanged) {
    return null;
  }

  const result = await checkForAppUpdateWithInstalledVersion(installed);

  recordUpdateCheckResult(result);

  return result;
}
