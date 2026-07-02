import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';

export type TreasurySendDraftResultStatus = 'ready' | 'invalid';

export interface TreasurySendDraftResult {
  status: TreasurySendDraftResultStatus;
  destinationAddress?: string;
  amountSats?: number;
  estimatedFeeSats?: number;
  actualFeeSats?: number;
  isMaxSend?: boolean;
  draft?: TreasuryTransactionDraft;
  errorMessage?: string;
  createdAt: string;
}
