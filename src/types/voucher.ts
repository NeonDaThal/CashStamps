import type { TopupFeeModelV1Snapshot } from 'src/types/fee-model';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';

export type VoucherStatus =
  | 'draft'
  | 'quote_locked'
  | 'funding'
  | 'funded'
  | 'printed'
  | 'redeemed'
  | 'reclaimed'
  | 'error';

export type VoucherFeeType = 'percentage' | 'fixed' | 'none';

export type VoucherQuoteSource =
  | 'general_protocols_oracle'
  | 'coingecko'
  | 'cached'
  | 'manual'
  | 'unknown';

export interface VoucherQuote {
  source: VoucherQuoteSource;
  fiatCurrency: string;
  marketRate: number;
  marketRateTimestamp: string;
  quoteLockedAt?: string;
  quoteExpiresAt?: string;
  isFallbackQuote: boolean;
}

export type VoucherRedemptionDetectionStatus =
  | 'unfunded'
  | 'funded'
  | 'swept'
  | 'unknown';

export interface VoucherRedemptionDetection {
  status: VoucherRedemptionDetectionStatus;
  address: string;
  derivationIndex: number;
  balanceSats: number;
  utxoCount: number;
  checkedAt: string;
  message: string;
}

export interface VoucherFee {
  type: VoucherFeeType;
  basisPoints: number;
  amountMinor: number;
  description?: string;
}

export interface VoucherKeyMetadata {
  hasWif: boolean;
  checkedAt: string;
}

export interface VoucherManualRedemption {
  status: 'swept';
  txid?: string;
  note?: string;
  redeemedAt: string;
}

/**
 * How the customer chose to receive the bearer voucher.
 *
 * Once selected for a real Topup, this method is immutable.
 *
 * A printed voucher must never later become a digital voucher, and a digital
 * voucher must never later be printed.
 */
export type VoucherDeliveryMethod = 'printed' | 'digital';

/**
 * Separate from VoucherStatus because funding and bearer-secret delivery are
 * different lifecycle concerns.
 *
 * selected:
 *   The delivery method has been durably locked, but no WIF exposure attempt
 *   has begun.
 *
 * delivery_started:
 *   The selected delivery operation has begun. For digital delivery this must
 *   be persisted before rendering the WIF. For printed delivery it must be
 *   persisted before handing the receipt to the native printer bridge.
 *
 * delivered:
 *   The selected delivery operation completed successfully.
 *
 * uncertain:
 *   A delivery operation began but its outcome cannot be safely proven.
 *   This is especially important for physical printing.
 */
export type VoucherDeliveryStatus =
  | 'selected'
  | 'delivery_started'
  | 'delivered'
  | 'uncertain';

export interface VoucherDelivery {
  method: VoucherDeliveryMethod;

  status: VoucherDeliveryStatus;

  /**
   * The moment the merchant committed this Topup to one delivery route.
   */
  selectedAt: string;

  /**
   * Set immediately before the bearer-secret delivery side effect begins.
   */
  startedAt?: string;

  /**
   * Set once the chosen delivery path completes successfully.
   */
  deliveredAt?: string;

  /**
   * Human-readable development/audit detail for a delivery whose physical or
   * visual outcome cannot safely be proven.
   */
  uncertaintyReason?: string;
}

export type VoucherPrintedRecoveryResolution =
  | 'confirmed_printed'
  | 'replacement_required';

export type VoucherPrintedRecoveryReclaimStatus =
  | 'not_required'
  | 'required'
  | 'in_progress'
  | 'reclaimed'
  | 'uncertain'
  | 'failed';

export type VoucherReclaimIntentStatus = 'prepared';

/**
 * Exact signed transaction which spends the original failed Printed Topup's
 * known funding output back to the merchant Treasury Wallet.
 *
 * This is persisted BEFORE any reclaim broadcast can occur.
 */
export interface VoucherReclaimIntent {
  status: VoucherReclaimIntentStatus;

