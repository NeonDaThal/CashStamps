import { strict as assert } from 'assert';

import {
  canResolvePrintedVoucherRecovery,
  resolvePrintedVoucherRecovery,
} from './voucher-printed-recovery';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TIME = '2026-08-24T10:00:00.000Z';

const RESOLVED_TIME = '2026-08-24T10:01:00.000Z';

function createVoucher(
  deliveryStatus: 'delivery_started' | 'uncertain'
): VoucherRecord {
  return {
    id: 'printed-recovery-test',

    serial: 'TEST-PRINT-RECOVERY',

    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,

    fiatCurrency: 'GBP',
    fiatAmountMinor: 550,

    marketBchSats: 100_000,

    fee: {
      type: 'fixed',
      basisPoints: 0,
      amountMinor: 50,
    },

    finalBchSats: 100_000,

    quote: {
      source: 'coingecko',
      fiatCurrency: 'GBP',
      marketRate: 500,
      marketRateTimestamp: TEST_TIME,
      quoteLockedAt: TEST_TIME,
      quoteExpiresAt: '2026-08-24T10:05:00.000Z',
      isFallbackQuote: false,
    },

    derivationIndex: 1,

    address: 'bitcoincash:test-printed-recovery',

    keyMetadata: {
      hasWif: true,
      checkedAt: TEST_TIME,
    },

    delivery: {
      method: 'printed',

      status: deliveryStatus,

      selectedAt: TEST_TIME,

      startedAt: TEST_TIME,

      ...(deliveryStatus === 'uncertain'
        ? {
            uncertaintyReason: 'Printer outcome unknown.',
          }
        : {}),
    },

    status: 'funded',
  };
}

function runTests(): void {
  {
    const voucher = createVoucher('delivery_started');

    assert.equal(canResolvePrintedVoucherRecovery(voucher), true);

    console.log('✓ Interrupted Printed voucher exposes exceptional resolution');
  }

  {
    const voucher = createVoucher('uncertain');

    assert.equal(canResolvePrintedVoucherRecovery(voucher), true);

    console.log(
      '✓ Explicitly uncertain Printed voucher exposes exceptional resolution'
    );
  }

  {
    const result = resolvePrintedVoucherRecovery(
      createVoucher('delivery_started'),
      'confirmed_printed',
      RESOLVED_TIME
    );

    assert.equal(result.delivery?.status, 'delivered');

    assert.equal(result.status, 'printed');

    assert.equal(result.printedRecovery?.resolution, 'confirmed_printed');

    assert.equal(result.printedRecovery?.reclaimStatus, 'not_required');

    assert.equal(result.printedAt, RESOLVED_TIME);

    console.log('✓ Merchant-confirmed usable print becomes delivered');
  }

  {
    const result = resolvePrintedVoucherRecovery(
      createVoucher('uncertain'),
      'replacement_required',
      RESOLVED_TIME
    );

    assert.equal(result.delivery?.status, 'uncertain');

    assert.equal(result.status, 'funded');

    assert.equal(result.printedRecovery?.resolution, 'replacement_required');

    assert.equal(result.printedRecovery?.reclaimStatus, 'required');

    console.log(
      '✓ No usable print permanently locks original and requires replacement/reclaim'
    );
  }

  {
    const voucher = resolvePrintedVoucherRecovery(
      createVoucher('uncertain'),
      'replacement_required',
      RESOLVED_TIME
    );

    const secondResult = resolvePrintedVoucherRecovery(
      voucher,
      'replacement_required',
      RESOLVED_TIME
    );

    assert.equal(secondResult, voucher);

    console.log('✓ Same recovery resolution is idempotent');
  }

  {
    const voucher = resolvePrintedVoucherRecovery(
      createVoucher('uncertain'),
      'replacement_required',
      RESOLVED_TIME
    );

    assert.throws(
      () =>
        resolvePrintedVoucherRecovery(
          voucher,
          'confirmed_printed',
          RESOLVED_TIME
        ),
      /already been resolved differently/
    );

    console.log('✓ Conflicting recovery resolution is blocked');
  }

  {
    const voucher = createVoucher('uncertain');

    const delivery = voucher.delivery;

    assert.ok(delivery);

    voucher.delivery = {
      ...delivery,

      method: 'digital',
    };

    assert.equal(canResolvePrintedVoucherRecovery(voucher), false);

    console.log('✓ Digital voucher can never enter Printed recovery');
  }

  {
    const voucher = createVoucher('uncertain');

    voucher.status = 'redeemed';

    assert.equal(canResolvePrintedVoucherRecovery(voucher), false);

    console.log('✓ Redeemed voucher cannot enter Printed replacement recovery');
  }

  console.log('\nAll 8 Printed voucher recovery tests passed successfully.');
}

runTests();
