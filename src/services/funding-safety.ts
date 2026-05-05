import type { FundingSafetyStatus } from 'src/types/funding-safety';

/**
 * Global hard safety switch.
 *
 * Keep this false until:
 * - platform fee address is configured
 * - buffer/reserve decision is finalized
 * - treasury backup/restore has been tested
 * - real transaction draft generation has been tested with tiny BCH amounts
 * - funded-state detection is implemented
 * - explicit broadcast UI/confirmation is added
 */
export const REAL_BROADCAST_ENABLED = false;

export function getFundingSafetyStatus(): FundingSafetyStatus {
  return {
    realBroadcastEnabled: REAL_BROADCAST_ENABLED,
    message: REAL_BROADCAST_ENABLED
      ? 'Real broadcast is enabled.'
      : 'Real broadcast is disabled by the global funding safety guard.',
    checkedAt: new Date().toISOString(),
  };
}
