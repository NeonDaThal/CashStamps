export type CashOutStatus =
  | 'draft'
  | 'quote_locked'
  | 'awaiting_payment'
  | 'received'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type CashOutQuoteSource =
  | 'general_protocols_oracle'
  | 'coingecko'
  | 'cached'
  | 'manual'
  | 'fake_phase_2_quote'
  | 'unknown';

export interface CashOutQuote {
  source: CashOutQuoteSource;
  fiatCurrency: string;
  marketRate: number;
  marketRateTimestamp: string;
  quoteLockedAt?: string;
  quoteExpiresAt?: string;
  isFallbackQuote: boolean;
}

export interface CashOutFeeBreakdown {
  totalServiceFeeBasisPoints: number;
  totalServiceFeeAmountMinor: number;

  platformFeeBasisPoints: number;
  platformFeeAmountMinor: number;

  merchantRetainedBasisPoints: number;
  merchantRetainedAmountMinor: number;

  bufferReserveBasisPoints: number;
  bufferReserveAmountMinor: number;

  /**
   * MVP note:
   *
   * Cash-out customer payments are received as one BCH payment into the
   * merchant treasury wallet.
   *
   * These fee amounts are tracked for accounting/settlement, but the payment
   * URI itself does not force separate BCH outputs.
   */
  settlementMode: 'accounting_only';
}

export interface CashOutPaymentDetection {
  treasuryAddress: string;
  requiredSats: number;
  receivedSats: number;
  txid?: string;
  detectedAt: string;
  message: string;
}

export interface CashOutRecord {
  id: string;
  serial: string;

  createdAt: string;
  updatedAt: string;

  /**
   * Fiat cash amount the merchant gives to the customer after BCH is detected.
   */
  fiatCurrency: string;
  fiatAmountMinor: number;

  /**
   * Fiat-equivalent value the customer must send in BCH.
   *
   * Example:
   * - fiatAmountMinor = £100.00 cash paid out
   * - total service fee = £10.00
   * - customerSendsFiatEquivalentMinor = £110.00 equivalent in BCH
   */
  customerSendsFiatEquivalentMinor: number;

  /**
   * BCH value of the cash payout before the service fee/spread is added.
   */
  marketBchSats: number;

  /**
   * Final BCH sats the customer must send to the merchant treasury.
   */
  bchSatsRequired: number;

  /**
   * BCH sats detected as received for this cash-out.
   */
  bchSatsReceived?: number;

  quote: CashOutQuote;
  fee: CashOutFeeBreakdown;

  treasuryReceivingAddress: string;
  paymentUri?: string;

  paymentDetection?: CashOutPaymentDetection;

  receivedTxid?: string;
  detectedAt?: string;
  completedAt?: string;
  printedAt?: string;
  cancelledAt?: string;
  failedAt?: string;

  status: CashOutStatus;

  printerJobId?: string;
  errorMessage?: string;
}
