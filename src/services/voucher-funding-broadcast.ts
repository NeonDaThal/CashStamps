import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { VoucherFundingBroadcast, VoucherRecord } from 'src/types/voucher';

function normaliseTransactionId(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    return undefined;
  }

  return normalised;
}

/**
 * Apply one broadcast result to an already-persisted voucher.
 *
 * This function never changes the transaction itself.
 *
 * It validates that all transaction identity information still refers to the
 * exact deterministic transaction stored in fundingIntent.
 */
export function applyVoucherFundingBroadcast(
  record: VoucherRecord,
  result: TreasuryBroadcastResult
): VoucherRecord {
  const fundingIntentTxid = normaliseTransactionId(record.fundingIntent?.txid);

  if (!fundingIntentTxid) {
    throw new Error(
      'Voucher does not contain a valid durable funding transaction ID.'
    );
  }

  const resultTxid = normaliseTransactionId(result.txid);

  /**
   * Blocked results may occur before a transaction identity is supplied to a
   * network request.
   *
   * Every other B5.5 result must identify the exact durable transaction.
   */
  if (result.status !== 'blocked' && !resultTxid) {
    throw new Error(
      'Broadcast result does not contain a valid transaction ID.'
    );
  }

  if (resultTxid && resultTxid !== fundingIntentTxid) {
    throw new Error(
      'Broadcast result transaction ID does not match the durable funding intent.'
    );
  }

  const serverTxid = normaliseTransactionId(result.serverTxid);

  switch (result.status) {
    case 'blocked': {
      if (result.requestAttempted) {
        throw new Error(
          'Blocked broadcast result cannot indicate that a network request was attempted.'
        );
      }

      break;
    }

    case 'definitely_not_broadcast': {
      if (result.requestAttempted) {
        throw new Error(
          'Definitely-not-broadcast result cannot indicate that a network request was attempted.'
        );
      }

      break;
    }

    case 'uncertain': {
      if (!result.requestAttempted) {
        throw new Error(
          'Uncertain broadcast result must indicate that a network request was attempted.'
        );
      }

      break;
    }

    case 'broadcasted': {
      if (!result.requestAttempted) {
        throw new Error(
          'Broadcasted result must indicate that a network request was attempted.'
        );
      }

      if (!serverTxid) {
        throw new Error(
          'Broadcasted result is missing a valid server transaction ID.'
        );
      }

      if (serverTxid !== fundingIntentTxid) {
        throw new Error(
          'Broadcast server transaction ID does not match the durable funding intent.'
        );
      }

      break;
    }
  }

  const fundingBroadcast: VoucherFundingBroadcast = {
    status: result.status,

    txid: resultTxid,

    serverTxid: result.serverTxid,

    errorMessage: result.errorMessage,

    broadcastEnabled: result.broadcastEnabled,

    requestAttempted: result.requestAttempted,

    attemptedAt: result.attemptedAt,
  };

  return {
    ...record,

    fundingBroadcast,

    updatedAt: new Date().toISOString(),
  };
}
