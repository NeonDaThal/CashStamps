import en from './messages/en';
import es from './messages/es';
import de from './messages/de';
import pt from './messages/pt';
import zhHK from './messages/zh-HK';
import neNP from './messages/ne-NP';
import svSE from './messages/sv-SE';

export const supportedLocales = [
  'en',
  'es',
  'de',
  'pt',
  'zh-HK',
  'ne-NP',
  'sv-SE',
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en';

export const fallbackLocale: SupportedLocale = 'en';

const messages = {
  en,
  es,
  de,
  pt,
  'zh-HK': zhHK,
  'ne-NP': neNP,
  'sv-SE': svSE,
};

export default messages;
