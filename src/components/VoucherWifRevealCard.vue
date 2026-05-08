<template>
  <q-card v-if="canShow" flat bordered class="q-mt-sm">
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">Voucher WIF / Sweep QR</div>

      <q-banner class="bg-orange-1 text-orange-10 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="warning" />
        </template>

        Development-only recovery tool. Anyone with this WIF can sweep the BCH
        from this voucher address. Only reveal it in a private testing
        environment.
      </q-banner>

      <q-banner
        v-if="errorMessage"
        class="bg-red-1 text-red-10 q-mb-md"
        rounded
      >
        <template #avatar>
          <q-icon name="warning" />
        </template>

        {{ errorMessage }}
      </q-banner>

      <q-banner
        v-if="voucherKey && !isWifVisible"
        class="bg-grey-2 text-grey-9 q-mb-md"
        rounded
      >
        WIF loaded but hidden.
      </q-banner>

      <q-list v-if="voucherKey" dense bordered separator class="q-mb-md">
        <q-item>
          <q-item-section>
            <q-item-label caption>Voucher address</q-item-label>
            <q-item-label class="text-break">
              {{ voucherKey.address }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section>
            <q-item-label caption>Derivation index</q-item-label>
            <q-item-label>
              {{ voucherKey.derivationIndex }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section>
            <q-item-label caption>WIF</q-item-label>
            <q-item-label class="text-break">
              {{ isWifVisible ? voucherKey.wif : redactedWif }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section>
            <q-item-label caption>Loaded</q-item-label>
            <q-item-label>
              {{ formatDate(voucherKey.createdAt) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-if="voucherKey && isWifVisible"
        class="row items-start q-col-gutter-md q-mb-md"
      >
        <div class="col-12 col-sm-auto">
          <q-card flat bordered class="bg-white">
            <q-card-section class="flex flex-center">
              <q-spinner v-if="isGeneratingQr" color="primary" size="42px" />

              <q-img
                v-else-if="qrDataUrl"
                :src="qrDataUrl"
                alt="Voucher WIF QR code"
                style="width: 220px; height: 220px"
                fit="contain"
              />

              <div v-else class="text-negative">WIF QR unavailable.</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col">
          <q-banner class="bg-blue-1 text-blue-10" rounded>
            Scan this QR with a BCH wallet that supports WIF sweep/import to
            recover the BCH from this voucher address.
          </q-banner>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-auto">
          <q-btn
            v-if="!voucherKey"
            color="primary"
            outline
            label="Load Voucher WIF"
            :loading="isLoading"
            @click="handleLoadWif"
          />
        </div>

        <div class="col-12 col-sm-auto">
          <q-btn
            v-if="voucherKey && !isWifVisible"
            color="negative"
            outline
            label="Reveal WIF + QR"
            @click="handleRevealWif"
          />
        </div>

        <div class="col-12 col-sm-auto">
          <q-btn
            v-if="voucherKey && isWifVisible"
            color="grey-8"
            outline
            label="Hide WIF"
            @click="handleHideWif"
          />
        </div>

        <div class="col-12 col-sm-auto">
          <q-btn
            v-if="voucherKey && isWifVisible"
            color="primary"
            outline
            label="Copy WIF"
            @click="handleCopyWif"
          />
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
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import { redactSensitiveKey } from 'src/services/voucher-key-redaction';
import { exportVoucherKeyAtIndex } from 'src/services/voucher-wallet';
import type { VoucherKeyExport } from 'src/types/voucher-key';

const props = defineProps<{
  derivationIndex: number;
  voucherAddress?: string;
  hasWif?: boolean;
}>();

const $q = useQuasar();

const voucherKey = ref<VoucherKeyExport | null>(null);
const qrDataUrl = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const isWifVisible = ref(false);
const isGeneratingQr = ref(false);

const canShow = computed(() => {
  return props.hasWif === true && props.derivationIndex >= 0;
});

const redactedWif = computed(() => {
  return voucherKey.value ? redactSensitiveKey(voucherKey.value.wif) : '';
});

async function generateQrCode(): Promise<void> {
  qrDataUrl.value = '';

  if (!voucherKey.value?.wif) {
    return;
  }

  isGeneratingQr.value = true;

  try {
    qrDataUrl.value = await QRCode.toDataURL(voucherKey.value.wif, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 420,
    });
  } catch (error) {
    console.error(error);
    qrDataUrl.value = '';
    errorMessage.value = 'Could not generate WIF QR code.';
  } finally {
    isGeneratingQr.value = false;
  }
}

async function handleLoadWif(): Promise<void> {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const exportedKey = await exportVoucherKeyAtIndex(props.derivationIndex);

    if (props.voucherAddress && exportedKey.address !== props.voucherAddress) {
      throw new Error(
        'Derived WIF address does not match this voucher address.'
      );
    }

    voucherKey.value = exportedKey;
    isWifVisible.value = false;
  } catch (error) {
    console.error(error);
    voucherKey.value = null;
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load voucher WIF.';
  } finally {
    isLoading.value = false;
  }
}

async function handleRevealWif(): Promise<void> {
  errorMessage.value = '';

  if (!voucherKey.value) {
    await handleLoadWif();
  }

  if (!voucherKey.value) {
    return;
  }

  isWifVisible.value = true;
  await generateQrCode();
}

function handleHideWif(): void {
  isWifVisible.value = false;
  qrDataUrl.value = '';
}

async function handleCopyWif(): Promise<void> {
  if (!voucherKey.value?.wif) {
    return;
  }

  try {
    await navigator.clipboard.writeText(voucherKey.value.wif);

    $q.notify({
      type: 'positive',
      message: 'Voucher WIF copied.',
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message: 'Could not copy WIF.',
    });
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
</script>
