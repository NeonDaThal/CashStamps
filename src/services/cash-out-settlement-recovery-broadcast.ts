import { hashTransaction, hexToBin } from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';

import type { ElectrumService } from 'src/services/electrum';

import type { TransactionBroadcast } from 'src/services/electrum-types';

import { getFundingSafetyStatus } from 'src/services/funding-safety';

import {
  classifyTreasuryBroadcastResponse,
  createBlockedTreasuryBroadcastResult,
  createDefinitelyNotBroadcastResult,
  createUncertainBroadcastResult,
} from 'src/services/treasury-broadcast-classification';

import { reconcileTreasuryBroadcastWithRetry } from 'src/services/treasury-broadcast-reconciliation';

import { classifyCashOutSettlementExplicitBroadcastRejection } from 'src/services/cash-out-settlement-broadcast';

import { getCashOutRecordById } from 'src/services/cash-out-store';

import {
  storeCashOutSettlementRecoveryBroadcast,
  storeCashOutSettlementRecoveryReconciliation,
} from './cash-out-settlement-recovery-store';

import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';

import type { CashOutSettlementBroadcastResult } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutSettlementRecoveryBroadcastSafetyStatus {
  realBroadcastEnabled: boolean;

  message: string;
}

export interface CashOutSettlementRecoveryBroadcastTransport {
  /**
   * Establish network connectivity.
   *
   * Failure here proves no transaction submission request began.
   */
  start(): Promise<void>;

  /**
   * Submit the exact raw transaction which already crossed D6E write-ahead.
   *
   * Once entered, thrown errors are ambiguous because the server may already
   * have received the transaction.
   */
  broadcast(rawTransactionHex: string): Promise<string>;
}

export interface CashOutSettlementRecoveryBroadcastDependencies {
  getBroadcastSafetyStatus: () => CashOutSettlementRecoveryBroadcastSafetyStatus;

  createTransport: () => CashOutSettlementRecoveryBroadcastTransport;
}

interface ValidatedRecoveryBroadcastIntent {
  expectedTxid: string;

  rawTransactionHex: string;
}

function isValidTransactionId(value: string | undefined): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

function validateRecoveryIntentForBroadcast(
  intent: CashOutSettlementRecoverySignedTransactionArtifact
): ValidatedRecoveryBroadcastIntent {
  if (
    typeof intent.rawTransactionHex !== 'string' ||
    !/^(?:[0-9a-f]{2})+$/i.test(intent.rawTransactionHex)
  ) {
    throw new Error(
      'Durable Cash-out recovery intent is missing valid raw transaction hex.'
    );
  }

  if (!isValidTransactionId(intent.txid)) {
    throw new Error(
      'Durable Cash-out recovery intent is missing a valid deterministic transaction ID.'
    );
  }

  if (
    !Number.isSafeInteger(intent.transactionBytes) ||
    intent.transactionBytes <= 0
  ) {
    throw new Error(
      'Cash-out recovery intent has an invalid raw transaction byte length.'
    );
  }

  if (
    intent.transactionSummary.inputCount < 1 ||
    intent.transactionSummary.inputCount > 3
  ) {
    throw new Error(
      'Cash-out recovery broadcast requires between one and three transaction inputs.'
    );
  }

  if (intent.transactionSummary.outputCount !== 2) {
    throw new Error(
      'Cash-out recovery broadcast requires exactly two transaction outputs.'
    );
  }

  if (intent.transactionSummary.cashOutId !== intent.cashOutId) {
    throw new Error(
      'Cash-out recovery transaction summary belongs to a different Cash-out.'
    );
  }

  if (intent.signingRequest.cashOutId !== intent.cashOutId) {
    throw new Error(
      'Cash-out recovery signing request belongs to a different Cash-out.'
    );
  }

  if (intent.signingRequest.inputSetId !== intent.inputSetId) {
    throw new Error(
      'Cash-out recovery signing request belongs to a different recovery input set.'
    );
  }

  const rawTransactionBytes = hexToBin(intent.rawTransactionHex);

  if (rawTransactionBytes.length !== intent.transactionBytes) {
    throw new Error(
      'Cash-out recovery raw transaction byte length does not match the durable D6E intent.'
    );
  }

  const expectedTxid = intent.txid.trim().toLowerCase();

  /**
   * Critical D6F boundary:
   *
   * Recalculate identity from the exact persisted bytes immediately before
   * any network operation.
   */
  const calculatedTxid = hashTransaction(rawTransactionBytes)
    .trim()
    .toLowerCase();

  if (calculatedTxid !== expectedTxid) {
    throw new Error(
      'Cash-out recovery raw transaction does not match its persisted deterministic transaction ID.'
    );
  }

  return {
    expectedTxid,

    /**
     * Return the exact stored string.
     *
     * D6F does not reconstruct, serialize, sign or otherwise alter it.
     */
    rawTransactionHex: intent.rawTransactionHex,
  };
}

