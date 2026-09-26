import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementSourceConflictEvidence } from 'src/types/cash-out-settlement';

export interface CashOutSettlementConflictHistoryItem {
  txid: string;

  /**
   * Electrum-style transaction height.
   *
   * Positive = confirmed.
   * Zero/negative = unconfirmed/mempool-like network evidence.
   */
  height: number;
}

export interface CashOutSettlementConflictTransactionInput {
  previousTxid: string;

  previousOutputIndex: number;
}

export interface CashOutSettlementConflictInspectorDependencies {
  /**
   * Read transaction history involving the unique CashScript contract address.
   */
  getContractHistory: (
    contractAddress: string
  ) => Promise<CashOutSettlementConflictHistoryItem[]>;

  /**
   * Decode only the previous outpoints consumed by one transaction.
   *
   * D5D.2b will provide the real Electrum/libauth implementation.
   */
  getTransactionInputs: (
    txid: string
  ) => Promise<CashOutSettlementConflictTransactionInput[]>;

  now: () => string;
}

export type CashOutSettlementConflictInspectionStatus =
  | 'no_conflict_observed'
  | 'conflict_detected'
  | 'inspection_unavailable';

export interface CashOutSettlementConflictInspectionResult {
  status: CashOutSettlementConflictInspectionStatus;

  sourcePaymentTxid: string;

  sourceOutpointIndex: number;

  expectedSettlementTxid: string;

  checkedTransactionCount: number;

  evidence?: CashOutSettlementSourceConflictEvidence;

  errorMessage?: string;
}

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
      `${fieldName} must be a valid 64-character transaction ID.`
    );
  }

  return normalised;
}

function normaliseOutpointIndex(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }

  return value;
}

function normaliseHistoryItem(
  item: CashOutSettlementConflictHistoryItem
): CashOutSettlementConflictHistoryItem {
  return {
    txid: normaliseTransactionId(item.txid, 'Contract-history transaction ID'),

    height: Number.isSafeInteger(item.height) ? item.height : 0,
  };
}

function transactionSpendsExactOutpoint(
  inputs: CashOutSettlementConflictTransactionInput[],
  sourcePaymentTxid: string,
  sourceOutpointIndex: number
): boolean {
  return inputs.some((input) => {
    let previousTxid: string;

    try {
      previousTxid = normaliseTransactionId(
        input.previousTxid,
        'Transaction input previous txid'
      );
    } catch {
      return false;
    }

    if (
      !Number.isSafeInteger(input.previousOutputIndex) ||
      input.previousOutputIndex < 0
    ) {
      return false;
    }

    return (
      previousTxid === sourcePaymentTxid &&
      input.previousOutputIndex === sourceOutpointIndex
    );
  });
}

function conflictStrength(
  history: CashOutSettlementConflictHistoryItem
): number {
  return history.height > 0 ? 2 : 1;
}

function chooseStrongestConflict(
  conflicts: CashOutSettlementConflictHistoryItem[]
): CashOutSettlementConflictHistoryItem {
  const ordered = [...conflicts].sort((left, right) => {
    const strengthDifference = conflictStrength(right) - conflictStrength(left);

    if (strengthDifference !== 0) {
      return strengthDifference;
    }

    if (left.height !== right.height) {
      return right.height - left.height;
    }

    return left.txid.localeCompare(right.txid);
  });

  const selected = ordered[0];

  if (!selected) {
    throw new Error(
      'Conflict selection requires at least one conflicting transaction.'
    );
  }

  return selected;
}

/**
 * D5D.2a — inspect contract history for a concrete different transaction which
 * consumes the exact D3-bound customer payment outpoint.
 *
 * IMPORTANT:
 *
 * This function does NOT infer a conflict from:
 *
 * - the source UTXO no longer appearing in listunspent;
 * - the settlement transaction being temporarily unknown;
 * - an unrelated transaction involving the contract;
 * - the deterministic settlement transaction spending the source itself.
 *
 * Conflict requires positive evidence of a DIFFERENT transaction consuming:
 *
 * sourcePaymentTxid : sourceOutpointIndex
 */
