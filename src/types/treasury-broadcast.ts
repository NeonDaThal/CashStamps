export type TreasuryBroadcastStatus =
  | 'blocked'
  | 'broadcasted'
  | 'definitely_not_broadcast'
  | 'uncertain';

export interface TreasuryBroadcastResult {
  status: TreasuryBroadcastStatus;

  /**
   * Deterministic transaction ID calculated locally before broadcast.
   *
   * When present, this identifies the exact transaction whose broadcast
   * outcome is being described.
   */
  txid?: string;

  /**
   * Transaction ID returned by the Electrum server.
   *
   * On a proven successful broadcast this must equal txid.
   */
  serverTxid?: string;

  errorMessage?: string;

  /**
   * Whether the global real-broadcast safety guard was enabled.
   */
  broadcastEnabled: boolean;

  /**
   * Whether the app actually began the transaction broadcast request.
   *
   * False means we know the transaction was not submitted by this attempt.
   * True means any ambiguous failure must be treated as uncertain.
   */
  requestAttempted: boolean;

  attemptedAt: string;
}
