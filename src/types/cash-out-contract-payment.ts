export type CashOutContractPaymentClassification =
  | 'no_utxos'
  | 'exact'
  | 'underpayment'
  | 'overpayment'
  | 'fragmented_underpayment'
  | 'multiple_non_exact'
  | 'multiple_exact'
  | 'exact_with_overpayment';

export interface CashOutContractUtxo {
  /**
   * Canonical lowercase transaction ID.
   */
  txid: string;

  /**
   * Exact transaction output index.
   */
  vout: number;

  /**
   * BCH value of this one UTXO.
   */
  satoshis: number;

  /**
   * Electrum height when known.
   *
   * 0 means mempool/unconfirmed.
   * A positive value means confirmed.
   *
   * D2 classification deliberately does not use confirmation state to decide
   * whether an amount is exact.
   */
  height?: number;
}

export type CashOutContractPaymentInspectionVersion =
  'cash_out_contract_payment_inspection_v1';

/**
 * Pure classification result for the current UTXO set belonging to one unique
 * Cash-out contract address.
 *
 * This is NOT yet:
 *
 * - authorization to hand physical cash to the customer;
 * - a persisted settlement intent;
 * - a settlement transaction;
 * - or network/broadcast evidence.
 */
export interface CashOutContractPaymentInspection {
  version: CashOutContractPaymentInspectionVersion;

  contractAddress: string;

  requiredSats: number;

  classification: CashOutContractPaymentClassification;

  /**
   * Canonically sorted snapshot of every observed contract UTXO.
   */
  utxos: CashOutContractUtxo[];

  exactUtxos: CashOutContractUtxo[];

  underpaymentUtxos: CashOutContractUtxo[];

  overpaymentUtxos: CashOutContractUtxo[];

  /**
   * Present only when exactly one unambiguous normal settlement UTXO exists.
   *
   * Later D3 work may bind this exact txid:vout.
   *
   * Its presence still does NOT by itself mean the merchant is safe to hand
   * over cash.
   */
  normalSettlementCandidate?: CashOutContractUtxo;
}

export type CashOutSettlementPaymentInspectionVersion =
  'cash_out_settlement_payment_inspection_v1';

/**
 * One exact contract UTXO bound to the Cash-out/contract identity that produced
 * it.
 *
 * This is still only a candidate for later D3 settlement planning.
 *
 * Its existence does NOT yet authorize the merchant to hand over cash.
 */
export interface CashOutNormalSettlementCandidate {
  cashOutId: string;

  cashOutSerial: string;

  cashOutCommitmentHex: string;

  contractAddress: string;

  paymentSats: number;

  txid: string;

  vout: number;

  satoshis: number;

  height?: number;
}

/**
 * Contract-bound result of one D2 payment inspection.
 *
 * This ties the observed UTXO set to the exact deterministic D1 contract plan
 * rather than allowing contract address and required payment amount to be
 * supplied independently.
 */
export interface CashOutSettlementPaymentInspection {
  version: CashOutSettlementPaymentInspectionVersion;

  cashOutId: string;

  cashOutSerial: string;

  cashOutCommitmentHex: string;

  contractAddress: string;

  requiredSats: number;

  observedAt: string;

  connectedServer?: string;

  payment: CashOutContractPaymentInspection;

  /**
   * Present only when the classifier found one unambiguous exact UTXO.
   *
   * D3 may later bind this exact txid:vout into the deterministic settlement
   * transaction.
   */
  normalSettlementCandidate?: CashOutNormalSettlementCandidate;
}
