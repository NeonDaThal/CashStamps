export type TreasuryBroadcastStatus = 'blocked' | 'broadcasted' | 'failed';

export interface TreasuryBroadcastResult {
  status: TreasuryBroadcastStatus;
  txid?: string;
  errorMessage?: string;
  broadcastEnabled: boolean;
  attemptedAt: string;
}
