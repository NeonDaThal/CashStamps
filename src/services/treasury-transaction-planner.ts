import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type {
  TreasuryTransactionPlan,
  TreasuryTransactionPlanInvalidReason,
  TreasuryTransactionPlanOutput,
} from 'src/types/treasury-transaction';

function createInvalidPlan(
  preview: TreasuryFundingPreview,
  invalidReason: TreasuryTransactionPlanInvalidReason,
  invalidMessage: string
): TreasuryTransactionPlan {
  return {
    status: 'invalid',

    treasuryAddress: preview.treasuryAddress,
    voucherAddress: preview.voucherAddress,

    selectedUtxos: preview.selectedUtxos,
    selectedInputSats: preview.selectedInputSats,

    outputs: [],

    voucherOutputSats: preview.amountSats,
    estimatedFeeSats: preview.estimatedFeeSats,
    estimatedChangeSats: preview.estimatedChangeSats,

    invalidReason,
    invalidMessage,

    createdAt: new Date().toISOString(),
  };
}

export function createTreasuryTransactionPlanFromPreview(
  preview: TreasuryFundingPreview
): TreasuryTransactionPlan {
  if (!preview.treasuryAddress) {
    return createInvalidPlan(
      preview,
      'missing_treasury_address',
      'Treasury address is missing.'
    );
  }

  if (!preview.voucherAddress) {
    return createInvalidPlan(
      preview,
      'missing_voucher_address',
      'Voucher address is missing.'
    );
  }

  if (!Number.isFinite(preview.amountSats) || preview.amountSats <= 0) {
    return createInvalidPlan(
      preview,
      'invalid_amount',
      'Voucher funding amount is invalid.'
    );
  }

  if (preview.selectedUtxos.length === 0) {
    return createInvalidPlan(
      preview,
      'no_selected_utxos',
      'No treasury UTXOs are selected for this transaction.'
    );
  }

  if (preview.selectedInputSats < preview.estimatedTotalRequiredSats) {
    return createInvalidPlan(
      preview,
      'insufficient_input_value',
      'Selected treasury UTXOs do not cover the voucher amount and estimated fee.'
    );
  }

  if (preview.estimatedChangeSats < 0) {
    return createInvalidPlan(
      preview,
      'invalid_change',
      'Estimated change is negative.'
    );
  }

  const outputs: TreasuryTransactionPlanOutput[] = [
    {
      address: preview.voucherAddress,
      valueSats: preview.amountSats,
      purpose: 'voucher',
    },
  ];

  if (preview.estimatedChangeSats > 0) {
    outputs.push({
      address: preview.treasuryAddress,
      valueSats: preview.estimatedChangeSats,
      purpose: 'change',
    });
  }

  return {
    status: 'valid',

    treasuryAddress: preview.treasuryAddress,
    voucherAddress: preview.voucherAddress,

    selectedUtxos: preview.selectedUtxos,
    selectedInputSats: preview.selectedInputSats,

    outputs,

    voucherOutputSats: preview.amountSats,
    estimatedFeeSats: preview.estimatedFeeSats,
    estimatedChangeSats: preview.estimatedChangeSats,

    createdAt: new Date().toISOString(),
  };
}
