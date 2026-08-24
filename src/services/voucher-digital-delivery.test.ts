import { strict as assert } from 'assert';

import { assertDigitalVoucherDeliveryAllowed } from './voucher-digital-delivery';

import type {
  VoucherDeliveryStatus,
  VoucherRecord,
  VoucherStatus,
} from 'src/types/voucher';

const TEST_TIME = '2026-08-22T15:00:00.000Z';

function createVoucher(
  deliveryStatus: VoucherDeliveryStatus = 'selected',
  status: VoucherStatus = 'funded'
): VoucherRecord {
  return {
    id: 'digital-delivery-test',

    serial: 'TEST-DIGITAL',

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

      quoteExpiresAt: '2026-08-22T15:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 1,

    address: 'bitcoincash:test-digital-address',

    keyMetadata: {
      hasWif: true,
      checkedAt: TEST_TIME,
    },

    delivery: {
      method: 'digital',
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
    },

    status,
  };
}

function runTests(): void {
  {
    const voucher = createVoucher();

    assert.doesNotThrow(() => assertDigitalVoucherDeliveryAllowed(voucher));

    console.log('✓ Selected funded Digital Topup can enter delivery');
  }

  {
    const voucher = createVoucher('delivery_started');

    assert.doesNotThrow(() => assertDigitalVoucherDeliveryAllowed(voucher));

    console.log('✓ Interrupted Digital delivery can resume the same voucher');
  }

  {
    const voucher = createVoucher('delivered');

    assert.doesNotThrow(() => assertDigitalVoucherDeliveryAllowed(voucher));

    console.log('✓ Delivered but unswept Digital Topup can be shown again');
  }

  {
    const voucher = createVoucher();

    const delivery = voucher.delivery;

    assert.ok(delivery);

    voucher.delivery = {
      ...delivery,
      method: 'printed',
    };

    assert.throws(
      () => assertDigitalVoucherDeliveryAllowed(voucher),
      /not a digital voucher/
    );

    console.log('✓ Printed Topup can never enter digital delivery');
  }

  {
    const voucher = createVoucher('delivered', 'redeemed');

    assert.throws(
      () => assertDigitalVoucherDeliveryAllowed(voucher),
      /funded and unswept/
    );

    console.log('✓ Redeemed Digital Topup cannot be normally exposed again');
  }

  {
    const voucher = createVoucher();

    voucher.derivationIndex = -1;

    assert.throws(
      () => assertDigitalVoucherDeliveryAllowed(voucher),
      /derivation index/
    );

    console.log('✓ Invalid key derivation fails closed');
  }

  console.log('\nAll 6 digital voucher delivery tests passed successfully.');
}

runTests();
