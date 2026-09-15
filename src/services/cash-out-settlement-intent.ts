import { hashTransaction, hexToBin } from '@bitauth/libauth';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

const TXID_PATTERN = /^[0-9a-f]{64}$/;

const RAW_TRANSACTION_PATTERN = /^(?:[0-9a-f]{2})+$/;

const COMMITMENT_PATTERN = /^[0-9a-f]{64}$/;

function normaliseTxid(value: string, fieldName: string): string {
  const normalised = value.trim().toLowerCase();

  if (!TXID_PATTERN.test(normalised)) {
    throw new Error(
      `${fieldName} must be exactly 32 bytes encoded as hexadecimal.`
    );
  }

  return normalised;
}

function normaliseRawTransactionHex(value: string): string {
  const normalised = value.trim().toLowerCase();

  if (!RAW_TRANSACTION_PATTERN.test(normalised)) {
    throw new Error(
      'Cash-out settlement intent does not contain valid raw transaction hexadecimal.'
    );
  }

  return normalised;
}

function requirePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer.`);
  }

  return value;
}

function requireNonNegativeSafeInteger(
  value: number,
  fieldName: string
): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer.`);
  }

  return value;
}

function requireNonEmptyString(value: string, fieldName: string): string {
  const normalised = value.trim();

  if (!normalised) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalised;
}

/**
 * Validate that rawTransactionHex and txid describe the SAME exact
 * transaction.
 */
function validateSettlementTransactionIdentity(
  intent: CashOutSettlementIntent
): {
  rawTransactionHex: string;

  txid: string;
} {
  const rawTransactionHex = normaliseRawTransactionHex(
    intent.rawTransactionHex
  );

  const txid = normaliseTxid(intent.txid, 'Cash-out settlement transaction ID');

  const calculatedTxid = hashTransaction(hexToBin(rawTransactionHex))
    .trim()
    .toLowerCase();

  if (calculatedTxid !== txid) {
    throw new Error(
      'Cash-out settlement raw transaction does not match its deterministic transaction ID.'
    );
  }

  if (intent.rawTransactionBytesLength !== rawTransactionHex.length / 2) {
    throw new Error(
      'Cash-out settlement raw transaction byte length is inconsistent.'
    );
  }

  return {
    rawTransactionHex,

    txid,
  };
}

interface ValidatedCashOutSettlementIntent {
  cashOutCommitmentHex: string;

  contractAddress: string;

  sourcePaymentTxid: string;

  sourceOutpointIndex: number;

  sourceValueSats: number;

  rawTransactionHex: string;

  txid: string;

  treasuryAddress: string;

  treasuryOutputSats: number;

  platformAddress: string;

  platformOutputSats: number;

  actualFeeSats: number;

  preparedAt: string;
}

/**
 * Validate one settlement intent against the permanent identity and received
 * payment state of its Cash-out.
 *
 * This validation is used BOTH:
 *
 * - before the first persistence; and
 * - whenever an already-persisted intent is recovered.
 *
 * That means corrupted durable state cannot become trusted merely because a
 * settlementIntent field already exists.
 */
