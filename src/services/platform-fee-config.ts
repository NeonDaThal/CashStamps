export const PLATFORM_FEE_BASIS_POINTS = 500;
export const MERCHANT_RETAINED_BASIS_POINTS = 300;
export const BUFFER_RESERVE_BASIS_POINTS = 200;

export const TOTAL_SERVICE_FEE_BASIS_POINTS =
  PLATFORM_FEE_BASIS_POINTS +
  MERCHANT_RETAINED_BASIS_POINTS +
  BUFFER_RESERVE_BASIS_POINTS;

/**
 * Real funding must stay disabled until this is configured.
 *
 * This should be your BCH fee collection wallet address.
 */
export const PLATFORM_FEE_ADDRESS = '';

/**
 * Optional future reserve wallet.
 *
 * For now, this is required only if BUFFER_RESERVE_BASIS_POINTS is greater than 0
 * and we decide the buffer should be paid as an on-chain output.
 */
export const BUFFER_RESERVE_ADDRESS = '';

export function isPlatformFeeAddressConfigured(): boolean {
  return PLATFORM_FEE_ADDRESS.trim().length > 0;
}

export function isBufferReserveAddressConfigured(): boolean {
  return BUFFER_RESERVE_ADDRESS.trim().length > 0;
}
