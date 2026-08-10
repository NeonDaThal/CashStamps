import type { TreasuryUtxo } from 'src/types/treasury';
import type {
  TreasuryFundingPreview,
  TreasuryFundingPreviewInput,
  TreasuryFundingPreviewSelectedUtxo,
} from 'src/types/treasury-funding';

/**
 * Conservative placeholder fee for dry-run previews.
 *
 * This is NOT final transaction fee logic.
 * The signed transaction builder later calculates the real miner fee.
 */
const MINIMUM_DRY_RUN_FEE_SATS = 500;

function cloneUtxo(utxo: TreasuryUtxo): TreasuryFundingPreviewSelectedUtxo {
  return {
    outpointTransactionHash: utxo.outpointTransactionHash,
    outpointIndex: utxo.outpointIndex,
    valueSats: utxo.valueSats,
  };
}

/**
 * Simple conservative transaction-size estimate.
 *
 * For Topup funding we account for:
 *
 * - treasury P2PKH inputs
 * - voucher output
 * - any platform fee output
 * - any buffer reserve output
 * - one possible treasury change output
 *
 * Always reserving space for a change output is intentionally conservative.
 */
function estimateDryRunFeeSats(
  inputCount: number,
  nonChangeOutputCount: number
): number {
  const safeInputCount = Math.max(inputCount, 1);
  const safeNonChangeOutputCount = Math.max(nonChangeOutputCount, 1);

  const estimatedOutputCount = safeNonChangeOutputCount + 1;

  const estimatedBytes =
    10 + // tx overhead
    safeInputCount * 148 + // rough P2PKH input size
    estimatedOutputCount * 34;

  return Math.max(MINIMUM_DRY_RUN_FEE_SATS, estimatedBytes);
}

function sortUtxosByValueAscending(utxos: TreasuryUtxo[]): TreasuryUtxo[] {
  return [...utxos].sort((a, b) => a.valueSats - b.valueSats);
}

function countNonChangeOutputs(
  platformFeeSats: number,
  bufferReserveSats: number
): number {
  return (
    1 + // voucher output
    (platformFeeSats > 0 ? 1 : 0) +
    (bufferReserveSats > 0 ? 1 : 0)
  );
}

function selectDryRunUtxos(
  utxos: TreasuryUtxo[],
  amountSats: number,
  platformFeeSats: number,
  bufferReserveSats: number
): {
  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;
  estimatedFeeSats: number;
} {
  const sortedUtxos = sortUtxosByValueAscending(utxos);
  const selectedUtxos: TreasuryFundingPreviewSelectedUtxo[] = [];

  const nonChangeOutputCount = countNonChangeOutputs(
    platformFeeSats,
    bufferReserveSats
  );

  const nonNetworkOutputSats = amountSats + platformFeeSats + bufferReserveSats;

  let selectedInputSats = 0;
  let estimatedFeeSats = estimateDryRunFeeSats(1, nonChangeOutputCount);

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(cloneUtxo(utxo));
    selectedInputSats += utxo.valueSats;

    estimatedFeeSats = estimateDryRunFeeSats(
      selectedUtxos.length,
      nonChangeOutputCount
    );

    if (selectedInputSats >= nonNetworkOutputSats + estimatedFeeSats) {
      break;
    }
  }

  return {
    selectedUtxos,
    selectedInputSats,
    estimatedFeeSats,
  };
}

function normaliseOptionalOutputSats(
  value: number | undefined,
  fieldName: string
): number {
  const normalisedValue = value ?? 0;

  if (!Number.isSafeInteger(normalisedValue) || normalisedValue < 0) {
    throw new Error(
      `${fieldName} must be a non-negative safe integer in satoshis.`
    );
  }

  return normalisedValue;
}

export function createTreasuryFundingPreview(
  input: TreasuryFundingPreviewInput
): TreasuryFundingPreview {
  if (!Number.isSafeInteger(input.amountSats) || input.amountSats <= 0) {
    throw new Error(
      'Voucher amount must be a positive safe integer in satoshis.'
    );
  }

  const treasuryUtxos = input.treasuryUtxos ?? [];

  const platformFeeSats = normaliseOptionalOutputSats(
    input.platformFeeSats,
    'Platform fee'
  );

  const bufferReserveSats = normaliseOptionalOutputSats(
    input.bufferReserveSats,
    'Buffer reserve'
  );

  const nonChangeOutputCount = countNonChangeOutputs(
    platformFeeSats,
    bufferReserveSats
  );

  const hasDetailedUtxos = treasuryUtxos.length > 0;

  const { selectedUtxos, selectedInputSats, estimatedFeeSats } =
    hasDetailedUtxos
      ? selectDryRunUtxos(
          treasuryUtxos,
          input.amountSats,
          platformFeeSats,
          bufferReserveSats
        )
      : {
          selectedUtxos: [],
          selectedInputSats: input.treasuryBalanceSats,
          estimatedFeeSats: estimateDryRunFeeSats(
            input.treasuryUtxoCount,
            nonChangeOutputCount
          ),
        };

  const estimatedTotalRequiredSats =
    input.amountSats + platformFeeSats + bufferReserveSats + estimatedFeeSats;

  const estimatedChangeSats = selectedInputSats - estimatedTotalRequiredSats;

  return {
    treasuryAddress: input.treasuryAddress,
    voucherAddress: input.voucherAddress,

    amountSats: input.amountSats,

    platformFeeSats,
    bufferReserveSats,

    estimatedFeeSats,
    estimatedTotalRequiredSats,
    estimatedChangeSats,

    treasuryBalanceSats: input.treasuryBalanceSats,
    treasuryUtxoCount: input.treasuryUtxoCount,

    selectedUtxos,
    selectedInputSats,

    isAffordable: estimatedChangeSats >= 0,
    createdAt: new Date().toISOString(),
  };
}
