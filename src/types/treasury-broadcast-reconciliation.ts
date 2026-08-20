export type TreasuryBroadcastReconciliationServerStatus =
  | 'confirmed'
  | 'mempool'
  | 'unknown'
  | 'error';

export interface TreasuryBroadcastReconciliationServerCheck {
  server: string;

  status: TreasuryBroadcastReconciliationServerStatus;

  /**
   * > 0 when confirmed.
   * 0 when seen in the mempool.
   *
   * Omitted for unknown/error results.
   */
  blockHeight?: number;

  errorMessage?: string;
}

export type TreasuryBroadcastReconciliationStatus =
  | 'confirmed'
  | 'mempool'
  | 'unknown'
  | 'unavailable';

export interface TreasuryBroadcastReconciliationResult {
  /**
   * Exact deterministic transaction ID being reconciled.
   */
  txid: string;

  status: TreasuryBroadcastReconciliationStatus;

  /**
   * Populated when the transaction is confirmed.
   */
  blockHeight?: number;

  /**
   * Per-server evidence used to reach this result.
   */
  serverChecks: TreasuryBroadcastReconciliationServerCheck[];

  checkedAt: string;

  message: string;
}
