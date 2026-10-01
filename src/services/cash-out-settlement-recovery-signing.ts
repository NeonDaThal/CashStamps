import type { CashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

import type { CashOutSettlementRecoveryInputAuthorization } from './cash-out-settlement-recovery-input-authorization';

import {
  assertCashOutSettlementRecoveryTransactionMatchesPlan,
  type CashOutSettlementRecoveryTransactionSummary,
} from './cash-out-settlement-recovery-transaction-reconciliation';

export type CashOutSettlementRecoverySigningRequestVersion =
  'cash_out_recovery_signing_request_v1';

export type CashOutSettlementRecoverySignedTransactionVersion =
  'cash_out_recovery_signed_transaction_v1';

export interface CashOutSettlementRecoverySigningInput {
  outpoint: string;

  txid: string;

  vout: number;

  satoshis: number;

  height: number;

  networkState: 'mempool' | 'confirmed';
}

export interface CashOutSettlementRecoverySigningRequest {
  version: CashOutSettlementRecoverySigningRequestVersion;

  cashOutId: string;

  contractAddress: string;

  inputSetId: string;

  inputCount: 1 | 2 | 3;

  totalInputSats: number;

  inputs: CashOutSettlementRecoverySigningInput[];

  exceptionalCase: CashOutSettlementRecoveryInputAuthorization['exceptionalCase'];

  recoveryFeeSats: number;

  treasuryDestination: CashOutSettlementRecoveryPlan['treasuryDestination'];

  treasuryOutputSats: number;

  platformDestination: CashOutSettlementRecoveryPlan['platformDestination'];

  platformOutputSats: number;

  outputCount: 2;
}

/**
 * Result produced by the future real signed-transaction constructor.
 *
 * D6E.3 will be responsible for deriving txid from these exact signed bytes.
 * D6E.1 deliberately does not contain cryptocurrency/serialization code.
 */
export interface CashOutSettlementRecoverySignedTransactionMaterial {
  rawTransactionHex: string;

  txid: string;

  transactionBytes: number;

  transactionSummary: CashOutSettlementRecoveryTransactionSummary;
}

export interface CashOutSettlementRecoverySignedTransactionArtifact {
  version: CashOutSettlementRecoverySignedTransactionVersion;

  cashOutId: string;

  contractAddress: string;

  inputSetId: string;

  rawTransactionHex: string;

  txid: string;

  transactionBytes: number;

  actualFeeSats: number;

  preparedAt: string;

  signingRequest: CashOutSettlementRecoverySigningRequest;

  transactionSummary: CashOutSettlementRecoveryTransactionSummary;
}

function fail(message: string): never {
  throw new Error(`Invalid Cash-out recovery signing boundary: ${message}`);
}

function normalizeString(value: string): string {
  return value.trim();
}

function normalizeAddress(value: string): string {
  return normalizeString(value).toLowerCase();
}

function normalizeHex(value: string): string {
  return normalizeString(value).toLowerCase();
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

function assertRawTransactionHex(value: string): string {
  const normalized = normalizeHex(value);

  if (
    !normalized ||
    normalized.length % 2 !== 0 ||
    !/^[0-9a-f]+$/.test(normalized)
  ) {
    fail('signed raw transaction must be non-empty even-length hexadecimal.');
  }

  return normalized;
}

function assertTxid(value: string): string {
  const normalized = normalizeHex(value);

  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    fail('signed recovery transaction ID must be 32-byte hexadecimal.');
  }

  return normalized;
}

function assertPreparedAt(value: string): string {
  const normalized = normalizeString(value);

  if (!normalized || !Number.isFinite(Date.parse(normalized))) {
    fail('prepared timestamp must be a valid date-time string.');
  }

  return normalized;
}

/**
 * D6E.1A
 *
 * Convert the already-frozen D6C recovery plan and D6D authorized inputs into
 * the one exact request the future signer is permitted to consume.
 *
 * The signer is not allowed to:
 *
 * - select another input;
 * - change input order;
 * - alter a value;
 * - alter the recovery fee;
 * - redirect Treasury;
 * - redirect Platform;
 * - change either output amount.
 */
export function buildCashOutSettlementRecoverySigningRequest(
  plan: CashOutSettlementRecoveryPlan,
  authorization: CashOutSettlementRecoveryInputAuthorization
): CashOutSettlementRecoverySigningRequest {
  if (authorization.eligibility !== 'eligible') {
    fail('recovery input authorization is not eligible.');
  }

  if (authorization.cashOutId !== plan.cashOutId) {
    fail('authorization belongs to a different Cash-out.');
  }

  if (
    normalizeAddress(authorization.contractAddress) !==
    normalizeAddress(plan.contractAddress)
  ) {
    fail('authorization belongs to a different Cash-out contract.');
  }

  if (authorization.inputSetId !== plan.inputSetId) {
    fail('authorization input-set identity differs from the recovery plan.');
  }

  if (authorization.inputCount !== plan.inputCount) {
    fail('authorization input count differs from the recovery plan.');
  }

  if (authorization.totalInputSats !== plan.recoveryInputSats) {
    fail('authorization input total differs from the recovery plan.');
  }

  if (authorization.inputs.length !== plan.inputs.length) {
    fail('authorization selected inputs differ from the recovery plan.');
  }

  for (let index = 0; index < plan.inputs.length; index += 1) {
    const planned = plan.inputs[index];

    const authorized = authorization.inputs[index];

    if (!planned || !authorized) {
      fail(`recovery input ${index} is missing.`);
    }

    if (authorized.outpoint !== planned.outpoint) {
      fail(`recovery input ${index} outpoint differs.`);
    }

    if (normalizeHex(authorized.txid) !== normalizeHex(planned.txid)) {
      fail(`recovery input ${index} transaction ID differs.`);
    }

    if (authorized.vout !== planned.vout) {
      fail(`recovery input ${index} output index differs.`);
    }

    if (authorized.satoshis !== planned.satoshis) {
      fail(`recovery input ${index} value differs.`);
    }

    if (
      normalizeAddress(authorized.contractAddress) !==
      normalizeAddress(planned.contractAddress)
    ) {
      fail(`recovery input ${index} contract differs.`);
    }

    if (
      authorized.networkState !== 'mempool' &&
      authorized.networkState !== 'confirmed'
    ) {
      fail(`recovery input ${index} does not have positive network state.`);
    }

    assertNonNegativeSafeInteger(
      authorized.height,
      `Recovery input ${index} height`
    );
  }

  assertPositiveSafeInteger(plan.recoveryFeeSats, 'Recovery miner fee');

  assertPositiveSafeInteger(
    plan.treasuryOutputSats,
    'Treasury recovery output'
  );

  assertPositiveSafeInteger(
    plan.platformOutputSats,
    'Platform recovery output'
  );

  if (plan.outputCount !== 2) {
    fail('Recovery v1 requires exactly two outputs.');
  }

  if (
    plan.treasuryOutputSats + plan.platformOutputSats + plan.recoveryFeeSats !==
    plan.recoveryInputSats
  ) {
    fail('recovery plan inputs, outputs and miner fee do not reconcile.');
  }

  return {
    version: 'cash_out_recovery_signing_request_v1',

    cashOutId: plan.cashOutId,

    contractAddress: plan.contractAddress,

    inputSetId: plan.inputSetId,

    inputCount: plan.inputCount,

    totalInputSats: plan.recoveryInputSats,

    inputs: authorization.inputs.map((input) => ({
      outpoint: input.outpoint,

      txid: input.txid,

      vout: input.vout,

      satoshis: input.satoshis,

      height: input.height,

      networkState: input.networkState,
    })),

    exceptionalCase: authorization.exceptionalCase,

    recoveryFeeSats: plan.recoveryFeeSats,

    treasuryDestination: plan.treasuryDestination,

    treasuryOutputSats: plan.treasuryOutputSats,

    platformDestination: plan.platformDestination,

    platformOutputSats: plan.platformOutputSats,

    outputCount: 2,
  };
}

/**
 * D6E.1B
 *
 * Freeze the exact signed transaction material into the object that D6E's
 * write-ahead layer will later persist.
 *
 * This function assumes the future real constructor derives `txid` directly
 * from `rawTransactionHex`.
 *
 * D6C.5 is reused here to independently prove that the signed transaction
 * summary still represents the exact frozen recovery plan.
 */
export function createCashOutSettlementRecoverySignedTransactionArtifact(input: {
  plan: CashOutSettlementRecoveryPlan;

  authorization: CashOutSettlementRecoveryInputAuthorization;

  signed: CashOutSettlementRecoverySignedTransactionMaterial;

  preparedAt: string;
}): CashOutSettlementRecoverySignedTransactionArtifact {
  const signingRequest = buildCashOutSettlementRecoverySigningRequest(
    input.plan,
    input.authorization
  );

  const rawTransactionHex = assertRawTransactionHex(
    input.signed.rawTransactionHex
  );

  const txid = assertTxid(input.signed.txid);

  assertPositiveSafeInteger(
    input.signed.transactionBytes,
    'Signed recovery transaction byte length'
  );

  const expectedBytes = rawTransactionHex.length / 2;

  if (input.signed.transactionBytes !== expectedBytes) {
    fail(
      'reported signed transaction byte length does not match raw transaction bytes.'
    );
  }

  assertCashOutSettlementRecoveryTransactionMatchesPlan(
    input.plan,
    input.signed.transactionSummary
  );

  if (input.signed.transactionSummary.cashOutId !== signingRequest.cashOutId) {
    fail('signed transaction summary belongs to a different Cash-out.');
  }

  if (
    normalizeAddress(input.signed.transactionSummary.contractAddress) !==
    normalizeAddress(signingRequest.contractAddress)
  ) {
    fail('signed transaction summary belongs to a different contract.');
  }

  if (
    input.signed.transactionSummary.feeSats !== signingRequest.recoveryFeeSats
  ) {
    fail('signed transaction miner fee differs from the signing request.');
  }

  const preparedAt = assertPreparedAt(input.preparedAt);

  return {
    version: 'cash_out_recovery_signed_transaction_v1',

    cashOutId: signingRequest.cashOutId,

    contractAddress: signingRequest.contractAddress,

    inputSetId: signingRequest.inputSetId,

    rawTransactionHex,

    txid,

    transactionBytes: input.signed.transactionBytes,

    actualFeeSats: input.signed.transactionSummary.feeSats,

    preparedAt,

    signingRequest,

    transactionSummary: input.signed.transactionSummary,
  };
}
