import en from './messages/en';
import es from './messages/es';
import de from './messages/de';
import pt from './messages/pt';
import zhHK from './messages/zh-HK';
import neNP from './messages/ne-NP';
import svSE from './messages/sv-SE';
import sw from './messages/sw';

import faqEn from './faq/en';
import faqEs from './faq/es';
import faqDe from './faq/de';
import faqPt from './faq/pt';
import faqZhHK from './faq/zh-HK';
import faqNeNP from './faq/ne-NP';
import faqSvSE from './faq/sv-SE';
import faqSw from './faq/sw';

export const localeOptions = [
  {
    value: 'en',
    toolbarLabel: 'EN',
    labelKey: 'language.english',
  },
  {
    value: 'es',
    toolbarLabel: 'ES',
    labelKey: 'language.spanish',
  },
  {
    value: 'de',
    toolbarLabel: 'DE',
    labelKey: 'language.german',
  },
  {
    value: 'pt',
    toolbarLabel: 'PT',
    labelKey: 'language.portuguese',
  },
  {
    value: 'zh-HK',
    toolbarLabel: 'HK',
    labelKey: 'language.cantonese',
  },
  {
    value: 'ne-NP',
    toolbarLabel: 'NP',
    labelKey: 'language.nepali',
  },
  {
    value: 'sv-SE',
    toolbarLabel: 'SE',
    labelKey: 'language.swedish',
  },
  {
    value: 'sw',
    toolbarLabel: 'SW',
    labelKey: 'language.swahili',
  },
] as const;

export type SupportedLocale = (typeof localeOptions)[number]['value'];

export type LocaleOption = (typeof localeOptions)[number];

export const supportedLocales: readonly SupportedLocale[] = localeOptions.map(
  (localeOption) => localeOption.value
);

export const defaultLocale: SupportedLocale = 'en';

export const fallbackLocale: SupportedLocale = 'en';

export const getLocaleOption = (value: string): LocaleOption => {
  const exactMatch = localeOptions.find(
    (localeOption) => localeOption.value === value
  );

  if (exactMatch) {
    return exactMatch;
  }

  const mainLanguageCode = value.substring(0, 2);

  const languageMatch = localeOptions.find(
    (localeOption) => localeOption.value.substring(0, 2) === mainLanguageCode
  );

  return languageMatch ?? localeOptions[0];
};

const messages = {
  en: {
    ...en,
    faq: faqEn,
  },

  es: {
    ...es,
    faq: faqEs,
  },

  de: {
    ...de,
    faq: faqDe,
  },

  pt: {
    ...pt,
    faq: faqPt,
  },

  'zh-HK': {
    ...zhHK,
    faq: faqZhHK,
  },

  'ne-NP': {
    ...neNP,
    faq: faqNeNP,
  },

  'sv-SE': {
    ...svSE,
    faq: faqSvSE,
  },

  sw: {
    ...sw,
    faq: faqSw,
  },
};

export default messages;
