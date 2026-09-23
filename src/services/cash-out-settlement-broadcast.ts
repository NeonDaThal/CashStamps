import { hashTransaction, hexToBin } from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';
import type { ElectrumService } from 'src/services/electrum';

import {
  classifyTreasuryBroadcastResponse,
  createBlockedTreasuryBroadcastResult,
  createDefinitelyNotBroadcastResult,
  createUncertainBroadcastResult,
} from 'src/services/treasury-broadcast-classification';

import type {
  CashOutSettlementBroadcastResult,
  CashOutSettlementExplicitBroadcastRejection,
  CashOutSettlementIntent,
} from 'src/types/cash-out-settlement';

import { getFundingSafetyStatus } from 'src/services/funding-safety';

import type { TransactionBroadcast } from 'src/services/electrum-types';

export interface CashOutSettlementBroadcastSafetyStatus {
  realBroadcastEnabled: boolean;

  message: string;
}

export interface CashOutSettlementBroadcastTransport {
  /**
   * Establish the network connection.
   *
   * Failure here proves that no transaction broadcast request began.
   */
  start(): Promise<void>;

  /**
   * Submit the exact already-persisted raw transaction.
   *
   * Once this function has been entered, an exception is ambiguous because
   * Electrum may have received the transaction before the response was lost.
   */
  broadcast(rawTransactionHex: string): Promise<string>;
}

export interface CashOutSettlementBroadcastDependencies {
  getBroadcastSafetyStatus: () => CashOutSettlementBroadcastSafetyStatus;

  createTransport: () => CashOutSettlementBroadcastTransport;
}

interface ValidatedSettlementBroadcastIntent {
  expectedTxid: string;

  rawTransactionHex: string;
}

function isValidTransactionId(value: string | undefined): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

function validateSettlementIntentForBroadcast(
  intent: CashOutSettlementIntent
): ValidatedSettlementBroadcastIntent {
  if (intent.status !== 'prepared') {
    throw new Error('Cash-out settlement intent is not in the prepared state.');
  }

  if (
    typeof intent.rawTransactionHex !== 'string' ||
    !/^(?:[0-9a-f]{2})+$/i.test(intent.rawTransactionHex)
  ) {
    throw new Error(
      'Durable Cash-out settlement intent is missing valid raw transaction hex.'
    );
  }

  if (!isValidTransactionId(intent.txid)) {
    throw new Error(
      'Durable Cash-out settlement intent is missing a valid deterministic transaction ID.'
    );
  }

  if (
    !Number.isSafeInteger(intent.rawTransactionBytesLength) ||
    intent.rawTransactionBytesLength <= 0
  ) {
    throw new Error(
      'Cash-out settlement intent has an invalid raw transaction byte length.'
    );
  }

  if (intent.inputCount !== 1) {
    throw new Error(
      'Normal Cash-out settlement broadcast requires exactly one transaction input.'
    );
  }

  if (intent.outputCount !== 2) {
    throw new Error(
      'Normal Cash-out settlement broadcast requires exactly two transaction outputs.'
    );
  }

  /**
   * D3 always persists the transaction before any broadcast side effect.
   *
   * A runtime-corrupted intent claiming otherwise must fail closed.
   */
  if (intent.broadcastEnabled !== false) {
    throw new Error(
      'Cash-out settlement intent does not represent a pre-broadcast D3 transaction.'
    );
  }

  const rawTransactionBytes = hexToBin(intent.rawTransactionHex);

  if (rawTransactionBytes.length !== intent.rawTransactionBytesLength) {
    throw new Error(
      'Cash-out settlement raw transaction byte length does not match the durable D3 intent.'
    );
  }

  const expectedTxid = intent.txid.toLowerCase();

  /**
   * Recalculate the transaction ID from the exact persisted bytes immediately
   * before any network operation.
   *
   * D4 therefore cannot submit bytes whose identity differs from the D3
   * write-ahead transaction.
   */
  const calculatedTxid = hashTransaction(rawTransactionBytes)
    .trim()
    .toLowerCase();

  if (calculatedTxid !== expectedTxid) {
    throw new Error(
      'Cash-out settlement raw transaction does not match its persisted deterministic transaction ID.'
    );
  }

  return {
    expectedTxid,

    /**
     * Important: return the exact stored string.
     *
     * D4 does not rebuild, re-encode, alter or replace the transaction.
     */
    rawTransactionHex: intent.rawTransactionHex,
  };
}

function getBroadcastErrorMessage(error: unknown): string {
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
    'Cash-out settlement broadcast failed.'
  );
}

/**
 * Recognise ONLY a narrow explicit server rejection which says the transaction
 * input is unavailable.
 *
 * Importantly:
 *
 * - generic network/transport failures are NOT classified;
 * - script-validation failures are NOT classified;
 * - mempool conflicts are NOT classified;
 * - arbitrary Electrum errors are NOT classified.
 *
 * "bad-txns-inputs-missingorspent" does not prove whether the parent is merely
 * missing or actually spent, so the classification is intentionally named
 * input_unavailable rather than parent_not_propagated.
 */
