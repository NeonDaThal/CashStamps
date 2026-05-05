export type TreasuryTransactionDraftAuditStatus = 'passed' | 'failed';

export type TreasuryTransactionDraftAuditCheckKey =
  | 'draft_created'
  | 'broadcast_disabled'
  | 'input_count_matches_plan'
  | 'has_voucher_output'
  | 'has_platform_fee_output'
  | 'has_change_output'
  | 'actual_fee_positive'
  | 'actual_change_non_negative';

export interface TreasuryTransactionDraftAuditCheck {
  key: TreasuryTransactionDraftAuditCheckKey;
  passed: boolean;
  message: string;
}

export interface TreasuryTransactionDraftAudit {
  status: TreasuryTransactionDraftAuditStatus;
  checks: TreasuryTransactionDraftAuditCheck[];
  checkedAt: string;
}
