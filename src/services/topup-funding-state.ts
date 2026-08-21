import type { VoucherRecord } from 'src/types/voucher';

export type TopupFundingState =
  | 'not_applicable'
  | 'ready_to_submit'
  | 'verification_pending'
  | 'funded'
  | 'terminal_error';

export type TopupFundingRecoveryAction =
  | 'none'
  | 'resume_same_transaction'
  | 'check_same_transaction';

export type TopupFundingStateReason =
  | 'no_funding_intent'
  | 'funding_state_missing_intent'
  | 'invalid_transaction_id'
  | 'missing_signed_transaction'
  | 'issue_operation_mismatch'
  | 'reconciliation_transaction_mismatch'
  | 'broadcast_transaction_mismatch'
  | 'positive_network_evidence'
  | 'no_broadcast_attempt'
  | 'broadcast_blocked'
  | 'definitely_not_broadcast'
  | 'broadcasted_pending_verification'
  | 'broadcast_uncertain'
  | 'legacy_failed_before_request'
  | 'legacy_failed_outcome_unknown'
  | 'persisted_terminal_error';

export interface TopupFundingStateResult {
  state: TopupFundingState;

  recoveryAction: TopupFundingRecoveryAction;

  reason: TopupFundingStateReason;

  txid?: string;
}

function normaliseTxid(value: string | undefined): string | null {
  const txid = value?.trim().toLowerCase();

  if (!txid || !/^[0-9a-f]{64}$/.test(txid)) {
    return null;
  }

  return txid;
}

function createResult(
  state: TopupFundingState,
  recoveryAction: TopupFundingRecoveryAction,
  reason: TopupFundingStateReason,
  txid?: string
): TopupFundingStateResult {
  return {
    state,
    recoveryAction,
    reason,
    ...(txid
      ? {
          txid,
        }
      : {}),
  };
}

/**
 * Classify one persisted Topup funding record without performing any network
 * or storage operation.
 *
 * The classifier answers two separate questions:
 *
 * 1. What does the persisted evidence currently prove?
 * 2. What recovery operation, if any, is safe?
 *
 * Important:
 *
 * - "funded" requires positive evidence for the exact deterministic txid.
 * - "resume_same_transaction" means the exact already-signed transaction may
 *   be submitted again after a quick pre-broadcast reconciliation.
 * - "check_same_transaction" is read-only and must never broadcast.
 * - malformed/internally contradictory funding data fails closed.
 */
export function getTopupFundingState(
  record: VoucherRecord
): TopupFundingStateResult {
  const fundingIntent = record.fundingIntent;

  if (!fundingIntent) {
    if (record.status === 'funding') {
      return createResult(
        'terminal_error',
        'none',
        'funding_state_missing_intent'
      );
    }

    return createResult('not_applicable', 'none', 'no_funding_intent');
  }

  const txid = normaliseTxid(fundingIntent.txid);

  if (!txid) {
    return createResult('terminal_error', 'none', 'invalid_transaction_id');
  }

  if (!fundingIntent.rawTransactionHex.trim()) {
    return createResult(
      'terminal_error',
      'none',
      'missing_signed_transaction',
      txid
    );
  }

  const issueOperationId = record.issueOperationId?.trim();

  const intentOperationId = fundingIntent.operationId.trim();

  if (issueOperationId && intentOperationId !== issueOperationId) {
    return createResult(
      'terminal_error',
      'none',
      'issue_operation_mismatch',
      txid
    );
  }

  /**
   * Any persisted reconciliation must refer to the exact same transaction.
   */
  if (record.fundingReconciliation) {
    const reconciliationTxid = normaliseTxid(record.fundingReconciliation.txid);

    if (reconciliationTxid !== txid) {
      return createResult(
        'terminal_error',
        'none',
        'reconciliation_transaction_mismatch',
        txid
      );
    }

    if (
      record.fundingReconciliation.status === 'mempool' ||
      record.fundingReconciliation.status === 'confirmed'
    ) {
      return createResult('funded', 'none', 'positive_network_evidence', txid);
    }
  }

  /**
   * A previously-persisted terminal error remains terminal unless stronger
   * positive network evidence above proves that the exact funding transaction
   * actually exists.
   */
  if (record.status === 'error') {
    return createResult(
      'terminal_error',
      'none',
      'persisted_terminal_error',
      txid
    );
  }

  const broadcast = record.fundingBroadcast;

  if (!broadcast) {
    return createResult(
      'ready_to_submit',
      'resume_same_transaction',
      'no_broadcast_attempt',
      txid
    );
  }

  /**
   * If a broadcast record contains a txid, it must agree with the durable
   * funding intent.
   */
  if (broadcast.txid) {
    const broadcastTxid = normaliseTxid(broadcast.txid);

    if (broadcastTxid !== txid) {
      return createResult(
        'terminal_error',
        'none',
        'broadcast_transaction_mismatch',
        txid
      );
    }
  }

  if (broadcast.status === 'blocked') {
    return createResult(
      'ready_to_submit',
      'resume_same_transaction',
      'broadcast_blocked',
      txid
    );
  }

  if (broadcast.status === 'definitely_not_broadcast') {
    return createResult(
      'ready_to_submit',
      'resume_same_transaction',
      'definitely_not_broadcast',
      txid
    );
  }

  if (broadcast.status === 'broadcasted') {
    return createResult(
      'verification_pending',
      'check_same_transaction',
      'broadcasted_pending_verification',
      txid
    );
  }

  if (broadcast.status === 'uncertain') {
    return createResult(
      'verification_pending',
      'check_same_transaction',
      'broadcast_uncertain',
      txid
    );
  }

  /**
   * Legacy development "failed" state.
   *
   * If the historical record explicitly proves the request never began, the
   * exact persisted transaction may safely be resumed.
   *
   * Otherwise fail conservatively to verification-only because the historical
   * request outcome cannot be proven.
   */
  if (broadcast.status === 'failed' && broadcast.requestAttempted === false) {
    return createResult(
      'ready_to_submit',
      'resume_same_transaction',
      'legacy_failed_before_request',
      txid
    );
  }

  return createResult(
    'verification_pending',
    'check_same_transaction',
    'legacy_failed_outcome_unknown',
    txid
  );
}

