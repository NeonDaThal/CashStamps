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
 * Real fee estimation will be added when we build actual transaction creation.
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
 * Simple placeholder transaction size estimate.
 *
 * A normal P2PKH treasury funding transaction will usually have:
 * - one or more inputs from treasury UTXOs
 * - one voucher output
 * - one change output back to treasury
 */
function estimateDryRunFeeSats(inputCount: number): number {
  const safeInputCount = Math.max(inputCount, 1);

  const estimatedBytes =
    10 + // tx overhead
    safeInputCount * 148 + // rough P2PKH input size
    2 * 34; // voucher output + change output

  return Math.max(MINIMUM_DRY_RUN_FEE_SATS, estimatedBytes);
}

function sortUtxosByValueAscending(utxos: TreasuryUtxo[]): TreasuryUtxo[] {
  return [...utxos].sort((a, b) => a.valueSats - b.valueSats);
}

function selectDryRunUtxos(
  utxos: TreasuryUtxo[],
  amountSats: number
): {
  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;
  estimatedFeeSats: number;
} {
  const sortedUtxos = sortUtxosByValueAscending(utxos);
  const selectedUtxos: TreasuryFundingPreviewSelectedUtxo[] = [];

  let selectedInputSats = 0;
  let estimatedFeeSats = estimateDryRunFeeSats(1);

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(cloneUtxo(utxo));
    selectedInputSats += utxo.valueSats;

    estimatedFeeSats = estimateDryRunFeeSats(selectedUtxos.length);

    if (selectedInputSats >= amountSats + estimatedFeeSats) {
      break;
    }
  }

  return {
    selectedUtxos,
    selectedInputSats,
    estimatedFeeSats,
  };
}

export function createTreasuryFundingPreview(
  input: TreasuryFundingPreviewInput
): TreasuryFundingPreview {
  const treasuryUtxos = input.treasuryUtxos ?? [];

  const hasDetailedUtxos = treasuryUtxos.length > 0;

  const { selectedUtxos, selectedInputSats, estimatedFeeSats } =
    hasDetailedUtxos
      ? selectDryRunUtxos(treasuryUtxos, input.amountSats)
      : {
          selectedUtxos: [],
          selectedInputSats: input.treasuryBalanceSats,
          estimatedFeeSats: estimateDryRunFeeSats(input.treasuryUtxoCount),
        };

  const estimatedTotalRequiredSats = input.amountSats + estimatedFeeSats;
  const estimatedChangeSats = selectedInputSats - estimatedTotalRequiredSats;

  return {
    treasuryAddress: input.treasuryAddress,
    voucherAddress: input.voucherAddress,

    amountSats: input.amountSats,
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
