<template>
  <q-card v-if="treasuryAddress" flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h5 q-mb-xs">
        {{ t('treasuryTopUpQr.title') }}
      </div>
      <p class="text-grey-7 q-mb-none">
        {{ t('treasuryTopUpQr.subtitle') }}
      </p>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="qr_code" />
        </template>

        {{ t('treasuryTopUpQr.receiveOnlyNotice') }}
      </q-banner>

      <div class="row items-start q-col-gutter-md">
        <div class="col-12 col-sm-auto">
          <q-card flat bordered class="bg-white">
            <q-card-section class="flex flex-center">
              <q-spinner v-if="isGeneratingQr" color="primary" size="42px" />

              <q-img
                v-else-if="qrDataUrl"
                :src="qrDataUrl"
                :alt="t('treasuryTopUpQr.qrAlt')"
                style="width: 220px; height: 220px"
                fit="contain"
              />

              <div v-else class="text-negative">
                {{ t('treasuryTopUpQr.qrUnavailable') }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col">
          <q-list bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>
                  {{ t('treasuryTopUpQr.treasuryAddress') }}
                </q-item-label>
                <q-item-label class="text-break">
                  {{ topUpUri.address }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>
                  {{ t('treasuryTopUpQr.paymentUri') }}
                </q-item-label>
                <q-item-label class="text-break">
                  {{ topUpUri.uri }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>
                  {{ t('treasuryTopUpQr.qrGenerated') }}
                </q-item-label>
                <q-item-label>
                  {{ formatDateTime(topUpUri.createdAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="row q-col-gutter-sm q-mt-md">
            <div class="col-12 col-sm-auto">
              <q-btn
                color="primary"
                outline
                :label="t('treasuryTopUpQr.copyAddress')"
                @click="handleCopyAddress"
              />
            </div>

            <div class="col-12 col-sm-auto">
              <q-btn
                color="primary"
                outline
                :label="t('treasuryTopUpQr.copyPaymentUri')"
                @click="handleCopyUri"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// qrcode is a CommonJS package. This browser subpath avoids Vite import-analysis
// issues seen with the package root import in this older Quasar/Vite setup.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode/lib/browser';
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { createTreasuryTopUpUri } from 'src/services/treasury-topup-uri';

const props = defineProps<{
  treasuryAddress: string;
}>();

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

const qrDataUrl = ref('');
const isGeneratingQr = ref(false);

const topUpUri = computed(() =>
  createTreasuryTopUpUri({
    address: props.treasuryAddress,
  })
);

async function generateQrCode(): Promise<void> {
  qrDataUrl.value = '';

  if (!props.treasuryAddress) {
    return;
  }

  isGeneratingQr.value = true;

  try {
    qrDataUrl.value = await QRCode.toDataURL(topUpUri.value.uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 420,
    });
  } catch (error) {
    console.error(error);
    qrDataUrl.value = '';
  } finally {
    isGeneratingQr.value = false;
  }
}

async function copyToClipboard(
  value: string,
  successMessage: string
): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);

    $q.notify({
      type: 'positive',
      message: successMessage,
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message: t('treasuryTopUpQr.copyFailed'),
    });
  }
}

function handleCopyAddress(): void {
  void copyToClipboard(
    topUpUri.value.address,
    t('treasuryTopUpQr.addressCopied')
  );
}

function handleCopyUri(): void {
  void copyToClipboard(topUpUri.value.uri, t('treasuryTopUpQr.uriCopied'));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

onMounted(() => {
  void generateQrCode();
});

watch(
  () => props.treasuryAddress,
  () => {
    void generateQrCode();
  }
);
</script>
