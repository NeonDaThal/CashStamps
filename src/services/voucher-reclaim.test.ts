import { strict as assert } from 'assert';

import {
  applyVoucherReclaimIntent,
  canPrepareVoucherReclaim,
  selectVoucherReclaimSourceUtxo,
} from './voucher-reclaim';

import type { VoucherReclaimIntent, VoucherRecord } from 'src/types/voucher';

const TEST_TIME = '2026-08-24T12:30:00.000Z';

const ORIGINAL_FUNDING_TXID = 'aa'.repeat(32);

const RECLAIM_TXID = 'bb'.repeat(32);

function createOriginal(): VoucherRecord {
  return {
    id: 'original',

    serial: 'BCHV-RECLAIM',

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

      quoteExpiresAt: '2026-08-24T12:35:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 5,

    address: 'bitcoincash:original-reclaim-address',

    fundingTxid: ORIGINAL_FUNDING_TXID,

    fundingIntent: {
      operationId: 'original-operation',

      status: 'prepared',

      rawTransactionHex: '00',

      txid: ORIGINAL_FUNDING_TXID,

      actualFeeSats: 500,

      actualChangeSats: 1000,

      dustChangeAbsorbedSats: 0,

      inputCount: 1,

      outputCount: 2,

      preparedAt: TEST_TIME,
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

      replacementVoucherId: 'replacement',
    },

    status: 'funded',
  };
}

function createReplacement(): VoucherRecord {
  const original = createOriginal();

  return {
    ...original,

    id: 'replacement',

    derivationIndex: 6,

    address: 'bitcoincash:replacement-address',

    fundingTxid: 'cc'.repeat(32),

    fundingIntent: {
      operationId: 'replacement-operation',

      status: 'prepared',

      rawTransactionHex: '00',

      txid: 'cc'.repeat(32),

      actualFeeSats: 500,

      actualChangeSats: 1000,

      dustChangeAbsorbedSats: 0,

      inputCount: 1,

      outputCount: 2,

      preparedAt: TEST_TIME,
    },

    delivery: {
      method: 'printed',

      status: 'selected',

      selectedAt: TEST_TIME,
    },

    printedRecovery: undefined,

    replacement: {
      originalVoucherId: original.id,

      originalSerial: original.serial,

      reason: 'printed_delivery_failure',

      sequence: 1,

      createdAt: TEST_TIME,

      customerPaymentAlreadyRecorded: true,

      platformFeeAlreadyPaid: true,
    },

    status: 'funded',
  };
}

function createIntent(): VoucherReclaimIntent {
  return {
    status: 'prepared',

    rawTransactionHex: '01020304',

    txid: RECLAIM_TXID,

    sourceFundingTxid: ORIGINAL_FUNDING_TXID,

    sourceOutpointIndex: 1,

    sourceValueSats: 200_000,

    voucherAddress: 'bitcoincash:original-reclaim-address',

    voucherDerivationIndex: 5,

    treasuryAddress: 'bitcoincash:treasury',

    treasuryOutputSats: 199_500,

    actualFeeSats: 500,

    inputCount: 1,

    outputCount: 1,

    preparedAt: TEST_TIME,
  };
}

function runTests(): void {
  {
    assert.equal(
      canPrepareVoucherReclaim(createOriginal(), createReplacement()),
      true
    );

    console.log(
      '✓ Reclaim becomes eligible only after replacement funding is verified'
    );
  }

  {
    const replacement = createReplacement();

    replacement.status = 'funding';

    replacement.fundingReconciliation = undefined;

    assert.equal(
      canPrepareVoucherReclaim(createOriginal(), replacement),
      false
    );

    console.log('✓ Unfunded replacement blocks reclaim');
  }

  {
    const source = selectVoucherReclaimSourceUtxo(createOriginal(), [
      {
        outpointTransactionHash: 'dd'.repeat(32),

        outpointIndex: 0,

        valueSats: 50_000,
      },

      {
        outpointTransactionHash: ORIGINAL_FUNDING_TXID,

        outpointIndex: 1,

        valueSats: 200_000,
      },
    ]);

    assert.equal(source.outpointTransactionHash, ORIGINAL_FUNDING_TXID);

    assert.equal(source.valueSats, 200_000);

    console.log(
      '✓ Reclaim selects only the original funding output and ignores unrelated BCH'
    );
  }

  {
    assert.throws(
      () =>
        selectVoucherReclaimSourceUtxo(createOriginal(), [
          {
            outpointTransactionHash: 'dd'.repeat(32),

            outpointIndex: 0,

            valueSats: 200_000,
          },
        ]),
      /no longer unspent/
    );

    console.log('✓ Missing original funding output blocks reclaim');
  }

  {
    assert.throws(
      () =>
        selectVoucherReclaimSourceUtxo(createOriginal(), [
          {
            outpointTransactionHash: ORIGINAL_FUNDING_TXID,

            outpointIndex: 1,

            valueSats: 199_999,
          },
        ]),
      /does not match/
    );

    console.log('✓ Unexpected original output value blocks reclaim');
  }

  {
    const result = applyVoucherReclaimIntent(
      createOriginal(),
      createReplacement(),
      createIntent()
    );

    assert.equal(result.printedRecovery?.reclaimStatus, 'in_progress');

    assert.equal(result.printedRecovery?.reclaimIntent?.txid, RECLAIM_TXID);

    console.log(
      '✓ Prepared reclaim intent crosses the durable in-progress boundary'
    );
  }

  {
    const original = applyVoucherReclaimIntent(
      createOriginal(),
      createReplacement(),
      createIntent()
    );

    const repeated = applyVoucherReclaimIntent(
      original,
      createReplacement(),
      createIntent()
    );

    assert.equal(repeated, original);

    console.log('✓ Same reclaim intent is idempotent');
  }

  {
    const original = applyVoucherReclaimIntent(
      createOriginal(),
      createReplacement(),
      createIntent()
    );

    const conflictingIntent = {
      ...createIntent(),

      txid: 'ee'.repeat(32),
    };

    assert.throws(
      () =>
        applyVoucherReclaimIntent(
          original,
          createReplacement(),
          conflictingIntent
        ),
      /different reclaim transaction/
    );

    console.log('✓ Second conflicting reclaim transaction is blocked');
  }

  console.log('\nAll 8 voucher reclaim safety tests passed successfully.');
}

runTests();
