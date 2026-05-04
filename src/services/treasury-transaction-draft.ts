import { binToHex } from '@bitauth/libauth';

import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';

/**
 * This is a placeholder draft builder.
 *
 * It intentionally does not sign or broadcast anything yet.
 *
 * The next real implementation will:
 * - map selected treasury UTXOs into libauth input directives
 * - create voucher and change output locking bytecode
 * - run generateTransaction()
 * - encode the transaction
 * - keep broadcast disabled until a later explicit step
 */
export function createTreasuryTransactionDraftFromPlan(
  plan: TreasuryTransactionPlan
): TreasuryTransactionDraft {
  if (plan.status !== 'valid') {
    return {
      status: 'invalid',
      plan,
      errorMessage:
        plan.invalidMessage ??
        'Transaction plan is invalid, so no transaction draft was created.',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Temporary placeholder bytes.
   *
   * Do not use this as a transaction.
   * This exists only to prove the draft pipeline shape before real generation.
   */
  const placeholderBytes = new Uint8Array();

  return {
    status: 'not_created',
    plan,
    rawTransactionHex: binToHex(placeholderBytes),
    rawTransactionBytesLength: placeholderBytes.length,
    errorMessage: 'Real transaction draft generation has not been enabled yet.',
    createdAt: new Date().toISOString(),
  };
}
