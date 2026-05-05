import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type {
  TreasuryTransactionDraftAudit,
  TreasuryTransactionDraftAuditCheck,
} from 'src/types/treasury-transaction-audit';

function createCheck(
  key: TreasuryTransactionDraftAuditCheck['key'],
  passed: boolean,
  message: string
): TreasuryTransactionDraftAuditCheck {
  return {
    key,
    passed,
    message,
  };
}

export function auditTreasuryTransactionDraft(
  draft: TreasuryTransactionDraft
): TreasuryTransactionDraftAudit {
  const checks: TreasuryTransactionDraftAuditCheck[] = [];

  checks.push(
    createCheck(
      'draft_created',
      draft.status === 'created',
      draft.status === 'created'
        ? 'Transaction draft was created.'
        : 'Transaction draft was not created.'
    )
  );

  checks.push(
    createCheck(
      'broadcast_disabled',
      draft.broadcastEnabled === false,
      draft.broadcastEnabled === false
        ? 'Broadcast is disabled.'
        : 'Broadcast is enabled.'
    )
  );

  checks.push(
    createCheck(
      'input_count_matches_plan',
      draft.inputCount === draft.plan.selectedUtxos.length,
      draft.inputCount === draft.plan.selectedUtxos.length
        ? 'Input count matches selected treasury UTXOs.'
        : 'Input count does not match selected treasury UTXOs.'
    )
  );

  checks.push(
    createCheck(
      'has_voucher_output',
      draft.plan.outputs.some((output) => output.purpose === 'voucher'),
      draft.plan.outputs.some((output) => output.purpose === 'voucher')
        ? 'Voucher output is present.'
        : 'Voucher output is missing.'
    )
  );

  checks.push(
    createCheck(
      'has_platform_fee_output',
      draft.plan.outputs.some((output) => output.purpose === 'platform_fee'),
      draft.plan.outputs.some((output) => output.purpose === 'platform_fee')
        ? 'Platform fee output is present.'
        : 'Platform fee output is missing.'
    )
  );

  checks.push(
    createCheck(
      'has_change_output',
      draft.outputCount !== undefined &&
        draft.outputCount >
          draft.plan.outputs.filter((output) => output.purpose !== 'change')
            .length,
      draft.outputCount !== undefined &&
        draft.outputCount >
          draft.plan.outputs.filter((output) => output.purpose !== 'change')
            .length
        ? 'Change output is present.'
        : 'Change output is not present.'
    )
  );

  checks.push(
    createCheck(
      'actual_fee_positive',
      draft.actualFeeSats !== undefined && draft.actualFeeSats > 0,
      draft.actualFeeSats !== undefined && draft.actualFeeSats > 0
        ? 'Actual fee is positive.'
        : 'Actual fee is missing or not positive.'
    )
  );

  checks.push(
    createCheck(
      'actual_change_non_negative',
      draft.actualChangeSats !== undefined && draft.actualChangeSats >= 0,
      draft.actualChangeSats !== undefined && draft.actualChangeSats >= 0
        ? 'Actual change is non-negative.'
        : 'Actual change is missing or negative.'
    )
  );

  return {
    status: checks.every((check) => check.passed) ? 'passed' : 'failed',
    checks,
    checkedAt: new Date().toISOString(),
  };
}
