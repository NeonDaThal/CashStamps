import { strict as assert } from 'assert';

import type { CashOutRecord } from 'src/types/cash-out';

import { buildCashOutReceiptData } from 'src/services/cash-out-receipt';

function createCashOut(status: CashOutRecord['status']): CashOutRecord {
  return {
    id: 'cash-out-test',
    serial: 'CO-TEST',

    createdAt: '2026-08-27T10:00:00.000Z',

    updatedAt: '2026-08-27T10:01:00.000Z',

    fiatCurrency: 'GBP',

    fiatAmountMinor: 10_000,

    customerSendsFiatEquivalentMinor: 10_300,

    marketBchSats: 20_000_000,

    bchSatsRequired: 20_600_000,

    bchSatsReceived: 20_600_000,

    quote: {
      source: 'coingecko',
      fiatCurrency: 'GBP',
      marketRate: 500,
      marketRateTimestamp: '2026-08-27T10:00:00.000Z',
      quoteLockedAt: '2026-08-27T10:00:00.000Z',
      quoteExpiresAt: '2026-08-27T10:05:00.000Z',
      isFallbackQuote: false,
    },

    fee: {
      feeModel: 'cash_out_v1',

      totalServiceFeeBasisPoints: 300,

      totalServiceFeeAmountMinor: 300,

      platformFeeBasisPoints: 150,

      platformFeeAmountMinor: 150,

      merchantFeeBasisPoints: 150,

      merchantFeeAmountMinor: 150,

      settlementMode: 'accounting_only',
    },

    treasuryReceivingAddress: 'bitcoincash:qtestaddress',

    receivedTxid: '0123456789abcdef',

    detectedAt: '2026-08-27T10:01:00.000Z',

    completedAt:
      status === 'completed' ? '2026-08-27T10:02:00.000Z' : undefined,

    status,
  };
}

{
  const receivedCashOut = createCashOut('received');

  assert.throws(
    () => buildCashOutReceiptData(receivedCashOut),
    /not been completed/
  );

  console.log(
    '✓ Receipt is blocked while BCH is received but cash payout is not confirmed'
  );
}

{
  const completedCashOut = createCashOut('completed');

  const receipt = buildCashOutReceiptData(completedCashOut);

  assert.equal(receipt.cashPaidOutMinor, 10_000);

  assert.equal(receipt.customerSentFiatEquivalentMinor, 10_300);

  assert.equal(receipt.serviceFeeAmountMinor, 300);

  assert.equal(receipt.serviceFeePercentLabel, '3.00%');

  assert.equal(receipt.bchReceivedSats, 20_600_000);

  console.log('✓ Completed Cash-out builds a 3% customer receipt correctly');
}

console.log('All Cash-out receipt lifecycle tests passed successfully.');
