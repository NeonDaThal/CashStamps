import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import messages, { defaultLocale, fallbackLocale } from '../i18n';

export default ({ app }: { app: App }) => {
  const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale,
    messages,
  });

  app.use(i18n);
};
