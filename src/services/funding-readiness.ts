import {
  BUFFER_RESERVE_BASIS_POINTS,
  BUFFER_RESERVE_OUTPUT_ENABLED,
  PLATFORM_FEE_BASIS_POINTS,
  isBufferReserveAddressConfigured,
  isPlatformFeeAddressConfigured,
} from 'src/services/platform-fee-config';
import { getFundingSafetyStatus } from 'src/services/funding-safety';
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

function addBlocker(
  blockers: FundingReadinessCheck['blockers'],
  messages: string[],
  blocker: FundingReadinessCheck['blockers'][number],
  message: string
): void {
  if (!blockers.includes(blocker)) {
    blockers.push(blocker);
  }

  if (!messages.includes(message)) {
    messages.push(message);
  }
}

export function createFundingReadinessCheck(
  input: CreateFundingReadinessCheckInput
): FundingReadinessCheck {
  const blockers: FundingReadinessCheck['blockers'] = [];
  const messages: string[] = [];
  const fundingSafetyStatus = getFundingSafetyStatus();

  if (!fundingSafetyStatus.realBroadcastEnabled) {
    addBlocker(
      blockers,
      messages,
      'real_broadcast_disabled',
      fundingSafetyStatus.message
    );
  }

  if (PLATFORM_FEE_BASIS_POINTS > 0 && !isPlatformFeeAddressConfigured()) {
    addBlocker(
      blockers,
      messages,
      'platform_fee_address_missing',
      'Platform fee address is not configured. Real funding must stay disabled.'
    );
  }

  if (
    BUFFER_RESERVE_OUTPUT_ENABLED &&
    BUFFER_RESERVE_BASIS_POINTS > 0 &&
    !isBufferReserveAddressConfigured()
  ) {
    addBlocker(
      blockers,
      messages,
      'buffer_reserve_address_missing',
      'Buffer reserve address is not configured. Real funding must stay disabled while buffer reserve output is enabled.'
    );
  }

  if (!input.treasuryIsSetup) {
    addBlocker(
      blockers,
      messages,
      'treasury_not_setup',
      'Treasury wallet is not set up.'
    );
  }

  if (input.treasuryIsSetup && input.treasuryBalanceSats === undefined) {
    addBlocker(
      blockers,
      messages,
      'treasury_balance_missing',
      'Treasury balance has not been checked.'
    );
  }

  if (
    input.treasuryBalanceSats !== undefined &&
    input.requiredSats !== undefined &&
    input.treasuryBalanceSats < input.requiredSats
  ) {
    addBlocker(
      blockers,
      messages,
      'treasury_balance_too_low',
      'Treasury balance is too low for this voucher.'
    );
  }

  if (input.transactionPlan && input.transactionPlan.status !== 'valid') {
    addBlocker(
      blockers,
      messages,
      'transaction_plan_invalid',
      input.transactionPlan.invalidMessage ?? 'Transaction plan is invalid.'
    );
  }

  if (input.transactionDraft && input.transactionDraft.status !== 'created') {
    addBlocker(
      blockers,
      messages,
      'transaction_draft_not_created',
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
