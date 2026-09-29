/**
 * D6C.2 — Cash-out exceptional recovery input-set planning.
 *
 * Purpose:
 *
 * Convert one to three already-selected exceptional Cash-out contract UTXOs
 * into one deterministic recovery input set.
 *
 * This module is deliberately:
 *
 * - pure;
 * - network-free;
 * - signing-free;
 * - broadcast-free;
 * - storage-free.
 *
 * D6D will later prove that observed network UTXOs are genuinely eligible for
 * inclusion before they reach this boundary.
 */

export const CASH_OUT_RECOVERY_MIN_INPUTS = 1;
export const CASH_OUT_RECOVERY_MAX_INPUTS = 3;

export interface CashOutSettlementRecoveryInputCandidate {
  txid: string;
  vout: number;
  satoshis: number;

  /**
   * Every Recovery v1 input must belong to the exact same instantiated
   * CashOutSettlement contract.
   */
  contractAddress: string;
}

export interface CashOutSettlementRecoveryInput {
  txid: string;
  vout: number;
  satoshis: number;
  contractAddress: string;

  /**
   * Canonical durable identifier for the exact source output.
   */
  outpoint: string;
}

export interface CashOutSettlementRecoveryInputSet {
  /**
   * Recovery v1 deliberately supports only 1–3 contract inputs.
   */
  inputCount: 1 | 2 | 3;

  /**
   * Exact instantiated Cash-out contract shared by every selected input.
   */
  contractAddress: string;

  /**
   * Canonically ordered exact source outputs.
   */
  inputs: CashOutSettlementRecoveryInput[];

  /**
   * Sum of all selected exceptional customer-payment UTXOs.
   */
  totalInputSats: number;

  /**
   * Stable identity derived only from the canonical source outpoints.
   *
   * This is not a blockchain txid. It is an application-level input-set
   * identity used to prove that the same exact UTXO set was selected.
   */
  inputSetId: string;
}

function requireTxid(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Recovery input txid must be a string.');
  }

  const normalized = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error('Recovery input txid must be exactly 32 bytes of hex.');
  }

  return normalized;
}

function requireVout(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      'Recovery input output index must be a non-negative safe integer.'
    );
  }

  return value;
}

function requirePositiveSats(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(
      'Recovery input value must be a positive safe integer number of satoshis.'
    );
  }

  return value;
}

function requireContractAddress(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Recovery input contract address must be a string.');
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    throw new Error('Recovery input contract address is required.');
  }

  return normalized;
}

function compareRecoveryInputs(
  a: CashOutSettlementRecoveryInput,
  b: CashOutSettlementRecoveryInput
): number {
  const txidComparison = a.txid.localeCompare(b.txid);

  if (txidComparison !== 0) {
    return txidComparison;
  }

  return a.vout - b.vout;
}

function createInputSetId(inputs: CashOutSettlementRecoveryInput[]): string {
  return inputs.map((input) => input.outpoint).join('|');
}

/**
 * Build the one deterministic Recovery v1 source-input set.
 *
 * Important:
 *
 * This does NOT decide whether recovery is allowed.
 * D6A owns recovery eligibility.
 *
 * This does NOT discover or trust Electrum UTXOs.
 * D6D will own exceptional UTXO/network binding.
 *
 * This function only freezes the exact selected inputs into canonical order.
 */
export function buildCashOutSettlementRecoveryInputSet(
  candidates: CashOutSettlementRecoveryInputCandidate[]
): CashOutSettlementRecoveryInputSet {
  if (!Array.isArray(candidates)) {
    throw new Error('Recovery input candidates must be an array.');
  }

  if (candidates.length < CASH_OUT_RECOVERY_MIN_INPUTS) {
    throw new Error('Recovery requires at least one selected contract input.');
  }

  if (candidates.length > CASH_OUT_RECOVERY_MAX_INPUTS) {
    throw new Error(
      `Recovery v1 supports at most ${CASH_OUT_RECOVERY_MAX_INPUTS} selected contract inputs.`
    );
  }

  const normalizedInputs = candidates.map(
    (candidate): CashOutSettlementRecoveryInput => {
      if (!candidate || typeof candidate !== 'object') {
        throw new Error('Recovery input candidate is malformed.');
      }

      const txid = requireTxid(candidate.txid);

      const vout = requireVout(candidate.vout);

      const satoshis = requirePositiveSats(candidate.satoshis);

      const contractAddress = requireContractAddress(candidate.contractAddress);

      return {
        txid,
        vout,
        satoshis,
        contractAddress,
        outpoint: `${txid}:${vout}`,
      };
    }
  );

  const expectedContractAddress = normalizedInputs[0].contractAddress;

  for (const input of normalizedInputs) {
    if (input.contractAddress !== expectedContractAddress) {
      throw new Error(
        'Recovery inputs must all belong to the exact same Cash-out contract.'
      );
    }
  }

  /**
   * Canonical ordering is part of transaction determinism.
   *
   * Network/API response order must never affect the recovery transaction.
   */
  const inputs = [...normalizedInputs].sort(compareRecoveryInputs);

  const seenOutpoints = new Set<string>();

  let totalInputSats = 0;

  for (const input of inputs) {
    if (seenOutpoints.has(input.outpoint)) {
      throw new Error(`Duplicate recovery outpoint: ${input.outpoint}`);
    }

    seenOutpoints.add(input.outpoint);

    totalInputSats += input.satoshis;

    if (!Number.isSafeInteger(totalInputSats)) {
      throw new Error('Recovery input total exceeds safe integer range.');
    }
  }

  const inputCount = inputs.length as 1 | 2 | 3;

  return {
    inputCount,

    contractAddress: expectedContractAddress,

    inputs,

    totalInputSats,

    inputSetId: createInputSetId(inputs),
  };
}
