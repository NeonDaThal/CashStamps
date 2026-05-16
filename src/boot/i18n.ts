import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import messages, { fallbackLocale } from '../i18n';
import { getStoredLocale } from '../i18n/locale-storage';

export default ({ app }: { app: App }) => {
  const i18n = createI18n({
    legacy: false,
    locale: getStoredLocale(),
    fallbackLocale,
    messages,
  });

  app.use(i18n);
};
