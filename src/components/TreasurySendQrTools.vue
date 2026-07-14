<template>
  <div class="treasury-send-qr-tools">
    <q-btn
      flat
      dense
      round
      icon="qr_code_scanner"
      class="treasury-send-qr-tool-button"
      :aria-label="t('treasuryPage.walletTools.scanQr')"
      :loading="isOpeningScanner"
      :disable="isBusy"
      @click="openScannerDialog"
    />

    <q-btn
      flat
      dense
      round
      icon="image_search"
      class="treasury-send-qr-tool-button"
      :aria-label="t('treasuryPage.walletTools.uploadQr')"
      :loading="isUploading"
      :disable="isBusy"
      @click="triggerImageUpload"
    />

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="treasury-send-qr-file-input"
      @change="handleImageSelected"
    />

    <q-dialog
      v-model="showScannerDialog"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
      @show="startScanner"
      @hide="stopScanner"
    >
      <q-card class="treasury-qr-scanner-card">
        <q-card-section class="treasury-qr-scanner-header">
          <div>
            <div class="text-h6">
              {{ t('treasuryPage.walletTools.scannerTitle') }}
            </div>
            <p>
              {{ t('treasuryPage.walletTools.scannerSubtitle') }}
            </p>
          </div>

          <q-btn
            flat
            dense
            round
            icon="close"
            class="treasury-qr-scanner-close-button"
            :aria-label="t('common.close')"
            @click="showScannerDialog = false"
          />
        </q-card-section>

        <q-card-section class="treasury-qr-scanner-body">
          <div class="treasury-qr-video-panel">
            <video
              v-show="isVideoReady"
              ref="videoRef"
              class="treasury-qr-video"
              autoplay
              muted
              playsinline
              @loadedmetadata="handleScannerVideoReady"
              @playing="handleScannerVideoReady"
            ></video>

            <div class="treasury-qr-frame" aria-hidden="true">
              <span></span>
            </div>

            <div
              v-if="isOpeningScanner || !isVideoReady"
              class="treasury-qr-loading"
            >
              <q-spinner v-if="isOpeningScanner" color="green" size="42px" />
            </div>
          </div>

          <canvas ref="canvasRef" class="treasury-qr-canvas"></canvas>

          <q-banner
            v-if="scannerErrorMessage"
            class="bg-red-1 text-red-10 q-mt-md"
            rounded
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>

            {{ scannerErrorMessage }}
          </q-banner>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="treasury-qr-scanner-actions">
          <q-btn
            flat
            color="grey-8"
            :label="t('common.cancel')"
            no-caps
            @click="showScannerDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  openTreasuryQrCameraStream,
  readTreasuryQrFromImageFile,
  readTreasuryQrFromVideoFrame,
  stopTreasuryQrCameraStream,
} from 'src/services/treasury-qr-scanner';

const emit = defineEmits<{
  scanned: [value: string];
  error: [message: string];
}>();

const { t } = useI18n({ useScope: 'global' });

const fileInputRef = ref<HTMLInputElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showScannerDialog = ref(false);
const isOpeningScanner = ref(false);
const isUploading = ref(false);
const isVideoReady = ref(false);
const scannerErrorMessage = ref('');

let cameraStream: MediaStream | null = null;
let scanLoopTimer: number | null = null;

const isBusy = computed(() => isOpeningScanner.value || isUploading.value);

