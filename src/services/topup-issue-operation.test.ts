import { strict as assert } from 'assert';

import {
  createTopupIssueOperationId,
  createVoucherFundingIntentFromDraft,
} from './topup-issue-operation-core';

import { insertVoucherRecordIdempotently } from './voucher-store';

import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { TreasuryTransactionPlan } from 'src/types/treasury-transaction';
import type { VoucherRecord } from 'src/types/voucher';

function createPlan(): TreasuryTransactionPlan {
  return {
    status: 'valid',

    treasuryAddress: 'bitcoincash:test-treasury',

    voucherAddress: 'bitcoincash:test-voucher',

    selectedUtxos: [
      {
        outpointTransactionHash: '11'.repeat(32),

        outpointIndex: 0,

        valueSats: 100_000,
      },
    ],

    selectedInputSats: 100_000,

    outputs: [],

    voucherOutputSats: 90_000,

    platformFeeOutputSats: 5_000,
    bufferReserveOutputSats: 0,

    estimatedFeeSats: 500,
    estimatedChangeSats: 4_500,

    dustChangeAbsorbedSats: 0,

    createdAt: '2026-08-18T12:00:00.000Z',
  };
}

function createDraft(): TreasuryTransactionDraft {
  return {
    status: 'created',

    plan: createPlan(),

    rawTransactionHex: '01020304',

    rawTransactionBytesLength: 4,

    actualFeeSats: 520,
    actualChangeSats: 4_480,

    dustChangeAbsorbedSats: 0,

    inputCount: 1,
    outputCount: 3,

    broadcastEnabled: false,

    createdAt: '2026-08-18T12:01:00.000Z',
  };
}

function createVoucher(id: string, operationId: string): VoucherRecord {
  return {
    id,
    serial: id,

    createdAt: '2026-08-18T12:02:00.000Z',

    updatedAt: '2026-08-18T12:02:00.000Z',

    fiatCurrency: 'GBP',
    fiatAmountMinor: 2_200,

    marketBchSats: 20_000_000,

    fee: {
      type: 'percentage',
      basisPoints: 1_000,
      amountMinor: 200,
    },

    finalBchSats: 20_000_000,

    quote: {
      source: 'coingecko',
      fiatCurrency: 'GBP',
      marketRate: 100,
      marketRateTimestamp: '2026-08-18T12:00:00.000Z',

      quoteLockedAt: '2026-08-18T12:00:00.000Z',

      quoteExpiresAt: '2026-08-18T12:05:00.000Z',

      isFallbackQuote: false,
    },

    derivationIndex: 1,

    address: 'bitcoincash:test-voucher',

    issueOperationId: operationId,

    status: 'funding',
  };
}

{
  const firstId = createTopupIssueOperationId();
  const secondId = createTopupIssueOperationId();

  assert.ok(firstId.startsWith('topup-issue-'));
  assert.ok(secondId.startsWith('topup-issue-'));
  assert.notEqual(firstId, secondId);

  console.log('✓ Topup Issue creates stable unique operation IDs');
}

{
  const operationId = 'topup-issue-test-operation';

  const intent = createVoucherFundingIntentFromDraft(
    operationId,
    createDraft()
  );

  assert.equal(intent.operationId, operationId);

  assert.equal(intent.status, 'prepared');

  assert.equal(intent.rawTransactionHex, '01020304');

  assert.equal(intent.actualFeeSats, 520);
  assert.equal(intent.actualChangeSats, 4_480);

  assert.equal(intent.inputCount, 1);
  assert.equal(intent.outputCount, 3);

  console.log('✓ Signed transaction draft becomes a durable funding intent');
}

{
  const invalidDraft: TreasuryTransactionDraft = {
    status: 'not_created',

    plan: createPlan(),

    broadcastEnabled: false,

    errorMessage: 'Draft unavailable.',

    createdAt: '2026-08-18T12:01:00.000Z',
  };

  assert.throws(() => {
    createVoucherFundingIntentFromDraft('topup-issue-invalid', invalidDraft);
  });

  console.log('✓ Invalid transaction draft cannot become a funding intent');
}

{
  const operationId = 'same-operation';

  const firstVoucher = createVoucher('voucher-1', operationId);

  const secondVoucher = createVoucher('voucher-2', operationId);

  const firstInsert = insertVoucherRecordIdempotently([], firstVoucher);

  assert.equal(firstInsert.created, true);
  assert.equal(firstInsert.records.length, 1);

  const secondInsert = insertVoucherRecordIdempotently(
    firstInsert.records,
    secondVoucher
  );

  assert.equal(secondInsert.created, false);

  assert.equal(secondInsert.records.length, 1);

  assert.equal(secondInsert.record.id, 'voucher-1');

  console.log('✓ Same Issue operation cannot create a second voucher record');
}

{
  const firstVoucher = createVoucher('voucher-a', 'operation-a');

  const secondVoucher = createVoucher('voucher-b', 'operation-b');

  const firstInsert = insertVoucherRecordIdempotently([], firstVoucher);

  const secondInsert = insertVoucherRecordIdempotently(
    firstInsert.records,
    secondVoucher
  );

  assert.equal(secondInsert.created, true);

  assert.equal(secondInsert.records.length, 2);

  console.log('✓ Different Issue operations may create separate Topups');
}

console.log('\nAll 5 Topup Issue operation tests passed successfully.');
