import type { TreasuryUtxo } from 'src/types/treasury';

export interface TreasuryFundingPreviewInput {
  treasuryAddress: string;
  voucherAddress: string;

  /**
   * BCH loaded into the customer voucher output.
   */
  amountSats: number;

  /**
   * Optional additional funding outputs.
   *
   * These default to zero so legacy callers retain their existing behaviour.
   * Fee Model v1 populates platformFeeSats for new Topups.
   */
  platformFeeSats?: number;
  bufferReserveSats?: number;

  treasuryBalanceSats: number;
  treasuryUtxoCount: number;
  treasuryUtxos?: TreasuryUtxo[];
}

export interface TreasuryFundingPreviewSelectedUtxo {
  outpointTransactionHash: string;
  outpointIndex: number;
  valueSats: number;

  /**
   * Treasury-derived address that owns this UTXO.
   *
   * Optional only for compatibility with older persisted funding previews.
   * New funding previews preserve this information.
   */
  address?: string;

  /**
   * Treasury derivation index that owns this UTXO.
   *
   * This provenance is required by the live signing path so a Topup can spend
   * funds held at both the main treasury address (index 0) and known Cash-out
   * receiving addresses (indexes 1+).
   *
   * Optional only for compatibility with historical persisted previews.
   */
  derivationIndex?: number;
}

export interface TreasuryFundingPreview {
  treasuryAddress: string;
  voucherAddress: string;

  /**
   * BCH loaded into the voucher.
   */
  amountSats: number;

  /**
   * Additional outputs included while selecting treasury UTXOs.
   *
   * Optional for compatibility with historical persisted previews.
   */
  platformFeeSats?: number;
  bufferReserveSats?: number;

  /**
   * Conservative dry-run miner-fee estimate.
   */
  estimatedFeeSats: number;

  /**
   * Voucher + platform output + buffer output + estimated miner fee.
   */
  estimatedTotalRequiredSats: number;

  estimatedChangeSats: number;

  treasuryBalanceSats: number;
  treasuryUtxoCount: number;

  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;

  isAffordable: boolean;
  createdAt: string;
}
