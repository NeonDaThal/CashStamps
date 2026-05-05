import { hexToBin } from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import { getFundingSafetyStatus } from 'src/services/funding-safety';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';

function createBlockedBroadcastResult(
  errorMessage: string
): TreasuryBroadcastResult {
  return {
    status: 'blocked',
    errorMessage,
    broadcastEnabled: false,
    attemptedAt: new Date().toISOString(),
  };
}

function createFailedBroadcastResult(
  errorMessage: string
): TreasuryBroadcastResult {
  return {
    status: 'failed',
    errorMessage,
    broadcastEnabled: true,
    attemptedAt: new Date().toISOString(),
  };
}

function createBroadcastedResult(txid: string): TreasuryBroadcastResult {
  return {
    status: 'broadcasted',
    txid,
    broadcastEnabled: true,
    attemptedAt: new Date().toISOString(),
  };
}

/**
 * Broadcast a treasury transaction draft.
 *
 * This function is intentionally guarded by REAL_BROADCAST_ENABLED.
 * While the global safety guard is false, this function will refuse to
 * broadcast even if called accidentally from UI code.
 */
export async function broadcastTreasuryTransactionDraft(
  draft: TreasuryTransactionDraft
): Promise<TreasuryBroadcastResult> {
  const fundingSafety = getFundingSafetyStatus();

  if (!fundingSafety.realBroadcastEnabled) {
    return createBlockedBroadcastResult(fundingSafety.message);
  }

  if (draft.status !== 'created') {
    return createBlockedBroadcastResult(
      'Transaction draft has not been created.'
    );
  }

  if (draft.broadcastEnabled !== false) {
    return createBlockedBroadcastResult(
      'Unexpected draft broadcast marker. Draft service must keep broadcastEnabled false.'
    );
  }

  if (!draft.rawTransactionHex) {
    return createBlockedBroadcastResult(
      'Raw transaction hex is missing from the transaction draft.'
    );
  }

  try {
    const electrum = new ElectrumService(ELECTRUM_SERVERS);
    await electrum.start();

    const rawTransaction = hexToBin(draft.rawTransactionHex);

    /**
     * CashStamps ElectrumService exposes broadcast functionality through the
     * underlying Electrum client. The exact method name may vary, so this is
     * intentionally defensive until tested.
     */
    const electrumLike = electrum as unknown as {
      request?: (method: string, ...params: unknown[]) => Promise<unknown>;
      client?: {
        request?: (method: string, ...params: unknown[]) => Promise<unknown>;
      };
      broadcastTransaction?: (transaction: Uint8Array) => Promise<string>;
      sendRawTransaction?: (transactionHex: string) => Promise<string>;
    };

    if (typeof electrumLike.broadcastTransaction === 'function') {
      const txid = await electrumLike.broadcastTransaction(rawTransaction);
      return createBroadcastedResult(txid);
    }

    if (typeof electrumLike.sendRawTransaction === 'function') {
      const txid = await electrumLike.sendRawTransaction(
        draft.rawTransactionHex
      );
      return createBroadcastedResult(txid);
    }

    if (typeof electrumLike.request === 'function') {
      const txid = await electrumLike.request(
        'blockchain.transaction.broadcast',
        draft.rawTransactionHex
      );

      return createBroadcastedResult(String(txid));
    }

    if (typeof electrumLike.client?.request === 'function') {
      const txid = await electrumLike.client.request(
        'blockchain.transaction.broadcast',
        draft.rawTransactionHex
      );

      return createBroadcastedResult(String(txid));
    }

    return createFailedBroadcastResult(
      'No compatible Electrum broadcast method was found.'
    );
  } catch (error) {
    return createFailedBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Treasury transaction broadcast failed.'
    );
  }
}
