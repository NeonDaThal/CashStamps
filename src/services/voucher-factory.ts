import type {
  TreasuryFundingPreview,
  TreasuryFundingPreviewSelectedUtxo,
} from 'src/types/treasury-funding';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import type {
  VoucherFundingBroadcast,
  VoucherKeyMetadata,
  VoucherRecord,
  VoucherQuoteSource,
} from 'src/types/voucher';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';

export interface VoucherAddressData {
  derivationIndex: number;
  address: string;
}

export interface CreateVoucherRecordOptions {
  addressData?: VoucherAddressData;
  keyMetadata?: VoucherKeyMetadata | null;
  feeOutputPlan?: VoucherFeeOutputPlan | null;
  treasuryFundingPreview?: TreasuryFundingPreview | null;
  fundingBroadcast?: VoucherFundingBroadcast | null;
}

function createVoucherId(): string {
  return `voucher-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createVoucherSerial(): string {
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');

  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `BCHV-${datePart}-${randomPart}`;
}

function mapPricingQuoteSourceToVoucherQuoteSource(
  source: FakeVoucherPricingQuote['quoteSource']
): VoucherQuoteSource {
  if (source === 'fake_phase_2_quote') {
    return 'manual';
  }

  return source;
}

function cloneSelectedUtxos(
  selectedUtxos?: TreasuryFundingPreviewSelectedUtxo[]
): TreasuryFundingPreviewSelectedUtxo[] {
  if (!Array.isArray(selectedUtxos)) {
    return [];
  }

  return selectedUtxos.map((utxo) => ({
    outpointTransactionHash: utxo.outpointTransactionHash,
    outpointIndex: utxo.outpointIndex,
    valueSats: utxo.valueSats,
  }));
}

function cloneTreasuryFundingPreview(
  preview?: TreasuryFundingPreview | null
): TreasuryFundingPreview | undefined {
  if (!preview) {
    return undefined;
  }

  return {
    treasuryAddress: preview.treasuryAddress,
    voucherAddress: preview.voucherAddress,

    amountSats: preview.amountSats,
    estimatedFeeSats: preview.estimatedFeeSats,
    estimatedTotalRequiredSats: preview.estimatedTotalRequiredSats,
    estimatedChangeSats: preview.estimatedChangeSats,

    treasuryBalanceSats: preview.treasuryBalanceSats,
    treasuryUtxoCount: preview.treasuryUtxoCount,

    selectedUtxos: cloneSelectedUtxos(preview.selectedUtxos),
    selectedInputSats:
      preview.selectedInputSats ?? preview.treasuryBalanceSats ?? 0,

    isAffordable: preview.isAffordable,
    createdAt: preview.createdAt,
  };
}

function cloneFeeOutputPlan(
  feeOutputPlan?: VoucherFeeOutputPlan | null
): VoucherFeeOutputPlan | undefined {
  if (!feeOutputPlan) {
    return undefined;
  }

  return {
    platformFeeAddress: feeOutputPlan.platformFeeAddress,
    platformFeeSats: feeOutputPlan.platformFeeSats,
    platformFeeBasisPoints: feeOutputPlan.platformFeeBasisPoints,

    merchantRetainedSats: feeOutputPlan.merchantRetainedSats,
    merchantRetainedBasisPoints: feeOutputPlan.merchantRetainedBasisPoints,

    bufferReserveAddress: feeOutputPlan.bufferReserveAddress,
    bufferReserveSats: feeOutputPlan.bufferReserveSats,
    bufferReserveBasisPoints: feeOutputPlan.bufferReserveBasisPoints,
    bufferReserveOutputEnabled: feeOutputPlan.bufferReserveOutputEnabled,

    totalServiceFeeSats: feeOutputPlan.totalServiceFeeSats,
    totalServiceFeeBasisPoints: feeOutputPlan.totalServiceFeeBasisPoints,
  };
}

function cloneKeyMetadata(
  keyMetadata?: VoucherKeyMetadata | null
): VoucherKeyMetadata | undefined {
  if (!keyMetadata) {
    return undefined;
  }

  return {
    hasWif: keyMetadata.hasWif,
    checkedAt: keyMetadata.checkedAt,
  };
}

function cloneFundingBroadcast(
  fundingBroadcast?: VoucherFundingBroadcast | null
): VoucherFundingBroadcast | undefined {
  if (!fundingBroadcast) {
    return undefined;
  }

  return {
    status: fundingBroadcast.status,
    txid: fundingBroadcast.txid,
    errorMessage: fundingBroadcast.errorMessage,
    broadcastEnabled: fundingBroadcast.broadcastEnabled,
    attemptedAt: fundingBroadcast.attemptedAt,
  };
}

export function createDraftVoucherRecord(
  fiatAmountMinor: number,
  fiatCurrency = 'GBP',
  pricing?: FakeVoucherPricingQuote,
  options?: CreateVoucherRecordOptions
): VoucherRecord {
  const now = new Date().toISOString();

  const fundingBroadcast = cloneFundingBroadcast(options?.fundingBroadcast);

  return {
    id: createVoucherId(),
    serial: createVoucherSerial(),

    createdAt: now,
    updatedAt: now,

    fiatCurrency,
    fiatAmountMinor,

    // These become real BCH satoshi values once a real locked quote is passed in.
    marketBchSats: pricing?.marketBchSats ?? 0,
    fee: {
      type: 'percentage',
      basisPoints: pricing?.serviceFeeBasisPoints ?? 1000,
      amountMinor: pricing?.serviceFeeAmountMinor ?? 0,
      description: 'MVP service fee',
    },
    finalBchSats: pricing?.finalBchSats ?? 0,

    quote: {
      source: pricing
        ? mapPricingQuoteSourceToVoucherQuoteSource(pricing.quoteSource)
        : 'unknown',
      fiatCurrency,
      marketRate: pricing?.marketRate ?? 0,
      marketRateTimestamp: pricing?.quoteTimestamp ?? now,
      quoteLockedAt: pricing?.quoteLockedAt,
      quoteExpiresAt: pricing?.quoteExpiresAt,
      isFallbackQuote: pricing?.isFallbackQuote ?? false,
    },

    derivationIndex: options?.addressData?.derivationIndex ?? -1,
    address: options?.addressData?.address ?? '',

    keyMetadata: cloneKeyMetadata(options?.keyMetadata),

    feeOutputPlan: cloneFeeOutputPlan(options?.feeOutputPlan),
    treasuryFundingPreview: cloneTreasuryFundingPreview(
      options?.treasuryFundingPreview
    ),
    fundingBroadcast,

    status: fundingBroadcast?.status === 'broadcasted' ? 'funded' : 'draft',
  };
}
