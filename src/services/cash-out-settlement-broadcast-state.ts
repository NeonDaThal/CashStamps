import type { CashOutRecord } from 'src/types/cash-out';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import type { CashOutSettlementBroadcastResult } from 'src/types/cash-out-settlement';

function normaliseTransactionId(
  value: string | undefined,
  fieldName: string
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} is required.`);
  }

  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    throw new Error(
      `${fieldName} must be exactly 32 bytes encoded as hexadecimal.`
    );
  }

  return normalised;
}

function requireNonEmptyString(value: string, fieldName: string): string {
  const normalised = value.trim();

  if (!normalised) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalised;
}

function getSettlementTransactionId(cashOut: CashOutRecord): string {
  const intent = cashOut.settlementIntent;

  if (!intent) {
    throw new Error(
      'Cash-out settlement network state requires a durable D3 settlement intent.'
    );
  }

  return normaliseTransactionId(
    intent.txid,
    'Cash-out settlement intent transaction ID'
  );
}

/**
 * Validate one broadcast result against the ONE durable D3 transaction.
 *
 * This does not perform any BCH network action.
 */
function validateSettlementBroadcast(
  result: CashOutSettlementBroadcastResult,
  expectedTxid: string
): CashOutSettlementBroadcastResult {
  const txid = normaliseTransactionId(
    result.txid,
    'Cash-out settlement broadcast transaction ID'
  );

  if (txid !== expectedTxid) {
    throw new Error(
      'Cash-out settlement broadcast result belongs to a different transaction.'
    );
  }

  const attemptedAt = requireNonEmptyString(
    result.attemptedAt,
    'Cash-out settlement broadcast timestamp'
  );

  let serverTxid: string | undefined;

  if (result.serverTxid !== undefined) {
    serverTxid = normaliseTransactionId(
      result.serverTxid,
      'Cash-out settlement server transaction ID'
    );

    if (serverTxid !== expectedTxid) {
      throw new Error(
        'Electrum broadcast response belongs to a different Cash-out settlement transaction.'
      );
    }
  }

  switch (result.status) {
    case 'blocked': {
      if (result.requestAttempted) {
        throw new Error(
          'Blocked Cash-out settlement broadcast cannot claim that a network request was attempted.'
        );
      }

      break;
    }

    case 'broadcasted': {
      if (!result.broadcastEnabled || !result.requestAttempted) {
        throw new Error(
          'Successful Cash-out settlement broadcast must record an enabled and attempted network request.'
        );
      }

      if (!serverTxid) {
        throw new Error(
          'Successful Cash-out settlement broadcast requires the matching Electrum transaction ID.'
        );
      }

      break;
    }

    case 'definitely_not_broadcast': {
      if (!result.broadcastEnabled || result.requestAttempted) {
        throw new Error(
          'Definitely-not-broadcast Cash-out settlement result must prove that no transaction broadcast request began.'
        );
      }

      break;
    }

    case 'uncertain': {
      if (!result.broadcastEnabled || !result.requestAttempted) {
        throw new Error(
          'Uncertain Cash-out settlement result requires a broadcast request which may have reached Electrum.'
        );
      }

      break;
    }
  }

  if (result.explicitRejection) {
    if (result.status !== 'uncertain') {
      throw new Error(
        'Explicit Cash-out settlement broadcast rejection is valid only for an uncertain request-attempt result.'
      );
    }

    if (result.serverTxid !== undefined) {
      throw new Error(
        'Explicit Cash-out settlement broadcast rejection must not contain a server transaction ID.'
      );
    }

    if (result.explicitRejection.kind !== 'input_unavailable') {
      throw new Error(
        'Cash-out settlement broadcast contains an unsupported explicit rejection kind.'
      );
    }

    if (result.explicitRejection.retrySameTransaction !== true) {
      throw new Error(
        'Retryable Cash-out settlement rejection must permit only the same persisted transaction.'
      );
    }

    if (
      typeof result.errorMessage !== 'string' ||
      !result.errorMessage.trim()
    ) {
      throw new Error(
        'Explicit Cash-out settlement rejection requires an error message.'
      );
    }
  }

  return {
    ...result,

    txid,

    ...(serverTxid !== undefined
      ? {
          serverTxid,
        }
      : {}),

    attemptedAt,
  };
}

function reconciliationStrength(
  reconciliation: TreasuryBroadcastReconciliationResult
): number {
  switch (reconciliation.status) {
    case 'confirmed':
      return 4;

    case 'mempool':
      return 3;

    case 'unknown':
      return 2;

    case 'unavailable':
      return 1;
  }
}

function isPositiveReconciliation(
  reconciliation: TreasuryBroadcastReconciliationResult
): boolean {
  return (
    reconciliation.status === 'mempool' || reconciliation.status === 'confirmed'
  );
}

function broadcastMayHaveBeenSubmitted(
  broadcast: CashOutSettlementBroadcastResult
): boolean {
  /**
   * An explicit input-unavailable rejection proves that this Electrum server
   * rejected this exact request rather than accepting it.
   *
   * A later attempt may therefore submit the SAME persisted transaction again.
   */
  if (
    broadcast.status === 'uncertain' &&
    broadcast.explicitRejection?.kind === 'input_unavailable' &&
    broadcast.explicitRejection.retrySameTransaction === true
  ) {
    return false;
  }

  return broadcast.status === 'broadcasted' || broadcast.status === 'uncertain';
}

function isSameBroadcastResult(
  left: CashOutSettlementBroadcastResult,
  right: CashOutSettlementBroadcastResult
): boolean {
  return (
    left.explicitRejection?.kind === right.explicitRejection?.kind &&
    left.explicitRejection?.retrySameTransaction ===
      right.explicitRejection?.retrySameTransaction &&
    left.status === right.status &&
    left.txid === right.txid &&
    left.serverTxid === right.serverTxid &&
    left.errorMessage === right.errorMessage &&
    left.broadcastEnabled === right.broadcastEnabled &&
    left.requestAttempted === right.requestAttempted &&
    left.attemptedAt === right.attemptedAt
  );
}

/**
 * Validate read-only network evidence against the ONE durable settlement txid.
 */
function validateSettlementReconciliation(
  reconciliation: TreasuryBroadcastReconciliationResult,
  expectedTxid: string
): TreasuryBroadcastReconciliationResult {
  const txid = normaliseTransactionId(
    reconciliation.txid,
    'Cash-out settlement reconciliation transaction ID'
  );

  if (txid !== expectedTxid) {
    throw new Error(
      'Cash-out settlement reconciliation belongs to a different transaction.'
    );
  }

  const checkedAt = requireNonEmptyString(
    reconciliation.checkedAt,
    'Cash-out settlement reconciliation timestamp'
  );

  requireNonEmptyString(
    reconciliation.message,
    'Cash-out settlement reconciliation message'
  );

  if (!Array.isArray(reconciliation.serverChecks)) {
    throw new Error(
      'Cash-out settlement reconciliation server evidence is invalid.'
    );
  }

  if (reconciliation.status === 'confirmed') {
    if (
      !Number.isInteger(reconciliation.blockHeight) ||
      (reconciliation.blockHeight ?? 0) <= 0
    ) {
      throw new Error(
        'Confirmed Cash-out settlement reconciliation requires a positive block height.'
      );
    }
  }

  if (reconciliation.status === 'mempool') {
    if (reconciliation.blockHeight !== 0) {
      throw new Error(
        'Mempool Cash-out settlement reconciliation requires block height zero.'
      );
    }
  }

  if (
    (reconciliation.status === 'unknown' ||
      reconciliation.status === 'unavailable') &&
    reconciliation.blockHeight !== undefined
  ) {
    throw new Error(
      'Unknown or unavailable Cash-out settlement reconciliation must not contain a block height.'
    );
  }

  return {
    ...reconciliation,

    txid,

    checkedAt,
  };
}

/**
 * Validate all currently-persisted D4 network state without changing it.
 *
 * Recovery/lifecycle services can use this before deciding what action is
 * permitted.
 */
export function validateCashOutSettlementNetworkState(
  cashOut: CashOutRecord
): void {
  const expectedTxid = getSettlementTransactionId(cashOut);

  if (cashOut.settlementBroadcast) {
    validateSettlementBroadcast(cashOut.settlementBroadcast, expectedTxid);
  }

  if (cashOut.settlementReconciliation) {
    validateSettlementReconciliation(
      cashOut.settlementReconciliation,
      expectedTxid
    );
  }
}

/**
 * Persist one network-submission outcome for the exact D3 transaction.
 *
 * This helper does not broadcast.
 *
 * It also deliberately does not alter CashOutStatus. Merchant-safe lifecycle
 * transitions belong to D5.
 */
export function applyCashOutSettlementBroadcast(
  cashOut: CashOutRecord,
  result: CashOutSettlementBroadcastResult
): CashOutRecord {
  const expectedTxid = getSettlementTransactionId(cashOut);

  const validated = validateSettlementBroadcast(result, expectedTxid);

  let existingBroadcast: CashOutSettlementBroadcastResult | undefined;

  if (cashOut.settlementBroadcast) {
    existingBroadcast = validateSettlementBroadcast(
      cashOut.settlementBroadcast,
      expectedTxid
    );

    /**
     * Exact replay of the already-persisted result is idempotent.
     */
    if (isSameBroadcastResult(existingBroadcast, validated)) {
      return cashOut;
    }
  }

  let existingReconciliation: TreasuryBroadcastReconciliationResult | undefined;

  if (cashOut.settlementReconciliation) {
    existingReconciliation = validateSettlementReconciliation(
      cashOut.settlementReconciliation,
      expectedTxid
    );
  }

  /**
   * Positive network evidence proves that this exact settlement transaction
   * already exists on the BCH network.
   *
   * No later broadcast-result mutation may make another submission appear
   * permissible.
   */
  if (
    existingReconciliation &&
    isPositiveReconciliation(existingReconciliation)
  ) {
    throw new Error(
      'Cash-out settlement already has positive network evidence and must not acquire another broadcast attempt.'
    );
  }

  /**
   * Once a blockchain.transaction.broadcast request may have reached Electrum,
   * the durable state may never be replaced by a result which implies another
   * submission is safe.
   *
   * From here onward D4 must reconcile the SAME deterministic txid.
   */
  if (existingBroadcast && broadcastMayHaveBeenSubmitted(existingBroadcast)) {
    throw new Error(
      'Cash-out settlement broadcast may already have occurred. Reconcile the same deterministic transaction instead of replacing its broadcast state.'
    );
  }

  return {
    ...cashOut,

    settlementBroadcast: validated,
  };
}

/**
 * Persist read-only network evidence for the exact D3 settlement txid.
 *
 * Evidence is monotonic:
 *
 * confirmed > mempool > unknown > unavailable
 *
 * A weaker later Electrum observation cannot erase stronger positive evidence.
 *
 * This does NOT yet mark the merchant as safe to hand over cash; D5 owns that
 * final lifecycle decision.
 */
export function applyCashOutSettlementReconciliation(
  cashOut: CashOutRecord,
  reconciliation: TreasuryBroadcastReconciliationResult
): CashOutRecord {
  const expectedTxid = getSettlementTransactionId(cashOut);

  if (cashOut.settlementBroadcast) {
    validateSettlementBroadcast(cashOut.settlementBroadcast, expectedTxid);
  }

  const validated = validateSettlementReconciliation(
    reconciliation,
    expectedTxid
  );

  const existing = cashOut.settlementReconciliation;

  if (existing) {
    const validatedExisting = validateSettlementReconciliation(
      existing,
      expectedTxid
    );

    if (
      reconciliationStrength(validatedExisting) >
      reconciliationStrength(validated)
    ) {
      return cashOut;
    }
  }

  return {
    ...cashOut,

    settlementReconciliation: validated,
  };
}
