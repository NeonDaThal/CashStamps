import type { TreasuryUtxo } from 'src/types/treasury';

export interface TreasuryFundingPreviewInput {
  treasuryAddress: string;
  voucherAddress: string;
  amountSats: number;
  treasuryBalanceSats: number;
  treasuryUtxoCount: number;
  treasuryUtxos?: TreasuryUtxo[];
}

export interface TreasuryFundingPreviewSelectedUtxo {
  outpointTransactionHash: string;
  outpointIndex: number;
  valueSats: number;
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

  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;

  isAffordable: boolean;
  createdAt: string;
}