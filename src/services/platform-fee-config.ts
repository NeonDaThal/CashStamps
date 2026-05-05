export const PLATFORM_FEE_BASIS_POINTS = 500;
export const MERCHANT_RETAINED_BASIS_POINTS = 300;
export const BUFFER_RESERVE_BASIS_POINTS = 200;

export const TOTAL_SERVICE_FEE_BASIS_POINTS =
  PLATFORM_FEE_BASIS_POINTS +
  MERCHANT_RETAINED_BASIS_POINTS +
  BUFFER_RESERVE_BASIS_POINTS;

/**
 * Platform fee collection wallet.
 *
 * Real broadcast is still disabled globally in funding-safety.ts.
 */
export const PLATFORM_FEE_ADDRESS =
  'bitcoincash:qqwecydzk9da5ck3jp7updj5pgkskk79tcnexweus6';

/**
 * MVP decision:
 *
 * Keep the buffer reserve calculation, but do not require a separate on-chain
 * buffer output yet.
 *
 * If this is false, the buffer reserve amount is tracked in the fee plan but
 * is not added as a required transaction output.
 */
export const BUFFER_RESERVE_OUTPUT_ENABLED = false;

/**
 * Optional future reserve wallet.
 *
 * This is only required if BUFFER_RESERVE_OUTPUT_ENABLED is true.
 */
export const BUFFER_RESERVE_ADDRESS = '';

export function isPlatformFeeAddressConfigured(): boolean {
  return PLATFORM_FEE_ADDRESS.trim().length > 0;
}

export function isBufferReserveAddressConfigured(): boolean {
  if (!BUFFER_RESERVE_OUTPUT_ENABLED) {
    return true;
  }

  return BUFFER_RESERVE_ADDRESS.trim().length > 0;
}
