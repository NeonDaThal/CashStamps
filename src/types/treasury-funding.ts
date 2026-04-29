export interface TreasuryFundingPreviewInput {
  treasuryAddress: string;
  voucherAddress: string;
  amountSats: number;
  treasuryBalanceSats: number;
  treasuryUtxoCount: number;
}

export interface TreasuryFundingPreview {
  treasuryAddress: string;
  voucherAddress: string;

  amountSats: number;
  estimatedFeeSats: number;
  estimatedTotalRequiredSats: number;
  estimatedChangeSats: number;

  treasuryBalanceSats: number;
  treasuryUtxoCount: number;

  isAffordable: boolean;
  createdAt: string;
}
