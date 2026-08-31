/**
 * Cash-out Fee Model v1
 *
 * Customer fee:
 * - 3% of the fiat cash amount being paid out
 *
 * Split:
 * - 50% platform
 * - 50% merchant
 *
 * There is:
 * - no spread
 * - no reserve component
 * - no minimum fee
 * - no maximum fee
 *
 * The minimum Cash-out transaction itself is £1.00.
 *
 * When an odd number of minor currency units cannot be split perfectly:
 * - platform receives the lower half
 * - merchant receives the remainder
 *
 * Example:
 * £1.00 Cash-out
 * 3% service fee = £0.03
 * platform = £0.01
 * merchant = £0.02
 */
export const CASH_OUT_TOTAL_SERVICE_FEE_BASIS_POINTS = 300;

export const CASH_OUT_PLATFORM_FEE_BASIS_POINTS = 150;

export const CASH_OUT_MERCHANT_FEE_BASIS_POINTS = 150;

/**
 * Current MVP currency is GBP, where 100 minor units = £1.00.
 *
 * Future multi-currency work can replace this with currency-specific
 * transaction limits.
 */
export const CASH_OUT_MINIMUM_AMOUNT_MINOR = 100;
