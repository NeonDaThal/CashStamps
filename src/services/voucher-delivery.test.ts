import { strict as assert } from 'assert';

import {
  beginVoucherDelivery,
  completeVoucherDelivery,
  markVoucherDeliveryUncertain,
  resetVoucherDeliveryAfterDefiniteFailure,
  selectVoucherDeliveryMethod,
} from './voucher-delivery';

import type { VoucherRecord } from 'src/types/voucher';

const BASE_TIME = '2026-08-21T17:00:00.000Z';

const START_TIME = '2026-08-21T17:01:00.000Z';

const DELIVERED_TIME = '2026-08-21T17:02:00.000Z';

function createVoucher(): VoucherRecord {
  return {
    id: 'voucher-delivery-test',

    serial: 'TEST-DELIVERY',

    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,

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

      marketRateTimestamp: BASE_TIME,

      quoteLockedAt: BASE_TIME,

      quoteExpiresAt: '2026-08-21T17:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 1,

    address: 'bitcoincash:test-delivery-address',

    status: 'funded',
  };
}

function runTests(): void {
  {
    const voucher = selectVoucherDeliveryMethod(
      createVoucher(),
      'printed',
      BASE_TIME
    );

    assert.equal(voucher.delivery?.method, 'printed');

    assert.equal(voucher.delivery?.status, 'selected');

    assert.equal(voucher.status, 'funded');

    console.log(
      '✓ Printed delivery can be selected without changing funding status'
    );
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'digital',
      BASE_TIME
    );

    const repeated = selectVoucherDeliveryMethod(
      selected,
      'digital',
      START_TIME
    );

    assert.equal(repeated, selected);

    console.log('✓ Selecting the same delivery method again is idempotent');
  }

  {
    const printed = selectVoucherDeliveryMethod(
      createVoucher(),
      'printed',
      BASE_TIME
    );

    assert.throws(
      () => selectVoucherDeliveryMethod(printed, 'digital', START_TIME),
      /already locked to printed/
    );

    console.log('✓ Printed delivery can never be switched to digital');
  }

  {
    const digital = selectVoucherDeliveryMethod(
      createVoucher(),
      'digital',
      BASE_TIME
    );

    assert.throws(
      () => selectVoucherDeliveryMethod(digital, 'printed', START_TIME),
      /already locked to digital/
    );

    console.log('✓ Digital delivery can never be switched to printed');
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'digital',
      BASE_TIME
    );

    const started = beginVoucherDelivery(selected, 'digital', START_TIME);

    assert.equal(started.delivery?.status, 'delivery_started');

    assert.equal(started.delivery?.startedAt, START_TIME);

    console.log(
      '✓ Digital delivery persists its finality boundary before WIF exposure'
    );
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'printed',
      BASE_TIME
    );

    const started = beginVoucherDelivery(selected, 'printed', START_TIME);

    const delivered = completeVoucherDelivery(
      started,
      'printed',
      DELIVERED_TIME
    );

    assert.equal(delivered.delivery?.status, 'delivered');

    assert.equal(delivered.delivery?.deliveredAt, DELIVERED_TIME);

    console.log('✓ Started printed delivery can be completed');
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'printed',
      BASE_TIME
    );

    const started = beginVoucherDelivery(selected, 'printed', START_TIME);

    const uncertain = markVoucherDeliveryUncertain(
      started,
      'printed',
      'Printer write may have partially completed.'
    );

    assert.equal(uncertain.delivery?.status, 'uncertain');

    assert.throws(
      () => beginVoucherDelivery(uncertain, 'printed', DELIVERED_TIME),
      /cannot be started again automatically/
    );

    console.log(
      '✓ Uncertain physical delivery fails closed and cannot automatically retry'
    );
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'digital',
      BASE_TIME
    );

    assert.throws(
      () => beginVoucherDelivery(selected, 'printed', START_TIME),
      /already locked to digital/
    );

    console.log('✓ Delivery side effect cannot use the opposite locked method');
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'printed',
      BASE_TIME
    );

    const started = beginVoucherDelivery(selected, 'printed', START_TIME);

    const reset = resetVoucherDeliveryAfterDefiniteFailure(started, 'printed');

    assert.equal(reset.delivery?.method, 'printed');

    assert.equal(reset.delivery?.status, 'selected');

    assert.equal(reset.delivery?.selectedAt, BASE_TIME);

    assert.equal(reset.delivery?.startedAt, undefined);

    console.log(
      '✓ Definitely failed Printed delivery can safely return to selected'
    );
  }

  {
    const selected = selectVoucherDeliveryMethod(
      createVoucher(),
      'printed',
      BASE_TIME
    );

    const started = beginVoucherDelivery(selected, 'printed', START_TIME);

    const uncertain = markVoucherDeliveryUncertain(
      started,
      'printed',
      'Printer transmission may have begun.'
    );

    assert.throws(
      () => resetVoucherDeliveryAfterDefiniteFailure(uncertain, 'printed'),
      /cannot be reset/
    );

    console.log(
      '✓ Uncertain Printed delivery can never be reset for automatic retry'
    );
  }

  console.log('\nAll 10 voucher delivery tests passed successfully.');
}

runTests();