  /**
   * Exact signed transaction bytes.
   */
  rawTransactionHex: string;

  /**
   * Deterministic txid calculated locally from rawTransactionHex.
   */
  txid: string;

  /**
   * Original voucher funding output being reclaimed.
   *
   * Reclaim must never silently sweep unrelated BCH which may have been sent
   * to the same voucher address.
   */
  sourceFundingTxid: string;
  sourceOutpointIndex: number;
  sourceValueSats: number;

  voucherAddress: string;
  voucherDerivationIndex: number;

  treasuryAddress: string;

  /**
   * Amount returned to Treasury after the reclaim miner fee.
   */
  treasuryOutputSats: number;

  actualFeeSats: number;

  inputCount: number;
  outputCount: number;

  preparedAt: string;
}

/**
 * Permanent audit record for an exceptional Printed delivery whose physical
 * outcome could not originally be proven.
 *
 * This does NOT unlock the original WIF for another print.
 */
export interface VoucherPrintedRecovery {
  /**
   * The unresolved physical-delivery state which required merchant review.
   */
  previousDeliveryStatus: 'delivery_started' | 'uncertain';

  /**
   * Merchant's explicit physical inspection result.
   */
  resolution: VoucherPrintedRecoveryResolution;

  /**
   * When the merchant made the exceptional resolution.
   */
  resolvedAt: string;

  /**
   * Human-readable permanent audit description.
   */
  reason: string;

  /**
   * confirmed_printed:
   *   no reclaim required.
   *
   * replacement_required:
   *   original funded voucher must eventually be reclaimed.
   */
  reclaimStatus: VoucherPrintedRecoveryReclaimStatus;

  /**
   * Populated later when the replacement Topup is actually created.
   */
  replacementVoucherId?: string;

  /**
   * Durable write-ahead transaction for reclaiming the original failed Printed
   * voucher.
   *
   * Once this exists, a replacement reclaim transaction must never be created.
   */
  reclaimIntent?: VoucherReclaimIntent;
  /**
   * Latest submission result for the exact persisted reclaim transaction.
   */
  reclaimBroadcast?: TreasuryBroadcastResult;

  /**
   * Latest strongest network evidence for the exact persisted reclaim txid.
   */
  reclaimReconciliation?: TreasuryBroadcastReconciliationResult;

  /**
   * Populated later by the hardened reclaim lifecycle.
   */
  reclaimTxid?: string;
}

export type VoucherReplacementReason = 'printed_delivery_failure';

/**
 * Marks a voucher as a replacement for an existing customer sale.
 *
 * A replacement:
 *
 * - uses a NEW derivation index / NEW WIF / NEW address;
 * - preserves the original customer-facing sale/reference;
 * - does NOT represent another cash payment;
 * - does NOT charge another platform fee;
 * - must not be counted as another merchant sale in reports.
 */
export interface VoucherReplacement {
  originalVoucherId: string;

  originalSerial: string;

  reason: VoucherReplacementReason;

  /**
   * Allows us to support another replacement safely later if an exceptional
   * recovery ever requires it, while retaining the full chain.
   *
   * First replacement = 1.
   */
  sequence: number;

  createdAt: string;

  /**
   * Explicit accounting audit flags.
   */
  customerPaymentAlreadyRecorded: true;

  platformFeeAlreadyPaid: true;
}

export type VoucherFundingIntentStatus = 'prepared';

export interface VoucherFundingIntent {
  /**
   * Stable identifier for one merchant Issue action.
   *
   * The same operation ID must never create a second VoucherRecord.
   */
  operationId: string;

  status: VoucherFundingIntentStatus;

  /**
   * Signed transaction prepared for this exact Topup.
   *
   * This is persisted before any future broadcast attempt so the app can
   * recover/reconcile the exact same transaction after interruption.
   */
  rawTransactionHex: string;

