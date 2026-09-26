import type { CashOutRecord } from 'src/types/cash-out';

export type CashOutSettlementSourceConflictEvaluation =
  | 'none'
  | 'active'
  | 'resolved';

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

function getIsoTimestamp(value: string | undefined, fieldName: string): number {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error(`${fieldName} must be a valid timestamp.`);
  }

  return timestamp;
}

/**
 * Validate and classify any durable conflict evidence attached to a Cash-out.
 *
 * IMPORTANT:
 *
 * - missing UTXO != conflict;
 * - network lookup failure != conflict;
 * - unknown settlement != conflict;
 * - a concrete DIFFERENT spender of the exact source outpoint = conflict.
 */
export function evaluateCashOutSettlementSourceConflict(
  cashOut: CashOutRecord
): CashOutSettlementSourceConflictEvaluation {
  const conflict = cashOut.settlementSourceConflict;

  if (!conflict) {
    return 'none';
  }

  const intent = cashOut.settlementIntent;

  if (!intent) {
    throw new Error(
      'Settlement conflict evidence requires a durable settlement intent.'
    );
  }

  const sourcePaymentTxid = normaliseTransactionId(intent.sourcePaymentTxid);

  const conflictSourcePaymentTxid = normaliseTransactionId(
    conflict.sourcePaymentTxid
  );

  if (
    !sourcePaymentTxid ||
    !conflictSourcePaymentTxid ||
    conflictSourcePaymentTxid !== sourcePaymentTxid
  ) {
    throw new Error(
      'Settlement conflict evidence does not match the selected customer payment transaction.'
    );
  }

  if (
    !Number.isSafeInteger(conflict.sourceOutpointIndex) ||
    conflict.sourceOutpointIndex < 0 ||
    conflict.sourceOutpointIndex !== intent.sourceOutpointIndex
  ) {
    throw new Error(
      'Settlement conflict evidence does not match the selected customer payment output.'
    );
  }

  const expectedSettlementTxid = normaliseTransactionId(intent.txid);

  const conflictExpectedSettlementTxid = normaliseTransactionId(
    conflict.expectedSettlementTxid
  );

  if (
    !expectedSettlementTxid ||
    !conflictExpectedSettlementTxid ||
    conflictExpectedSettlementTxid !== expectedSettlementTxid
  ) {
    throw new Error(
      'Settlement conflict evidence does not match the deterministic settlement transaction.'
    );
  }

  const conflictingTxid = normaliseTransactionId(conflict.conflictingTxid);

  if (!conflictingTxid) {
    throw new Error(
      'Settlement conflict evidence requires a valid conflicting transaction ID.'
    );
  }

  if (conflictingTxid === expectedSettlementTxid) {
    throw new Error(
      'The deterministic settlement transaction cannot be recorded as its own conflict.'
    );
  }

  if (conflictingTxid === sourcePaymentTxid) {
    throw new Error(
      'The customer payment transaction cannot spend its own selected output.'
    );
  }

  if (conflict.conflictingTransactionStatus === 'mempool') {
    if (conflict.conflictingTransactionBlockHeight !== 0) {
      throw new Error('Mempool conflict evidence must use block height zero.');
    }
  } else if (conflict.conflictingTransactionStatus === 'confirmed') {
    if (
      !Number.isSafeInteger(conflict.conflictingTransactionBlockHeight) ||
      conflict.conflictingTransactionBlockHeight <= 0
    ) {
      throw new Error(
        'Confirmed conflict evidence requires a positive block height.'
      );
    }
  } else {
    throw new Error(
      'Settlement conflict evidence contains an unsupported network status.'
    );
  }

  const detectedAt = getIsoTimestamp(
    conflict.detectedAt,
    'Settlement conflict detectedAt'
  );

  if (typeof conflict.message !== 'string' || !conflict.message.trim()) {
    throw new Error('Settlement conflict evidence requires an audit message.');
  }

  if (conflict.state === 'detected') {
    if (
      conflict.resolvedAt !== undefined ||
      conflict.resolution !== undefined
    ) {
      throw new Error(
        'Active settlement conflict evidence cannot contain resolution metadata.'
      );
    }

    return 'active';
  }

  if (conflict.state !== 'resolved') {
    throw new Error(
      'Settlement conflict evidence contains an unsupported lifecycle state.'
    );
  }

  if (conflict.resolution !== 'exact_settlement_confirmed') {
    throw new Error(
      'Settlement conflict may only be resolved by confirmed evidence for the exact deterministic settlement.'
    );
  }

  const resolvedAt = getIsoTimestamp(
    conflict.resolvedAt,
    'Settlement conflict resolvedAt'
  );

  if (resolvedAt < detectedAt) {
    throw new Error(
      'Settlement conflict cannot be resolved before it was detected.'
    );
  }

  const reconciliation = cashOut.settlementReconciliation;

  const reconciledTxid = normaliseTransactionId(reconciliation?.txid);

  if (
    reconciliation?.status !== 'confirmed' ||
    reconciledTxid !== expectedSettlementTxid
  ) {
    throw new Error(
      'Resolved settlement conflict requires confirmed evidence for the exact deterministic settlement transaction.'
    );
  }

  return 'resolved';
}
