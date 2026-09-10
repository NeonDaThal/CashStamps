import type {
  CashOutContractPaymentClassification,
  CashOutContractPaymentInspection,
  CashOutContractUtxo,
} from 'src/types/cash-out-contract-payment';

const TXID_PATTERN = /^[0-9a-f]{64}$/;

function requireContractAddress(address: string): string {
  const normalized = address.trim();

  if (!normalized) {
    throw new Error(
      'Cash-out contract address is required for payment classification.'
    );
  }

  if (!normalized.toLowerCase().startsWith('bitcoincash:')) {
    throw new Error(
      'Cash-out contract payment classification requires a full mainnet CashAddr.'
    );
  }

  return normalized.toLowerCase();
}

function requireRequiredSats(requiredSats: number): number {
  if (!Number.isSafeInteger(requiredSats) || requiredSats <= 0) {
    throw new Error(
      'Cash-out contract required payment must be a positive safe integer number of satoshis.'
    );
  }

  return requiredSats;
}

function normalizeUtxo(utxo: CashOutContractUtxo): CashOutContractUtxo {
  const txid = utxo.txid.trim().toLowerCase();

  if (!TXID_PATTERN.test(txid)) {
    throw new Error(
      'Cash-out contract UTXO transaction ID must be exactly 32 bytes encoded as hexadecimal.'
    );
  }

  if (!Number.isSafeInteger(utxo.vout) || utxo.vout < 0) {
    throw new Error(
      'Cash-out contract UTXO output index must be a non-negative safe integer.'
    );
  }

  if (!Number.isSafeInteger(utxo.satoshis) || utxo.satoshis <= 0) {
    throw new Error(
      'Cash-out contract UTXO value must be a positive safe integer number of satoshis.'
    );
  }

  if (
    utxo.height !== undefined &&
    (!Number.isSafeInteger(utxo.height) || utxo.height < 0)
  ) {
    throw new Error(
      'Cash-out contract UTXO height must be a non-negative safe integer when present.'
    );
  }

  return {
    txid,

    vout: utxo.vout,

    satoshis: utxo.satoshis,

    ...(utxo.height !== undefined
      ? {
          height: utxo.height,
        }
      : {}),
  };
}

function compareUtxos(
  left: CashOutContractUtxo,
  right: CashOutContractUtxo
): number {
  const txidComparison = left.txid.localeCompare(right.txid);

  if (txidComparison !== 0) {
    return txidComparison;
  }

  return left.vout - right.vout;
}

function classifyWithoutExactUtxo(input: {
  totalUtxos: number;

  underpaymentCount: number;

  overpaymentCount: number;
}): CashOutContractPaymentClassification {
  if (input.totalUtxos === 0) {
    return 'no_utxos';
  }

  if (input.underpaymentCount === 1 && input.overpaymentCount === 0) {
    return 'underpayment';
  }

  if (input.underpaymentCount === 0 && input.overpaymentCount === 1) {
    return 'overpayment';
  }

  /**
   * Multiple individually insufficient outputs are not added together.
   *
   * Even if their combined value happens to equal or exceed requiredSats,
   * normal settlement requires one exact UTXO.
   */
  if (input.underpaymentCount > 1 && input.overpaymentCount === 0) {
    return 'fragmented_underpayment';
  }

  /**
   * Covers combinations such as:
   *
   * - underpayment + overpayment;
   * - multiple overpayments;
   * - several different unexpected non-exact payments.
   */
  return 'multiple_non_exact';
}

export interface ClassifyCashOutContractPaymentInput {
  contractAddress: string;

  requiredSats: number;

  utxos: CashOutContractUtxo[];
}

/**
 * Classify the exact current UTXO set for one unique Cash-out contract.
 *
 * Core rule:
 *
 * normal settlement may select only one individual UTXO whose value exactly
 * equals requiredSats.
 *
 * Partial payments are never summed.
 */
export function classifyCashOutContractPayment(
  input: ClassifyCashOutContractPaymentInput
): CashOutContractPaymentInspection {
  const contractAddress = requireContractAddress(input.contractAddress);

  const requiredSats = requireRequiredSats(input.requiredSats);

  if (!Array.isArray(input.utxos)) {
    throw new Error(
      'Cash-out contract payment classification requires a UTXO array.'
    );
  }

  const utxos = input.utxos.map(normalizeUtxo).sort(compareUtxos);

  /**
   * Electrum should never return the same outpoint twice.
   *
   * If it does, fail closed rather than allowing duplicate response data to
   * alter payment classification.
   */
  const seenOutpoints = new Set<string>();

  for (const utxo of utxos) {
    const outpoint = `${utxo.txid}:${utxo.vout}`;

    if (seenOutpoints.has(outpoint)) {
      throw new Error(
        `Duplicate Cash-out contract UTXO outpoint returned: ${outpoint}.`
      );
    }

    seenOutpoints.add(outpoint);
  }

  const exactUtxos = utxos.filter((utxo) => utxo.satoshis === requiredSats);

  const underpaymentUtxos = utxos.filter(
    (utxo) => utxo.satoshis < requiredSats
  );

  const overpaymentUtxos = utxos.filter((utxo) => utxo.satoshis > requiredSats);

  let classification: CashOutContractPaymentClassification;

  let normalSettlementCandidate: CashOutContractUtxo | undefined;

  if (exactUtxos.length > 1) {
    /**
     * More than one exact customer-sized payment is an explicit exceptional
     * reconciliation case.
     *
     * Never choose one automatically.
     */
    classification = 'multiple_exact';
  } else if (exactUtxos.length === 1) {
    if (overpaymentUtxos.length > 0) {
      /**
       * One exact payment plus a second economically significant overpayment
       * is ambiguous enough to require exceptional handling.
       */
      classification = 'exact_with_overpayment';
    } else {
      /**
       * Smaller unrelated/nuisance/partial outputs do not poison the one exact
       * UTXO.
       *
       * They remain visible in underpaymentUtxos for later recovery handling.
       */
      classification = 'exact';

      normalSettlementCandidate = exactUtxos[0];
    }
  } else {
    classification = classifyWithoutExactUtxo({
      totalUtxos: utxos.length,

      underpaymentCount: underpaymentUtxos.length,

      overpaymentCount: overpaymentUtxos.length,
    });
  }

  return {
    version: 'cash_out_contract_payment_inspection_v1',

    contractAddress,

    requiredSats,

    classification,

    utxos,

    exactUtxos,

    underpaymentUtxos,

    overpaymentUtxos,

    ...(normalSettlementCandidate
      ? {
          normalSettlementCandidate,
        }
      : {}),
  };
}
