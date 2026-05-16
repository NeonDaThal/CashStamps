<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark">
      <q-toolbar class="row">
        <q-toolbar-title class="col-shrink">
          <span @click="$router.push('/')" class="cursor-pointer">
            <q-avatar square>
              <img src="/icon.svg" />
            </q-avatar>
            Stamps.<span class="text-primary">Cash</span>
          </span>
        </q-toolbar-title>

        <!-- Right Buttons -->
        <div class="col-grow text-right q-gutter-x-xs">
          <!-- Telegram -->
          <q-btn
            round
            flat
            icon="img:telegram.svg"
            type="a"
            href="https://t.me/cashstamps"
            target="_blank"
          >
            <q-tooltip>Telegram</q-tooltip>
          </q-btn>
          <!-- X -->
          <q-btn
            round
            flat
            icon="img:x.svg"
            type="a"
            href="https://x.com/cashstamps"
            target="_blank"
          >
            <q-tooltip>X</q-tooltip>
          </q-btn>
          <!-- Git -->
          <q-btn
            round
            flat
            icon="img:github.svg"
            type="a"
            href="https://github.com/harvmaster/CashStamps"
            target="_blank"
          >
            <q-tooltip>Source Code</q-tooltip>
          </q-btn>
          <!-- FAQ -->
          <q-btn round flat icon="img:help.svg" to="/faq">
            <q-tooltip>FAQ</q-tooltip>
          </q-btn>

          <!-- Locale Selector -->
          <q-btn
            round
            flat
            :label="localeShortLabel"
            :aria-label="t('language.label')"
          >
            <q-tooltip>{{ t('language.label') }}</q-tooltip>

            <q-menu auto-close>
              <q-list style="min-width: 120px">
                <q-item clickable @click="setLocale('en')">
                  <q-item-section>{{ t('language.english') }}</q-item-section>
                </q-item>
                <q-item clickable @click="setLocale('es')">
                  <q-item-section>{{ t('language.spanish') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition appear enter-active-class="animated fadeIn">
          <Suspense @pending="$q.loading.show()" @resolve="$q.loading.hide()">
            <component :is="Component" />
          </Suspense>
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
.q-header {
  color: #fff;
  font-family: 'Anton', sans-serif;
  font-weight: 400;
  font-style: normal;
}

.q-toolbar .q-toolbar__title {
  font-size: 26px;
}

.q-toolbar a img {
  width: 24px;
  height: 24px;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { SupportedLocale } from '../i18n';
import { saveStoredLocale } from '../i18n/locale-storage';

const $router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });
const $q = useQuasar();

const localeShortLabel = computed((): string => {
  const localeMain = locale.value.substring(0, 2);

  if (localeMain === 'es') {
    return 'ES';
  }

  return 'EN';
});

const setLocale = (newLocale: SupportedLocale) => {
  locale.value = newLocale;
  saveStoredLocale(newLocale);
};
</script>
