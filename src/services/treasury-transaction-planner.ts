import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type {
  TreasuryTransactionPlan,
  TreasuryTransactionPlanFeeOutputs,
  TreasuryTransactionPlanInvalidReason,
  TreasuryTransactionPlanOutput,
} from 'src/types/treasury-transaction';

const DEFAULT_FEE_OUTPUTS: TreasuryTransactionPlanFeeOutputs = {
  platformFeeSats: 0,
  bufferReserveSats: 0,
};

function createInvalidPlan(
  preview: TreasuryFundingPreview,
  invalidReason: TreasuryTransactionPlanInvalidReason,
  invalidMessage: string,
  feeOutputs: TreasuryTransactionPlanFeeOutputs = DEFAULT_FEE_OUTPUTS
): TreasuryTransactionPlan {
  return {
    status: 'invalid',

    treasuryAddress: preview.treasuryAddress,
    voucherAddress: preview.voucherAddress,

    selectedUtxos: preview.selectedUtxos,
    selectedInputSats: preview.selectedInputSats,

    outputs: [],

    voucherOutputSats: preview.amountSats,

    platformFeeOutputSats: feeOutputs.platformFeeSats,
    bufferReserveOutputSats: feeOutputs.bufferReserveSats,

    estimatedFeeSats: preview.estimatedFeeSats,
    estimatedChangeSats: preview.estimatedChangeSats,

    invalidReason,
    invalidMessage,

    createdAt: new Date().toISOString(),
  };
}

function createFeeOutputs(
  feeOutputs: TreasuryTransactionPlanFeeOutputs
): TreasuryTransactionPlanOutput[] {
  const outputs: TreasuryTransactionPlanOutput[] = [];

  if (feeOutputs.platformFeeSats > 0 && feeOutputs.platformFeeAddress) {
    outputs.push({
      address: feeOutputs.platformFeeAddress,
      valueSats: feeOutputs.platformFeeSats,
      purpose: 'platform_fee',
    });
  }

  if (feeOutputs.bufferReserveSats > 0 && feeOutputs.bufferReserveAddress) {
    outputs.push({
      address: feeOutputs.bufferReserveAddress,
      valueSats: feeOutputs.bufferReserveSats,
      purpose: 'buffer_reserve',
    });
  }

  return outputs;
}

export function createTreasuryTransactionPlanFromPreview(
  preview: TreasuryFundingPreview,
  feeOutputs: TreasuryTransactionPlanFeeOutputs = DEFAULT_FEE_OUTPUTS
): TreasuryTransactionPlan {
  if (!preview.treasuryAddress) {
    return createInvalidPlan(
      preview,
      'missing_treasury_address',
      'Treasury address is missing.',
      feeOutputs
    );
  }

  if (!preview.voucherAddress) {
    return createInvalidPlan(
      preview,
      'missing_voucher_address',
      'Voucher address is missing.',
      feeOutputs
    );
  }

  if (!Number.isFinite(preview.amountSats) || preview.amountSats <= 0) {
    return createInvalidPlan(
      preview,
      'invalid_amount',
      'Voucher funding amount is invalid.',
      feeOutputs
    );
  }

  if (preview.selectedUtxos.length === 0) {
    return createInvalidPlan(
      preview,
      'no_selected_utxos',
      'No treasury UTXOs are selected for this transaction.',
      feeOutputs
    );
  }

  const totalOutputSatsBeforeChange =
    preview.amountSats +
    feeOutputs.platformFeeSats +
    feeOutputs.bufferReserveSats;

  const totalRequiredSats =
    totalOutputSatsBeforeChange + preview.estimatedFeeSats;

  const estimatedChangeSats = preview.selectedInputSats - totalRequiredSats;

  if (preview.selectedInputSats < totalRequiredSats) {
    return createInvalidPlan(
      {
        ...preview,
        estimatedTotalRequiredSats: totalRequiredSats,
        estimatedChangeSats,
      },
      'insufficient_input_value',
      'Selected treasury UTXOs do not cover the voucher amount, fee outputs, and estimated network fee.',
      feeOutputs
    );
  }

  if (estimatedChangeSats < 0) {
    return createInvalidPlan(
      {
        ...preview,
        estimatedTotalRequiredSats: totalRequiredSats,
        estimatedChangeSats,
      },
      'invalid_change',
      'Estimated change is negative.',
      feeOutputs
    );
  }

  const outputs: TreasuryTransactionPlanOutput[] = [
    {
      address: preview.voucherAddress,
      valueSats: preview.amountSats,
      purpose: 'voucher',
    },
    ...createFeeOutputs(feeOutputs),
  ];

  if (estimatedChangeSats > 0) {
    outputs.push({
      address: preview.treasuryAddress,
      valueSats: estimatedChangeSats,
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

    platformFeeOutputSats: feeOutputs.platformFeeSats,
    bufferReserveOutputSats: feeOutputs.bufferReserveSats,

    estimatedFeeSats: preview.estimatedFeeSats,
    estimatedChangeSats,

    createdAt: new Date().toISOString(),
  };
}