export async function inspectCashOutSettlementSourceConflictWithDependencies(
  cashOut: CashOutRecord,
  dependencies: CashOutSettlementConflictInspectorDependencies
): Promise<CashOutSettlementConflictInspectionResult> {
  const intent = cashOut.settlementIntent;

  if (!intent) {
    throw new Error(
      'Cash-out settlement conflict inspection requires a durable settlement intent.'
    );
  }

  const contractAddress = intent.contractAddress?.trim();

  if (!contractAddress) {
    throw new Error(
      'Cash-out settlement conflict inspection requires the contract address.'
    );
  }

  const sourcePaymentTxid = normaliseTransactionId(
    intent.sourcePaymentTxid,
    'Settlement source payment txid'
  );

  const sourceOutpointIndex = normaliseOutpointIndex(
    intent.sourceOutpointIndex,
    'Settlement source output index'
  );

  const expectedSettlementTxid = normaliseTransactionId(
    intent.txid,
    'Deterministic settlement txid'
  );

  let history: CashOutSettlementConflictHistoryItem[];

  try {
    history = (await dependencies.getContractHistory(contractAddress)).map(
      normaliseHistoryItem
    );
  } catch (error) {
    return {
      status: 'inspection_unavailable',

      sourcePaymentTxid,

      sourceOutpointIndex,

      expectedSettlementTxid,

      checkedTransactionCount: 0,

      errorMessage:
        error instanceof Error
          ? error.message
          : 'Contract history could not be inspected.',
    };
  }

  /**
   * Remove:
   *
   * - the original customer payment transaction itself;
   * - the exact deterministic settlement transaction.
   *
   * Neither can be a conflicting spender.
   */
  const candidates = history.filter(
    (item) =>
      item.txid !== sourcePaymentTxid && item.txid !== expectedSettlementTxid
  );

  const conflicts: CashOutSettlementConflictHistoryItem[] = [];

  let checkedTransactionCount = 0;

  for (const candidate of candidates) {
    let inputs: CashOutSettlementConflictTransactionInput[];

    try {
      inputs = await dependencies.getTransactionInputs(candidate.txid);
    } catch (error) {
      return {
        status: 'inspection_unavailable',

        sourcePaymentTxid,

        sourceOutpointIndex,

        expectedSettlementTxid,

        checkedTransactionCount,

        errorMessage:
          error instanceof Error
            ? error.message
            : 'A contract-history transaction could not be decoded.',
      };
    }

    checkedTransactionCount += 1;

    if (
      transactionSpendsExactOutpoint(
        inputs,
        sourcePaymentTxid,
        sourceOutpointIndex
      )
    ) {
      conflicts.push(candidate);
    }
  }

  if (conflicts.length === 0) {
    return {
      status: 'no_conflict_observed',

      sourcePaymentTxid,

      sourceOutpointIndex,

      expectedSettlementTxid,

      checkedTransactionCount,
    };
  }

  /**
   * One proven conflicting spender is already sufficient for the merchant
   * hard stop.
   *
   * If inconsistent network data exposes more than one, preserve the strongest
   * observation deterministically:
   *
   * confirmed > unconfirmed
   */
  const conflict = chooseStrongestConflict(conflicts);

  const isConfirmed = conflict.height > 0;

  const detectedAt = dependencies.now();

  if (!Number.isFinite(new Date(detectedAt).getTime())) {
    throw new Error(
      'Conflict inspection produced an invalid detection timestamp.'
    );
  }

  const evidence: CashOutSettlementSourceConflictEvidence = {
    state: 'detected',

    sourcePaymentTxid,

    sourceOutpointIndex,

    expectedSettlementTxid,

    conflictingTxid: conflict.txid,

    conflictingTransactionStatus: isConfirmed ? 'confirmed' : 'mempool',

    conflictingTransactionBlockHeight: isConfirmed ? conflict.height : 0,

    detectedAt,

    message:
      'A different transaction spends the exact customer payment output selected for Cash-out settlement.',
  };

  return {
    status: 'conflict_detected',

    sourcePaymentTxid,

    sourceOutpointIndex,

    expectedSettlementTxid,

    checkedTransactionCount,

    evidence,
  };
}
