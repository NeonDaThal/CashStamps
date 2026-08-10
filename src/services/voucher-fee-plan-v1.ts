import { getFeeAddressConfigStatus } from './fee-address-config';
import { createVoucherFeeOutputPlanV1Core } from './voucher-fee-plan-v1-core';

import type { TopupPricingV1 } from './topup-pricing-v1';
import type { VoucherFeeOutputPlan } from '../types/voucher-fees';

/**
 * Production Fee Model v1 Topup fee-output plan.
 *
 * Pure monetary calculations live in voucher-fee-plan-v1-core.ts.
 * This wrapper adds the currently configured platform address.
 *
 * Address validity is still enforced independently by the existing
 * funding-readiness / pre-broadcast safety checks.
 */
export function createVoucherFeeOutputPlanV1(
  pricing: TopupPricingV1
): VoucherFeeOutputPlan {
  const feeAddressConfig = getFeeAddressConfigStatus();

  return createVoucherFeeOutputPlanV1Core(
    pricing,
    feeAddressConfig.platformFeeAddress || undefined
  );
}
