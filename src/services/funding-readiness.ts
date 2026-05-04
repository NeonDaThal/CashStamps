import {
  BUFFER_RESERVE_BASIS_POINTS,
  PLATFORM_FEE_BASIS_POINTS,
  isBufferReserveAddressConfigured,
  isPlatformFeeAddressConfigured,
} from 'src/services/platform-fee-config';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';
import type { FundingReadinessCheck } from 'src/types/funding-readiness';

export interface CreateFundingReadinessCheckInput {
  treasuryIsSetup: boolean;
  treasuryBalanceSats?: number;
  requiredSats?: number;
  transactionPlan?: TreasuryTransactionPlan | null;
  transactionDraft?: TreasuryTransactionDraft | null;
}

export function createFundingReadinessCheck(
  input: CreateFundingReadinessCheckInput
): FundingReadinessCheck {
  const blockers: FundingReadinessCheck['blockers'] = [];
  const messages: string[] = [];

  if (PLATFORM_FEE_BASIS_POINTS > 0 && !isPlatformFeeAddressConfigured()) {
    blockers.push('platform_fee_address_missing');
    messages.push(
      'Platform fee address is not configured. Real funding must stay disabled.'
    );
  }

  if (BUFFER_RESERVE_BASIS_POINTS > 0 && !isBufferReserveAddressConfigured()) {
    blockers.push('buffer_reserve_address_missing');
    messages.push(
      'Buffer reserve address is not configured. Real funding must stay disabled while buffer reserve output is enabled.'
    );
  }

  if (!input.treasuryIsSetup) {
    blockers.push('treasury_not_setup');
    messages.push('Treasury wallet is not set up.');
  }

  if (input.treasuryIsSetup && input.treasuryBalanceSats === undefined) {
    blockers.push('treasury_balance_missing');
    messages.push('Treasury balance has not been checked.');
  }

  if (
    input.treasuryBalanceSats !== undefined &&
    input.requiredSats !== undefined &&
    input.treasuryBalanceSats < input.requiredSats
  ) {
    blockers.push('treasury_balance_too_low');
    messages.push('Treasury balance is too low for this voucher.');
  }

  if (input.transactionPlan && input.transactionPlan.status !== 'valid') {
    blockers.push('transaction_plan_invalid');
    messages.push(
      input.transactionPlan.invalidMessage ?? 'Transaction plan is invalid.'
    );
  }

  if (input.transactionDraft && input.transactionDraft.status !== 'created') {
    blockers.push('transaction_draft_not_created');
    messages.push(
      input.transactionDraft.errorMessage ??
        'Transaction draft has not been created.'
    );
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'not_ready',
    blockers,
    messages,
    checkedAt: new Date().toISOString(),
  };
}
