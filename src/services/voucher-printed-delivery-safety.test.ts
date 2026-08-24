import { strict as assert } from 'assert';

import { assertPrintedVoucherDeliveryAllowed } from './voucher-printed-delivery-safety';

import type {
  VoucherDeliveryStatus,
  VoucherRecord,
  VoucherStatus,
} from 'src/types/voucher';

const TEST_TIME = '2026-08-23T20:00:00.000Z';

function createVoucher(
  deliveryStatus: VoucherDeliveryStatus = 'selected',
  status: VoucherStatus = 'funded'
): VoucherRecord {
  return {
    id: 'printed-delivery-test',

    serial: 'TEST-PRINTED',

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

      quoteExpiresAt: '2026-08-23T20:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 1,

    address: 'bitcoincash:test-printed-address',

    keyMetadata: {
      hasWif: true,
      checkedAt: TEST_TIME,
    },

    delivery: {
      method: 'printed',

      status: deliveryStatus,

      selectedAt: TEST_TIME,

      ...(deliveryStatus === 'delivery_started'
        ? {
            startedAt: TEST_TIME,
          }
        : {}),

      ...(deliveryStatus === 'delivered'
        ? {
            startedAt: TEST_TIME,

            deliveredAt: TEST_TIME,
          }
        : {}),

      ...(deliveryStatus === 'uncertain'
        ? {
            startedAt: TEST_TIME,

            uncertaintyReason: 'Printer outcome unknown.',
          }
        : {}),
    },

    status,
  };
}

function runTests(): void {
  {
    const voucher = createVoucher();

    assert.doesNotThrow(() => assertPrintedVoucherDeliveryAllowed(voucher));

    console.log('✓ Selected funded Printed Topup may begin first print');
  }

  {
    const voucher = createVoucher('delivery_started');

    assert.throws(
      () => assertPrintedVoucherDeliveryAllowed(voucher),
      /must be investigated/
    );

    console.log(
      '✓ Interrupted Printed delivery cannot automatically print again'
    );
  }

  {
    const voucher = createVoucher('uncertain');

    assert.throws(
      () => assertPrintedVoucherDeliveryAllowed(voucher),
      /Automatic reprinting is blocked/
    );

    console.log('✓ Uncertain Printed delivery cannot automatically reprint');
  }

  {
    const voucher = createVoucher('delivered', 'printed');

    assert.throws(
      () => assertPrintedVoucherDeliveryAllowed(voucher),
      /funded and unswept|already been delivered/
    );

    console.log(
      '✓ Delivered Printed Topup cannot use ordinary first-print path again'
    );
  }

  {
    const voucher = createVoucher();

    const delivery = voucher.delivery;

    assert.ok(delivery);

    voucher.delivery = {
      ...delivery,

      method: 'digital',
    };

    assert.throws(
      () => assertPrintedVoucherDeliveryAllowed(voucher),
      /not a Printed voucher/
    );

    console.log('✓ Digital Topup can never enter Printed delivery');
  }

  {
    const voucher = createVoucher();

    voucher.derivationIndex = -1;

    assert.throws(
      () => assertPrintedVoucherDeliveryAllowed(voucher),
      /derivation index/
    );

    console.log('✓ Invalid Printed voucher key derivation fails closed');
  }

  console.log(
    '\nAll 6 Printed voucher delivery safety tests passed successfully.'
  );
}

runTests();
