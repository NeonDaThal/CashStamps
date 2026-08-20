import { ELECTRUM_SERVERS } from 'src/config';

import {
  classifyTreasuryBroadcastResponse,
  createBlockedTreasuryBroadcastResult,
  createDefinitelyNotBroadcastResult,
  createUncertainBroadcastResult,
} from 'src/services/treasury-broadcast-classification';

import { ElectrumService } from 'src/services/electrum';

import { getFundingSafetyStatus } from 'src/services/funding-safety';

import type { TransactionBroadcast } from 'src/services/electrum-types';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';

import type { VoucherFundingIntent } from 'src/types/voucher';

function isValidTransactionId(value: string | undefined): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value.trim());
}

function isValidRawTransactionHex(value: string | undefined): value is string {
  return typeof value === 'string' && /^(?:[0-9a-f]{2})+$/i.test(value.trim());
}

/**
 * Direct broadcasting from an in-memory transaction draft is permanently
 * prohibited by B5 hardening.
 *
 * A real broadcast must operate on a durable VoucherFundingIntent that has
 * already crossed the pre-broadcast persistence boundary.
 *
 * This function remains only because the development Sale Confirm dialog has
 * a safety-guard test that deliberately calls it and expects a blocked result.
 */
export async function broadcastTreasuryTransactionDraft(
  draft: TreasuryTransactionDraft
): Promise<TreasuryBroadcastResult> {
  const fundingSafety = getFundingSafetyStatus();

  /**
   * Preserve the existing development guard test behaviour while the global
   * real-broadcast switch remains disabled.
   */
  if (!fundingSafety.realBroadcastEnabled) {
    return createBlockedTreasuryBroadcastResult(
      fundingSafety.message,
      false,
      draft.txid
    );
  }

  return createBlockedTreasuryBroadcastResult(
    'Direct transaction-draft broadcasting is disabled. A durable funding intent must be persisted before broadcast.',
    true,
    draft.txid
  );
}

/**
 * Broadcast the exact transaction already stored in a durable Topup funding
 * intent.
 *
 * B5 safety invariant:
 *
 *   one persisted raw transaction
 *   + one predetermined txid
 *   = the only transaction this Issue operation may broadcast
 *
 * This service never builds, modifies, signs or replaces the transaction.
 */
export async function broadcastTreasuryFundingIntent(
  fundingIntent: VoucherFundingIntent
): Promise<TreasuryBroadcastResult> {
  const fundingSafety = getFundingSafetyStatus();

  if (!fundingSafety.realBroadcastEnabled) {
    return createBlockedTreasuryBroadcastResult(
      fundingSafety.message,
      false,
      fundingIntent.txid
    );
  }

  if (fundingIntent.status !== 'prepared') {
    return createBlockedTreasuryBroadcastResult(
      'Funding intent is not in the prepared state.',
      true,
      fundingIntent.txid
    );
  }

  if (!isValidRawTransactionHex(fundingIntent.rawTransactionHex)) {
    return createBlockedTreasuryBroadcastResult(
      'Durable funding intent is missing valid signed transaction hex.',
      true,
      fundingIntent.txid
    );
  }

  if (!isValidTransactionId(fundingIntent.txid)) {
    return createBlockedTreasuryBroadcastResult(
      'Durable funding intent is missing a valid deterministic transaction ID.',
      true
    );
  }

  const expectedTxid = fundingIntent.txid.trim().toLowerCase();

  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  /**
   * Failure here is safely classified as definitely_not_broadcast because no
   * blockchain.transaction.broadcast request has yet been attempted.
   */
  try {
    await electrum.start();
  } catch (error) {
    return createDefinitelyNotBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Could not connect to Electrum before transaction broadcast.',
      expectedTxid
    );
  }

  /**
   * From the moment this request begins, any error is ambiguous with our
   * current Electrum client.
   *
   * The server may have received and accepted the transaction before the
   * connection or response was lost.
   *
   * Therefore every exception from this point becomes UNCERTAIN.
   */
  try {
    const serverTxid = await electrum.request<TransactionBroadcast>(
      'blockchain.transaction.broadcast',
      fundingIntent.rawTransactionHex
    );

    return classifyTreasuryBroadcastResponse(expectedTxid, serverTxid);
  } catch (error) {
    return createUncertainBroadcastResult(
      expectedTxid,

      error instanceof Error
        ? error.message
        : 'Transaction broadcast outcome is uncertain.'
    );
  }
}
