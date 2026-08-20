import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

function normaliseTransactionId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    return undefined;
  }

  return normalised;
}

export function createBlockedTreasuryBroadcastResult(
  errorMessage: string,
  broadcastEnabled: boolean,
  txid?: string
): TreasuryBroadcastResult {
  return {
    status: 'blocked',

    txid: normaliseTransactionId(txid),

    errorMessage,

    broadcastEnabled,

    requestAttempted: false,

    attemptedAt: new Date().toISOString(),
  };
}

export function createDefinitelyNotBroadcastResult(
  errorMessage: string,
  txid?: string
): TreasuryBroadcastResult {
  return {
    status: 'definitely_not_broadcast',

    txid: normaliseTransactionId(txid),

    errorMessage,

    broadcastEnabled: true,

    requestAttempted: false,

    attemptedAt: new Date().toISOString(),
  };
}

export function createUncertainBroadcastResult(
  txid: string,
  errorMessage: string,
  serverTxid?: string
): TreasuryBroadcastResult {
  return {
    status: 'uncertain',

    txid: normaliseTransactionId(txid),

    serverTxid: normaliseTransactionId(serverTxid),

    errorMessage,

    broadcastEnabled: true,

    requestAttempted: true,

    attemptedAt: new Date().toISOString(),
  };
}

/**
 * Classify the direct response from blockchain.transaction.broadcast.
 *
 * A broadcast is only proven successful if the server returns the exact
 * deterministic transaction ID that was calculated and persisted before
 * broadcast.
 *
 * Anything else is uncertain rather than failed, because after the request
 * has begun we must not assume that the network did not receive it.
 */
export function classifyTreasuryBroadcastResponse(
  expectedTxid: string,
  response: unknown
): TreasuryBroadcastResult {
  const normalisedExpectedTxid = normaliseTransactionId(expectedTxid);

  if (!normalisedExpectedTxid) {
    return createUncertainBroadcastResult(
      expectedTxid,
      'The persisted deterministic transaction ID is invalid.'
    );
  }

  const serverTxid = normaliseTransactionId(response);

  if (!serverTxid) {
    return createUncertainBroadcastResult(
      normalisedExpectedTxid,
      'Electrum returned an unexpected broadcast response.'
    );
  }

  if (serverTxid !== normalisedExpectedTxid) {
    return createUncertainBroadcastResult(
      normalisedExpectedTxid,
      'Electrum returned a transaction ID that does not match the persisted transaction.',
      serverTxid
    );
  }

  return {
    status: 'broadcasted',

    txid: normalisedExpectedTxid,

    serverTxid,

    broadcastEnabled: true,

    requestAttempted: true,

    attemptedAt: new Date().toISOString(),
  };
}
