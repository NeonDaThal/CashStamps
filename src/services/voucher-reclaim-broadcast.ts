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

import type { VoucherReclaimIntent } from 'src/types/voucher';

function isValidTransactionId(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value.trim());
}

function isValidRawTransactionHex(value: string): boolean {
  return /^(?:[0-9a-f]{2})+$/i.test(value.trim());
}

/**
 * Broadcast ONLY the exact reclaim transaction already persisted on the
 * original VoucherRecord.
 *
 * This service never builds, modifies, signs or replaces a reclaim tx.
 */
export async function broadcastVoucherReclaimIntent(
  intent: VoucherReclaimIntent
): Promise<TreasuryBroadcastResult> {
  const fundingSafety = getFundingSafetyStatus();

  if (!fundingSafety.realBroadcastEnabled) {
    return createBlockedTreasuryBroadcastResult(
      fundingSafety.message,
      false,
      intent.txid
    );
  }

  if (intent.status !== 'prepared') {
    return createBlockedTreasuryBroadcastResult(
      'Voucher reclaim intent is not prepared.',
      true,
      intent.txid
    );
  }

  if (!isValidRawTransactionHex(intent.rawTransactionHex)) {
    return createBlockedTreasuryBroadcastResult(
      'Durable voucher reclaim intent is missing valid signed transaction hex.',
      true,
      intent.txid
    );
  }

  if (!isValidTransactionId(intent.txid)) {
    return createBlockedTreasuryBroadcastResult(
      'Durable voucher reclaim intent is missing a valid deterministic transaction ID.',
      true
    );
  }

  const expectedTxid = intent.txid.trim().toLowerCase();

  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  try {
    await electrum.start();
  } catch (error) {
    return createDefinitelyNotBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Could not connect to Electrum before voucher reclaim broadcast.',

      expectedTxid
    );
  }

  /**
   * Once the request starts, an exception is ambiguous: the server may already
   * have received the transaction.
   */
  try {
    const serverTxid = await electrum.request<TransactionBroadcast>(
      'blockchain.transaction.broadcast',
      intent.rawTransactionHex
    );

    return classifyTreasuryBroadcastResponse(expectedTxid, serverTxid);
  } catch (error) {
    return createUncertainBroadcastResult(
      expectedTxid,

      error instanceof Error
        ? error.message
        : 'Voucher reclaim broadcast outcome is uncertain.'
    );
  }
}
