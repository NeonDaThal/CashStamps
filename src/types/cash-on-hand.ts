export type CashOnHandMovementType =
  | 'setup'
  | 'manual_add'
  | 'manual_withdraw'
  | 'topup_sale'
  | 'cash_out_paid'
  | 'clear';

export type CashOnHandRelatedRecordType = 'voucher' | 'cash_out';

export interface CashOnHandMovement {
  id: string;
  type: CashOnHandMovementType;

  /**
   * Always stored as a positive minor-unit amount.
   *
   * Example:
   * - GBP £10.00 = 1000
   * - USD $10.00 = 1000
   *
   * Whether this increases or decreases Cash on Hand is determined by `type`.
   */
  amountMinor: number;

  /**
   * Cash on Hand balance after this movement was applied.
   */
  balanceAfterMinor: number;

  currency: string;

  relatedRecordId?: string;
  relatedRecordType?: CashOnHandRelatedRecordType;

  note?: string;
  createdAt: string;
}

export interface CashOnHandState {
  isSetUp: boolean;
  currency: string;
  balanceMinor: number;

  createdAt?: string;
  updatedAt?: string;

  movements: CashOnHandMovement[];
}

export interface CashOnHandSetupInput {
  amountMinor: number;
  currency?: string;
  note?: string;
  createdAt?: string;
}

export interface CashOnHandManualAdjustmentInput {
  amountMinor: number;
  currency?: string;
  note?: string;
  createdAt?: string;
}

export interface CashOnHandRelatedMovementInput {
  amountMinor: number;
  currency?: string;
  relatedRecordId: string;
  note?: string;
  createdAt?: string;
}
