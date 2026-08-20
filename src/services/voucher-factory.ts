import type { TopupFeeModelV1Snapshot } from 'src/types/fee-model';
import type {
  TreasuryFundingPreview,
  TreasuryFundingPreviewSelectedUtxo,
} from 'src/types/treasury-funding';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import type {
  VoucherFee,
  VoucherFundingBroadcast,
  VoucherFundingIntent,
  VoucherKeyMetadata,
  VoucherRecord,
  VoucherQuoteSource,
} from 'src/types/voucher';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';
import type { TopupPricingV1 } from 'src/services/topup-pricing-v1';

export interface VoucherAddressData {
  derivationIndex: number;
  address: string;
}

export interface CreateVoucherRecordOptions {
  addressData?: VoucherAddressData;
  keyMetadata?: VoucherKeyMetadata | null;
  feeModel?: TopupFeeModelV1Snapshot | null;
  feeOutputPlan?: VoucherFeeOutputPlan | null;
  treasuryFundingPreview?: TreasuryFundingPreview | null;

  issueOperationId?: string | null;
  fundingIntent?: VoucherFundingIntent | null;

  fundingBroadcast?: VoucherFundingBroadcast | null;
}

type VoucherPricingForRecord = FakeVoucherPricingQuote | TopupPricingV1;

function createVoucherId(): string {
  return `voucher-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createVoucherSerial(): string {
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');

  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `BCHV-${datePart}-${randomPart}`;
}

function isTopupPricingV1(
  pricing: VoucherPricingForRecord
): pricing is TopupPricingV1 {
  return 'feeModelVersion' in pricing && pricing.feeModelVersion === 'topup_v1';
}

function mapPricingQuoteSourceToVoucherQuoteSource(
  source: string
): VoucherQuoteSource {
  switch (source) {
    case 'fake_phase_2':
    case 'fake_phase_2_quote':
      return 'manual';

    case 'coingecko':
      return 'coingecko';

    case 'cached':
      return 'cached';

    case 'general_protocols_oracle':
      return 'general_protocols_oracle';

    case 'manual':
      return 'manual';

    case 'unknown':
    default:
      return 'unknown';
  }
}

function createVoucherFee(pricing?: VoucherPricingForRecord): VoucherFee {
  if (!pricing) {
    return {
      type: 'percentage',
      basisPoints: 1000,
      amountMinor: 0,
      description: 'MVP service fee',
    };
  }

  if (isTopupPricingV1(pricing)) {
    const isPercentageTier = pricing.feeTier === 'percentage';

    return {
      type: isPercentageTier ? 'percentage' : 'fixed',

      basisPoints: isPercentageTier
        ? pricing.feeModelCalculation.percentageBasisPoints
        : 0,

      amountMinor: pricing.serviceFeeAmountMinor,

      description: `Fee Model v1 ${pricing.feeTier} service fee`,
    };
  }

  return {
    type: 'percentage',
    basisPoints: pricing.serviceFeeBasisPoints,
    amountMinor: pricing.serviceFeeAmountMinor,
    description: 'MVP service fee',
  };
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

    address: utxo.address,

    derivationIndex: utxo.derivationIndex,
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

    platformFeeSats: preview.platformFeeSats ?? 0,
    bufferReserveSats: preview.bufferReserveSats ?? 0,

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

function cloneFeeModel(
  feeModel?: TopupFeeModelV1Snapshot | null
): TopupFeeModelV1Snapshot | undefined {
  if (!feeModel) {
    return undefined;
  }

  return {
    version: feeModel.version,

    currency: feeModel.currency,
    principalMinor: feeModel.principalMinor,

    feeTier: feeModel.feeTier,
    percentageBasisPoints: feeModel.percentageBasisPoints,

    serviceFeeMinor: feeModel.serviceFeeMinor,
    merchantFeeMinor: feeModel.merchantFeeMinor,
    platformFeeMinor: feeModel.platformFeeMinor,

    customerTotalBeforeNetworkFeeMinor:
      feeModel.customerTotalBeforeNetworkFeeMinor,

    scheduleSnapshot: {
      minorUnitDigits: feeModel.scheduleSnapshot.minorUnitDigits,
      smallestPositivePrincipalMinor:
        feeModel.scheduleSnapshot.smallestPositivePrincipalMinor,

      minimumTierMaximumPrincipalMinor:
        feeModel.scheduleSnapshot.minimumTierMaximumPrincipalMinor,

      percentageTierMaximumPrincipalMinor:
        feeModel.scheduleSnapshot.percentageTierMaximumPrincipalMinor,

      minimumFeeMinor: feeModel.scheduleSnapshot.minimumFeeMinor,

      percentageBasisPoints: feeModel.scheduleSnapshot.percentageBasisPoints,

      maximumFeeMinor: feeModel.scheduleSnapshot.maximumFeeMinor,
    },

    snapshotCreatedAt: feeModel.snapshotCreatedAt,

    networkFee: {
      status: feeModel.networkFee.status,
      feeSats: feeModel.networkFee.feeSats,
      recoveryMinor: feeModel.networkFee.recoveryMinor,
    },

    customerTotalMinor: feeModel.customerTotalMinor,
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

function cloneFundingIntent(
  fundingIntent?: VoucherFundingIntent | null
): VoucherFundingIntent | undefined {
  if (!fundingIntent) {
    return undefined;
  }

  return {
    operationId: fundingIntent.operationId,

    status: fundingIntent.status,

    rawTransactionHex: fundingIntent.rawTransactionHex,

    txid: fundingIntent.txid,

    actualFeeSats: fundingIntent.actualFeeSats,

    actualChangeSats: fundingIntent.actualChangeSats,

    dustChangeAbsorbedSats: fundingIntent.dustChangeAbsorbedSats,

    inputCount: fundingIntent.inputCount,

    outputCount: fundingIntent.outputCount,

    preparedAt: fundingIntent.preparedAt,
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

    serverTxid: fundingBroadcast.serverTxid,

    errorMessage: fundingBroadcast.errorMessage,

    broadcastEnabled: fundingBroadcast.broadcastEnabled,

    requestAttempted: fundingBroadcast.requestAttempted,

    attemptedAt: fundingBroadcast.attemptedAt,
  };
}

export function createDraftVoucherRecord(
  fiatAmountMinor: number,
  fiatCurrency = 'GBP',
  pricing?: VoucherPricingForRecord,
  options?: CreateVoucherRecordOptions
): VoucherRecord {
  const now = new Date().toISOString();

  const fundingBroadcast = cloneFundingBroadcast(options?.fundingBroadcast);
  const fundingIntent = cloneFundingIntent(options?.fundingIntent);

  return {
    id: createVoucherId(),
    serial: createVoucherSerial(),

    createdAt: now,
    updatedAt: now,

    fiatCurrency,
    fiatAmountMinor,

    marketBchSats: pricing?.marketBchSats ?? 0,

    fee: createVoucherFee(pricing),

    finalBchSats: pricing?.finalBchSats ?? 0,

    feeModel: cloneFeeModel(options?.feeModel),

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

    issueOperationId: options?.issueOperationId ?? undefined,

    fundingIntent,

    fundingBroadcast,

    status:
      fundingBroadcast?.status === 'broadcasted'
        ? 'funded'
        : fundingIntent
        ? 'funding'
        : 'draft',
  };
}
