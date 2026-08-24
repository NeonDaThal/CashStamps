import { strict as assert } from 'assert';

import { buildPreparedPrintedReplacementRecord } from './printed-replacement-record';

import { createPrintedReplacementFeeOutputPlan } from './voucher-replacement';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TIME = '2026-08-24T12:00:00.000Z';

function createOriginal(): VoucherRecord {
  return {
    id: 'original',

    serial: 'BCHV-ORIGINAL',

    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,

    fiatCurrency: 'GBP',
    fiatAmountMinor: 1100,

    marketBchSats: 200_000,

    fee: {
      type: 'percentage',
      basisPoints: 1000,
      amountMinor: 100,
    },

    finalBchSats: 200_000,

    quote: {
      source: 'coingecko',

      fiatCurrency: 'GBP',

      marketRate: 500,

      marketRateTimestamp: TEST_TIME,

      quoteLockedAt: TEST_TIME,

      quoteExpiresAt: '2026-08-24T12:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 5,

    address: 'bitcoincash:original-address',

    keyMetadata: {
      hasWif: true,
      checkedAt: TEST_TIME,
    },

    delivery: {
      method: 'printed',
      status: 'uncertain',
      selectedAt: TEST_TIME,
      startedAt: TEST_TIME,
      uncertaintyReason: 'Printer outcome unknown.',
    },

    printedRecovery: {
      previousDeliveryStatus: 'uncertain',

      resolution: 'replacement_required',

      resolvedAt: TEST_TIME,

      reason: 'No usable voucher printed.',

      reclaimStatus: 'required',
    },

    feeOutputPlan: {
      platformFeeAddress: 'bitcoincash:platform',

      platformFeeSats: 10_000,
      platformFeeBasisPoints: 500,

      merchantRetainedSats: 10_000,
      merchantRetainedBasisPoints: 500,

      bufferReserveAddress: 'bitcoincash:buffer',

      bufferReserveSats: 0,
      bufferReserveBasisPoints: 0,

      bufferReserveOutputEnabled: false,

      totalServiceFeeSats: 20_000,
      totalServiceFeeBasisPoints: 1000,
    },

    status: 'funded',
  };
}

function createPreparedDraft(original: VoucherRecord): VoucherRecord {
  const feeOutputPlan = createPrintedReplacementFeeOutputPlan(original);

  return {
    id: 'replacement',

    serial: 'TEMP',

    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,

    fiatCurrency: 'GBP',
    fiatAmountMinor: 0,

    marketBchSats: 0,

    fee: {
      type: 'none',
      basisPoints: 0,
      amountMinor: 0,
    },

    finalBchSats: 0,

    quote: {
      source: 'unknown',

      fiatCurrency: 'GBP',

      marketRate: 0,

      marketRateTimestamp: TEST_TIME,

      isFallbackQuote: false,
    },

    derivationIndex: 6,

    address: 'bitcoincash:replacement-address',

    keyMetadata: {
      hasWif: true,
      checkedAt: TEST_TIME,
    },

    feeOutputPlan,

    treasuryFundingPreview: {
      treasuryAddress: 'bitcoincash:treasury',

      voucherAddress: 'bitcoincash:replacement-address',

      amountSats: original.finalBchSats,

      platformFeeSats: 0,

      bufferReserveSats: 0,

      estimatedFeeSats: 500,

      estimatedTotalRequiredSats: original.finalBchSats + 500,

      estimatedChangeSats: 99_500,

      treasuryBalanceSats: 300_000,

      treasuryUtxoCount: 1,

      selectedUtxos: [
        {
          outpointTransactionHash: 'aa'.repeat(32),

          outpointIndex: 0,

          valueSats: 300_000,

          address: 'bitcoincash:treasury',

          derivationIndex: 0,
        },
      ],

      selectedInputSats: 300_000,

      isAffordable: true,

      createdAt: TEST_TIME,
    },

    issueOperationId: 'replacement-operation',

    fundingIntent: {
      operationId: 'replacement-operation',

      status: 'prepared',

      rawTransactionHex: '00',

      txid: 'bb'.repeat(32),

      actualFeeSats: 500,

      actualChangeSats: 99_500,

      dustChangeAbsorbedSats: 0,

      inputCount: 1,

      outputCount: 2,

      preparedAt: TEST_TIME,
    },

    status: 'funding',
  };
}

function runTests(): void {
  const original = createOriginal();

  const draft = createPreparedDraft(original);

  const replacement = buildPreparedPrintedReplacementRecord(
    original,
    draft,
    TEST_TIME
  );

  assert.equal(replacement.id, 'replacement');

  assert.equal(replacement.serial, original.serial);

  assert.equal(replacement.finalBchSats, original.finalBchSats);

  assert.equal(replacement.derivationIndex, 6);

  assert.equal(replacement.address, 'bitcoincash:replacement-address');

  assert.equal(replacement.delivery?.method, 'printed');

  assert.equal(replacement.delivery?.status, 'selected');

  assert.equal(replacement.replacement?.originalVoucherId, original.id);

  assert.equal(replacement.fundingIntent?.txid, 'bb'.repeat(32));

  assert.equal(replacement.feeOutputPlan?.platformFeeSats, 0);

  assert.equal(replacement.feeOutputPlan?.totalServiceFeeSats, 0);

  assert.notEqual(replacement.derivationIndex, original.derivationIndex);

  assert.notEqual(replacement.address, original.address);

  console.log(
    '✓ Prepared replacement keeps the original sale but a new Printed bearer key'
  );

  console.log('✓ Exact signed replacement funding intent remains attached');

  console.log('✓ Replacement contains no second service/platform fee');

  console.log(
    '\nAll 3 prepared Printed replacement tests passed successfully.'
  );
}

runTests();
