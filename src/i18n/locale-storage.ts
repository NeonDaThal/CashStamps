import { defaultLocale, supportedLocales, type SupportedLocale } from './index';

const LOCALE_STORAGE_KEY = 'bch-voucher-locale';

export const isSupportedLocale = (value: string): value is SupportedLocale => {
  return (supportedLocales as readonly string[]).includes(value);
};

export const getStoredLocale = (): SupportedLocale => {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (storedLocale && isSupportedLocale(storedLocale)) {
    return storedLocale;
  }

  return defaultLocale;
};

export const saveStoredLocale = (locale: SupportedLocale): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
};
