export const PLATFORM_FEE_BASIS_POINTS = 500;
export const MERCHANT_RETAINED_BASIS_POINTS = 300;
export const BUFFER_RESERVE_BASIS_POINTS = 200;

export const TOTAL_SERVICE_FEE_BASIS_POINTS =
  PLATFORM_FEE_BASIS_POINTS +
  MERCHANT_RETAINED_BASIS_POINTS +
  BUFFER_RESERVE_BASIS_POINTS;

/**
 * TODO before real funding:
 * Replace these with real BCH addresses.
 *
 * PLATFORM_FEE_ADDRESS is your automatic fee wallet.
 * BUFFER_RESERVE_ADDRESS is optional. It can be your own reserve wallet,
 * a separate reserve wallet, or left blank if we later decide not to use
 * an on-chain buffer output.
 */
export const PLATFORM_FEE_ADDRESS = '';
export const BUFFER_RESERVE_ADDRESS = '';
