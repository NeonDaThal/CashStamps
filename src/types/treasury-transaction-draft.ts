import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';

export type TreasuryTransactionDraftStatus =
  | 'not_created'
  | 'created'
  | 'invalid';

export interface TreasuryTransactionDraft {
  status: TreasuryTransactionDraftStatus;

  plan: TreasuryTransactionPlan;

  rawTransactionHex?: string;
  rawTransactionBytesLength?: number;

  actualFeeSats?: number;
  actualChangeSats?: number;

  outputCount?: number;
  inputCount?: number;

  /**
   * Safety marker: the app must not broadcast from this draft service.
   */
  broadcastEnabled: false;

  errorMessage?: string;

  createdAt: string;
}
