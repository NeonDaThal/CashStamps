import en from './messages/en';
import es from './messages/es';
import de from './messages/de';

export const supportedLocales = ['en', 'es', 'de'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en';

export const fallbackLocale: SupportedLocale = 'en';

const messages = {
  en,
  es,
  de,
};

export default messages;
