import type { TopupPricingV1 } from './topup-pricing-v1';
import type { VoucherFeeOutputPlan } from '../types/voucher-fees';

function calculateEffectiveBasisPoints(
  feeAmountMinor: number,
  principalMinor: number
): number {
  if (!Number.isSafeInteger(feeAmountMinor) || feeAmountMinor < 0) {
    throw new Error(
      'Fee amount must be a non-negative safe integer in minor units.'
    );
  }

  if (!Number.isSafeInteger(principalMinor) || principalMinor <= 0) {
    throw new Error(
      'Principal must be a positive safe integer in minor units.'
    );
  }

  return Math.round((feeAmountMinor / principalMinor) * 10_000);
}

/**
 * Pure Fee Model v1 Topup fee-output calculation.
 *
 * This function deliberately has no wallet, Libauth, address-validation,
 * browser, IndexedDB, or Vue dependencies so it can be tested deterministically.
 *
 * Address validation remains a separate funding-readiness responsibility.
 */
export function createVoucherFeeOutputPlanV1Core(
  pricing: TopupPricingV1,
  platformFeeAddress?: string
): VoucherFeeOutputPlan {
  const platformFeeBasisPoints = calculateEffectiveBasisPoints(
    pricing.platformFeeAmountMinor,
    pricing.principalMinor
  );

  const merchantRetainedBasisPoints = calculateEffectiveBasisPoints(
    pricing.merchantFeeAmountMinor,
    pricing.principalMinor
  );

  const totalServiceFeeBasisPoints = calculateEffectiveBasisPoints(
    pricing.serviceFeeAmountMinor,
    pricing.principalMinor
  );

  return {
    platformFeeAddress,

    platformFeeSats: pricing.platformFeeSats,
    platformFeeBasisPoints,

    merchantRetainedSats: pricing.merchantFeeEquivalentSats,

    merchantRetainedBasisPoints,

    bufferReserveAddress: undefined,
    bufferReserveSats: 0,
    bufferReserveBasisPoints: 0,
    bufferReserveOutputEnabled: false,

    totalServiceFeeSats:
      pricing.platformFeeSats + pricing.merchantFeeEquivalentSats,

    totalServiceFeeBasisPoints,
  };
}
