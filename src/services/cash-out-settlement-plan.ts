import {
  CASH_OUT_MERCHANT_FEE_BASIS_POINTS,
  CASH_OUT_PLATFORM_FEE_BASIS_POINTS,
  CASH_OUT_TOTAL_SERVICE_FEE_BASIS_POINTS,
} from 'src/services/cash-out-fee-config';

import { calculateCashOutSettlementServiceFeeSplit } from 'src/services/cash-out-settlement-economics';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  BuildCashOutSettlementPlanInput,
  CashOutSettlementP2pkhDestination,
  CashOutSettlementPlan,
} from 'src/types/cash-out-settlement';

import { getCashOutRecordValues } from 'src/services/cash-out-record-values';

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

function requireLockedQuoteWindow(
  quoteLockedAt: string | undefined,
  quoteExpiresAt: string | undefined
): {
  quoteLockedAt: string;
  quoteExpiresAt: string;
} {
  const normalizedLockedAt = requireNonEmptyString(
    quoteLockedAt,
    'Cash-out quote locked timestamp'
  );

  const normalizedExpiresAt = requireNonEmptyString(
    quoteExpiresAt,
    'Cash-out quote expiry timestamp'
  );

  const lockedAtMs = Date.parse(normalizedLockedAt);

  const expiresAtMs = Date.parse(normalizedExpiresAt);

  if (!Number.isFinite(lockedAtMs) || !Number.isFinite(expiresAtMs)) {
    throw new Error(
      'Cash-out settlement planning requires valid quote timestamps.'
    );
  }

  if (expiresAtMs <= lockedAtMs) {
    throw new Error(
      'Cash-out quote expiry must be later than its locked timestamp.'
    );
  }

  return {
    quoteLockedAt: normalizedLockedAt,

    quoteExpiresAt: normalizedExpiresAt,
  };
}

/**
 * Pure settlement-plan constructor.
 *
 * This function deliberately knows nothing about:
 *
 * - BCH address decoding;
 * - CashScript artifacts;
 * - Electrum;
 * - IndexedDB;
 * - transaction broadcasting.
 *
 * It converts one already-frozen Cash-out accounting snapshot plus validated
 * P2PKH destinations and an exact settlement miner fee into one deterministic
 * normal-settlement plan.
 */
