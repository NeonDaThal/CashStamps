import en from './messages/en';
import es from './messages/es';
import de from './messages/de';
import pt from './messages/pt';
import zhHK from './messages/zh-HK';

export const supportedLocales = ['en', 'es', 'de', 'pt', 'zh-HK'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en';

export const fallbackLocale: SupportedLocale = 'en';

const messages = {
  en,
  es,
  de,
  pt,
  'zh-HK': zhHK,
};

export default messages;
