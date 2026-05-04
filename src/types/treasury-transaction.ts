import type { TreasuryFundingPreviewSelectedUtxo } from 'src/types/treasury-funding';

export type TreasuryTransactionPlanStatus = 'valid' | 'invalid';

export type TreasuryTransactionPlanInvalidReason =
  | 'missing_treasury_address'
  | 'missing_voucher_address'
  | 'invalid_amount'
  | 'no_selected_utxos'
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

  invalidReason?: TreasuryTransactionPlanInvalidReason;
  invalidMessage?: string;

  createdAt: string;
}