function normalizeError(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function clearScanLoop(): void {
  if (scanLoopTimer !== null) {
    window.clearTimeout(scanLoopTimer);
    scanLoopTimer = null;
  }
}

function scheduleNextFrameScan(): void {
  clearScanLoop();
  scanLoopTimer = window.setTimeout(scanCurrentVideoFrame, 180);
}

function handleDetectedQrValue(value: string): void {
  const scannedValue = value.trim();

  if (!scannedValue) {
    return;
  }

  emit('scanned', scannedValue);
  showScannerDialog.value = false;
}

function scanCurrentVideoFrame(): void {
  if (!showScannerDialog.value || !videoRef.value || !canvasRef.value) {
    return;
  }

  try {
    const qrValue = readTreasuryQrFromVideoFrame(
      videoRef.value,
      canvasRef.value
    );

    if (qrValue) {
      handleDetectedQrValue(qrValue);
      return;
    }
  } catch (error) {
    console.error(error);
  }

  scheduleNextFrameScan();
}

function openScannerDialog(): void {
  scannerErrorMessage.value = '';
  isVideoReady.value = false;
  showScannerDialog.value = true;
}

function handleScannerVideoReady(): void {
  if (videoRef.value?.videoWidth && videoRef.value.videoHeight) {
    isVideoReady.value = true;
  }
}

async function startScanner(): Promise<void> {
  scannerErrorMessage.value = '';
  isVideoReady.value = false;
  isOpeningScanner.value = true;

  try {
    cameraStream = await openTreasuryQrCameraStream();

    if (!videoRef.value) {
      throw new Error('Camera preview is not ready.');
    }

    videoRef.value.srcObject = cameraStream;
    await videoRef.value.play();
    handleScannerVideoReady();

    scheduleNextFrameScan();
  } catch (error) {
    console.error(error);
    scannerErrorMessage.value = normalizeError(
      error,
      t('treasuryPage.walletTools.errors.qrScanFailed')
    );
    emit('error', scannerErrorMessage.value);
  } finally {
    isOpeningScanner.value = false;
  }
}

function stopScanner(): void {
  clearScanLoop();
  isVideoReady.value = false;
  stopTreasuryQrCameraStream(cameraStream);
  cameraStream = null;

  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
}

function triggerImageUpload(): void {
  fileInputRef.value?.click();
}

async function handleImageSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  isUploading.value = true;

  try {
    const qrValue = await readTreasuryQrFromImageFile(file);
    emit('scanned', qrValue);
  } catch (error) {
    console.error(error);
    emit(
      'error',
      normalizeError(error, t('treasuryPage.walletTools.errors.qrUploadFailed'))
    );
  } finally {
    isUploading.value = false;
    input.value = '';
  }
}
</script>

<style lang="scss" scoped>
.treasury-send-qr-tools {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.treasury-send-qr-tool-button {
  background: #111111;
  color: #00ce1b;
  height: 38px;
  width: 38px;
}

.treasury-send-qr-tool-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.treasury-send-qr-file-input {
  display: none;
}

.treasury-qr-scanner-card {
  background: #111111;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.treasury-qr-scanner-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.treasury-qr-scanner-header p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 750;
  line-height: 1.35;
  margin: 5px 0 0;
}

.treasury-qr-scanner-close-button {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  flex: 0 0 auto;
}

.treasury-qr-scanner-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
}

.treasury-qr-video-panel {
  background: #000000;
  border: 1px solid rgba(0, 206, 27, 0.45);
  border-radius: 24px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.38);
  min-height: 55vh;
  overflow: hidden;
  position: relative;
}

.treasury-qr-video {
  height: 100%;
  inset: 0;
  object-fit: cover;
  position: absolute;
  width: 100%;
}

.treasury-qr-frame {
  align-items: center;
  border: 2px solid rgba(0, 206, 27, 0.9);
  border-radius: 24px;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.34);
  display: flex;
  height: min(70vw, 300px);
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(70vw, 300px);
}

.treasury-qr-frame span {
  background: rgba(0, 206, 27, 0.9);
  border-radius: 999px;
  box-shadow: 0 0 18px rgba(0, 206, 27, 0.85);
  height: 8px;
  width: 8px;
}

.treasury-qr-loading {
  align-items: center;
  background: rgba(0, 0, 0, 0.62);
  display: flex;
  inset: 0;
  justify-content: center;
  position: absolute;
}

.treasury-qr-canvas {
  display: none;
}

.treasury-qr-scanner-actions {
  padding: 14px 18px;
}
</style>
