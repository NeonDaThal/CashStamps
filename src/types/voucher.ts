import type { TopupFeeModelV1Snapshot } from 'src/types/fee-model';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';
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
