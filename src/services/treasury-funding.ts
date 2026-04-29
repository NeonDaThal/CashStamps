import type {
  TreasuryFundingPreview,
  TreasuryFundingPreviewInput,
} from 'src/types/treasury-funding';

/**
 * Conservative placeholder fee for dry-run previews.
 *
 * This is NOT final transaction fee logic.
 * Real fee estimation will be added when we build actual transaction creation.
 */
const MINIMUM_DRY_RUN_FEE_SATS = 500;

/**
 * Simple placeholder transaction size estimate.
 *
 * A normal P2PKH treasury funding transaction will usually have:
 * - one or more inputs from treasury UTXOs
 * - one voucher output
 * - one change output back to treasury
 *
 * This dry-run estimate deliberately stays simple so we can test UX safely
 * before real transaction construction.
 */
function estimateDryRunFeeSats(utxoCount: number): number {
  const safeInputCount = Math.max(utxoCount, 1);

  const estimatedBytes =
    10 + // tx overhead
    safeInputCount * 148 + // rough P2PKH input size
    2 * 34; // voucher output + change output

  return Math.max(MINIMUM_DRY_RUN_FEE_SATS, estimatedBytes);
}

export function createTreasuryFundingPreview(
  input: TreasuryFundingPreviewInput
): TreasuryFundingPreview {
  const estimatedFeeSats = estimateDryRunFeeSats(input.treasuryUtxoCount);
  const estimatedTotalRequiredSats = input.amountSats + estimatedFeeSats;
  const estimatedChangeSats =
    input.treasuryBalanceSats - estimatedTotalRequiredSats;

  return {
    treasuryAddress: input.treasuryAddress,
    voucherAddress: input.voucherAddress,

    amountSats: input.amountSats,
    estimatedFeeSats,
    estimatedTotalRequiredSats,
    estimatedChangeSats,

    treasuryBalanceSats: input.treasuryBalanceSats,
    treasuryUtxoCount: input.treasuryUtxoCount,

    isAffordable: estimatedChangeSats >= 0,
    createdAt: new Date().toISOString(),
  };
}
