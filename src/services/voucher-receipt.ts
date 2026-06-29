import type { VoucherRecord } from 'src/types/voucher';
import type { VoucherKeyExport } from 'src/types/voucher-key';
import { exportVoucherKeyAtIndex } from 'src/services/voucher-wallet';
import { formatBchSats } from 'src/services/voucher-pricing';

export interface VoucherReceiptPrintLabels {
  valueLoaded: string;
  scanToRedeem: string;
  reference: string;
  issued: string;
  customerPaid: string;
  loaded: string;
  voucherAddress: string;
}

export interface VoucherReceiptData {
  title: string;
  serial: string;

  issuedAt: string;
  issuedAtLabel: string;

  fiatCurrency: string;
  customerPaidMinor: number;
  loadedFiatMinor: number;
  customerPaidLabel: string;
  loadedFiatLabel: string;

  bchSats: number;
  bchAmountLabel: string;

  address: string;
  derivationIndex: number;

  /**
   * Labels used by the native Bluetooth ESC/POS receipt printer.
   */
  printLabels?: VoucherReceiptPrintLabels;

  /**
   * This is the sweepable private key payload.
   * It must be encoded into the customer QR.
   */
  qrPayload: string;

  /**
   * Keep the export result available for development/testing,
   * but receipt UI should not print the WIF as text by default.
   */
  wifExport: VoucherKeyExport;

  redemptionInstruction: string;
  cashWarning: string;
  supportNote: string;

  isDevelopmentPrivateKeyPreview: true;
}

export interface VoucherReceiptErrorMessages {
  invalidDerivationIndex: string;
  missingSerial: string;
  missingFiatCurrency: string;
  invalidBchAmount: string;
  missingAddress: string;
  addressMismatch: string;
}

export interface BuildVoucherReceiptDataOptions {
  title?: string;
  redemptionInstruction?: string;
  cashWarning?: string;
  supportNote?: string;
  printLabels?: Partial<VoucherReceiptPrintLabels>;
  errors?: Partial<VoucherReceiptErrorMessages>;
}

const DEFAULT_RECEIPT_TITLE = 'BCH Voucher';

const DEFAULT_REDEMPTION_INSTRUCTION =
  'Scan this QR code with a Bitcoin Cash wallet that supports private key sweeping.';

const DEFAULT_CASH_WARNING =
  'Treat this receipt like cash. Anyone with this QR code can sweep the funds.';

const DEFAULT_SUPPORT_NOTE =
  'Keep this receipt safe until the BCH has been swept into your own wallet.';

const DEFAULT_PRINT_LABELS: VoucherReceiptPrintLabels = {
  valueLoaded: 'Value loaded',
  scanToRedeem: 'Scan to Redeem',
  reference: 'Reference',
  issued: 'Issued',
  customerPaid: 'Customer Paid',
  loaded: 'Loaded',
  voucherAddress: 'Voucher Address',
};

const DEFAULT_ERROR_MESSAGES: VoucherReceiptErrorMessages = {
  invalidDerivationIndex: 'Voucher does not have a valid derivation index.',
  missingSerial: 'Voucher does not have a serial/reference number.',
  missingFiatCurrency: 'Voucher does not have a fiat currency.',
  invalidBchAmount: 'Voucher does not have a valid BCH amount loaded.',
  missingAddress: 'Voucher does not have a BCH address.',
  addressMismatch:
    'Voucher address does not match the exported voucher key address.',
};

function getErrorMessages(
  options: BuildVoucherReceiptDataOptions
): VoucherReceiptErrorMessages {
  return {
    ...DEFAULT_ERROR_MESSAGES,
    ...options.errors,
  };
}

function formatFiatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function formatReceiptDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getLoadedFiatMinor(voucher: VoucherRecord): number {
  const feeAmountMinor =
    voucher.fee.type === 'none' ? 0 : voucher.fee.amountMinor;

  return Math.max(0, voucher.fiatAmountMinor - feeAmountMinor);
}

function getReceiptIssuedAt(voucher: VoucherRecord): string {
  return (
    voucher.printedAt ||
    voucher.fundingDetectedAt ||
    voucher.quote.quoteLockedAt ||
    voucher.createdAt
  );
}

function assertUsableVoucherForReceipt(
  voucher: VoucherRecord,
  errorMessages: VoucherReceiptErrorMessages
): void {
  if (
    !Number.isInteger(voucher.derivationIndex) ||
    voucher.derivationIndex < 0
  ) {
    throw new Error(errorMessages.invalidDerivationIndex);
  }

  if (!voucher.serial) {
    throw new Error(errorMessages.missingSerial);
  }

  if (!voucher.fiatCurrency) {
    throw new Error(errorMessages.missingFiatCurrency);
  }

  if (!Number.isFinite(voucher.finalBchSats) || voucher.finalBchSats <= 0) {
    throw new Error(errorMessages.invalidBchAmount);
  }
}

export async function buildVoucherReceiptData(
  voucher: VoucherRecord,
  options: BuildVoucherReceiptDataOptions = {}
): Promise<VoucherReceiptData> {
  const errorMessages = getErrorMessages(options);

  assertUsableVoucherForReceipt(voucher, errorMessages);

  const wifExport = await exportVoucherKeyAtIndex(voucher.derivationIndex);

  const voucherAddress = voucher.address || wifExport.address;

  if (!voucherAddress) {
    throw new Error(errorMessages.missingAddress);
  }

  if (
    voucher.address &&
    wifExport.address &&
    voucher.address !== wifExport.address
  ) {
    throw new Error(errorMessages.addressMismatch);
  }

  const issuedAt = getReceiptIssuedAt(voucher);
  const loadedFiatMinor = getLoadedFiatMinor(voucher);

  return {
    title: options.title ?? DEFAULT_RECEIPT_TITLE,
    serial: voucher.serial,

    issuedAt,
    issuedAtLabel: formatReceiptDate(issuedAt),

    fiatCurrency: voucher.fiatCurrency,
    customerPaidMinor: voucher.fiatAmountMinor,
    loadedFiatMinor,
    customerPaidLabel: formatFiatAmount(
      voucher.fiatAmountMinor,
      voucher.fiatCurrency
    ),
    loadedFiatLabel: formatFiatAmount(loadedFiatMinor, voucher.fiatCurrency),

    bchSats: voucher.finalBchSats,
    bchAmountLabel: formatBchSats(voucher.finalBchSats),

    address: voucherAddress,
    derivationIndex: voucher.derivationIndex,

    printLabels: {
      ...DEFAULT_PRINT_LABELS,
      ...options.printLabels,
    },

    qrPayload: wifExport.wif,
    wifExport,

    redemptionInstruction:
      options.redemptionInstruction ?? DEFAULT_REDEMPTION_INSTRUCTION,
    cashWarning: options.cashWarning ?? DEFAULT_CASH_WARNING,
    supportNote: options.supportNote ?? DEFAULT_SUPPORT_NOTE,

    isDevelopmentPrivateKeyPreview: true,
  };
}
