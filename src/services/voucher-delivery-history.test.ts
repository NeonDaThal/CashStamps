import { strict as assert } from 'assert';

import {
  canRetryPrintedVoucherFromHistory,
  canShowDigitalVoucherFromHistory,
} from './voucher-delivery-history';

import type {
  VoucherDeliveryMethod,
  VoucherDeliveryStatus,
  VoucherRecord,
  VoucherStatus,
} from 'src/types/voucher';

const TEST_TIME = '2026-08-24T10:00:00.000Z';

function createVoucher(
  method: VoucherDeliveryMethod,
  deliveryStatus: VoucherDeliveryStatus,
  status: VoucherStatus = 'funded'
): VoucherRecord {
  return {
    id: 'history-delivery-test',

    serial: 'TEST-HISTORY',

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

    address: 'bitcoincash:test-history-address',

    keyMetadata: {
      hasWif: true,
      checkedAt: TEST_TIME,
    },

    delivery: {
      method,
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
            uncertaintyReason: 'Physical print outcome unknown.',
          }
        : {}),
    },

    status,
  };
}

function runTests(): void {
  assert.equal(
    canShowDigitalVoucherFromHistory(createVoucher('digital', 'selected')),
    true
  );

  console.log('✓ Funded selected Digital voucher may be shown from History');

  assert.equal(
    canShowDigitalVoucherFromHistory(
      createVoucher('digital', 'delivery_started')
    ),
    true
  );

  console.log('✓ Interrupted Digital voucher may resume from History');

  assert.equal(
    canShowDigitalVoucherFromHistory(createVoucher('digital', 'delivered')),
    true
  );

  console.log('✓ Delivered but unswept Digital voucher may be shown again');

  assert.equal(
    canShowDigitalVoucherFromHistory(createVoucher('printed', 'selected')),
    false
  );

  console.log('✓ Printed voucher can never enter Digital History delivery');

  assert.equal(
    canRetryPrintedVoucherFromHistory(createVoucher('printed', 'selected')),
    true
  );

  console.log('✓ Safely retryable Printed voucher may print from History');

  assert.equal(
    canRetryPrintedVoucherFromHistory(
      createVoucher('printed', 'delivery_started')
    ),
    false
  );

  console.log('✓ Interrupted Printed delivery cannot automatically reprint');

  assert.equal(
    canRetryPrintedVoucherFromHistory(createVoucher('printed', 'uncertain')),
    false
  );

  console.log('✓ Uncertain Printed delivery cannot automatically reprint');

  assert.equal(
    canRetryPrintedVoucherFromHistory(
      createVoucher('printed', 'delivered', 'printed')
    ),
    false
  );

  console.log(
    '✓ Delivered Printed voucher cannot use ordinary History reprint'
  );

  assert.equal(
    canShowDigitalVoucherFromHistory(
      createVoucher('digital', 'delivered', 'redeemed')
    ),
    false
  );

  console.log('✓ Redeemed Digital voucher cannot use ordinary History reveal');

  console.log('\nAll 9 voucher delivery History tests passed successfully.');
}

runTests();
