export const PLATFORM_FEE_BASIS_POINTS = 500;
export const MERCHANT_RETAINED_BASIS_POINTS = 300;
export const BUFFER_RESERVE_BASIS_POINTS = 200;

export const TOTAL_SERVICE_FEE_BASIS_POINTS =
  PLATFORM_FEE_BASIS_POINTS +
  MERCHANT_RETAINED_BASIS_POINTS +
  BUFFER_RESERVE_BASIS_POINTS;

/**
 * Real funding must stay disabled until this is configured with a valid BCH
 * address.
 *
 * This should be your BCH fee collection wallet address.
 *
 * Example format:
 * bitcoincash:...
 */
export const PLATFORM_FEE_ADDRESS = '';

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
