import { strict as assert } from 'assert';

import { applyVoucherFundingReconciliation } from './voucher-funding-reconciliation';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';
import type { VoucherRecord } from 'src/types/voucher';

const TEST_TXID = '11'.repeat(32);

const OTHER_TXID = '22'.repeat(32);

const BASE_TIME = '2026-08-20T12:00:00.000Z';

function createVoucher(): VoucherRecord {
  return {
    id: 'voucher-test-1',

    serial: 'TEST-0001',

    createdAt: BASE_TIME,

    updatedAt: BASE_TIME,

    fiatCurrency: 'GBP',

    fiatAmountMinor: 200,

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
      marketRate: 150,
      marketRateTimestamp: BASE_TIME,

      quoteLockedAt: BASE_TIME,

      quoteExpiresAt: '2026-08-20T12:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 1,

    address: 'bitcoincash:test-voucher-address',

    issueOperationId: 'topup-issue-test-1',

    fundingIntent: {
      operationId: 'topup-issue-test-1',

      status: 'prepared',

      rawTransactionHex: '01020304',

      txid: TEST_TXID,

      actualFeeSats: 500,

      actualChangeSats: 1_000,

      dustChangeAbsorbedSats: 0,

      inputCount: 1,

      outputCount: 3,

      preparedAt: BASE_TIME,
    },

    status: 'funding',
  };
}

function createReconciliation(
  status: TreasuryBroadcastReconciliationResult['status'],
  checkedAt: string = BASE_TIME
): TreasuryBroadcastReconciliationResult {
  return {
    txid: TEST_TXID,

    status,

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_000,
        }
      : status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    serverChecks: [
      {
        server: 'test-server',

        status: status === 'unavailable' ? 'error' : status,

        ...(status === 'confirmed'
          ? {
              blockHeight: 900_000,
            }
          : status === 'mempool'
          ? {
              blockHeight: 0,
            }
          : status === 'unavailable'
          ? {
              errorMessage: 'Connection unavailable',
            }
          : {}),
      },
    ],

    checkedAt,

    message: `Test reconciliation: ${status}`,
  };
}

{
  const result = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('unknown')
  );

  assert.equal(result.status, 'funding');

  assert.equal(result.fundingReconciliation?.status, 'unknown');

  assert.equal(result.fundingTxid, undefined);

  console.log(
    '✓ Unknown reconciliation is persisted without marking the voucher funded'
  );
}

{
  const result = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('unavailable')
  );

  assert.equal(result.status, 'funding');

  assert.equal(result.fundingReconciliation?.status, 'unavailable');

  console.log(
    '✓ Unavailable reconciliation is persisted without marking the voucher funded'
  );
}

{
  const result = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('mempool')
  );

  assert.equal(result.status, 'funded');

  assert.equal(result.fundingTxid, TEST_TXID);

  assert.equal(result.fundingDetectedAt, BASE_TIME);

  console.log(
    '✓ Mempool evidence safely marks the exact voucher transaction funded'
  );
}

{
  const result = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('confirmed')
  );

  assert.equal(result.status, 'funded');

  assert.equal(result.fundingReconciliation?.status, 'confirmed');

  assert.equal(result.fundingReconciliation?.blockHeight, 900_000);

  console.log(
    '✓ Confirmed evidence safely marks the exact voucher transaction funded'
  );
}

{
  const reconciliation = createReconciliation('mempool');

  reconciliation.txid = OTHER_TXID;

  assert.throws(
    () => applyVoucherFundingReconciliation(createVoucher(), reconciliation),
    /does not match the durable funding intent/
  );

  console.log('✓ Reconciliation for a different transaction ID fails closed');
}

{
  const confirmed = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('confirmed', '2026-08-20T12:01:00.000Z')
  );

  const laterUnknown = applyVoucherFundingReconciliation(
    confirmed,
    createReconciliation('unknown', '2026-08-20T12:02:00.000Z')
  );

  assert.equal(laterUnknown.fundingReconciliation?.status, 'confirmed');

  assert.equal(laterUnknown.status, 'funded');

  console.log(
    '✓ Confirmed evidence cannot be downgraded by a later unknown result'
  );
}

{
  const mempool = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('mempool', '2026-08-20T12:01:00.000Z')
  );

  const laterUnknown = applyVoucherFundingReconciliation(
    mempool,
    createReconciliation('unknown', '2026-08-20T12:02:00.000Z')
  );

  assert.equal(laterUnknown.fundingReconciliation?.status, 'mempool');

  assert.equal(laterUnknown.status, 'funded');

  console.log(
    '✓ Mempool evidence cannot be downgraded by a later unknown result'
  );
}

{
  const mempool = applyVoucherFundingReconciliation(
    createVoucher(),
    createReconciliation('mempool', '2026-08-20T12:01:00.000Z')
  );

  const confirmed = applyVoucherFundingReconciliation(
    mempool,
    createReconciliation('confirmed', '2026-08-20T12:02:00.000Z')
  );

  assert.equal(confirmed.fundingReconciliation?.status, 'confirmed');

  assert.equal(confirmed.status, 'funded');

  console.log('✓ Mempool evidence upgrades safely to confirmed');
}

console.log(
  '\nAll 8 Voucher funding reconciliation tests passed successfully.'
);
