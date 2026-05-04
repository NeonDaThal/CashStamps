import {
  BUFFER_RESERVE_ADDRESS,
  BUFFER_RESERVE_BASIS_POINTS,
  MERCHANT_RETAINED_BASIS_POINTS,
  PLATFORM_FEE_ADDRESS,
  PLATFORM_FEE_BASIS_POINTS,
  TOTAL_SERVICE_FEE_BASIS_POINTS,
} from 'src/services/platform-fee-config';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';

function calculateBasisPointShare(
  baseSats: number,
  basisPoints: number
): number {
  return Math.round((baseSats * basisPoints) / 10_000);
}

function optionalAddress(address: string): string | undefined {
  const trimmedAddress = address.trim();

  return trimmedAddress.length > 0 ? trimmedAddress : undefined;
}

export function createVoucherFeeOutputPlan(
  pricing: FakeVoucherPricingQuote
): VoucherFeeOutputPlan {
  const platformFeeSats = calculateBasisPointShare(
    pricing.marketBchSats,
    PLATFORM_FEE_BASIS_POINTS
  );

  const merchantRetainedSats = calculateBasisPointShare(
    pricing.marketBchSats,
    MERCHANT_RETAINED_BASIS_POINTS
  );

  const bufferReserveSats = calculateBasisPointShare(
    pricing.marketBchSats,
    BUFFER_RESERVE_BASIS_POINTS
  );

  return {
    platformFeeAddress: optionalAddress(PLATFORM_FEE_ADDRESS),
    platformFeeSats,
    platformFeeBasisPoints: PLATFORM_FEE_BASIS_POINTS,

    merchantRetainedSats,
    merchantRetainedBasisPoints: MERCHANT_RETAINED_BASIS_POINTS,

    bufferReserveAddress: optionalAddress(BUFFER_RESERVE_ADDRESS),
    bufferReserveSats,
    bufferReserveBasisPoints: BUFFER_RESERVE_BASIS_POINTS,

    totalServiceFeeSats:
      platformFeeSats + merchantRetainedSats + bufferReserveSats,
    totalServiceFeeBasisPoints: TOTAL_SERVICE_FEE_BASIS_POINTS,
  };
}
