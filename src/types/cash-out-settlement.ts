export type CashOutSettlementPlanVersion = 'cash_out_settlement_v1';

/**
 * A P2PKH destination that has already been decoded and validated by the
 * runtime address layer.
 *
 * D1C.1 deliberately does not perform BCH address decoding itself.
 */
export interface CashOutSettlementP2pkhDestination {
  address: string;

  /**
   * Exact lowercase 20-byte HASH160 encoded as 40 hexadecimal characters.
   */
  publicKeyHashHex: string;
}

/**
 * Constructor values required by CashOutSettlement.cash.
 *
 * These remain JSON-safe numbers/strings at the planning boundary.
 * The CashScript runtime adapter converts satoshi integers to bigint.
 */
export interface CashOutSettlementConstructorPlan {
  treasuryPublicKeyHashHex: string;

  platformPublicKeyHashHex: string;

  paymentSats: number;

  platformFeeSats: number;

  settlementFeeSats: number;
}

/**
 * Deterministic production-shaped plan for one normal Cash-out settlement.
 *
 * This is NOT yet:
 *
 * - a contract instance;
 * - a payment address;
 * - a persisted settlement intent;
 * - a signed/raw transaction;
 * - or a broadcast operation.
 *
 * Those boundaries are added separately in later D steps.
 */
export interface CashOutSettlementPlan {
  version: CashOutSettlementPlanVersion;

  cashOutId: string;

  cashOutSerial: string;

  fiatCurrency: string;

  quoteLockedAt: string;

  quoteExpiresAt: string;

  /**
   * Frozen customer payment.
   */
  paymentSats: number;

  /**
   * BCH value corresponding to the physical cash payout before service fee.
   */
  marketBchSats: number;

  /**
   * Exact BCH service-fee portion already contained inside paymentSats.
   */
  serviceFeeSats: number;

  merchantFeeSats: number;

  platformFeeSats: number;

  /**
   * Exact normal-settlement miner fee.
   *
   * The production CashScript contract planner calculates this from the real
   * instantiated contract using the fixed-point fee loop proved in D1B.
   */
  settlementFeeSats: number;

  /**
   * Exact normal settlement outputs.
   */
  treasuryOutputSats: number;

  platformOutputSats: number;

  /**
   * Original stored fiat accounting snapshot.
   */
  totalServiceFeeMinor: number;

  merchantFeeMinor: number;

  platformFeeMinor: number;

  treasuryDestination: CashOutSettlementP2pkhDestination;

  platformDestination: CashOutSettlementP2pkhDestination;

  constructor: CashOutSettlementConstructorPlan;
}

export interface BuildCashOutSettlementPlanInput {
  cashOutId: string;

  cashOutSerial: string;

  fiatCurrency: string;

  status: string;

  quoteLockedAt?: string;

  quoteExpiresAt?: string;

  customerCashPaidOutMinor: number;

  customerSendsFiatEquivalentMinor: number;

  marketBchSats: number;

  bchRequiredSats: number;

  feeModel: 'cash_out_v1' | 'legacy';

  settlementMode: 'accounting_only' | 'unknown';

  totalServiceFeeBasisPoints: number;

  platformFeeBasisPoints: number;

  merchantFeeBasisPoints?: number;

  totalServiceFeeMinor: number;

  merchantFeeMinor: number | null;

  platformFeeMinor: number | null;

  feeSplitKnown: boolean;

  treasuryDestination: CashOutSettlementP2pkhDestination;

  platformDestination: CashOutSettlementP2pkhDestination;

  settlementFeeSats: number;
}

export type CashOutSettlementContractPlanVersion =
  'cash_out_settlement_contract_v1';

export type CashOutSettlementContractType = 'p2sh32';

/**
 * Full constructor snapshot for one instantiated normal Cash-out settlement
 * contract.
 *
 * cashOutCommitmentHex is the unique 32-byte value bound into the contract.
 *
 * The other fields come from the already-proven pure settlement economics
 * plan.
 */
export interface CashOutSettlementContractConstructorPlan
  extends CashOutSettlementConstructorPlan {
  /**
   * Exact lowercase 32-byte commitment encoded as 64 hexadecimal characters.
   */
  cashOutCommitmentHex: string;
}

export interface CashOutSettlementFeePlanningIteration {
  iteration: number;

  proposedSettlementFeeSats: number;

  transactionSizeBytes: number;

  requiredSettlementFeeSats: number;
}

/**
 * Deterministic identity and economics for one real CashScript normal
 * settlement contract.
 *
 * This is still planning only.
 *
 * It contains:
 *
 * - no customer payment UTXO;
 * - no persisted settlement transaction;
 * - no real raw settlement transaction;
 * - no broadcast state;
 * - no store mutation.
 *
 * Those boundaries belong to later D phases.
 */
export interface CashOutSettlementContractPlan {
  version: CashOutSettlementContractPlanVersion;

  settlementPlan: CashOutSettlementPlan;

  cashOutCommitmentHex: string;

  constructor: CashOutSettlementContractConstructorPlan;

  contractType: CashOutSettlementContractType;

  /**
   * Mainnet CashAddr for the instantiated P2SH32 CashScript contract.
   */
  contractAddress: string;

  /**
   * Exact locking bytecode identity for the contract address.
   */
  contractLockingBytecodeHex: string;

  /**
   * Exact instantiated redeem bytecode including constructor arguments.
   */
  contractBytecodeHex: string;

  contractBytecodeSize: number;

  contractOpcodeCount: number;

  settlementTransactionSizeBytes: number;

  settlementFeeRateSatsPerByte: number;

  feePlanningIterations: CashOutSettlementFeePlanningIteration[];
}
