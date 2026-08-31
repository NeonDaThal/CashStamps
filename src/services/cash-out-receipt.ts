import type { CashOutRecord } from 'src/types/cash-out';
import {
  formatCashOutBchSats,
  formatCashOutMarketRate,
  formatCashOutMinorFiatAmount,
} from 'src/services/cash-out-pricing';

export interface CashOutReceiptPrintLabels {
  cashPaidOut: string;
  bchReceived: string;
  reference: string;
  issued: string;
  customerSent: string;
  serviceFee: string;
  exchangeRate: string;
  treasuryReceivingAddress: string;
  transactionId: string;
}

export interface CashOutReceiptData {
  title: string;
  printerSubtitle: string;
  serial: string;

  issuedAt: string;
  issuedAtLabel: string;

  fiatCurrency: string;
  cashPaidOutMinor: number;
  cashPaidOutLabel: string;

  customerSentFiatEquivalentMinor: number;
  customerSentFiatEquivalentLabel: string;

  serviceFeeAmountMinor: number;
  serviceFeeLabel: string;
  serviceFeePercentLabel: string;

  bchReceivedSats: number;
  bchReceivedLabel: string;

  exchangeRateLabel: string;

  treasuryReceivingAddress: string;
  treasuryReceivingAddressShort: string;

  txid?: string;
  txidShort: string;

  /**
   * Labels used by the native Bluetooth ESC/POS receipt printer.
   */
  printLabels?: CashOutReceiptPrintLabels;

  statusNote: string;
  supportNote: string;
  footerNote: string;
}

export interface CashOutReceiptErrorMessages {
  missingSerial: string;
  missingFiatCurrency: string;
  invalidCashAmount: string;
  invalidBchReceived: string;
  missingTreasuryReceivingAddress: string;
  cashOutNotCompleted: string;
}

export interface BuildCashOutReceiptDataOptions {
  title?: string;
  printerSubtitle?: string;
  statusNote?: string;
  supportNote?: string;
  footerNote?: string;
  printLabels?: Partial<CashOutReceiptPrintLabels>;
  errors?: Partial<CashOutReceiptErrorMessages>;
}

const DEFAULT_RECEIPT_TITLE = 'Cash-out Receipt';

const DEFAULT_PRINTER_SUBTITLE = 'Cash-out Receipt';

const DEFAULT_STATUS_NOTE =
  'Customer BCH was received before the merchant confirmed the cash payout.';

const DEFAULT_SUPPORT_NOTE =
  'Keep this receipt as proof of the cash-out transaction.';

const DEFAULT_FOOTER_NOTE =
  'Cash-out completed after BCH payment was received.';

const DEFAULT_PRINT_LABELS: CashOutReceiptPrintLabels = {
  cashPaidOut: 'Cash paid out',
  bchReceived: 'BCH received',
  reference: 'Reference',
  issued: 'Issued',
  customerSent: 'Customer sent',
  serviceFee: 'Service fee',
  exchangeRate: 'Exchange rate',
  treasuryReceivingAddress: 'Treasury receiving address',
  transactionId: 'Transaction ID',
};

const DEFAULT_ERROR_MESSAGES: CashOutReceiptErrorMessages = {
  missingSerial: 'Cash-out does not have a reference number.',
  missingFiatCurrency: 'Cash-out does not have a fiat currency.',
  invalidCashAmount: 'Cash-out does not have a valid cash amount.',
  invalidBchReceived: 'Cash-out does not have a valid BCH received amount.',
  missingTreasuryReceivingAddress:
    'Cash-out does not have a treasury receiving address.',
  cashOutNotCompleted:
    'Cash-out has not been completed yet. Receipt cannot be built.',
};

function getErrorMessages(
  options: BuildCashOutReceiptDataOptions
): CashOutReceiptErrorMessages {
  return {
    ...DEFAULT_ERROR_MESSAGES,
    ...options.errors,
  };
}

function formatReceiptDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatServiceFeePercentLabel(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

function shortenMiddle(
  value: string,
  visibleStart = 12,
  visibleEnd = 10
): string {
  if (value.length <= visibleStart + visibleEnd + 3) {
    return value;
  }

  return `${value.slice(0, visibleStart)}...${value.slice(-visibleEnd)}`;
}

function getReceiptIssuedAt(cashOut: CashOutRecord): string {
  return (
    cashOut.printedAt ||
    cashOut.completedAt ||
    cashOut.detectedAt ||
    cashOut.paymentDetection?.detectedAt ||
    cashOut.updatedAt ||
    cashOut.createdAt
  );
}

function getBchReceivedSats(cashOut: CashOutRecord): number {
  return cashOut.bchSatsReceived ?? cashOut.paymentDetection?.receivedSats ?? 0;
}

function assertUsableCashOutForReceipt(
  cashOut: CashOutRecord,
  errorMessages: CashOutReceiptErrorMessages
): void {
  if (cashOut.status !== 'completed') {
    throw new Error(errorMessages.cashOutNotCompleted);
  }

  if (!cashOut.serial) {
    throw new Error(errorMessages.missingSerial);
  }

  if (!cashOut.fiatCurrency) {
    throw new Error(errorMessages.missingFiatCurrency);
  }

  if (
    !Number.isFinite(cashOut.fiatAmountMinor) ||
    cashOut.fiatAmountMinor <= 0
  ) {
    throw new Error(errorMessages.invalidCashAmount);
  }

  if (!cashOut.treasuryReceivingAddress) {
    throw new Error(errorMessages.missingTreasuryReceivingAddress);
  }

  const bchReceivedSats = getBchReceivedSats(cashOut);

  if (!Number.isFinite(bchReceivedSats) || bchReceivedSats <= 0) {
    throw new Error(errorMessages.invalidBchReceived);
  }
}

export function buildCashOutReceiptData(
  cashOut: CashOutRecord,
  options: BuildCashOutReceiptDataOptions = {}
): CashOutReceiptData {
  const errorMessages = getErrorMessages(options);

  assertUsableCashOutForReceipt(cashOut, errorMessages);

  const issuedAt = getReceiptIssuedAt(cashOut);
  const bchReceivedSats = getBchReceivedSats(cashOut);

  return {
    title: options.title ?? DEFAULT_RECEIPT_TITLE,
    printerSubtitle: options.printerSubtitle ?? DEFAULT_PRINTER_SUBTITLE,
    serial: cashOut.serial,

    issuedAt,
    issuedAtLabel: formatReceiptDate(issuedAt),

    fiatCurrency: cashOut.fiatCurrency,
    cashPaidOutMinor: cashOut.fiatAmountMinor,
    cashPaidOutLabel: formatCashOutMinorFiatAmount(
      cashOut.fiatAmountMinor,
      cashOut.fiatCurrency
    ),

    customerSentFiatEquivalentMinor: cashOut.customerSendsFiatEquivalentMinor,
    customerSentFiatEquivalentLabel: formatCashOutMinorFiatAmount(
      cashOut.customerSendsFiatEquivalentMinor,
      cashOut.fiatCurrency
    ),

    serviceFeeAmountMinor: cashOut.fee.totalServiceFeeAmountMinor,
    serviceFeeLabel: formatCashOutMinorFiatAmount(
      cashOut.fee.totalServiceFeeAmountMinor,
      cashOut.fiatCurrency
    ),
    serviceFeePercentLabel: formatServiceFeePercentLabel(
      cashOut.fee.totalServiceFeeBasisPoints
    ),

    bchReceivedSats,
    bchReceivedLabel: formatCashOutBchSats(bchReceivedSats),

    exchangeRateLabel: formatCashOutMarketRate(
      cashOut.quote.marketRate,
      cashOut.fiatCurrency
    ),

    treasuryReceivingAddress: cashOut.treasuryReceivingAddress,
    treasuryReceivingAddressShort: shortenMiddle(
      cashOut.treasuryReceivingAddress
    ),

    txid: cashOut.receivedTxid,
    txidShort: cashOut.receivedTxid
      ? shortenMiddle(cashOut.receivedTxid, 10, 10)
      : 'Not available',

    printLabels: {
      ...DEFAULT_PRINT_LABELS,
      ...options.printLabels,
    },

    statusNote: options.statusNote ?? DEFAULT_STATUS_NOTE,
    supportNote: options.supportNote ?? DEFAULT_SUPPORT_NOTE,
    footerNote: options.footerNote ?? DEFAULT_FOOTER_NOTE,
  };
}
