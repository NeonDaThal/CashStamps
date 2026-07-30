import { Capacitor, registerPlugin } from '@capacitor/core';

import type { VoucherReceiptData } from 'src/services/voucher-receipt';

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

  printVoucherReceiptTest(options: {
    name?: string;
    address?: string;
  }): Promise<AndroidPrinterResult>;

  printCharacterEncodingTest(options: {
    name?: string;
    address?: string;
  }): Promise<AndroidPrinterResult>;

  printRasterTextTest(options: {
    name?: string;
    address?: string;
  }): Promise<AndroidPrinterResult>;

  printVoucherReceipt(options: {
    name?: string;
    address?: string;
    title: string;
    serial: string;
    issuedAtLabel: string;
    customerPaidLabel: string;
    loadedFiatLabel: string;
    bchAmountLabel: string;
    voucherAddress: string;
    qrPayload: string;
    redemptionInstruction: string;
    cashWarning: string;
    supportNote: string;
    valueLoadedLabel: string;
    scanToRedeemLabel: string;
    referenceLabel: string;
    issuedLabel: string;
    customerPaidFieldLabel: string;
    loadedFieldLabel: string;
    voucherAddressLabel: string;
  }): Promise<AndroidPrinterResult>;
}

export const DEFAULT_JK_5803P_PRINTER = {
  name: 'JK-5803P',
  address: '60:6E:41:45:8C:14',
} as const;

const BluetoothEscPosPrinter = registerPlugin<BluetoothEscPosPrinterPlugin>(
  'BluetoothEscPosPrinter'
);

const DEFAULT_PRINT_LABELS = {
  valueLoaded: 'Value loaded',
  scanToRedeem: 'Scan to Redeem',
  reference: 'Reference',
  issued: 'Issued',
  customerPaid: 'Customer Paid',
  loaded: 'Loaded',
  voucherAddress: 'Voucher Address',
} as const;

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
    throw new Error(
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
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
    throw new Error(
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
  }

  return BluetoothEscPosPrinter.printQrTest({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
    qrPayload: options?.qrPayload ?? 'BCH Voucher Printer QR Test',
  });
}

export async function printBluetoothVoucherReceiptTest(options?: {
  name?: string;
  address?: string;
}): Promise<AndroidPrinterResult> {
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new Error(
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
  }

  return BluetoothEscPosPrinter.printVoucherReceiptTest({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
  });
}

export async function printBluetoothCharacterEncodingTest(options?: {
  name?: string;
  address?: string;
}): Promise<AndroidPrinterResult> {
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new Error(
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
  }

  return BluetoothEscPosPrinter.printCharacterEncodingTest({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
  });
}

export async function printBluetoothRasterTextTest(options?: {
  name?: string;
  address?: string;
}): Promise<AndroidPrinterResult> {
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new Error(
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
  }

  return BluetoothEscPosPrinter.printRasterTextTest({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
  });
}

export async function printBluetoothVoucherReceipt(
  receiptData: VoucherReceiptData,
  options?: {
    name?: string;
    address?: string;
  }
): Promise<AndroidPrinterResult> {
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new Error(
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
  }

  if (!receiptData.qrPayload) {
    throw new Error('Voucher receipt QR payload is missing.');
  }

  const printLabels = {
    ...DEFAULT_PRINT_LABELS,
    ...receiptData.printLabels,
  };

  return BluetoothEscPosPrinter.printVoucherReceipt({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
    title: receiptData.title,
    serial: receiptData.serial,
    issuedAtLabel: receiptData.issuedAtLabel,
    customerPaidLabel: receiptData.customerPaidLabel,
    loadedFiatLabel: receiptData.loadedFiatLabel,
    bchAmountLabel: receiptData.bchAmountLabel,
    voucherAddress: receiptData.address,
    qrPayload: receiptData.qrPayload,
    redemptionInstruction: receiptData.redemptionInstruction,
    cashWarning: receiptData.cashWarning,
    supportNote: receiptData.supportNote,
    valueLoadedLabel: printLabels.valueLoaded,
    scanToRedeemLabel: printLabels.scanToRedeem,
    referenceLabel: printLabels.reference,
    issuedLabel: printLabels.issued,
    customerPaidFieldLabel: printLabels.customerPaid,
    loadedFieldLabel: printLabels.loaded,
    voucherAddressLabel: printLabels.voucherAddress,
  });
}
