import type { TreasuryFundingPreview } from 'src/types/treasury-funding';

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

export interface VoucherFee {
  type: VoucherFeeType;
  basisPoints: number;
  amountMinor: number;
  description?: string;
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

  quote: VoucherQuote;

  derivationIndex: number;
  address: string;

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