  /**
   * Deterministic transaction ID calculated locally from rawTransactionHex
   * before any broadcast attempt.
   *
   * New B5.5 funding intents always populate this field. It remains optional
   * only so funding intents persisted during earlier development checkpoints
   * remain readable.
   */
  txid?: string;

  actualFeeSats: number;
  actualChangeSats: number;

  /**
   * Sub-dust treasury remainder intentionally absorbed into the miner fee.
   */
  dustChangeAbsorbedSats: number;

  inputCount: number;
  outputCount: number;

  preparedAt: string;
}

export interface VoucherRecord {
  id: string;
  serial: string;

  createdAt: string;
  updatedAt: string;

  fiatCurrency: string;
  fiatAmountMinor: number;

  marketBchSats: number;
  fee: VoucherFee;
  finalBchSats: number;

  /**
   * Fee Model v1 snapshot.
   *
   * Legacy records do not have this field and continue to use the historical
   * meanings of fiatAmountMinor, fee, finalBchSats and feeOutputPlan.
   *
   * New Fee Model v1 records will populate this field once the live Topup flow
   * is migrated in Checkpoint B2.
   */
  feeModel?: TopupFeeModelV1Snapshot;

  quote: VoucherQuote;

  derivationIndex: number;
  address: string;

  keyMetadata?: VoucherKeyMetadata;
  /**
   * Immutable customer delivery choice and its bearer-secret delivery state.
   *
   * Legacy vouchers do not contain this field.
   */
  delivery?: VoucherDelivery;
  /**
   * Exceptional Printed-voucher recovery/audit state.
   *
   * Present only when an uncertain/interrupted physical print was manually
   * resolved by the merchant.
   */
  printedRecovery?: VoucherPrintedRecovery;

  /**
   * Present only on a replacement Topup.
   *
   * The original customer sale remains the accounting/reporting source.
   */
  replacement?: VoucherReplacement;

  /**
   * Idempotency key for the merchant Issue action that created this record.
   *
   * Legacy records do not have this field.
   */
  issueOperationId?: string;

  /**
   * Durable signed transaction intent saved before any broadcast attempt.
   *
   * Legacy records do not have this field.
   */
  fundingIntent?: VoucherFundingIntent;

  fundingBroadcast?: VoucherFundingBroadcast;

  /**
   * Latest strongest network evidence for the exact deterministic funding
   * transaction.
   *
   * Positive evidence is monotonic:
   * confirmed must never be downgraded;
   * mempool must never be replaced by unknown/unavailable.
   */
  fundingReconciliation?: TreasuryBroadcastReconciliationResult;

  redemptionDetection?: VoucherRedemptionDetection;

  manualRedemption?: VoucherManualRedemption;

  feeOutputPlan?: VoucherFeeOutputPlan;
  treasuryFundingPreview?: TreasuryFundingPreview;

  fundingTxid?: string;
  fundingDetectedAt?: string;

  printedAt?: string;
  redeemedAt?: string;
  reclaimedAt?: string;

  status: VoucherStatus;

  printerJobId?: string;
  errorMessage?: string;
}

export type VoucherFundingBroadcastStatus =
  | 'blocked'
  | 'broadcasted'
  | 'definitely_not_broadcast'
  | 'uncertain'

  /**
   * Legacy development records may contain the old generic failed state.
   *
   * New B5.5 broadcasts must not create this status.
   */
  | 'failed';

export interface VoucherFundingBroadcast {
  status: VoucherFundingBroadcastStatus;

  /**
   * Deterministic locally-calculated transaction ID.
   */
  txid?: string;

  /**
   * Transaction ID returned by Electrum when available.
   */
  serverTxid?: string;

  errorMessage?: string;

  broadcastEnabled: boolean;

  /**
   * Optional only for compatibility with historical development records.
   *
   * New B5.5 broadcast results always populate this field.
   */
  requestAttempted?: boolean;

  attemptedAt: string;
}
