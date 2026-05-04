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

  errorMessage?: string;

  createdAt: string;
}
