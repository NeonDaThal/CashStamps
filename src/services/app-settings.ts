export interface AppSettings {
  businessName: string;
  updatedAt: string | null;
}

export type AppSettingsUpdate = Partial<Omit<AppSettings, 'updatedAt'>>;

const APP_SETTINGS_STORAGE_KEY = 'bch-topup-app-settings';

const defaultAppSettings: AppSettings = {
  businessName: '',
  updatedAt: null,
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

function normalizeBusinessName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeUpdatedAt(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return value;
}

function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return { ...defaultAppSettings };
  }

  const storedSettings = value as Record<string, unknown>;

  return {
    businessName: normalizeBusinessName(storedSettings.businessName),
    updatedAt: normalizeUpdatedAt(storedSettings.updatedAt),
  };
}

export function getAppSettings(): AppSettings {
  const storage = getStorage();

  if (!storage) {
    return { ...defaultAppSettings };
  }

  const storedValue = storage.getItem(APP_SETTINGS_STORAGE_KEY);

  if (!storedValue) {
    return { ...defaultAppSettings };
  }

  try {
    return normalizeAppSettings(JSON.parse(storedValue));
  } catch (error) {
    return { ...defaultAppSettings };
  }
}

export function updateAppSettings(updates: AppSettingsUpdate): AppSettings {
  const storage = getStorage();

  if (!storage) {
    throw new Error('Local app settings storage is unavailable.');
  }

  const currentSettings = getAppSettings();

  const nextSettings: AppSettings = {
    ...currentSettings,
    ...updates,
    businessName:
      updates.businessName !== undefined
        ? normalizeBusinessName(updates.businessName)
        : currentSettings.businessName,
    updatedAt: new Date().toISOString(),
  };

  storage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));

  return nextSettings;
}
