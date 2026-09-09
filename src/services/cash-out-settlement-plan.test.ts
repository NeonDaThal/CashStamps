import assert from 'assert';

import type { CashOutRecord } from 'src/types/cash-out';

import { buildCashOutSettlementPlanFromRecord } from './cash-out-settlement-plan';

const TREASURY_DESTINATION = {
  address: 'bitcoincash:qtesttreasurydestination',

  publicKeyHashHex: '0102030405060708090a0b0c0d0e0f1011121314',
};

const PLATFORM_DESTINATION = {
  address: 'bitcoincash:qtestplatformdestination',

  publicKeyHashHex: '2122232425262728292a2b2c2d2e2f3031323334',
};

function createCashOutV1(
  overrides: Partial<CashOutRecord> = {}
): CashOutRecord {
  const base: CashOutRecord = {
    id: 'cash-out-settlement-test',

    serial: 'CO-TEST-001',

    createdAt: '2026-09-08T12:00:00.000Z',

    updatedAt: '2026-09-08T12:00:00.000Z',

    fiatCurrency: 'GBP',

    fiatAmountMinor: 100,

    customerSendsFiatEquivalentMinor: 103,

    marketBchSats: 200_000,

    bchSatsRequired: 206_000,

    quote: {
      source: 'coingecko',

      fiatCurrency: 'GBP',

      marketRate: 500,

      marketRateTimestamp: '2026-09-08T11:59:55.000Z',

      quoteLockedAt: '2026-09-08T12:00:00.000Z',

      quoteExpiresAt: '2026-09-08T12:05:00.000Z',

      isFallbackQuote: false,
    },

    fee: {
      feeModel: 'cash_out_v1',

      totalServiceFeeBasisPoints: 300,

      totalServiceFeeAmountMinor: 3,

      platformFeeBasisPoints: 150,

      platformFeeAmountMinor: 1,

      merchantFeeBasisPoints: 150,

      merchantFeeAmountMinor: 2,

      settlementMode: 'accounting_only',
    },

    /**
     * These are legacy/current-flow fields and are deliberately irrelevant to
     * D1C planning. The future contract receiving address is produced later by
     * D1C.2 rather than reusing this field.
     */
    treasuryMasterAddress: 'bitcoincash:qlegacytreasurymaster',

    treasuryReceivingAddress: 'bitcoincash:qlegacycashoutreceiving',

    treasuryReceivingDerivationIndex: 1,

    status: 'quote_locked',
  };

  return {
    ...base,
    ...overrides,
  };
}

/**
 * --------------------------------------------------------------------------
 * Valid deterministic Cash-out v1 plan
 * --------------------------------------------------------------------------
 */

{
  const cashOut = createCashOutV1();

  const first = buildCashOutSettlementPlanFromRecord({
    cashOut,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,

    settlementFeeSats: 244,
  });

  const second = buildCashOutSettlementPlanFromRecord({
    cashOut,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,

    settlementFeeSats: 244,
  });

  assert.deepEqual(second, first);

  assert.equal(first.version, 'cash_out_settlement_v1');

  assert.equal(first.paymentSats, 206_000);

  assert.equal(first.marketBchSats, 200_000);

  assert.equal(first.serviceFeeSats, 6_000);

  assert.equal(first.platformFeeSats, 2_000);

  assert.equal(first.merchantFeeSats, 4_000);

  assert.equal(first.settlementFeeSats, 244);

  assert.equal(first.treasuryOutputSats, 203_756);

  assert.equal(first.platformOutputSats, 2_000);

  assert.deepEqual(first.constructor, {
    treasuryPublicKeyHashHex: TREASURY_DESTINATION.publicKeyHashHex,

    platformPublicKeyHashHex: PLATFORM_DESTINATION.publicKeyHashHex,

    paymentSats: 206_000,

    platformFeeSats: 2_000,

    settlementFeeSats: 244,
  });

  console.log(
    'PASS: valid Cash-out v1 produces one deterministic settlement plan'
  );
}

/**
 * --------------------------------------------------------------------------
 * Legacy fee model must never be silently upgraded
 * --------------------------------------------------------------------------
 */

assert.throws(() => {
  const cashOut = createCashOutV1();

  delete cashOut.fee.feeModel;

  buildCashOutSettlementPlanFromRecord({
    cashOut,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,

    settlementFeeSats: 244,
  });
}, /Fee Model v1/);

console.log('PASS: legacy Cash-out fee model is rejected');

/**
 * --------------------------------------------------------------------------
 * Inconsistent stored fee split
 * --------------------------------------------------------------------------
 */

