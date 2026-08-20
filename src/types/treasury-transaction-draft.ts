import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';

export type TreasuryTransactionDraftStatus =
  | 'not_created'
  | 'created'
  | 'invalid';

export interface TreasuryTransactionDraft {
  status: TreasuryTransactionDraftStatus;

  plan: TreasuryTransactionPlan;

  /**
   * Exact signed transaction encoded for network broadcast.
   */
  rawTransactionHex?: string;

  /**
   * Deterministic transaction ID calculated locally from the exact signed
   * transaction bytes before any broadcast attempt.
   *
   * This is normal wallet/block-explorer UI byte order.
   */
  txid?: string;

  rawTransactionBytesLength?: number;

  actualFeeSats?: number;
  actualChangeSats?: number;

  /**
   * Actual sub-dust remainder absorbed into the miner fee rather than emitted
   * as a change output.
   */
  dustChangeAbsorbedSats?: number;

  outputCount?: number;
  inputCount?: number;

  /**
   * Safety marker: the app must not broadcast from this draft service.
   */
  broadcastEnabled: false;

  errorMessage?: string;

  createdAt: string;
}
