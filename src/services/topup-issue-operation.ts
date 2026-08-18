import type { TreasuryFundingPreview } from 'src/types/treasury-funding';
import type { VoucherFeeOutputPlan } from 'src/types/voucher-fees';
import type { VoucherFundingIntent } from 'src/types/voucher';

import { createTreasuryTransactionDraftFromPlan } from 'src/services/treasury-transaction-draft';
import { createTreasuryTransactionPlanFromPreview } from 'src/services/treasury-transaction-planner';

import { createVoucherFundingIntentFromDraft } from 'src/services/topup-issue-operation-core';

export {
  createTopupIssueOperationId,
  createVoucherFundingIntentFromDraft,
} from 'src/services/topup-issue-operation-core';

export async function prepareTopupFundingIntent(input: {
  operationId: string;
  treasuryFundingPreview: TreasuryFundingPreview;
  feeOutputPlan: VoucherFeeOutputPlan;
}): Promise<VoucherFundingIntent> {
  const transactionPlan = createTreasuryTransactionPlanFromPreview(
    input.treasuryFundingPreview,
    {
      platformFeeAddress: input.feeOutputPlan.platformFeeAddress,
      platformFeeSats: input.feeOutputPlan.platformFeeSats,

      bufferReserveAddress: input.feeOutputPlan.bufferReserveAddress,
      bufferReserveSats: input.feeOutputPlan.bufferReserveOutputEnabled
        ? input.feeOutputPlan.bufferReserveSats
        : 0,
    }
  );

  if (transactionPlan.status !== 'valid') {
    throw new Error(
      transactionPlan.invalidMessage ?? 'Topup transaction plan is not valid.'
    );
  }

  const transactionDraft = await createTreasuryTransactionDraftFromPlan(
    transactionPlan
  );

  return createVoucherFundingIntentFromDraft(
    input.operationId,
    transactionDraft
  );
}
