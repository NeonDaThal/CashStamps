import type { CashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

export interface CashOutSettlementRecoveryTransactionInputSummary {
  txid: string;
  vout: number;
  satoshis: number;
}

export interface CashOutSettlementRecoveryTransactionOutputSummary {
  /**
   * Output position is covenant-significant:
   *
   * 0 = Treasury
   * 1 = Platform
   */
  index: number;

  publicKeyHashHex: string;

  satoshis: number;
}

export interface CashOutSettlementRecoveryTransactionSummary {
  cashOutId: string;

  contractAddress: string;

  inputCount: number;

  inputs: CashOutSettlementRecoveryTransactionInputSummary[];

  outputCount: number;

  outputs: CashOutSettlementRecoveryTransactionOutputSummary[];

  /**
   * Actual miner fee represented by:
   *
   * total selected inputs - total transaction outputs
   */
  feeSats: number;
}

function fail(message: string): never {
  throw new Error(
    `Recovery transaction does not match its deterministic plan: ${message}`
  );
}

function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function assertPositiveSafeInteger(value: number, fieldName: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail(`${fieldName} must be a positive safe integer.`);
  }
}

function assertNonNegativeSafeInteger(value: number, fieldName: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(`${fieldName} must be a non-negative safe integer.`);
  }
}

/**
 * D6C.5
 *
 * Prove that a constructed exceptional-recovery transaction represents
 * exactly the already-frozen D6C.4 recovery plan.
 *
 * This function deliberately performs no:
 *
 * - transaction construction;
 * - signing;
 * - private-key access;
 * - network access;
 * - persistence;
 * - broadcast.
 *
 * D6E will construct the real signed transaction, derive this summary from
 * that transaction, then pass it through this exact guard before persistence.
 */
export function assertCashOutSettlementRecoveryTransactionMatchesPlan(
  plan: CashOutSettlementRecoveryPlan,
  transaction: CashOutSettlementRecoveryTransactionSummary
): void {
  if (transaction.cashOutId !== plan.cashOutId) {
    fail('Cash-out ID differs.');
  }

  if (
    normalizeAddress(transaction.contractAddress) !==
    normalizeAddress(plan.contractAddress)
  ) {
    fail('Cash-out contract identity differs.');
  }

  if (transaction.inputCount !== transaction.inputs.length) {
    fail(
      'reported transaction input count does not match the supplied inputs.'
    );
  }

  if (transaction.inputCount !== plan.inputCount) {
    fail('transaction input count differs from the recovery plan.');
  }

  if (transaction.inputs.length !== plan.inputs.length) {
    fail('transaction source-input set differs from the recovery plan.');
  }

  let actualInputTotalSats = 0;

  for (let index = 0; index < plan.inputs.length; index += 1) {
    const plannedInput = plan.inputs[index];

    const actualInput = transaction.inputs[index];

    if (!actualInput) {
      fail(`recovery input ${index} is missing.`);
    }

    const actualTxid = normalizeHex(actualInput.txid);

    const plannedTxid = normalizeHex(plannedInput.txid);

    if (actualTxid !== plannedTxid) {
      fail(`recovery input ${index} txid differs.`);
    }

    assertNonNegativeSafeInteger(
      actualInput.vout,
      `Recovery input ${index} output index`
    );

    if (actualInput.vout !== plannedInput.vout) {
      fail(`recovery input ${index} output index differs.`);
    }

    assertPositiveSafeInteger(
      actualInput.satoshis,
      `Recovery input ${index} value`
    );

    if (actualInput.satoshis !== plannedInput.satoshis) {
      fail(`recovery input ${index} value differs.`);
    }

    actualInputTotalSats += actualInput.satoshis;

    if (!Number.isSafeInteger(actualInputTotalSats)) {
      fail('aggregate recovery input value exceeds safe integer range.');
    }
  }

  if (actualInputTotalSats !== plan.recoveryInputSats) {
    fail('aggregate recovery input value differs from the recovery plan.');
  }

  if (transaction.outputCount !== transaction.outputs.length) {
    fail(
      'reported transaction output count does not match the supplied outputs.'
    );
  }

  if (transaction.outputCount !== plan.outputCount) {
    fail('transaction output count differs from the recovery plan.');
  }

  if (transaction.outputs.length !== 2) {
    fail('Recovery v1 requires exactly two outputs.');
  }

  const treasuryOutput = transaction.outputs[0];

  const platformOutput = transaction.outputs[1];

  if (!treasuryOutput || treasuryOutput.index !== 0) {
    fail('Treasury must be transaction output 0.');
  }

  if (!platformOutput || platformOutput.index !== 1) {
    fail('Platform must be transaction output 1.');
  }

  if (
    normalizeHex(treasuryOutput.publicKeyHashHex) !==
    normalizeHex(plan.treasuryDestination.publicKeyHashHex)
  ) {
    fail('Treasury output destination differs.');
  }

  if (
    normalizeHex(platformOutput.publicKeyHashHex) !==
    normalizeHex(plan.platformDestination.publicKeyHashHex)
  ) {
    fail('Platform output destination differs.');
  }

  assertPositiveSafeInteger(treasuryOutput.satoshis, 'Treasury output value');

  assertPositiveSafeInteger(platformOutput.satoshis, 'Platform output value');

  if (treasuryOutput.satoshis !== plan.treasuryOutputSats) {
    fail('Treasury output value differs.');
  }

  if (platformOutput.satoshis !== plan.platformOutputSats) {
    fail('Platform output value differs.');
  }

  assertPositiveSafeInteger(
    transaction.feeSats,
    'Recovery transaction miner fee'
  );

  if (transaction.feeSats !== plan.recoveryFeeSats) {
    fail('recovery miner fee differs.');
  }

  const actualOutputTotalSats =
    treasuryOutput.satoshis + platformOutput.satoshis;

  if (!Number.isSafeInteger(actualOutputTotalSats)) {
    fail('aggregate recovery output value exceeds safe integer range.');
  }

  const impliedFeeSats = actualInputTotalSats - actualOutputTotalSats;

  if (impliedFeeSats !== transaction.feeSats) {
    fail('reported miner fee does not equal inputs minus outputs.');
  }

  if (actualOutputTotalSats + transaction.feeSats !== actualInputTotalSats) {
    fail('recovery transaction value does not reconcile exactly.');
  }
}
