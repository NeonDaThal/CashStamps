import en from './messages/en';
import es from './messages/es';

export const supportedLocales = ['en', 'es'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en';

export const fallbackLocale: SupportedLocale = 'en';

const messages = {
  en,
  es,
};

export default messages;
