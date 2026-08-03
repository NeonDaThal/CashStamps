<template>
  <Suspense>
    <PinLockGate>
      <router-view />
    </PinLockGate>
  </Suspense>
</template>

<script setup lang="ts">
import { onErrorCaptured } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import PinLockGate from './components/PinLockGate.vue';
import { getStoredLocale } from './i18n/locale-storage';

const $q = useQuasar();

const { locale } = useI18n({
  useScope: 'global',
});

locale.value = getStoredLocale();

onErrorCaptured((error) => {
  console.error(error);

  $q.loading.hide();

  $q.dialog({
    title: 'Error',
    message: `${error.message}: This may be a connectivity problem or a service this depends on might be currently unavailable.`,
    ok: 'Reload',
  }).onOk(() => {
    window.location.reload();
  });
});
</script>