function validateSettlementIntentForCashOut(
  cashOut: CashOutRecord,
  intent: CashOutSettlementIntent
): ValidatedCashOutSettlementIntent {
  if (intent.status !== 'prepared') {
    throw new Error('Cash-out settlement intent is not prepared.');
  }

  if (
    intent.cashOutId !== cashOut.id ||
    intent.cashOutSerial !== cashOut.serial
  ) {
    throw new Error(
      'Cash-out settlement intent belongs to a different Cash-out record.'
    );
  }

  const cashOutCommitmentHex = intent.cashOutCommitmentHex.trim().toLowerCase();

  if (
    !COMMITMENT_PATTERN.test(cashOutCommitmentHex) ||
    cashOutCommitmentHex === '0'.repeat(64)
  ) {
    throw new Error(
      'Cash-out settlement intent contains an invalid contract commitment.'
    );
  }

  const contractAddress = requireNonEmptyString(
    intent.contractAddress,
    'Cash-out settlement contract address'
  ).toLowerCase();

  if (!contractAddress.startsWith('bitcoincash:')) {
    throw new Error(
      'Cash-out settlement intent requires a full Bitcoin Cash mainnet contract address.'
    );
  }

  const sourcePaymentTxid = normaliseTxid(
    intent.sourcePaymentTxid,
    'Cash-out source payment transaction ID'
  );

  const sourceOutpointIndex = requireNonNegativeSafeInteger(
    intent.sourceOutpointIndex,
    'Cash-out source payment output index'
  );

  const sourceValueSats = requirePositiveSafeInteger(
    intent.sourceValueSats,
    'Cash-out source payment value'
  );

  if (sourceValueSats !== cashOut.bchSatsRequired) {
    throw new Error(
      'Cash-out settlement source value does not match the required customer payment.'
    );
  }

  /**
   * If the Cash-out record already identifies the received transaction, the
   * settlement intent must spend that SAME payment transaction.
   *
   * Legacy/pre-contract records may not contain this field, so absence is
   * allowed. A contradictory value is not.
   */
  if (cashOut.receivedTxid !== undefined) {
    const receivedTxid = normaliseTxid(
      cashOut.receivedTxid,
      'Cash-out recorded received transaction ID'
    );

    if (receivedTxid !== sourcePaymentTxid) {
      throw new Error(
        'Cash-out settlement source transaction does not match the recorded received payment.'
      );
    }
  }

  /**
   * The recorded received amount, when present, must also describe the exact
   * contract payment selected for normal settlement.
   */
  if (cashOut.bchSatsReceived !== undefined) {
    const receivedSats = requirePositiveSafeInteger(
      cashOut.bchSatsReceived,
      'Cash-out recorded received amount'
    );

    if (receivedSats !== sourceValueSats) {
      throw new Error(
        'Cash-out settlement source value does not match the recorded received amount.'
      );
    }
  }

  const transactionIdentity = validateSettlementTransactionIdentity(intent);

  const treasuryAddress = requireNonEmptyString(
    intent.treasuryAddress,
    'Cash-out Treasury settlement address'
  );

  const platformAddress = requireNonEmptyString(
    intent.platformAddress,
    'Cash-out platform settlement address'
  );

  const treasuryOutputSats = requirePositiveSafeInteger(
    intent.treasuryOutputSats,
    'Cash-out Treasury settlement output'
  );

  const platformOutputSats = requirePositiveSafeInteger(
    intent.platformOutputSats,
    'Cash-out platform settlement output'
  );

  const actualFeeSats = requirePositiveSafeInteger(
    intent.actualFeeSats,
    'Cash-out settlement miner fee'
  );

  if (
    treasuryOutputSats + platformOutputSats + actualFeeSats !==
    sourceValueSats
  ) {
    throw new Error(
      'Cash-out settlement transaction values do not reconcile to the exact customer payment.'
    );
  }

  if (intent.inputCount !== 1 || intent.outputCount !== 2) {
    throw new Error(
      'Normal Cash-out settlement must contain exactly one contract input and two covenant outputs.'
    );
  }

  if (intent.broadcastEnabled !== false) {
    throw new Error(
      'Cash-out settlement intent must not permit broadcast during D3 preparation.'
    );
  }

  const preparedAt = requireNonEmptyString(
    intent.preparedAt,
    'Cash-out settlement prepared timestamp'
  );

  return {
    cashOutCommitmentHex,

    contractAddress,

    sourcePaymentTxid,

    sourceOutpointIndex,

    sourceValueSats,

    rawTransactionHex: transactionIdentity.rawTransactionHex,

    txid: transactionIdentity.txid,

    treasuryAddress,

    treasuryOutputSats,

    platformAddress,

    platformOutputSats,

    actualFeeSats,

    preparedAt,
  };
}

/**
 * Compare the immutable identity/economic fields of two intents.
 *
 * preparedAt is deliberately excluded:
 *
 * re-preparing the exact same deterministic transaction after an interrupted
 * attempt must remain idempotent and preserve the FIRST persisted intent.
 */
