import { strict as assert } from 'assert';

import {
  applyPrintedReplacementMetadata,
  canCreatePrintedReplacement,
  createPrintedReplacementFeeOutputPlan,
  isReplacementVoucher,
  linkPrintedReplacement,
} from './voucher-replacement';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TIME = '2026-08-24T11:00:00.000Z';

function createOriginal(): VoucherRecord {
  return {
    id: 'original-voucher',
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
      quoteExpiresAt: '2026-08-24T11:05:00.000Z',
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

    status: 'funded',
  };
}

function createReplacementDraft(): VoucherRecord {
  return {
    id: 'replacement-voucher',
    serial: 'TEMP-REFERENCE',

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

    finalBchSats: 200_000,

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

    delivery: {
      method: 'printed',
      status: 'selected',
      selectedAt: TEST_TIME,
    },

    status: 'funding',
  };
}

function runTests(): void {
  {
    const original = createOriginal();

    assert.equal(canCreatePrintedReplacement(original), true);

    console.log('✓ Eligible failed Printed Topup may create a replacement');
  }

  {
    const original = createOriginal();

    const replacement = applyPrintedReplacementMetadata(
      createReplacementDraft(),
      original,
      TEST_TIME
    );

    assert.equal(replacement.id, 'replacement-voucher');

    assert.equal(replacement.serial, original.serial);

    assert.equal(replacement.finalBchSats, original.finalBchSats);

    assert.notEqual(replacement.derivationIndex, original.derivationIndex);

    assert.notEqual(replacement.address, original.address);

    assert.equal(replacement.replacement?.originalVoucherId, original.id);

    assert.equal(replacement.replacement?.platformFeeAlreadyPaid, true);

    assert.equal(replacement.replacement?.customerPaymentAlreadyRecorded, true);

    console.log(
      '✓ Replacement preserves customer sale while using a new bearer key'
    );
  }

  {
    const original = createOriginal();

    const badReplacement = createReplacementDraft();

    badReplacement.derivationIndex = original.derivationIndex;

    assert.throws(
      () =>
        applyPrintedReplacementMetadata(badReplacement, original, TEST_TIME),
      /new voucher key and address/
    );

    console.log('✓ Replacement cannot reuse original derivation index');
  }

  {
    const original = createOriginal();

    const badReplacement = createReplacementDraft();

    badReplacement.delivery = {
      method: 'digital',
      status: 'selected',
      selectedAt: TEST_TIME,
    };

    assert.throws(
      () =>
        applyPrintedReplacementMetadata(badReplacement, original, TEST_TIME),
      /must remain Printed/
    );

    console.log('✓ Printed recovery can never switch replacement to Digital');
  }

  {
    const original = createOriginal();

    const linked = linkPrintedReplacement(original, 'replacement-voucher');

    assert.equal(
      linked.printedRecovery?.replacementVoucherId,
      'replacement-voucher'
    );

    console.log('✓ Original may be linked to one replacement');
  }

  {
    const original = linkPrintedReplacement(
      createOriginal(),
      'replacement-voucher'
    );

    const repeated = linkPrintedReplacement(original, 'replacement-voucher');

    assert.equal(repeated, original);

    console.log('✓ Same replacement linkage is idempotent');
  }

  {
    const original = linkPrintedReplacement(
      createOriginal(),
      'replacement-voucher'
    );

    assert.throws(
      () => linkPrintedReplacement(original, 'another-replacement'),
      /different replacement/
    );

    console.log('✓ A second conflicting replacement is blocked');
  }

  {
    const replacement = applyPrintedReplacementMetadata(
      createReplacementDraft(),
      createOriginal(),
      TEST_TIME
    );

    assert.equal(isReplacementVoucher(replacement), true);

    console.log(
      '✓ Replacement records are explicitly identifiable for accounting'
    );
  }

  {
    const original = createOriginal();

    original.feeOutputPlan = {
      platformFeeAddress: 'bitcoincash:platform-test',

      platformFeeSats: 10_000,

      platformFeeBasisPoints: 500,

      merchantRetainedSats: 10_000,

      merchantRetainedBasisPoints: 500,

      bufferReserveAddress: 'bitcoincash:buffer-test',

      bufferReserveSats: 0,

      bufferReserveBasisPoints: 0,

      bufferReserveOutputEnabled: false,

      totalServiceFeeSats: 20_000,

      totalServiceFeeBasisPoints: 1000,
    };

    const replacementPlan = createPrintedReplacementFeeOutputPlan(original);

    assert.equal(
      replacementPlan.platformFeeAddress,
      'bitcoincash:platform-test'
    );

    assert.equal(replacementPlan.platformFeeSats, 0);

    assert.equal(replacementPlan.platformFeeBasisPoints, 0);

    assert.equal(replacementPlan.merchantRetainedSats, 0);

    assert.equal(replacementPlan.merchantRetainedBasisPoints, 0);

    assert.equal(replacementPlan.bufferReserveSats, 0);

    assert.equal(replacementPlan.bufferReserveOutputEnabled, false);

    assert.equal(replacementPlan.totalServiceFeeSats, 0);

    assert.equal(replacementPlan.totalServiceFeeBasisPoints, 0);

    console.log(
      '✓ Replacement funding plan contains no second service/platform fee'
    );
  }

  console.log('\nAll 9 voucher replacement tests passed successfully.');
}

runTests();