function getRecoveryBroadcastErrorMessage(error: unknown): string {
  const messages: string[] = [];

  if (error instanceof Error) {
    messages.push(error.message);
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      message?: unknown;

      error?:
        | unknown
        | {
            message?: unknown;
          };
    };

    if (
      typeof candidate.message === 'string' &&
      !messages.includes(candidate.message)
    ) {
      messages.push(candidate.message);
    }

    if (typeof candidate.error === 'string') {
      messages.push(candidate.error);
    } else if (
      typeof candidate.error === 'object' &&
      candidate.error !== null &&
      'message' in candidate.error &&
      typeof candidate.error.message === 'string'
    ) {
      messages.push(candidate.error.message);
    }
  }

  return (
    messages.filter(Boolean).join('\n').trim() ||
    'Cash-out recovery broadcast failed.'
  );
}

class ElectrumCashOutSettlementRecoveryBroadcastTransport
  implements CashOutSettlementRecoveryBroadcastTransport
{
  private electrum: ElectrumService | undefined;

  async start(): Promise<void> {
    /**
     * Load the Electrum runtime only when network access is genuinely needed.
     */
    const { ElectrumService } = await import('src/services/electrum');

    const electrum = new ElectrumService(ELECTRUM_SERVERS);

    await electrum.start();

    this.electrum = electrum;
  }

  async broadcast(rawTransactionHex: string): Promise<string> {
    if (!this.electrum) {
      throw new Error(
        'Cash-out recovery Electrum transport was not started before broadcast.'
      );
    }

    return this.electrum.request<TransactionBroadcast>(
      'blockchain.transaction.broadcast',

      rawTransactionHex
    );
  }
}

const DEFAULT_BROADCAST_DEPENDENCIES: CashOutSettlementRecoveryBroadcastDependencies =
  {
    getBroadcastSafetyStatus: getFundingSafetyStatus,

    createTransport: () =>
      new ElectrumCashOutSettlementRecoveryBroadcastTransport(),
  };

/**
 * Broadcast ONLY the exact exceptional-recovery transaction which has already
 * crossed the D6E durable write-ahead boundary.
 *
 * This function:
 *
 * - never constructs a transaction;
 * - never signs;
 * - never changes inputs;
 * - never changes outputs;
 * - never changes the recovery fee;
 * - recalculates txid from the exact persisted bytes before network access.
 */
