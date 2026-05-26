<template>
  <q-page class="printer-settings-page">
    <section class="hero-card">
      <div class="hero-eyebrow">Printer setup</div>
      <h1>Bluetooth Printer Test</h1>
      <p>
        Connect and test the JK-5803P 58mm ESC/POS Bluetooth printer before the
        live voucher receipt flow is connected.
      </p>
    </section>

    <section class="settings-grid">
      <q-card flat bordered class="settings-card">
        <q-card-section>
          <div class="section-title">Target printer</div>
          <div class="section-copy">
            This first bridge is intentionally narrow and targets your test
            printer directly.
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="printerName"
            outlined
            label="Printer name"
            readonly
          />

          <q-input
            v-model="printerAddress"
            outlined
            label="Bluetooth address"
            hint="From the printer self-test receipt"
          />

          <q-banner rounded class="info-banner">
            <template #avatar>
              <q-icon name="info" />
            </template>

            For this first step, keep the printer turned on and make sure no
            other printer app is currently connected to it.
          </q-banner>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section>
          <div class="section-title">Android bridge status</div>
          <div class="section-copy">
            The native bridge is only available inside the Android APK, not in
            the normal browser preview.
          </div>
        </q-card-section>

        <q-card-section>
          <q-list bordered separator class="status-list">
            <q-item>
              <q-item-section>
                <q-item-label>Current platform</q-item-label>
                <q-item-label caption>{{ platformLabel }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>Bridge available</q-item-label>
                <q-item-label caption>
                  {{ isBridgeAvailable ? 'Yes' : 'No - Android APK required' }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>Printer model</q-item-label>
                <q-item-label caption>JK-5803P / 58mm / ESC/POS</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </section>

    <section class="settings-grid">
      <q-card flat bordered class="settings-card">
        <q-card-section>
          <div class="section-title">Paired devices</div>
          <div class="section-copy">
            This checks which Bluetooth devices Android currently has paired or
            saved.
          </div>
        </q-card-section>

        <q-card-section>
          <q-btn
            color="primary"
            icon="bluetooth_searching"
            label="Check paired devices"
            :disable="!isBridgeAvailable"
            :loading="isCheckingDevices"
            @click="handleCheckPairedDevices"
          />
        </q-card-section>

        <q-card-section v-if="pairedDevices.length > 0">
          <q-list bordered separator class="devices-list">
            <q-item
              v-for="device in pairedDevices"
              :key="device.address"
              clickable
              @click="selectDevice(device)"
            >
              <q-item-section avatar>
                <q-icon name="bluetooth" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ device.name || 'Unnamed Bluetooth device' }}
                </q-item-label>
                <q-item-label caption>
                  {{ device.address }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :color="isTargetPrinter(device) ? 'green' : 'grey'"
                  text-color="white"
                >
                  {{ isTargetPrinter(device) ? 'Target' : 'Paired' }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-section v-else-if="hasCheckedDevices">
          <q-banner rounded class="warning-banner">
            <template #avatar>
              <q-icon name="warning" />
            </template>

            No paired devices were returned. Pair the printer with Android or
            connect once through the generic printer app, then try again.
          </q-banner>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section>
          <div class="section-title">Test printing</div>
          <div class="section-copy">
            These prints are harmless. They do not use voucher records, private
            keys, WIFs, or live receipt data.
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="testMessage" outlined label="Text test message" />

          <q-input v-model="qrPayload" outlined label="QR test payload" />

          <div class="button-row">
            <q-btn
              color="primary"
              icon="print"
              label="Print text test"
              :disable="!isBridgeAvailable"
              :loading="isPrintingText"
              @click="handlePrintTextTest"
            />

            <q-btn
              color="secondary"
              icon="qr_code_2"
              label="Print QR test"
              :disable="!isBridgeAvailable"
              :loading="isPrintingQr"
              @click="handlePrintQrTest"
            />

            <q-btn
              color="dark"
              icon="receipt_long"
              label="Print voucher receipt test"
              :disable="!isBridgeAvailable"
              :loading="isPrintingVoucherReceipt"
              @click="handlePrintVoucherReceiptTest"
            />
          </div>

          <q-banner rounded class="warning-banner">
            <template #avatar>
              <q-icon name="security" />
            </template>

            Voucher/WIF printing is deliberately not connected yet. The voucher
            receipt test uses fake receipt data and a harmless QR payload.
          </q-banner>
        </q-card-section>
      </q-card>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { useQuasar } from 'quasar';

import {
  DEFAULT_JK_5803P_PRINTER,
  getPairedPrinterDevices,
  isAndroidPrinterBridgeAvailable,
  printBluetoothQrTest,
  printBluetoothTextTest,
  printBluetoothVoucherReceiptTest,
  type AndroidPrinterDevice,
} from 'src/services/android-printer';

const $q = useQuasar();

const printerName = ref<string>(DEFAULT_JK_5803P_PRINTER.name);
const printerAddress = ref<string>(DEFAULT_JK_5803P_PRINTER.address);
const testMessage = ref('Testing from BCH Voucher app');
const qrPayload = ref('BCH Voucher Printer QR Test');

const pairedDevices = ref<AndroidPrinterDevice[]>([]);
const hasCheckedDevices = ref(false);

const isCheckingDevices = ref(false);
const isPrintingText = ref(false);
const isPrintingQr = ref(false);
const isPrintingVoucherReceipt = ref(false);

const isBridgeAvailable = computed(() => isAndroidPrinterBridgeAvailable());
const platformLabel = computed(() => Capacitor.getPlatform());

function isTargetPrinter(device: AndroidPrinterDevice): boolean {
  return (
    device.address.toUpperCase() === printerAddress.value.toUpperCase() ||
    device.name === printerName.value
  );
}

function selectDevice(device: AndroidPrinterDevice): void {
  printerName.value = device.name || printerName.value;
  printerAddress.value = device.address;

  $q.notify({
    type: 'positive',
    message: `Selected ${device.name || device.address}`,
  });
}

async function handleCheckPairedDevices(): Promise<void> {
  isCheckingDevices.value = true;
  hasCheckedDevices.value = false;

  try {
    pairedDevices.value = await getPairedPrinterDevices();
    hasCheckedDevices.value = true;

    const matchingPrinter = pairedDevices.value.find((device) =>
      isTargetPrinter(device)
    );

    if (matchingPrinter) {
      printerName.value = matchingPrinter.name || printerName.value;
      printerAddress.value = matchingPrinter.address;
    }

    $q.notify({
      type: 'positive',
      message: `Found ${pairedDevices.value.length} paired Bluetooth device(s).`,
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'Could not check paired Bluetooth devices.',
    });
  } finally {
    isCheckingDevices.value = false;
  }
}

async function handlePrintTextTest(): Promise<void> {
  isPrintingText.value = true;

  try {
    const result = await printBluetoothTextTest({
      name: printerName.value,
      address: printerAddress.value,
      text: testMessage.value,
    });

    $q.notify({
      type: 'positive',
      message: result.message || 'Text test sent to printer.',
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message:
        error instanceof Error ? error.message : 'Text test print failed.',
    });
  } finally {
    isPrintingText.value = false;
  }
}

async function handlePrintQrTest(): Promise<void> {
  isPrintingQr.value = true;

  try {
    const result = await printBluetoothQrTest({
      name: printerName.value,
      address: printerAddress.value,
      qrPayload: qrPayload.value,
    });

    $q.notify({
      type: 'positive',
      message: result.message || 'QR test sent to printer.',
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'QR test print failed.',
    });
  } finally {
    isPrintingQr.value = false;
  }
}

async function handlePrintVoucherReceiptTest(): Promise<void> {
  isPrintingVoucherReceipt.value = true;

  try {
    const result = await printBluetoothVoucherReceiptTest({
      name: printerName.value,
      address: printerAddress.value,
    });

    $q.notify({
      type: 'positive',
      message: result.message || 'Voucher receipt test sent to printer.',
    });
  } catch (error) {
    console.error(error);

    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'Voucher receipt test print failed.',
    });
  } finally {
    isPrintingVoucherReceipt.value = false;
  }
}
</script>

<style scoped>
.printer-settings-page {
  background: #f5f6f5;
  color: #111111;
  min-height: 100%;
  padding: 18px;
}

.hero-card,
.settings-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 24px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
}

.hero-card {
  margin: 0 auto 18px;
  max-width: 980px;
  padding: 24px;
}

.hero-eyebrow {
  color: #008f13;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.hero-card h1 {
  font-size: clamp(28px, 8vw, 44px);
  font-weight: 950;
  letter-spacing: -0.05em;
  line-height: 0.95;
  margin: 0 0 12px;
}

.hero-card p {
  color: #555555;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.45;
  margin: 0;
  max-width: 760px;
}

.settings-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 auto 18px;
  max-width: 980px;
}

.settings-card {
  overflow: hidden;
}

.section-title {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.section-copy {
  color: #666666;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  margin-top: 4px;
}

.info-banner {
  background: #eef7ff;
  color: #064b76;
}

.warning-banner {
  background: #fff4df;
  color: #8a4b00;
}

.status-list,
.devices-list {
  border-radius: 16px;
  overflow: hidden;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 780px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
