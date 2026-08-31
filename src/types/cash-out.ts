export type CashOutStatus =
  | 'draft'
  | 'quote_locked'
  | 'awaiting_payment'
  | 'received'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type CashOutCancellationReason = 'merchant_cancelled' | 'quote_expired';

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

export type CashOutFeeModel = 'cash_out_v1';

export interface CashOutFeeBreakdown {
  /**
   * Absent on older development records created before Cash-out Fee Model v1.
   */
  feeModel?: CashOutFeeModel;

  /**
   * Total customer-facing Cash-out service fee.
   *
   * Cash-out Fee Model v1:
   * 3% of the fiat cash amount paid to the customer.
   */
  totalServiceFeeBasisPoints: number;
  totalServiceFeeAmountMinor: number;

  /**
   * Platform share of the Cash-out service fee.
   *
   * Nominally 1.5% of the cash payout.
   *
   * When the total fee is an odd number of minor currency units, the platform
   * receives the lower half and the merchant receives the remainder.
   */
  platformFeeBasisPoints: number;
  platformFeeAmountMinor: number;

  /**
   * Merchant share of the Cash-out service fee.
   *
   * Nominally 1.5% of the cash payout.
   */
  merchantFeeBasisPoints?: number;
  merchantFeeAmountMinor?: number;

  /**
   * Legacy development fields.
   *
   * Older Cash-out records used the original shared 10% placeholder fee model:
   * platform + merchant retained + buffer reserve.
   *
   * Keep these optional so old locally stored records remain readable while
   * new Cash-out Fee Model v1 records stop writing them.
   */
  merchantRetainedBasisPoints?: number;
  merchantRetainedAmountMinor?: number;

  bufferReserveBasisPoints?: number;
  bufferReserveAmountMinor?: number;

  /**
   * Cash-out customer BCH is currently received as one payment into the
   * merchant Treasury Wallet.
   *
   * The merchant/platform split is recorded for accounting. Contract-based
   * settlement will be introduced separately in later CashScript phases.
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

  /**
   * Main treasury wallet address at derivation index 0.
   *
   * Older cash-out records may not have this because early MVP cash-outs
   * received directly to the main treasury address.
   */
  treasuryMasterAddress?: string;

  /**
   * Address shown to the customer for this specific cash-out payment.
   *
   * New cash-outs use a unique treasury-derived receiving address.
   */
  treasuryReceivingAddress: string;

  /**
   * Treasury derivation index for the unique cash-out receiving address.
   *
   * Main treasury address remains index 0. Cash-out receiving addresses start
   * at index 1 so existing treasury wallets are preserved.
   */
  treasuryReceivingDerivationIndex?: number;

  paymentUri?: string;

  paymentDetection?: CashOutPaymentDetection;

  receivedTxid?: string;
  detectedAt?: string;
  completedAt?: string;
  printedAt?: string;
  cancelledAt?: string;
  /**
   * Why an unfinished Cash-out was cancelled.
   *
   * This does not imply that the unique BCH receiving address becomes incapable
   * of receiving funds. A payment sent after cancellation/expiry is an
   * exceptional recovery case and must not automatically authorise cash payout.
   */
  cancellationReason?: CashOutCancellationReason;
  failedAt?: string;

  status: CashOutStatus;

  printerJobId?: string;
  errorMessage?: string;
}
