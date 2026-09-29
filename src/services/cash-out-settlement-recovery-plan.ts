import {
  buildCashOutSettlementRecoveryInputSet,
  type CashOutSettlementRecoveryInput,
  type CashOutSettlementRecoveryInputSet,
} from './cash-out-settlement-recovery-inputs';

import { calculateCashOutSettlementRecoveryEconomics } from './cash-out-settlement-recovery-economics';

import type {
  CashOutSettlementP2pkhDestination,
  CashOutSettlementRecoveryVariance,
} from 'src/types/cash-out-settlement';

export type CashOutSettlementRecoveryPlanVersion = 'cash_out_recovery_plan_v1';

export interface BuildCashOutSettlementRecoveryPlanInput {
  cashOutId: string;

  requiredSats: number;

  platformFeeSats: number;

  /**
   * Exact fee derived from the final signed recovery transaction.
   *
   * This function does not estimate or guess the fee.
   */
  recoveryFeeSats: number;

  inputSet: CashOutSettlementRecoveryInputSet;

  treasuryDestination: CashOutSettlementP2pkhDestination;

  platformDestination: CashOutSettlementP2pkhDestination;
}

export interface CashOutSettlementRecoveryPlan {
  version: CashOutSettlementRecoveryPlanVersion;

  cashOutId: string;

  contractAddress: string;

  inputSetId: string;

  inputCount: 1 | 2 | 3;

  inputs: CashOutSettlementRecoveryInput[];

  recoveryInputSats: number;

  requiredSats: number;

  platformFeeSats: number;

  recoveryFeeSats: number;

  treasuryOutputSats: number;

  platformOutputSats: number;

  paymentVarianceSats: number;

  variance: CashOutSettlementRecoveryVariance;

  merchantShortfallSats: number;

  customerSurplusSats: number;

  treasuryDestination: CashOutSettlementP2pkhDestination;

  platformDestination: CashOutSettlementP2pkhDestination;

  outputCount: 2;
}

const PUBLIC_KEY_HASH_HEX_PATTERN = /^[0-9a-f]{40}$/;

function requireNonEmptyString(
  value: string | undefined,
  fieldName: string
): string {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function requirePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer.`);
  }

  return value;
}

function normalizeDestination(
  destination: CashOutSettlementP2pkhDestination,
  fieldName: string
): CashOutSettlementP2pkhDestination {
  const address = requireNonEmptyString(
    destination.address,
    `${fieldName} address`
  );

  const publicKeyHashHex = requireNonEmptyString(
    destination.publicKeyHashHex,
    `${fieldName} public-key hash`
  ).toLowerCase();

  if (!PUBLIC_KEY_HASH_HEX_PATTERN.test(publicKeyHashHex)) {
    throw new Error(
      `${fieldName} public-key hash must be exactly 20 bytes encoded as hexadecimal.`
    );
  }

  return {
    address,
    publicKeyHashHex,
  };
}

/**
 * Rebuild the supplied input set through the canonical D6C.2 boundary.
 *
 * This means a manually-constructed or mutated input-set object cannot bypass
 * canonical ordering, duplicate-outpoint checks, contract identity checks, or
 * the Recovery v1 three-input limit.
 */
function normalizeInputSet(
  supplied: CashOutSettlementRecoveryInputSet
): CashOutSettlementRecoveryInputSet {
  const rebuilt = buildCashOutSettlementRecoveryInputSet(
    supplied.inputs.map((input) => ({
      txid: input.txid,
      vout: input.vout,
      satoshis: input.satoshis,
      contractAddress: input.contractAddress,
    }))
  );

  if (rebuilt.inputSetId !== supplied.inputSetId) {
    throw new Error(
      'Recovery input-set identity does not match its canonical inputs.'
    );
  }

  if (rebuilt.totalInputSats !== supplied.totalInputSats) {
    throw new Error(
      'Recovery input-set total does not match its canonical inputs.'
    );
  }

  if (rebuilt.inputCount !== supplied.inputCount) {
    throw new Error(
      'Recovery input-set count does not match its canonical inputs.'
    );
  }

  if (rebuilt.contractAddress !== supplied.contractAddress) {
    throw new Error(
      'Recovery input-set contract identity does not match its canonical inputs.'
    );
  }

  return rebuilt;
}

/**
 * Build one deterministic exceptional Cash-out recovery plan.
 *
 * This function deliberately performs no:
 *
 * - network discovery;
 * - recovery eligibility decision;
 * - private-key access;
 * - signing;
 * - transaction serialization;
 * - persistence;
 * - broadcast.
 *
 * Those responsibilities remain separate safety boundaries.
 */
export function buildCashOutSettlementRecoveryPlan(
  input: BuildCashOutSettlementRecoveryPlanInput
): CashOutSettlementRecoveryPlan {
  const cashOutId = requireNonEmptyString(input.cashOutId, 'Cash-out ID');

  const requiredSats = requirePositiveSafeInteger(
    input.requiredSats,
    'Cash-out required sats'
  );

  const platformFeeSats = requirePositiveSafeInteger(
    input.platformFeeSats,
    'Cash-out platform fee sats'
  );

  const recoveryFeeSats = requirePositiveSafeInteger(
    input.recoveryFeeSats,
    'Cash-out recovery miner fee'
  );

  const inputSet = normalizeInputSet(input.inputSet);

  const treasuryDestination = normalizeDestination(
    input.treasuryDestination,
    'Treasury recovery destination'
  );

  const platformDestination = normalizeDestination(
    input.platformDestination,
    'Platform recovery destination'
  );

  if (
    treasuryDestination.publicKeyHashHex ===
    platformDestination.publicKeyHashHex
  ) {
    throw new Error(
      'Treasury and platform recovery destinations must be different.'
    );
  }

  const economics = calculateCashOutSettlementRecoveryEconomics({
    cashOutId,

    requiredSats,

    recoveryInputSats: inputSet.totalInputSats,

    platformFeeSats,

    recoveryFeeSats,
  });

  /**
   * Full recovery economics must reconcile exactly.
   */
  if (
    economics.treasuryOutputSats +
      economics.platformFeeSats +
      economics.recoveryFeeSats !==
    economics.recoveryInputSats
  ) {
    throw new Error('Recovery plan economics do not reconcile exactly.');
  }

  return {
    version: 'cash_out_recovery_plan_v1',

    cashOutId,

    contractAddress: inputSet.contractAddress,

    inputSetId: inputSet.inputSetId,

    inputCount: inputSet.inputCount,

    inputs: inputSet.inputs,

    recoveryInputSats: economics.recoveryInputSats,

    requiredSats: economics.requiredSats,

    platformFeeSats: economics.platformFeeSats,

    recoveryFeeSats: economics.recoveryFeeSats,

    treasuryOutputSats: economics.treasuryOutputSats,

    platformOutputSats: economics.platformFeeSats,

    paymentVarianceSats: economics.paymentVarianceSats,

    variance: economics.variance,

    merchantShortfallSats: economics.merchantShortfallSats,

    customerSurplusSats: economics.customerSurplusSats,

    treasuryDestination,

    platformDestination,

    outputCount: 2,
  };
}
