import type { CashOutSettlementRecoveryAssessment } from 'src/types/cash-out-settlement';

import type { CashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';

import type {
  CashOutSettlementRecoveryInputBinding,
  CashOutSettlementRecoveryBoundInput,
} from './cash-out-settlement-recovery-input-binding';

export type CashOutSettlementRecoveryInputAuthorizationVersion =
  'cash_out_recovery_input_authorization_v1';

export interface CashOutSettlementRecoveryInputAuthorization {
  version: CashOutSettlementRecoveryInputAuthorizationVersion;

  cashOutId: string;

  contractAddress: string;

  inputSetId: string;

  inputCount: 1 | 2 | 3;

  totalInputSats: number;

  inputs: CashOutSettlementRecoveryBoundInput[];

  exceptionalCase: CashOutSettlementRecoveryAssessment['exceptionalCase'];

  eligibility: 'eligible';
}

export interface AuthorizeCashOutSettlementRecoveryInputsInput {
  cashOutId: string;

  recoveryAssessment: CashOutSettlementRecoveryAssessment;

  inputSet: CashOutSettlementRecoveryInputSet;

  binding: CashOutSettlementRecoveryInputBinding;
}

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

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * D6D.3
 *
 * Final pure authorization boundary before D6E transaction construction.
 *
 * D6A has already answered:
 *
 *   "Is exceptional recovery allowed?"
 *
 * D6D.1/D6D.2 have already answered:
 *
 *   "Are these exact selected outputs currently proven as unspent BCH-only
 *    outputs at the intended contract?"
 *
 * This function proves those two answers refer to the same Cash-out and the
 * same canonical D6C input set.
 *
 * It performs no:
 *
 * - network access;
 * - signing;
 * - transaction construction;
 * - persistence;
 * - broadcast.
 */
export function authorizeCashOutSettlementRecoveryInputs(
  input: AuthorizeCashOutSettlementRecoveryInputsInput
): CashOutSettlementRecoveryInputAuthorization {
  const cashOutId = requireNonEmptyString(input.cashOutId, 'Cash-out ID');

  if (input.recoveryAssessment.eligibility !== 'eligible') {
    throw new Error(
      'Cash-out recovery inputs cannot be authorized because exceptional recovery is not eligible.'
    );
  }

  if (input.binding.cashOutId !== cashOutId) {
    throw new Error('Recovery input binding belongs to a different Cash-out.');
  }

  if (input.binding.inputSetId !== input.inputSet.inputSetId) {
    throw new Error(
      'Recovery input binding does not match the canonical recovery input-set identity.'
    );
  }

  if (input.binding.inputCount !== input.inputSet.inputCount) {
    throw new Error(
      'Recovery input binding count does not match the canonical recovery input set.'
    );
  }

  if (input.binding.totalInputSats !== input.inputSet.totalInputSats) {
    throw new Error(
      'Recovery input binding total does not match the canonical recovery input set.'
    );
  }

  if (
    normalizeAddress(input.binding.contractAddress) !==
    normalizeAddress(input.inputSet.contractAddress)
  ) {
    throw new Error(
      'Recovery input binding contract does not match the canonical recovery input set.'
    );
  }

  if (input.binding.inputs.length !== input.inputSet.inputs.length) {
    throw new Error(
      'Recovery input binding does not contain the canonical selected input count.'
    );
  }

  for (let index = 0; index < input.inputSet.inputs.length; index += 1) {
    const selected = input.inputSet.inputs[index];

    const bound = input.binding.inputs[index];

    if (!selected || !bound) {
      throw new Error(
        `Recovery input ${index} is missing from authorization evidence.`
      );
    }

    if (bound.outpoint !== selected.outpoint) {
      throw new Error(
        `Recovery input ${index} outpoint differs from the canonical input set.`
      );
    }

    if (bound.txid !== selected.txid) {
      throw new Error(
        `Recovery input ${index} transaction ID differs from the canonical input set.`
      );
    }

    if (bound.vout !== selected.vout) {
      throw new Error(
        `Recovery input ${index} output index differs from the canonical input set.`
      );
    }

    if (bound.satoshis !== selected.satoshis) {
      throw new Error(
        `Recovery input ${index} value differs from the canonical input set.`
      );
    }

    if (
      normalizeAddress(bound.contractAddress) !==
      normalizeAddress(selected.contractAddress)
    ) {
      throw new Error(
        `Recovery input ${index} contract identity differs from the canonical input set.`
      );
    }

    if (
      bound.networkState !== 'mempool' &&
      bound.networkState !== 'confirmed'
    ) {
      throw new Error(
        `Recovery input ${index} does not have positive current network state.`
      );
    }
  }

  return {
    version: 'cash_out_recovery_input_authorization_v1',

    cashOutId,

    contractAddress: input.binding.contractAddress,

    inputSetId: input.binding.inputSetId,

    inputCount: input.binding.inputCount,

    totalInputSats: input.binding.totalInputSats,

    inputs: input.binding.inputs,

    exceptionalCase: input.recoveryAssessment.exceptionalCase,

    eligibility: 'eligible',
  };
}