export async function broadcastCashOutSettlementRecoveryIntentWithDependencies(
  intent: CashOutSettlementRecoverySignedTransactionArtifact,

  dependencies: CashOutSettlementRecoveryBroadcastDependencies
): Promise<CashOutSettlementBroadcastResult> {
  const safety = dependencies.getBroadcastSafetyStatus();

  /**
   * Preserve the existing project-wide real-BCH safety guard.
   *
   * No transport is created while broadcasting is disabled.
   */
  if (!safety.realBroadcastEnabled) {
    return createBlockedTreasuryBroadcastResult(
      safety.message,

      false,

      isValidTransactionId(intent.txid) ? intent.txid.toLowerCase() : undefined
    );
  }

  let validated: ValidatedRecoveryBroadcastIntent;

  try {
    validated = validateRecoveryIntentForBroadcast(intent);
  } catch (error) {
    return createBlockedTreasuryBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Cash-out recovery intent failed pre-broadcast validation.',

      true,

      isValidTransactionId(intent.txid) ? intent.txid.toLowerCase() : undefined
    );
  }

  const transport = dependencies.createTransport();

  /**
   * Failure before broadcast() proves that this attempt did not begin a
   * blockchain.transaction.broadcast request.
   */
  try {
    await transport.start();
  } catch (error) {
    return createDefinitelyNotBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Could not connect to Electrum before Cash-out recovery broadcast.',

      validated.expectedTxid
    );
  }

  /**
   * Once broadcast() begins, any thrown error is ambiguous.
   *
   * Reconciliation must inspect the same deterministic txid before any later
   * policy may consider retrying the same transaction.
   */
  try {
    const serverTxid = await transport.broadcast(validated.rawTransactionHex);

    return classifyTreasuryBroadcastResponse(
      validated.expectedTxid,

      serverTxid
    );
  } catch (error) {
    const errorMessage = getRecoveryBroadcastErrorMessage(error);

    /**
     * Reuse the already-frozen Cash-out-specific classification semantics.
     *
     * This does NOT alter Treasury Send or Topup behavior.
     */
    const explicitRejection =
      classifyCashOutSettlementExplicitBroadcastRejection(error);

    if (explicitRejection) {
      return {
        ...createUncertainBroadcastResult(
          validated.expectedTxid,

          errorMessage
        ),

        explicitRejection,
      };
    }

    return createUncertainBroadcastResult(
      validated.expectedTxid,

      errorMessage
    );
  }
}

export async function broadcastCashOutSettlementRecoveryIntent(
  intent: CashOutSettlementRecoverySignedTransactionArtifact
): Promise<CashOutSettlementBroadcastResult> {
  return broadcastCashOutSettlementRecoveryIntentWithDependencies(
    intent,

    DEFAULT_BROADCAST_DEPENDENCIES
  );
}

export interface CashOutSettlementRecoverySubmissionDependencies {
  getCashOutRecordById(id: string): Promise<CashOutRecord | undefined>;

  broadcastRecoveryIntent(
    intent: CashOutSettlementRecoverySignedTransactionArtifact
  ): Promise<CashOutSettlementBroadcastResult>;

  storeRecoveryBroadcast(
    cashOutId: string,
    broadcast: CashOutSettlementBroadcastResult
  ): Promise<CashOutRecord | undefined>;

  reconcileRecoveryTxid(
    txid: string
  ): Promise<TreasuryBroadcastReconciliationResult>;

  storeRecoveryReconciliation(
    cashOutId: string,
    reconciliation: TreasuryBroadcastReconciliationResult
  ): Promise<CashOutRecord | undefined>;
}

const DEFAULT_SUBMISSION_DEPENDENCIES: CashOutSettlementRecoverySubmissionDependencies =
  {
    getCashOutRecordById,

    broadcastRecoveryIntent: broadcastCashOutSettlementRecoveryIntent,

    storeRecoveryBroadcast: storeCashOutSettlementRecoveryBroadcast,

    reconcileRecoveryTxid: reconcileTreasuryBroadcastWithRetry,

    storeRecoveryReconciliation: storeCashOutSettlementRecoveryReconciliation,
  };

function hasPositiveRecoveryEvidence(record: CashOutRecord): boolean {
  return (
    record.recoveryReconciliation?.status === 'mempool' ||
    record.recoveryReconciliation?.status === 'confirmed'
  );
}