export function buildCashOutSettlementPlan(
  input: BuildCashOutSettlementPlanInput
): CashOutSettlementPlan {
  const cashOutId = requireNonEmptyString(input.cashOutId, 'Cash-out ID');

  const cashOutSerial = requireNonEmptyString(
    input.cashOutSerial,
    'Cash-out serial'
  );

  const fiatCurrency = requireNonEmptyString(
    input.fiatCurrency,
    'Cash-out fiat currency'
  ).toUpperCase();

  /**
   * Production contracts must be frozen before a customer payment address/QR
   * is exposed.
   *
   * Replanning an already-awaiting/received Cash-out is not a normal issuance
   * operation.
   */
  if (input.status !== 'quote_locked') {
    throw new Error(
      'Cash-out settlement plan may only be created from a quote-locked record.'
    );
  }

  if (input.feeModel !== 'cash_out_v1') {
    throw new Error(
      'Cash-out settlement planning requires Cash-out Fee Model v1.'
    );
  }

  /**
   * During D1 the source Cash-out record still uses the pre-contract
   * accounting marker.
   *
   * Later integration will introduce an explicit contract settlement model,
   * but legacy/unknown records must never be silently upgraded here.
   */
  if (input.settlementMode !== 'accounting_only') {
    throw new Error(
      'Cash-out settlement planning requires a known Cash-out v1 accounting source record.'
    );
  }

  if (!input.feeSplitKnown) {
    throw new Error(
      'Cash-out merchant/platform fee split is not known exactly.'
    );
  }

  if (input.merchantFeeMinor === null || input.platformFeeMinor === null) {
    throw new Error('Cash-out merchant/platform fee amounts are required.');
  }

  /**
   * Fail closed if a record claims cash_out_v1 but its percentage snapshot
   * does not match the canonical v1 fee contract.
   */
  if (
    input.totalServiceFeeBasisPoints !==
      CASH_OUT_TOTAL_SERVICE_FEE_BASIS_POINTS ||
    input.platformFeeBasisPoints !== CASH_OUT_PLATFORM_FEE_BASIS_POINTS ||
    input.merchantFeeBasisPoints !== CASH_OUT_MERCHANT_FEE_BASIS_POINTS
  ) {
    throw new Error(
      'Cash-out Fee Model v1 basis-point snapshot does not match the canonical fee configuration.'
    );
  }

  const customerCashPaidOutMinor = requirePositiveSafeInteger(
    input.customerCashPaidOutMinor,
    'Cash-out cash payout'
  );

  const totalServiceFeeMinor = requirePositiveSafeInteger(
    input.totalServiceFeeMinor,
    'Cash-out total service fee'
  );

  const merchantFeeMinor = requireNonNegativeSafeInteger(
    input.merchantFeeMinor,
    'Cash-out merchant fee'
  );

  const platformFeeMinor = requireNonNegativeSafeInteger(
    input.platformFeeMinor,
    'Cash-out platform fee'
  );

  if (merchantFeeMinor + platformFeeMinor !== totalServiceFeeMinor) {
    throw new Error(
      'Cash-out merchant/platform fee amounts do not reconcile to the total service fee.'
    );
  }

  const customerSendsFiatEquivalentMinor = requirePositiveSafeInteger(
    input.customerSendsFiatEquivalentMinor,
    'Cash-out customer-send fiat equivalent'
  );

  if (
    customerCashPaidOutMinor + totalServiceFeeMinor !==
    customerSendsFiatEquivalentMinor
  ) {
    throw new Error(
      'Cash-out customer-send fiat equivalent does not reconcile to cash payout plus service fee.'
    );
  }

  const marketBchSats = requirePositiveSafeInteger(
    input.marketBchSats,
    'Cash-out market BCH sats'
  );

  const bchRequiredSats = requirePositiveSafeInteger(
    input.bchRequiredSats,
    'Cash-out required BCH sats'
  );

  const settlementFeeSats = requirePositiveSafeInteger(
    input.settlementFeeSats,
    'Cash-out settlement miner fee'
  );

  const quoteWindow = requireLockedQuoteWindow(
    input.quoteLockedAt,
    input.quoteExpiresAt
  );

  const treasuryDestination = normalizeDestination(
    input.treasuryDestination,
    'Treasury settlement destination'
  );

  const platformDestination = normalizeDestination(
    input.platformDestination,
    'Platform settlement destination'
  );

  if (
    treasuryDestination.publicKeyHashHex ===
    platformDestination.publicKeyHashHex
  ) {
    throw new Error(
      'Treasury and platform settlement destinations must be different.'
    );
  }

  const serviceFeeSplit = calculateCashOutSettlementServiceFeeSplit({
    marketBchSats,

    bchSatsRequired: bchRequiredSats,

    totalServiceFeeAmountMinor: totalServiceFeeMinor,

    platformFeeAmountMinor: platformFeeMinor,

    merchantFeeAmountMinor: merchantFeeMinor,
  });

  const treasuryOutputSats =
    bchRequiredSats - serviceFeeSplit.platformFeeSats - settlementFeeSats;

  if (!Number.isSafeInteger(treasuryOutputSats) || treasuryOutputSats <= 0) {
    throw new Error(
      'Cash-out settlement miner fee leaves no positive Treasury output.'
    );
  }

  /**
   * Equivalent expression:
   *
   * Treasury receives:
   *
   * cash-payout BCH
   * + merchant service-fee allocation
   * - settlement miner fee.
   */
  const expectedTreasuryOutputSats =
    marketBchSats + serviceFeeSplit.merchantFeeSats - settlementFeeSats;

  if (treasuryOutputSats !== expectedTreasuryOutputSats) {
    throw new Error('Cash-out settlement economics do not reconcile exactly.');
  }

  /**
   * Full transaction economics must reconcile exactly:
   *
   * Treasury output
   * + Platform output
   * + Miner fee
   * =
   * Customer contract payment.
   */
  if (
    treasuryOutputSats + serviceFeeSplit.platformFeeSats + settlementFeeSats !==
    bchRequiredSats
  ) {
    throw new Error(
      'Cash-out settlement outputs and miner fee do not reconcile to the customer payment.'
    );
  }

  return {
    version: 'cash_out_settlement_v1',

    cashOutId,

    cashOutSerial,

    fiatCurrency,

    quoteLockedAt: quoteWindow.quoteLockedAt,

    quoteExpiresAt: quoteWindow.quoteExpiresAt,

    paymentSats: bchRequiredSats,

    marketBchSats,

    serviceFeeSats: serviceFeeSplit.serviceFeeSats,

    merchantFeeSats: serviceFeeSplit.merchantFeeSats,

    platformFeeSats: serviceFeeSplit.platformFeeSats,

    settlementFeeSats,

    treasuryOutputSats,

    platformOutputSats: serviceFeeSplit.platformFeeSats,

    totalServiceFeeMinor,

    merchantFeeMinor,

    platformFeeMinor,

    treasuryDestination,

    platformDestination,

    constructor: {
      treasuryPublicKeyHashHex: treasuryDestination.publicKeyHashHex,

      platformPublicKeyHashHex: platformDestination.publicKeyHashHex,

      paymentSats: bchRequiredSats,

      platformFeeSats: serviceFeeSplit.platformFeeSats,

      settlementFeeSats,
    },
  };
}

