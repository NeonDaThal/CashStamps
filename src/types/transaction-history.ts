export type TransactionHistoryType = 'topup' | 'cashout';

export type TransactionHistoryStatusStyle =
  | 'redeemed'
  | 'not-redeemed'
  | 'completed'
  | 'received'
  | 'awaiting-payment'
  | 'cancelled'
  | 'failed'
  | 'error'
  | 'neutral';

export interface TransactionHistoryRow {
  id: string;
  recordId: string;
  type: TransactionHistoryType;
  typeLabel: string;
  typeStyle: TransactionHistoryType;
  reference: string;
  shortReference: string;
  createdAt: string;
  dateDisplay: string;
  fiatAmountMinor: number;
  fiatCurrency: string;
  fiatDisplay: string;
  bchSats: number;
  bchDisplay: string;
  statusLabel: string;
  statusStyle: TransactionHistoryStatusStyle;
  accessibleLabel: string;
  isReplacement: boolean;
}