assert.throws(() => {
  const cashOut = createCashOutV1();

  cashOut.fee.merchantFeeAmountMinor = 1;

  buildCashOutSettlementPlanFromRecord({
    cashOut,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,

    settlementFeeSats: 244,
  });
}, /fee split is not known exactly/);

console.log(
  'PASS: inconsistent stored merchant/platform fee split is rejected'
);

/**
 * --------------------------------------------------------------------------
 * Incorrect v1 basis-point snapshot
 * --------------------------------------------------------------------------
 */

assert.throws(() => {
  const cashOut = createCashOutV1();

  cashOut.fee.platformFeeBasisPoints = 149;

  buildCashOutSettlementPlanFromRecord({
    cashOut,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,

    settlementFeeSats: 244,
  });
}, /basis-point snapshot/);

console.log('PASS: malformed Cash-out v1 basis-point snapshot is rejected');

/**
 * --------------------------------------------------------------------------
 * Customer-facing accounting must reconcile
 * --------------------------------------------------------------------------
 */

assert.throws(
  () =>
    buildCashOutSettlementPlanFromRecord({
      cashOut: createCashOutV1({
        customerSendsFiatEquivalentMinor: 104,
      }),

      treasuryDestination: TREASURY_DESTINATION,

      platformDestination: PLATFORM_DESTINATION,

      settlementFeeSats: 244,
    }),
  /customer-send fiat equivalent/
);

console.log('PASS: inconsistent customer-send accounting is rejected');

/**
 * --------------------------------------------------------------------------
 * Contract must be frozen before QR/payment exposure
 * --------------------------------------------------------------------------
 */

assert.throws(
  () =>
    buildCashOutSettlementPlanFromRecord({
      cashOut: createCashOutV1({
        status: 'awaiting_payment',
      }),

      treasuryDestination: TREASURY_DESTINATION,

      platformDestination: PLATFORM_DESTINATION,

      settlementFeeSats: 244,
    }),
  /quote-locked/
);

console.log('PASS: awaiting-payment record cannot be newly planned');

/**
 * --------------------------------------------------------------------------
 * Locked quote metadata is mandatory
 * --------------------------------------------------------------------------
 */

assert.throws(() => {
  const cashOut = createCashOutV1();

  delete cashOut.quote.quoteExpiresAt;

  buildCashOutSettlementPlanFromRecord({
    cashOut,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,

    settlementFeeSats: 244,
  });
}, /quote expiry timestamp/);

console.log('PASS: incomplete locked quote metadata is rejected');

/**
 * --------------------------------------------------------------------------
 * Destination descriptors fail closed
 * --------------------------------------------------------------------------
 */

assert.throws(
  () =>
    buildCashOutSettlementPlanFromRecord({
      cashOut: createCashOutV1(),

      treasuryDestination: {
        ...TREASURY_DESTINATION,

        publicKeyHashHex: '1234',
      },

      platformDestination: PLATFORM_DESTINATION,

      settlementFeeSats: 244,
    }),
  /exactly 20 bytes/
);

console.log('PASS: malformed destination public-key hash is rejected');

assert.throws(
  () =>
    buildCashOutSettlementPlanFromRecord({
      cashOut: createCashOutV1(),

      treasuryDestination: TREASURY_DESTINATION,

      platformDestination: {
        address: 'bitcoincash:qaccidentallysame',

        publicKeyHashHex: TREASURY_DESTINATION.publicKeyHashHex,
      },

      settlementFeeSats: 244,
    }),
  /must be different/
);

console.log(
  'PASS: Treasury and platform destinations cannot collapse to one PKH'
);

/**
 * --------------------------------------------------------------------------
 * Miner fee must reconcile safely
 * --------------------------------------------------------------------------
 */

assert.throws(
  () =>
    buildCashOutSettlementPlanFromRecord({
      cashOut: createCashOutV1(),

      treasuryDestination: TREASURY_DESTINATION,

      platformDestination: PLATFORM_DESTINATION,

      settlementFeeSats: 0,
    }),
  /positive safe integer/
);

console.log('PASS: zero settlement miner fee is rejected');

assert.throws(
  () =>
    buildCashOutSettlementPlanFromRecord({
      cashOut: createCashOutV1(),

      treasuryDestination: TREASURY_DESTINATION,

      platformDestination: PLATFORM_DESTINATION,

      settlementFeeSats: 204_001,
    }),
  /no positive Treasury output/
);

console.log('PASS: destructive settlement miner fee is rejected');

console.log('');
console.log('Cash-out Settlement D1C.1 plan tests passed.');
