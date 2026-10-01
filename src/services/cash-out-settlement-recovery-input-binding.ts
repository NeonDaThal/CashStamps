import type {
  CashOutSettlementRecoveryInput,
  CashOutSettlementRecoveryInputSet,
} from './cash-out-settlement-recovery-inputs';

export type CashOutSettlementRecoveryInputBindingVersion =
  'cash_out_recovery_input_binding_v1';

export type CashOutSettlementRecoveryNetworkState = 'mempool' | 'confirmed';

export interface CashOutSettlementRecoveryObservedUtxo {
  txid: string;

  vout: number;

  satoshis: number;

  /**
   * Electrum listunspent height:
   *
   * 0  = mempool
   * >0 = confirmed
   */
  height: number;

  /**
   * Must be derived from an include_tokens listunspent response.
   *
   * Selected Recovery v1 inputs must be ordinary BCH-only UTXOs.
   */
  tokenDataPresent: boolean;
}

export interface CashOutSettlementRecoveryNetworkEvidence {
  source: 'electrum_listunspent';

  /**
   * False means a trustworthy listunspent snapshot was not obtained.
   *
   * Recovery input binding must fail closed in that case.
   */
  available: boolean;

  /**
   * The exact Cash-out contract address that was queried.
   */
  contractAddress: string;

  /**
   * Complete UTXOs returned by that network query.
   *
   * The selected recovery inputs must each appear exactly once here.
   * Extra unselected UTXOs are allowed.
   */
  utxos: CashOutSettlementRecoveryObservedUtxo[];
}

export interface CashOutSettlementRecoveryBoundInput
  extends CashOutSettlementRecoveryInput {
  height: number;

  networkState: CashOutSettlementRecoveryNetworkState;
}

export interface CashOutSettlementRecoveryInputBinding {
  version: CashOutSettlementRecoveryInputBindingVersion;

  cashOutId: string;

  contractAddress: string;

  evidenceSource: 'electrum_listunspent';

  inputSetId: string;

  inputCount: 1 | 2 | 3;

  totalInputSats: number;

  inputs: CashOutSettlementRecoveryBoundInput[];
}

export interface BindCashOutSettlementRecoveryInputSetInput {
  cashOutId: string;

  expectedContractAddress: string;

  inputSet: CashOutSettlementRecoveryInputSet;

  networkEvidence: CashOutSettlementRecoveryNetworkEvidence;
}

const TXID_PATTERN = /^[0-9a-f]{64}$/;

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

function normalizeContractAddress(value: string, fieldName: string): string {
  return requireNonEmptyString(value, fieldName).toLowerCase();
}