/**
 * Read-only network check of the exact persisted recovery txid, followed by
 * persistence of that evidence.
 *
 * This function never broadcasts.
 */
export async function reconcileAndStoreCashOutSettlementRecoveryWithDependencies(
  cashOutId: string,

  dependencies: CashOutSettlementRecoverySubmissionDependencies
): Promise<CashOutRecord> {
  const current = await dependencies.getCashOutRecordById(cashOutId);

  if (!current) {
    throw new Error(
      'Cash-out record could not be found while reconciling exceptional recovery.'
    );
  }

  const intent = current.recoveryIntent;

  if (!intent) {
    throw new Error(
      'Cash-out recovery cannot be reconciled before its exact signed transaction is durably stored.'
    );
  }

  const reconciliation = await dependencies.reconcileRecoveryTxid(intent.txid);

  const stored = await dependencies.storeRecoveryReconciliation(
    cashOutId,

    reconciliation
  );

  if (!stored) {
    throw new Error(
      'Cash-out record could not be found while saving recovery reconciliation.'
    );
  }

  return stored;
}

/**
 * D6F submission orchestration.
 *
 * First attempt:
 *
 *   durable recoveryIntent
 *     → submit exact stored raw bytes
 *     → persist broadcast result
 *     → if request began, reconcile exact stored txid
 *
 * Re-entry after an attempted request:
 *
 *   DO NOT broadcast again here
 *     → reconcile exact stored txid only
 *
 * D6G will later own any explicit merchant-safe resume/retry policy.
 */
export async function broadcastAndReconcileCashOutSettlementRecoveryWithDependencies(
  cashOutId: string,

  dependencies: CashOutSettlementRecoverySubmissionDependencies
): Promise<CashOutRecord> {
  const current = await dependencies.getCashOutRecordById(cashOutId);

  if (!current) {
    throw new Error(
      'Cash-out record could not be found while broadcasting exceptional recovery.'
    );
  }

  const intent = current.recoveryIntent;

  if (!intent) {
    throw new Error(
      'Cash-out recovery cannot be broadcast before its exact signed transaction is durably stored.'
    );
  }

  /**
   * Positive evidence is terminal for submission purposes.
   */
  if (hasPositiveRecoveryEvidence(current)) {
    return current;
  }

  /**
   * If any earlier broadcast request actually began, never blindly submit
   * again.
   *
   * Exact-txid reconciliation comes first.
   */
  if (current.recoveryBroadcast?.requestAttempted === true) {
    return reconcileAndStoreCashOutSettlementRecoveryWithDependencies(
      cashOutId,

      dependencies
    );
  }

  const broadcast = await dependencies.broadcastRecoveryIntent(intent);

  const storedBroadcast = await dependencies.storeRecoveryBroadcast(
    cashOutId,

    broadcast
  );

  if (!storedBroadcast) {
    throw new Error(
      'Cash-out record could not be found while saving recovery broadcast state.'
    );
  }

  /**
   * A blocked attempt or connection failure before broadcast() is proven not
   * to have submitted this transaction.
   */
  if (!broadcast.requestAttempted) {
    return storedBroadcast;
  }

  /**
   * Submission began.
   *
   * From here forward only the exact deterministic txid is checked.
   */
  return reconcileAndStoreCashOutSettlementRecoveryWithDependencies(
    cashOutId,

    dependencies
  );
}

export async function reconcileAndStoreCashOutSettlementRecovery(
  cashOutId: string
): Promise<CashOutRecord> {
  return reconcileAndStoreCashOutSettlementRecoveryWithDependencies(
    cashOutId,

    DEFAULT_SUBMISSION_DEPENDENCIES
  );
}

export async function broadcastAndReconcileCashOutSettlementRecovery(
  cashOutId: string
): Promise<CashOutRecord> {
  return broadcastAndReconcileCashOutSettlementRecoveryWithDependencies(
    cashOutId,

    DEFAULT_SUBMISSION_DEPENDENCIES
  );
}
