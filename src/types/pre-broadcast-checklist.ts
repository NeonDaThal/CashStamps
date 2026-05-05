export type PreBroadcastChecklistStatus = 'passed' | 'blocked';

export type PreBroadcastChecklistCheckKey =
  | 'broadcast_guard_enabled'
  | 'transaction_draft_created'
  | 'transaction_audit_passed'
  | 'treasury_wallet_ready'
  | 'treasury_balance_sufficient'
  | 'platform_fee_address_configured'
  | 'platform_fee_address_valid'
  | 'voucher_wif_ready';

export interface PreBroadcastChecklistCheck {
  key: PreBroadcastChecklistCheckKey;
  passed: boolean;
  message: string;
}

export interface PreBroadcastChecklist {
  status: PreBroadcastChecklistStatus;
  checks: PreBroadcastChecklistCheck[];
  checkedAt: string;
}