/**
 * Compatibility adapter from the current CashOutRecord shape.
 *
 * The production CashScript contract planner supplies the validated P2PKH
 * destination descriptors and fixed-point settlement miner fee.
 */
export function buildCashOutSettlementPlanFromRecord(input: {
  cashOut: CashOutRecord;

  treasuryDestination: CashOutSettlementP2pkhDestination;

  platformDestination: CashOutSettlementP2pkhDestination;

  settlementFeeSats: number;
}): CashOutSettlementPlan {
  const values = getCashOutRecordValues(input.cashOut);

  return buildCashOutSettlementPlan({
    cashOutId: input.cashOut.id,

    cashOutSerial: input.cashOut.serial,

    fiatCurrency: input.cashOut.fiatCurrency,

    status: input.cashOut.status,

    quoteLockedAt: input.cashOut.quote?.quoteLockedAt,

    quoteExpiresAt: input.cashOut.quote?.quoteExpiresAt,

    customerCashPaidOutMinor: values.cashPaidOutMinor,

    customerSendsFiatEquivalentMinor: values.customerSendsFiatEquivalentMinor,

    marketBchSats: values.marketBchSats,

    bchRequiredSats: values.bchRequiredSats,

    feeModel: values.feeModel,

    settlementMode: values.settlementMode,

    totalServiceFeeBasisPoints:
      input.cashOut.fee?.totalServiceFeeBasisPoints ?? 0,

    platformFeeBasisPoints: input.cashOut.fee?.platformFeeBasisPoints ?? 0,

    merchantFeeBasisPoints: input.cashOut.fee?.merchantFeeBasisPoints,

    totalServiceFeeMinor: values.serviceFeeMinor,

    merchantFeeMinor: values.merchantFeeMinor,

    platformFeeMinor: values.platformFeeMinor,

    feeSplitKnown: values.feeSplitKnown,

    treasuryDestination: input.treasuryDestination,

    platformDestination: input.platformDestination,

    settlementFeeSats: input.settlementFeeSats,
  });
}
