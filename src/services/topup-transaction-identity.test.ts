import { strict as assert } from 'assert';

import { createVoucherFundingIntentFromDraft } from './topup-issue-operation-core';

import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';

const TEST_OPERATION_ID = 'topup-issue-transaction-identity-test';

const TEST_TRANSACTION_ID = 'ab'.repeat(32);

const createdDraft: TreasuryTransactionDraft = {
  status: 'created',

  plan: {} as TreasuryTransactionDraft['plan'],

  rawTransactionHex: '01000000000000000000',

  txid: TEST_TRANSACTION_ID,

  rawTransactionBytesLength: 10,

  actualFeeSats: 500,
  actualChangeSats: 2_000,

  dustChangeAbsorbedSats: 0,

  inputCount: 1,
  outputCount: 2,

  broadcastEnabled: false,

  createdAt: '2026-08-19T12:00:00.000Z',
};

{
  const fundingIntent = createVoucherFundingIntentFromDraft(
    TEST_OPERATION_ID,
    createdDraft
  );

  assert.equal(fundingIntent.txid, TEST_TRANSACTION_ID);

  assert.equal(fundingIntent.rawTransactionHex, createdDraft.rawTransactionHex);

  console.log(
    '✓ Deterministic transaction ID is preserved in the durable funding intent'
  );
}

{
  const draftWithoutTransactionId: TreasuryTransactionDraft = {
    ...createdDraft,
    txid: undefined,
  };

  assert.throws(
    () =>
      createVoucherFundingIntentFromDraft(
        TEST_OPERATION_ID,
        draftWithoutTransactionId
      ),
    /Deterministic funding transaction ID is missing or invalid/
  );

  console.log('✓ Created transaction draft without a txid fails closed');
}

{
  const draftWithInvalidTransactionId: TreasuryTransactionDraft = {
    ...createdDraft,
    txid: '1234',
  };

  assert.throws(
    () =>
      createVoucherFundingIntentFromDraft(
        TEST_OPERATION_ID,
        draftWithInvalidTransactionId
      ),
    /Deterministic funding transaction ID is missing or invalid/
  );

  console.log('✓ Malformed transaction ID fails closed');
}

{
  const uppercaseTransactionId = TEST_TRANSACTION_ID.toUpperCase();

  const fundingIntent = createVoucherFundingIntentFromDraft(TEST_OPERATION_ID, {
    ...createdDraft,
    txid: uppercaseTransactionId,
  });

  assert.equal(fundingIntent.txid, TEST_TRANSACTION_ID);

  console.log('✓ Transaction IDs are persisted in canonical lowercase form');
}

console.log('\nAll 4 Topup transaction identity tests passed successfully.');
