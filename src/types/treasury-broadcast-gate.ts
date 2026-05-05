export type TreasuryBroadcastGateStatus = 'allowed' | 'blocked';

export interface TreasuryBroadcastGate {
  status: TreasuryBroadcastGateStatus;
  canBroadcast: boolean;
  message: string;
  checkedAt: string;
}
