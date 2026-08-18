import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import {
  createTreasuryChangeAllocation,
  isAtOrAboveStandardP2pkhDustLimit,
  STANDARD_P2PKH_DUST_LIMIT_SATS,
} from 'src/services/treasury-output-safety';
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
    dustChangeAbsorbedSats: 0,

    invalidReason,
    invalidMessage,

    createdAt: new Date().toISOString(),
  };
}

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
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

  if (!Number.isSafeInteger(preview.amountSats) || preview.amountSats <= 0) {
    return createInvalidPlan(
      preview,
      'invalid_amount',
      'Voucher funding amount is invalid.',
      feeOutputs
    );
  }

  if (!isAtOrAboveStandardP2pkhDustLimit(preview.amountSats)) {
    return createInvalidPlan(
      preview,
      'voucher_output_below_dust',
      `Voucher output must be at least ${STANDARD_P2PKH_DUST_LIMIT_SATS} satoshis.`,
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

  if (!isNonNegativeSafeInteger(feeOutputs.platformFeeSats)) {
    return createInvalidPlan(
      preview,
      'invalid_platform_fee_amount',
      'Platform fee amount is invalid.',
      feeOutputs
    );
  }

  if (
    feeOutputs.platformFeeSats > 0 &&
    !isAtOrAboveStandardP2pkhDustLimit(feeOutputs.platformFeeSats)
  ) {
    return createInvalidPlan(
      preview,
      'platform_fee_output_below_dust',
      `Platform fee output must be at least ${STANDARD_P2PKH_DUST_LIMIT_SATS} satoshis when present.`,
      feeOutputs
    );
  }

  if (feeOutputs.platformFeeSats > 0 && !feeOutputs.platformFeeAddress) {
    return createInvalidPlan(
      preview,
      'missing_platform_fee_address',
      'Platform fee amount is planned, but no platform fee address is configured.',
      feeOutputs
    );
  }

  if (!isNonNegativeSafeInteger(feeOutputs.bufferReserveSats)) {
    return createInvalidPlan(
      preview,
      'invalid_buffer_reserve_amount',
      'Buffer reserve amount is invalid.',
      feeOutputs
    );
  }

  if (
    feeOutputs.bufferReserveSats > 0 &&
    !isAtOrAboveStandardP2pkhDustLimit(feeOutputs.bufferReserveSats)
  ) {
    return createInvalidPlan(
      preview,
      'buffer_reserve_output_below_dust',
      `Buffer reserve output must be at least ${STANDARD_P2PKH_DUST_LIMIT_SATS} satoshis when present.`,
      feeOutputs
    );
  }

  if (feeOutputs.bufferReserveSats > 0 && !feeOutputs.bufferReserveAddress) {
    return createInvalidPlan(
      preview,
      'missing_buffer_reserve_address',
      'Buffer reserve amount is planned, but no buffer reserve address is configured.',
      feeOutputs
    );
  }

  const totalOutputSatsBeforeChange =
    preview.amountSats +
    feeOutputs.platformFeeSats +
    feeOutputs.bufferReserveSats;

  const changeAllocation = createTreasuryChangeAllocation({
    selectedInputSats: preview.selectedInputSats,
    nonChangeOutputSats: totalOutputSatsBeforeChange,
    minimumFeeSats: preview.estimatedFeeSats,
  });

  if (!changeAllocation.isAffordable) {
    const estimatedChangeSats =
      preview.selectedInputSats -
      totalOutputSatsBeforeChange -
      preview.estimatedFeeSats;

    return createInvalidPlan(
      {
        ...preview,
        estimatedTotalRequiredSats:
          totalOutputSatsBeforeChange + preview.estimatedFeeSats,
        estimatedChangeSats,
      },
      'insufficient_input_value',
      'Selected treasury UTXOs do not cover the voucher amount, fee outputs, and estimated network fee.',
      feeOutputs
    );
  }

  if (changeAllocation.changeSats < 0) {
    return createInvalidPlan(
      preview,
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

  if (changeAllocation.changeSats > 0) {
    outputs.push({
      address: preview.treasuryAddress,
      valueSats: changeAllocation.changeSats,
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

    estimatedFeeSats: changeAllocation.finalFeeSats,
    estimatedChangeSats: changeAllocation.changeSats,
    dustChangeAbsorbedSats: changeAllocation.dustChangeAbsorbedSats,

    createdAt: new Date().toISOString(),
  };
}
