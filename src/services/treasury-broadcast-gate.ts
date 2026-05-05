import type { PreBroadcastChecklist } from 'src/types/pre-broadcast-checklist';
import type { TreasuryBroadcastGate } from 'src/types/treasury-broadcast-gate';

export function createTreasuryBroadcastGate(
  checklist?: PreBroadcastChecklist | null
): TreasuryBroadcastGate {
  if (!checklist) {
    return {
      status: 'blocked',
      canBroadcast: false,
      message:
        'Broadcast is blocked until a transaction draft has been created and checked.',
      checkedAt: new Date().toISOString(),
    };
  }

  if (checklist.status !== 'passed') {
    return {
      status: 'blocked',
      canBroadcast: false,
      message:
        'Broadcast is blocked because the pre-broadcast checklist has not passed.',
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    status: 'allowed',
    canBroadcast: true,
    message:
      'Broadcast gate is open. A separate explicit broadcast action is still required.',
    checkedAt: new Date().toISOString(),
  };
}
