import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AndroidPrinterDevice {
  name: string;
  address: string;
  bondState: number;
}

export interface AndroidPrinterResult {
  success: boolean;
  printerName: string;
  address: string;
  message: string;
}

interface BluetoothEscPosPrinterPlugin {
  getPairedDevices(): Promise<{
    devices: AndroidPrinterDevice[];
  }>;

  printTestPage(options: {
    name?: string;
    address?: string;
    text?: string;
  }): Promise<AndroidPrinterResult>;

  printQrTest(options: {
    name?: string;
    address?: string;
    qrPayload?: string;
  }): Promise<AndroidPrinterResult>;
}

export const DEFAULT_JK_5803P_PRINTER = {
  name: 'JK-5803P',
  address: '60:6E:41:45:8C:14',
} as const;

const BluetoothEscPosPrinter =
  registerPlugin<BluetoothEscPosPrinterPlugin>('BluetoothEscPosPrinter');

export function isAndroidPrinterBridgeAvailable(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export async function getPairedPrinterDevices(): Promise<
  AndroidPrinterDevice[]
> {
  if (!isAndroidPrinterBridgeAvailable()) {
    return [];
  }

  const result = await BluetoothEscPosPrinter.getPairedDevices();
  return result.devices;
}

export async function printBluetoothTextTest(options?: {
  name?: string;
  address?: string;
  text?: string;
}): Promise<AndroidPrinterResult> {
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new Error('Android Bluetooth printer bridge is only available in the Android app.');
  }

  return BluetoothEscPosPrinter.printTestPage({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
    text: options?.text ?? 'Testing from BCH Voucher Android app',
  });
}

export async function printBluetoothQrTest(options?: {
  name?: string;
  address?: string;
  qrPayload?: string;
}): Promise<AndroidPrinterResult> {
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new Error('Android Bluetooth printer bridge is only available in the Android app.');
  }

  return BluetoothEscPosPrinter.printQrTest({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
    qrPayload: options?.qrPayload ?? 'BCH Voucher Printer QR Test',
  });
}
