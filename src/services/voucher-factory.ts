import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type { VoucherRecord, VoucherQuoteSource } from 'src/types/voucher';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';

export interface VoucherAddressData {
  derivationIndex: number;
  address: string;
}

export interface CreateVoucherRecordOptions {
  addressData?: VoucherAddressData;
  treasuryFundingPreview?: TreasuryFundingPreview | null;
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

    isAffordable: preview.isAffordable,
    createdAt: preview.createdAt,
  };
}

export function createDraftVoucherRecord(
  fiatAmountMinor: number,
  fiatCurrency = 'GBP',
  pricing?: FakeVoucherPricingQuote,
  options?: CreateVoucherRecordOptions
): VoucherRecord {
  const now = new Date().toISOString();

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

    treasuryFundingPreview: cloneTreasuryFundingPreview(
      options?.treasuryFundingPreview
    ),

    status: pricing ? 'funded' : 'draft',
  };
}
