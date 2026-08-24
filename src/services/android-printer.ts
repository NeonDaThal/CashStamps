import { Capacitor, registerPlugin } from '@capacitor/core';

import type { CashOutReceiptData } from 'src/services/cash-out-receipt';
import type { VoucherReceiptData } from 'src/services/voucher-receipt';
import {
  classifyVoucherPrintFailure,
  VoucherPrintDeliveryError,
} from 'src/services/voucher-print-outcome';

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
    printerSubtitle: string;
    serial: string;
    issuedAtLabel: string;
    customerPaidLabel: string;
    serviceFeeLabel: string;
    loadedFiatLabel: string;
    bchAmountLabel: string;
    voucherAddress: string;
    qrPayload: string;
    qrImageDataUrl?: string;
    redemptionInstruction: string;
    cashWarning: string;
    supportNote: string;
    valueLoadedLabel: string;
    scanToRedeemLabel: string;
    referenceLabel: string;
    issuedLabel: string;
    customerPaidFieldLabel: string;
    serviceFeeFieldLabel: string;
    voucherAddressLabel: string;
  }): Promise<AndroidPrinterResult>;

  printCashOutReceipt(options: {
    name?: string;
    address?: string;
    title: string;
    printerSubtitle: string;
    serial: string;
    issuedAtLabel: string;
    cashPaidOutLabel: string;
    customerSentFiatEquivalentLabel: string;
    serviceFeeLabel: string;
    serviceFeePercentLabel: string;
    bchReceivedLabel: string;
    exchangeRateLabel: string;
    treasuryReceivingAddress: string;
    txid: string;
    statusNote: string;
    supportNote: string;
    footerNote: string;
    cashPaidOutFieldLabel: string;
    bchReceivedFieldLabel: string;
    referenceLabel: string;
    issuedLabel: string;
    customerSentFieldLabel: string;
    serviceFeeFieldLabel: string;
    exchangeRateFieldLabel: string;
    treasuryReceivingAddressLabel: string;
    transactionIdLabel: string;
  }): Promise<AndroidPrinterResult>;
}

export const DEFAULT_JK_5803P_PRINTER = {
  name: 'JK-5803P',
  address: '60:6E:41:45:8C:14',
} as const;

const BluetoothEscPosPrinter = registerPlugin<BluetoothEscPosPrinterPlugin>(
  'BluetoothEscPosPrinter'
);

const DEFAULT_PRINTER_SUBTITLE = 'Topup Voucher';
const DEFAULT_CASH_OUT_PRINTER_SUBTITLE = 'Cash-out Receipt';

const DEFAULT_PRINT_LABELS = {
  valueLoaded: 'Value loaded',
  scanToRedeem: 'Scan to Redeem',
  reference: 'Reference',
  issued: 'Issued',
  customerPaid: 'Customer Paid',
  serviceFee: 'Service Fee',
  voucherAddress: 'Voucher Address',
} as const;

const DEFAULT_CASH_OUT_PRINT_LABELS = {
  cashPaidOut: 'Cash paid out',
  bchReceived: 'BCH received',
  reference: 'Reference',
  issued: 'Issued',
  customerSent: 'Customer sent',
  serviceFee: 'Service fee',
  exchangeRate: 'Exchange rate',
  treasuryReceivingAddress: 'Treasury receiving address',
  transactionId: 'Transaction ID',
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
    qrImageDataUrl?: string;
  }
): Promise<AndroidPrinterResult> {
  /**
   * These failures occur before the native printer method can possibly begin
   * transmitting the bearer voucher.
   */
  if (!isAndroidPrinterBridgeAvailable()) {
    throw new VoucherPrintDeliveryError(
      'definitely_not_printed',
      'Android Bluetooth printer bridge is only available in the Android app.'
    );
  }

  if (!receiptData.qrPayload) {
    throw new VoucherPrintDeliveryError(
      'definitely_not_printed',
      'Voucher receipt QR payload is missing.'
    );
  }

  const printLabels = {
    ...DEFAULT_PRINT_LABELS,
    ...receiptData.printLabels,
  };

  try {
    return await BluetoothEscPosPrinter.printVoucherReceipt({
      name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,

      address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,

      title: receiptData.title,

      printerSubtitle: receiptData.printerSubtitle || DEFAULT_PRINTER_SUBTITLE,

      serial: receiptData.serial,

      issuedAtLabel: receiptData.issuedAtLabel,

      customerPaidLabel: receiptData.customerPaidLabel,

      serviceFeeLabel: receiptData.serviceFeeLabel,

      loadedFiatLabel: receiptData.loadedFiatLabel,

      bchAmountLabel: receiptData.bchAmountLabel,

      voucherAddress: receiptData.address,

      qrPayload: receiptData.qrPayload,

      qrImageDataUrl: options?.qrImageDataUrl,

      redemptionInstruction: receiptData.redemptionInstruction,

      cashWarning: receiptData.cashWarning,

      supportNote: receiptData.supportNote,

      valueLoadedLabel: printLabels.valueLoaded,

      scanToRedeemLabel: printLabels.scanToRedeem,

      referenceLabel: printLabels.reference,

      issuedLabel: printLabels.issued,

      customerPaidFieldLabel: printLabels.customerPaid,

      serviceFeeFieldLabel: printLabels.serviceFee,

      voucherAddressLabel: printLabels.voucherAddress,
    });
  } catch (error) {
    const failure = classifyVoucherPrintFailure(error);

    throw new VoucherPrintDeliveryError(failure.status, failure.message);
  }
}

export async function printBluetoothCashOutReceipt(
  receiptData: CashOutReceiptData,
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

  const printLabels = {
    ...DEFAULT_CASH_OUT_PRINT_LABELS,
    ...receiptData.printLabels,
  };

  return BluetoothEscPosPrinter.printCashOutReceipt({
    name: options?.name ?? DEFAULT_JK_5803P_PRINTER.name,
    address: options?.address ?? DEFAULT_JK_5803P_PRINTER.address,
    title: receiptData.title,
    printerSubtitle:
      receiptData.printerSubtitle || DEFAULT_CASH_OUT_PRINTER_SUBTITLE,
    serial: receiptData.serial,
    issuedAtLabel: receiptData.issuedAtLabel,
    cashPaidOutLabel: receiptData.cashPaidOutLabel,
    customerSentFiatEquivalentLabel:
      receiptData.customerSentFiatEquivalentLabel,
    serviceFeeLabel: receiptData.serviceFeeLabel,
    serviceFeePercentLabel: receiptData.serviceFeePercentLabel,
    bchReceivedLabel: receiptData.bchReceivedLabel,
    exchangeRateLabel: receiptData.exchangeRateLabel,
    treasuryReceivingAddress: receiptData.treasuryReceivingAddress,
    txid: receiptData.txid ?? receiptData.txidShort,
    statusNote: receiptData.statusNote,
    supportNote: receiptData.supportNote,
    footerNote: receiptData.footerNote,
    cashPaidOutFieldLabel: printLabels.cashPaidOut,
    bchReceivedFieldLabel: printLabels.bchReceived,
    referenceLabel: printLabels.reference,
    issuedLabel: printLabels.issued,
    customerSentFieldLabel: printLabels.customerSent,
    serviceFeeFieldLabel: printLabels.serviceFee,
    exchangeRateFieldLabel: printLabels.exchangeRate,
    treasuryReceivingAddressLabel: printLabels.treasuryReceivingAddress,
    transactionIdLabel: printLabels.transactionId,
  });
}