function isSameSettlementIntent(
  existing: CashOutSettlementIntent,
  incoming: CashOutSettlementIntent
): boolean {
  return (
    existing.status === incoming.status &&
    existing.cashOutId === incoming.cashOutId &&
    existing.cashOutSerial === incoming.cashOutSerial &&
    existing.cashOutCommitmentHex.toLowerCase() ===
      incoming.cashOutCommitmentHex.toLowerCase() &&
    existing.contractAddress.toLowerCase() ===
      incoming.contractAddress.toLowerCase() &&
    existing.sourcePaymentTxid.toLowerCase() ===
      incoming.sourcePaymentTxid.toLowerCase() &&
    existing.sourceOutpointIndex === incoming.sourceOutpointIndex &&
    existing.sourceValueSats === incoming.sourceValueSats &&
    existing.rawTransactionHex.toLowerCase() ===
      incoming.rawTransactionHex.toLowerCase() &&
    existing.txid.toLowerCase() === incoming.txid.toLowerCase() &&
    existing.rawTransactionBytesLength === incoming.rawTransactionBytesLength &&
    existing.treasuryAddress.toLowerCase() ===
      incoming.treasuryAddress.toLowerCase() &&
    existing.treasuryOutputSats === incoming.treasuryOutputSats &&
    existing.platformAddress.toLowerCase() ===
      incoming.platformAddress.toLowerCase() &&
    existing.platformOutputSats === incoming.platformOutputSats &&
    existing.actualFeeSats === incoming.actualFeeSats &&
    existing.inputCount === incoming.inputCount &&
    existing.outputCount === incoming.outputCount &&
    existing.broadcastEnabled === incoming.broadcastEnabled
  );
}

/**
 * Attach one exact normal-settlement transaction to a Cash-out.
 *
 * Safety rules:
 *
 * - only a received Cash-out may cross this boundary for the FIRST time;
 * - an already-persisted intent remains valid after later lifecycle progress;
 * - durable state is fully revalidated on recovery;
 * - intent must belong to this exact Cash-out and received payment;
 * - raw transaction and txid must cryptographically agree;
 * - input/output economics must reconcile;
 * - same exact intent is idempotent;
 * - ANY different second intent is rejected permanently.
 */
export function applyCashOutSettlementIntent(
  cashOut: CashOutRecord,
  intent: CashOutSettlementIntent
): CashOutRecord {
  if (cashOut.settlementIntent) {
    /**
     * Do not trust persisted state merely because it already exists.
     */
    validateSettlementIntentForCashOut(cashOut, cashOut.settlementIntent);

    validateSettlementIntentForCashOut(cashOut, intent);

    if (isSameSettlementIntent(cashOut.settlementIntent, intent)) {
      return cashOut;
    }

    throw new Error(
      'A different settlement transaction has already been prepared for this Cash-out.'
    );
  }

  if (cashOut.status !== 'received') {
    throw new Error(
      'Cash-out settlement intent may only be persisted after the exact customer payment has been received.'
    );
  }

  const validated = validateSettlementIntentForCashOut(cashOut, intent);

  return {
    ...cashOut,

    settlementIntent: {
      ...intent,

      cashOutCommitmentHex: validated.cashOutCommitmentHex,

      contractAddress: validated.contractAddress,

      sourcePaymentTxid: validated.sourcePaymentTxid,

      sourceOutpointIndex: validated.sourceOutpointIndex,

      sourceValueSats: validated.sourceValueSats,

      rawTransactionHex: validated.rawTransactionHex,

      txid: validated.txid,

      treasuryAddress: validated.treasuryAddress,

      treasuryOutputSats: validated.treasuryOutputSats,

      platformAddress: validated.platformAddress,

      platformOutputSats: validated.platformOutputSats,

      actualFeeSats: validated.actualFeeSats,

      preparedAt: validated.preparedAt,
    },
  };
}
