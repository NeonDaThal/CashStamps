import { strict as assert } from 'assert';

import { buildMerchantReport } from './merchant-reports';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TIME = '2026-08-24T10:00:00.000Z';

function createOriginalVoucher(): VoucherRecord {
  return {
    id: 'original-sale',

    serial: 'BCHV-REPLACEMENT-TEST',

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

      quoteExpiresAt: '2026-08-24T10:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 5,

    address: 'bitcoincash:original-accounting-test',

    status: 'printed',
  };
}

function createReplacementVoucher(original: VoucherRecord): VoucherRecord {
  return {
    ...original,

    id: 'replacement-record',

    derivationIndex: 6,

    address: 'bitcoincash:replacement-accounting-test',

    createdAt: '2026-08-24T10:01:00.000Z',

    updatedAt: '2026-08-24T10:01:00.000Z',

    replacement: {
      originalVoucherId: original.id,

      originalSerial: original.serial,

      reason: 'printed_delivery_failure',

      sequence: 1,

      createdAt: '2026-08-24T10:01:00.000Z',

      customerPaymentAlreadyRecorded: true,

      platformFeeAlreadyPaid: true,
    },
  };
}

function runTests(): void {
  const original = createOriginalVoucher();

  const replacement = createReplacementVoucher(original);

  const report = buildMerchantReport({
    range: 'all_time',

    now: new Date('2026-08-24T12:00:00.000Z'),

    voucherRecords: [original, replacement],

    cashOutRecords: [],
  });

  assert.equal(report.sourceRecordCounts.vouchersLoaded, 2);

  assert.equal(report.sourceRecordCounts.reportableVouchers, 1);

  assert.equal(report.current.vouchers.count, 1);

  assert.equal(report.current.overall.transactionCount, 1);

  assert.equal(report.current.vouchers.finalBchSats, original.finalBchSats);

  console.log(
    '✓ Replacement record is stored but not counted as another merchant sale'
  );

  {
    const original = createOriginalVoucher();

    const replacement = createReplacementVoucher(original);

    const reclaimedOriginal: VoucherRecord = {
      ...original,

      status: 'reclaimed',

      reclaimedAt: '2026-08-24T10:10:00.000Z',

      delivery: {
        method: 'printed',

        status: 'uncertain',

        selectedAt: TEST_TIME,

        startedAt: TEST_TIME,

        uncertaintyReason: 'Original physical print was unusable.',
      },

      printedRecovery: {
        previousDeliveryStatus: 'uncertain',

        resolution: 'replacement_required',

        resolvedAt: '2026-08-24T10:02:00.000Z',

        reason: 'No usable voucher printed.',

        reclaimStatus: 'reclaimed',

        replacementVoucherId: replacement.id,

        reclaimTxid: 'aa'.repeat(32),
      },
    };

    const report = buildMerchantReport({
      range: 'all_time',

      now: new Date('2026-08-24T12:00:00.000Z'),

      voucherRecords: [reclaimedOriginal, replacement],

      cashOutRecords: [],
    });

    assert.equal(report.sourceRecordCounts.reportableVouchers, 1);

    assert.equal(report.current.vouchers.count, 1);

    assert.equal(report.current.overall.transactionCount, 1);

    assert.equal(report.current.vouchers.finalBchSats, original.finalBchSats);

    console.log(
      '✓ Reclaimed original remains the single reportable customer sale'
    );
  }

  console.log('\nAll replacement accounting tests passed successfully.');
}

runTests();