export function classifyCashOutSettlementExplicitBroadcastRejection(
  error: unknown
): CashOutSettlementExplicitBroadcastRejection | undefined {
  const message = getBroadcastErrorMessage(error);

  const normalised = message.toLowerCase();

  const hasCanonicalInputUnavailableCode = normalised.includes(
    'bad-txns-inputs-missingorspent'
  );

  const hasExplicitRejectionContext =
    normalised.includes('rejected by network rules') ||
    normalised.includes('server returned an error') ||
    normalised.includes('rpc error');

  const hasInputUnavailableDescription =
    normalised.includes('missing inputs') ||
    normalised.includes('missing or spent inputs') ||
    normalised.includes('inputs missing or spent');

  if (
    hasCanonicalInputUnavailableCode ||
    (hasExplicitRejectionContext && hasInputUnavailableDescription)
  ) {
    return {
      kind: 'input_unavailable',

      retrySameTransaction: true,
    };
  }

  return undefined;
}

class ElectrumCashOutSettlementBroadcastTransport
  implements CashOutSettlementBroadcastTransport
{
  private electrum: ElectrumService | undefined;

  async start(): Promise<void> {
    /**
     * Load the real Electrum runtime only when production networking is
     * actually required.
     *
     * The type-only import above is erased from runtime output, so tests using
     * the injected fake transport do not load the Electrum/WebSocket stack.
     */
    const { ElectrumService } = await import('src/services/electrum');

    const electrum = new ElectrumService(ELECTRUM_SERVERS);

    await electrum.start();

    this.electrum = electrum;
  }

  async broadcast(rawTransactionHex: string): Promise<string> {
    if (!this.electrum) {
      throw new Error(
        'Cash-out settlement Electrum transport was not started before broadcast.'
      );
    }

    return this.electrum.request<TransactionBroadcast>(
      'blockchain.transaction.broadcast',
      rawTransactionHex
    );
  }
}

const DEFAULT_DEPENDENCIES: CashOutSettlementBroadcastDependencies = {
  getBroadcastSafetyStatus: getFundingSafetyStatus,

  createTransport: () => new ElectrumCashOutSettlementBroadcastTransport(),
};

/**
 * Broadcast ONLY the exact normal-settlement transaction which already crossed
 * the D3 durable write-ahead boundary.
 *
 * D4 safety invariants:
 *
 * - never constructs a transaction;
 * - never signs a transaction;
 * - never modifies transaction bytes;
 * - recalculates the txid from the persisted bytes before network access;
 * - pre-request failures are definitely_not_broadcast;
 * - once the broadcast request begins, failures are uncertain;
 * - successful Electrum responses are classified against the exact D3 txid.
 */
export async function broadcastCashOutSettlementIntentWithDependencies(
  intent: CashOutSettlementIntent,
  dependencies: CashOutSettlementBroadcastDependencies
): Promise<CashOutSettlementBroadcastResult> {
  const safety = dependencies.getBroadcastSafetyStatus();

  /**
   * Preserve the project's global real-BCH safety guard.
   *
   * No transport is even created while real broadcast is disabled.
   */
  if (!safety.realBroadcastEnabled) {
    return createBlockedTreasuryBroadcastResult(
      safety.message,
      false,
      isValidTransactionId(intent.txid) ? intent.txid.toLowerCase() : undefined
    );
  }

  let validated: ValidatedSettlementBroadcastIntent;

  try {
    validated = validateSettlementIntentForBroadcast(intent);
  } catch (error) {
    return createBlockedTreasuryBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Cash-out settlement intent failed pre-broadcast validation.',
      true,
      isValidTransactionId(intent.txid) ? intent.txid.toLowerCase() : undefined
    );
  }

  const transport = dependencies.createTransport();

  /**
   * Failure before broadcast() proves that this attempt never began a
   * blockchain.transaction.broadcast request.
   */
  try {
    await transport.start();
  } catch (error) {
    return createDefinitelyNotBroadcastResult(
      error instanceof Error
        ? error.message
        : 'Could not connect to Electrum before Cash-out settlement broadcast.',
      validated.expectedTxid
    );
  }

  /**
   * From the moment broadcast() begins, any thrown error is ambiguous.
   *
   * Electrum may already have accepted the exact transaction before the
   * response or connection was lost.
   *
   * D4 must therefore reconcile the same deterministic txid rather than
   * blindly submitting another request.
   */
  try {
    const serverTxid = await transport.broadcast(validated.rawTransactionHex);

    return classifyTreasuryBroadcastResponse(
      validated.expectedTxid,
      serverTxid
    );
  } catch (error) {
    const errorMessage = getBroadcastErrorMessage(error);

    const explicitRejection =
      classifyCashOutSettlementExplicitBroadcastRejection(error);

    if (explicitRejection) {
      return {
        ...createUncertainBroadcastResult(validated.expectedTxid, errorMessage),

        explicitRejection,
      };
    }

    /**
     * No explicit safe classification exists.
     *
     * The request began, so the outcome remains ambiguous and another
     * submission is forbidden until the exact txid is reconciled.
     */
    return createUncertainBroadcastResult(validated.expectedTxid, errorMessage);
  }
}

/**
 * Production entry point.
 *
 * The project-wide real-broadcast safety guard remains authoritative.
 */
export async function broadcastCashOutSettlementIntent(
  intent: CashOutSettlementIntent
): Promise<CashOutSettlementBroadcastResult> {
  return broadcastCashOutSettlementIntentWithDependencies(
    intent,
    DEFAULT_DEPENDENCIES
  );
}