function getFundingStateErrorMessage(
  result: TopupFundingStateResult
): string | undefined {
  switch (result.reason) {
    case 'no_broadcast_attempt':
      return undefined;

    case 'broadcast_blocked':
      return (
        'Funding submission was blocked before the transaction was sent. ' +
        'The exact saved transaction can be resumed safely.'
      );

    case 'definitely_not_broadcast':
      return (
        'The funding transaction was definitely not submitted. ' +
        'The exact saved transaction can be resumed safely.'
      );

    case 'broadcasted_pending_verification':
      return (
        'The funding transaction was submitted, but the exact transaction ' +
        'has not yet been verified on the BCH network. Check the same ' +
        'transaction again before continuing.'
      );

    case 'broadcast_uncertain':
      return (
        'The funding broadcast outcome is uncertain. Check the exact saved ' +
        'transaction again before any further funding action.'
      );

    case 'legacy_failed_before_request':
      return (
        'The previous funding attempt failed before submission. ' +
        'The exact saved transaction can be resumed safely.'
      );

    case 'legacy_failed_outcome_unknown':
      return (
        'The previous funding outcome cannot be proven. Check the exact ' +
        'saved transaction before any further funding action.'
      );

    case 'funding_state_missing_intent':
      return (
        'The voucher is marked as funding but does not contain its durable ' +
        'signed funding transaction.'
      );

    case 'invalid_transaction_id':
      return (
        'The durable funding transaction does not contain a valid ' +
        'deterministic transaction ID.'
      );

    case 'missing_signed_transaction':
      return 'The durable funding transaction is missing its signed transaction data.';

    case 'issue_operation_mismatch':
      return 'The funding transaction does not belong to the voucher Issue operation.';

    case 'reconciliation_transaction_mismatch':
      return (
        'Stored network evidence refers to a different transaction from the ' +
        'voucher funding transaction.'
      );

    case 'broadcast_transaction_mismatch':
      return (
        'Stored broadcast information refers to a different transaction from ' +
        'the voucher funding transaction.'
      );

    case 'persisted_terminal_error':
      return undefined;

    case 'positive_network_evidence':
    case 'no_funding_intent':
    default:
      return undefined;
  }
}

/**
 * Apply the pure funding classifier to the persisted voucher status.
 *
 * This only manages records which are actively inside the hardened funding
 * lifecycle (`funding` or `error`).
 *
 * Historical/post-funding states such as printed/redeemed/reclaimed are never
 * downgraded by this helper.
 */
export function synchroniseTopupFundingState(
  record: VoucherRecord
): VoucherRecord {
  const classification = getTopupFundingState(record);

  /**
   * WIF/receipt lifecycle states are beyond the scope of funding recovery.
   *
   * Never downgrade them based on funding bookkeeping.
   */
  if (
    record.status === 'printed' ||
    record.status === 'redeemed' ||
    record.status === 'reclaimed'
  ) {
    return record;
  }

  /**
   * A historically-funded record should never be downgraded merely because
   * older persisted data lacks the newer B5 funding metadata.
   */
  if (record.status === 'funded' && classification.state !== 'funded') {
    return record;
  }

  if (classification.state === 'funded') {
    if (record.status === 'funded' && record.errorMessage === undefined) {
      return record;
    }

    return {
      ...record,

      status: 'funded',

      errorMessage: undefined,
    };
  }

  if (
    classification.state === 'ready_to_submit' ||
    classification.state === 'verification_pending'
  ) {
    const errorMessage = getFundingStateErrorMessage(classification);

    if (record.status === 'funding' && record.errorMessage === errorMessage) {
      return record;
    }

    return {
      ...record,

      status: 'funding',

      errorMessage,
    };
  }

  if (classification.state === 'terminal_error') {
    /**
     * Preserve an existing useful terminal error message if one already
     * exists; otherwise provide the classifier's invariant failure.
     */
    const errorMessage =
      record.errorMessage ??
      getFundingStateErrorMessage(classification) ??
      'The persisted Topup funding state is invalid and requires manual investigation.';

    if (record.status === 'error' && record.errorMessage === errorMessage) {
      return record;
    }

    return {
      ...record,

      status: 'error',

      errorMessage,
    };
  }

  return record;
}