function normalizeTxid(value: string, fieldName: string): string {
  const normalized = requireNonEmptyString(value, fieldName).toLowerCase();

  if (!TXID_PATTERN.test(normalized)) {
    throw new Error(
      `${fieldName} must be a 32-byte hexadecimal transaction ID.`
    );
  }

  return normalized;
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

function requirePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer.`);
  }

  return value;
}

function buildOutpointId(txid: string, vout: number): string {
  return `${txid}:${vout}`;
}

/**
 * D6D.1 — exceptional recovery input/network binding.
 *
 * This function does not:
 *
 * - query Electrum;
 * - choose recovery inputs;
 * - assess D6A recovery eligibility;
 * - calculate recovery economics;
 * - sign a transaction;
 * - persist state;
 * - broadcast.
 *
 * D6A answers:
 *
 *   "Is exceptional recovery allowed?"
 *
 * D6C answers:
 *
 *   "Which canonical 1–3 inputs are selected and what is the deterministic
 *    recovery plan?"
 *
 * D6D answers:
 *
 *   "Are those exact selected inputs presently proven as unspent BCH-only
 *    outputs at the expected Cash-out contract?"
 */
export function bindCashOutSettlementRecoveryInputSetToNetworkEvidence(
  input: BindCashOutSettlementRecoveryInputSetInput
): CashOutSettlementRecoveryInputBinding {
  const cashOutId = requireNonEmptyString(input.cashOutId, 'Cash-out ID');

  const expectedContractAddress = normalizeContractAddress(
    input.expectedContractAddress,
    'Expected recovery contract address'
  );

  const inputSetContractAddress = normalizeContractAddress(
    input.inputSet.contractAddress,
    'Recovery input-set contract address'
  );

  if (inputSetContractAddress !== expectedContractAddress) {
    throw new Error(
      'Recovery input set does not belong to the expected Cash-out contract.'
    );
  }

  if (input.networkEvidence.source !== 'electrum_listunspent') {
    throw new Error(
      'Recovery input binding requires Electrum listunspent evidence.'
    );
  }

  if (input.networkEvidence.available !== true) {
    throw new Error('Recovery input network evidence is unavailable.');
  }

  const observedContractAddress = normalizeContractAddress(
    input.networkEvidence.contractAddress,
    'Observed recovery contract address'
  );

  if (observedContractAddress !== expectedContractAddress) {
    throw new Error(
      'Network evidence was obtained for a different Cash-out contract.'
    );
  }

  if (!Array.isArray(input.networkEvidence.utxos)) {
    throw new Error(
      'Recovery input network evidence must contain a UTXO list.'
    );
  }

  const observedByOutpoint = new Map<
    string,
    CashOutSettlementRecoveryObservedUtxo
  >();

  for (let index = 0; index < input.networkEvidence.utxos.length; index += 1) {
    const observed = input.networkEvidence.utxos[index];

    if (!observed) {
      throw new Error(`Observed recovery UTXO ${index} is missing.`);
    }

    const txid = normalizeTxid(
      observed.txid,
      `Observed recovery UTXO ${index} txid`
    );

    const vout = requireNonNegativeSafeInteger(
      observed.vout,
      `Observed recovery UTXO ${index} output index`
    );

    requirePositiveSafeInteger(
      observed.satoshis,
      `Observed recovery UTXO ${index} value`
    );

    requireNonNegativeSafeInteger(
      observed.height,
      `Observed recovery UTXO ${index} height`
    );

    if (typeof observed.tokenDataPresent !== 'boolean') {
      throw new Error(
        `Observed recovery UTXO ${index} token state is not known.`
      );
    }

    const outpointId = buildOutpointId(txid, vout);

    if (observedByOutpoint.has(outpointId)) {
      throw new Error(`Duplicate observed recovery outpoint: ${outpointId}.`);
    }

    observedByOutpoint.set(outpointId, {
      ...observed,
      txid,
      vout,
    });
  }

  const boundInputs: CashOutSettlementRecoveryBoundInput[] = [];

  let totalInputSats = 0;

  for (let index = 0; index < input.inputSet.inputs.length; index += 1) {
    const selected = input.inputSet.inputs[index];

    if (!selected) {
      throw new Error(`Selected recovery input ${index} is missing.`);
    }

    const selectedTxid = normalizeTxid(
      selected.txid,
      `Selected recovery input ${index} txid`
    );

    const selectedVout = requireNonNegativeSafeInteger(
      selected.vout,
      `Selected recovery input ${index} output index`
    );

    const selectedSatoshis = requirePositiveSafeInteger(
      selected.satoshis,
      `Selected recovery input ${index} value`
    );

    const selectedContractAddress = normalizeContractAddress(
      selected.contractAddress,
      `Selected recovery input ${index} contract address`
    );

    if (selectedContractAddress !== expectedContractAddress) {
      throw new Error(
        `Selected recovery input ${index} belongs to a different contract.`
      );
    }

    const outpointId = buildOutpointId(selectedTxid, selectedVout);

    const observed = observedByOutpoint.get(outpointId);

    if (!observed) {
      throw new Error(
        `Selected recovery input is not currently proven unspent by network evidence: ${outpointId}.`
      );
    }

    if (observed.satoshis !== selectedSatoshis) {
      throw new Error(
        `Selected recovery input value does not match network evidence: ${outpointId}.`
      );
    }

    if (observed.tokenDataPresent) {
      throw new Error(
        `Selected recovery input contains CashToken data: ${outpointId}.`
      );
    }

    totalInputSats += selectedSatoshis;

    if (!Number.isSafeInteger(totalInputSats)) {
      throw new Error('Bound recovery input value exceeds safe integer range.');
    }

    boundInputs.push({
      outpoint: outpointId,

      txid: selectedTxid,

      vout: selectedVout,

      satoshis: selectedSatoshis,

      contractAddress: expectedContractAddress,

      height: observed.height,

      networkState: observed.height === 0 ? 'mempool' : 'confirmed',
    });
  }

  if (boundInputs.length !== input.inputSet.inputCount) {
    throw new Error(
      'Bound recovery input count does not match the canonical input set.'
    );
  }

  if (totalInputSats !== input.inputSet.totalInputSats) {
    throw new Error(
      'Bound recovery input total does not match the canonical input set.'
    );
  }

  return {
    version: 'cash_out_recovery_input_binding_v1',

    cashOutId,

    contractAddress: expectedContractAddress,

    evidenceSource: 'electrum_listunspent',

    inputSetId: input.inputSet.inputSetId,

    inputCount: input.inputSet.inputCount,

    totalInputSats,

    inputs: boundInputs,
  };
}
