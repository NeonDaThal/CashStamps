import type { TreasuryFundingPreviewSelectedUtxo } from 'src/types/treasury-funding';

export type TreasuryTransactionPlanStatus = 'valid' | 'invalid';

export type TreasuryTransactionPlanInvalidReason =
  | 'missing_treasury_address'
  | 'missing_voucher_address'
  | 'invalid_amount'
  | 'voucher_output_below_dust'
  | 'no_selected_utxos'
  | 'invalid_platform_fee_amount'
  | 'platform_fee_output_below_dust'
  | 'missing_platform_fee_address'
  | 'invalid_buffer_reserve_amount'
  | 'buffer_reserve_output_below_dust'
  | 'missing_buffer_reserve_address'
  | 'insufficient_input_value'
  | 'invalid_change';

export type TreasuryTransactionPlanOutputPurpose =
  | 'voucher'
  | 'platform_fee'
  | 'buffer_reserve'
  | 'change';

export interface TreasuryTransactionPlanOutput {
  address: string;
  valueSats: number;
  purpose: TreasuryTransactionPlanOutputPurpose;
}

export interface TreasuryTransactionPlanFeeOutputs {
  platformFeeAddress?: string;
  platformFeeSats: number;

  bufferReserveAddress?: string;
  bufferReserveSats: number;
}

export interface TreasuryTransactionPlan {
  status: TreasuryTransactionPlanStatus;

  treasuryAddress: string;
  voucherAddress: string;

  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;

  outputs: TreasuryTransactionPlanOutput[];

  voucherOutputSats: number;

  platformFeeOutputSats: number;
  bufferReserveOutputSats: number;

  estimatedFeeSats: number;
  estimatedChangeSats: number;

  /**
   * Estimated sub-dust treasury change intentionally added to the miner fee
   * rather than emitted as a change output.
   */
  dustChangeAbsorbedSats?: number;

  invalidReason?: TreasuryTransactionPlanInvalidReason;
  invalidMessage?: string;

  createdAt: string;
}
