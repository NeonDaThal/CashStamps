import { getFeeAddressConfigStatus } from 'src/services/fee-address-config';
import { getFundingSafetyStatus } from 'src/services/funding-safety';
import type { PreBroadcastChecklist } from 'src/types/pre-broadcast-checklist';
import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { TreasuryTransactionDraftAudit } from 'src/types/treasury-transaction-audit';
import type { VoucherKeyMetadata } from 'src/types/voucher';

interface CreatePreBroadcastChecklistInput {
  treasuryFundingPreview?: TreasuryFundingPreview | null;
  transactionDraft?: TreasuryTransactionDraft | null;
  transactionDraftAudit?: TreasuryTransactionDraftAudit | null;
  voucherKeyMetadata?: VoucherKeyMetadata | null;
}

function createCheck(
  key: PreBroadcastChecklist['checks'][number]['key'],
  passed: boolean,
  message: string
): PreBroadcastChecklist['checks'][number] {
  return {
    key,
    passed,
    message,
  };
}

export function createPreBroadcastChecklist(
  input: CreatePreBroadcastChecklistInput
): PreBroadcastChecklist {
  const fundingSafety = getFundingSafetyStatus();
  const feeAddressConfig = getFeeAddressConfigStatus();

  const treasuryFundingPreview = input.treasuryFundingPreview;
  const transactionDraft = input.transactionDraft;
  const transactionDraftAudit = input.transactionDraftAudit;
  const voucherKeyMetadata = input.voucherKeyMetadata;

  const checks: PreBroadcastChecklist['checks'] = [
    createCheck(
      'broadcast_guard_enabled',
      fundingSafety.realBroadcastEnabled,
      fundingSafety.realBroadcastEnabled
        ? 'Global broadcast safety guard is enabled.'
        : 'Global broadcast safety guard is disabled.'
    ),

    createCheck(
      'transaction_draft_created',
      transactionDraft?.status === 'created',
      transactionDraft?.status === 'created'
        ? 'Transaction draft has been created.'
        : 'Transaction draft has not been created.'
    ),

    createCheck(
      'transaction_audit_passed',
      transactionDraftAudit?.status === 'passed',
      transactionDraftAudit?.status === 'passed'
        ? 'Transaction draft audit has passed.'
        : 'Transaction draft audit has not passed.'
    ),

    createCheck(
      'treasury_wallet_ready',
      Boolean(treasuryFundingPreview?.treasuryAddress),
      treasuryFundingPreview?.treasuryAddress
        ? 'Treasury wallet is available.'
        : 'Treasury wallet is not available.'
    ),

    createCheck(
      'treasury_balance_sufficient',
      Boolean(treasuryFundingPreview?.isAffordable),
      treasuryFundingPreview?.isAffordable
        ? 'Treasury balance appears sufficient.'
        : 'Treasury balance does not appear sufficient.'
    ),

    createCheck(
      'platform_fee_address_configured',
      feeAddressConfig.platformFeeAddressConfigured,
      feeAddressConfig.platformFeeAddressConfigured
        ? 'Platform fee address is configured.'
        : 'Platform fee address is not configured.'
    ),

    createCheck(
      'platform_fee_address_valid',
      feeAddressConfig.platformFeeAddressValid,
      feeAddressConfig.platformFeeAddressValid
        ? 'Platform fee address is valid.'
        : 'Platform fee address is not valid.'
    ),

    createCheck(
      'voucher_wif_ready',
      Boolean(voucherKeyMetadata?.hasWif),
      voucherKeyMetadata?.hasWif
        ? 'Voucher WIF export is ready.'
        : 'Voucher WIF export is not ready.'
    ),
  ];

  return {
    status: checks.every((check) => check.passed) ? 'passed' : 'blocked',
    checks,
    checkedAt: new Date().toISOString(),
  };
}
