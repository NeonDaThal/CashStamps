import {
  inspectCashOutContractPaymentOnce,
  inspectCashOutContractPaymentUsingElectrum,
  type CashOutContractPaymentNetworkInspection,
} from 'src/services/cash-out-contract-utxo-inspector';

import type { ElectrumService } from 'src/services/electrum';

import type {
  CashOutContractPaymentInspection,
  CashOutNormalSettlementCandidate,
  CashOutSettlementPaymentInspection,
} from 'src/types/cash-out-contract-payment';

import type { CashOutSettlementContractPlan } from 'src/types/cash-out-settlement';

const COMMITMENT_HEX_PATTERN = /^[0-9a-f]{64}$/;

function requireNonEmptyString(value: string, fieldName: string): string {
  const normalized = value.trim();

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

/**
 * Revalidate the D1 plan at the D2 boundary.
 *
 * D1 normally produces this object in-memory, but later phases may restore
 * persisted data after an app restart. D2 therefore fails closed if the plan
 * is internally inconsistent rather than trusting TypeScript types alone.
 */
function validateSettlementContractPlan(
  contractPlan: CashOutSettlementContractPlan
): {
  cashOutId: string;

  cashOutSerial: string;

  cashOutCommitmentHex: string;

  contractAddress: string;

  requiredSats: number;
} {
  if (contractPlan.version !== 'cash_out_settlement_contract_v1') {
    throw new Error(
      'Cash-out payment inspection requires a Cash-out settlement contract v1 plan.'
    );
  }

  if (contractPlan.settlementPlan.version !== 'cash_out_settlement_v1') {
    throw new Error(
      'Cash-out payment inspection requires a Cash-out settlement v1 economics plan.'
    );
  }

  if (contractPlan.contractType !== 'p2sh32') {
    throw new Error(
      'Cash-out payment inspection requires the frozen P2SH32 settlement contract.'
    );
  }

  const cashOutId = requireNonEmptyString(
    contractPlan.settlementPlan.cashOutId,
    'Cash-out ID'
  );

  const cashOutSerial = requireNonEmptyString(
    contractPlan.settlementPlan.cashOutSerial,
    'Cash-out serial'
  );

  const cashOutCommitmentHex = contractPlan.cashOutCommitmentHex
    .trim()
    .toLowerCase();

  if (!COMMITMENT_HEX_PATTERN.test(cashOutCommitmentHex)) {
    throw new Error(
      'Cash-out settlement commitment must be exactly 32 bytes encoded as hexadecimal.'
    );
  }

  if (cashOutCommitmentHex === '0'.repeat(64)) {
    throw new Error('Cash-out settlement commitment must not be zero.');
  }

  if (
    contractPlan.constructor.cashOutCommitmentHex.toLowerCase() !==
    cashOutCommitmentHex
  ) {
    throw new Error(
      'Cash-out settlement contract commitment does not match its constructor snapshot.'
    );
  }

  const contractAddress = requireNonEmptyString(
    contractPlan.contractAddress,
    'Cash-out settlement contract address'
  ).toLowerCase();

  if (!contractAddress.startsWith('bitcoincash:')) {
    throw new Error(
      'Cash-out payment inspection requires a full Bitcoin Cash mainnet contract address.'
    );
  }

  const requiredSats = requirePositiveSafeInteger(
    contractPlan.settlementPlan.paymentSats,
    'Cash-out contract payment'
  );

  if (contractPlan.constructor.paymentSats !== requiredSats) {
    throw new Error(
      'Cash-out settlement payment amount does not match its constructor snapshot.'
    );
  }

  if (
    contractPlan.settlementPlan.treasuryOutputSats +
      contractPlan.settlementPlan.platformOutputSats +
      contractPlan.settlementPlan.settlementFeeSats !==
    requiredSats
  ) {
    throw new Error(
      'Cash-out settlement plan economics do not reconcile at the payment-inspection boundary.'
    );
  }

  return {
    cashOutId,

    cashOutSerial,

    cashOutCommitmentHex,

    contractAddress,

    requiredSats,
  };
}

function assertInspectionMatchesContractPlan(
  payment: CashOutContractPaymentInspection,
  expected: {
    contractAddress: string;

    requiredSats: number;
  }
): void {
  if (
    payment.contractAddress.toLowerCase() !==
    expected.contractAddress.toLowerCase()
  ) {
    throw new Error(
      'Observed Cash-out payment belongs to a different settlement contract address.'
    );
  }

  if (payment.requiredSats !== expected.requiredSats) {
    throw new Error(
      'Observed Cash-out payment amount does not match the frozen settlement contract.'
    );
  }

  if (payment.classification === 'exact') {
    if (!payment.normalSettlementCandidate) {
      throw new Error(
        'Exact Cash-out payment classification is missing its settlement candidate.'
      );
    }

    if (payment.normalSettlementCandidate.satoshis !== expected.requiredSats) {
      throw new Error(
        'Exact Cash-out settlement candidate does not match the required payment.'
      );
    }

    return;
  }

  if (payment.normalSettlementCandidate) {
    throw new Error(
      'Exceptional Cash-out payment classification must not expose a normal settlement candidate.'
    );
  }
}

function buildBoundCandidate(input: {
  cashOutId: string;

  cashOutSerial: string;

  cashOutCommitmentHex: string;

  contractAddress: string;

  requiredSats: number;

  payment: CashOutContractPaymentInspection;
}): CashOutNormalSettlementCandidate | undefined {
  const candidate = input.payment.normalSettlementCandidate;

  if (!candidate) {
    return undefined;
  }

  return {
    cashOutId: input.cashOutId,

    cashOutSerial: input.cashOutSerial,

    cashOutCommitmentHex: input.cashOutCommitmentHex,

    contractAddress: input.contractAddress,

    paymentSats: input.requiredSats,

    txid: candidate.txid,

    vout: candidate.vout,

    satoshis: candidate.satoshis,

    ...(candidate.height !== undefined
      ? {
          height: candidate.height,
        }
      : {}),
  };
}

/**
 * Pure binding boundary between:
 *
 * D1 deterministic contract planning
 *
 * and
 *
 * D2 observed contract UTXOs.
 *
 * Exported so this safety boundary can be tested without a live Electrum
 * connection.
 */
export function bindCashOutSettlementPaymentInspection(
  contractPlan: CashOutSettlementContractPlan,
  networkInspection: CashOutContractPaymentNetworkInspection
): CashOutSettlementPaymentInspection {
  const expected = validateSettlementContractPlan(contractPlan);

  assertInspectionMatchesContractPlan(networkInspection.payment, expected);

  const normalSettlementCandidate = buildBoundCandidate({
    ...expected,

    payment: networkInspection.payment,
  });

  return {
    version: 'cash_out_settlement_payment_inspection_v1',

    cashOutId: expected.cashOutId,

    cashOutSerial: expected.cashOutSerial,

    cashOutCommitmentHex: expected.cashOutCommitmentHex,

    contractAddress: expected.contractAddress,

    requiredSats: expected.requiredSats,

    observedAt: networkInspection.observedAt,

    ...(networkInspection.connectedServer
      ? {
          connectedServer: networkInspection.connectedServer,
        }
      : {}),

    payment: networkInspection.payment,

    ...(normalSettlementCandidate
      ? {
          normalSettlementCandidate,
        }
      : {}),
  };
}

/**
 * Inspect a D1 contract using an existing Electrum connection.
 *
 * Later watcher/reconciliation code can therefore reuse one socket.
 */
export async function inspectCashOutSettlementPaymentUsingElectrum(
  electrum: ElectrumService,
  contractPlan: CashOutSettlementContractPlan
): Promise<CashOutSettlementPaymentInspection> {
  const expected = validateSettlementContractPlan(contractPlan);

  const networkInspection = await inspectCashOutContractPaymentUsingElectrum(
    electrum,
    {
      contractAddress: expected.contractAddress,

      requiredSats: expected.requiredSats,
    }
  );

  return bindCashOutSettlementPaymentInspection(
    contractPlan,
    networkInspection
  );
}

/**
 * Perform one complete read-only D2 inspection.
 *
 * The contract address and payment amount are derived exclusively from the
 * deterministic D1 contract plan.
 *
 * No store mutation.
 * No settlement transaction.
 * No broadcast.
 */
export async function inspectCashOutSettlementPaymentOnce(
  contractPlan: CashOutSettlementContractPlan
): Promise<CashOutSettlementPaymentInspection> {
  const expected = validateSettlementContractPlan(contractPlan);

  const networkInspection = await inspectCashOutContractPaymentOnce({
    contractAddress: expected.contractAddress,

    requiredSats: expected.requiredSats,
  });

  return bindCashOutSettlementPaymentInspection(
    contractPlan,
    networkInspection
  );
}
