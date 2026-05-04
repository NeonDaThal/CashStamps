export type FundingReadinessStatus = 'ready' | 'not_ready';

export type FundingReadinessBlocker =
  | 'platform_fee_address_missing'
  | 'buffer_reserve_address_missing'
  | 'treasury_not_setup'
  | 'treasury_balance_missing'
  | 'treasury_balance_too_low'
  | 'transaction_plan_invalid'
  | 'transaction_draft_not_created';

export interface FundingReadinessCheck {
  status: FundingReadinessStatus;
  blockers: FundingReadinessBlocker[];
  messages: string[];
  checkedAt: string;
}
