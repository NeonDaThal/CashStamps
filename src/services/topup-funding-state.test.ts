import { strict as assert } from 'assert';

import { getTopupFundingState } from './topup-funding-state';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TXID = '11'.repeat(32);
const OTHER_TXID = '22'.repeat(32);

const BASE_TIME = '2026-08-21T12:00:00.000Z';

function createVoucher(): VoucherRecord {
  return {
    id: 'voucher-funding-state-test',
    serial: 'TEST-FUNDING-STATE',

    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,

    fiatCurrency: 'GBP',
    fiatAmountMinor: 60,

    marketBchSats: 10_000,

    fee: {
      type: 'fixed',
      basisPoints: 0,
      amountMinor: 50,
    },

    finalBchSats: 10_000,

    quote: {
      source: 'coingecko',
      fiatCurrency: 'GBP',
      marketRate: 500,
      marketRateTimestamp: BASE_TIME,
      quoteLockedAt: BASE_TIME,
      quoteExpiresAt: '2026-08-21T12:05:00.000Z',
      isFallbackQuote: false,
    },

    derivationIndex: 1,
    address: 'bitcoincash:test-funding-state',

    issueOperationId: 'topup-issue-funding-state-test',

    fundingIntent: {
      operationId: 'topup-issue-funding-state-test',

      status: 'prepared',

      rawTransactionHex: '01020304',

      txid: TEST_TXID,

      actualFeeSats: 437,
      actualChangeSats: 1_000,
      dustChangeAbsorbedSats: 0,

      inputCount: 1,
      outputCount: 3,

      preparedAt: BASE_TIME,
    },

    status: 'funding',
  };
}

function runTests(): void {
  {
    const voucher = createVoucher();

    delete voucher.fundingIntent;
    voucher.status = 'draft';

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'not_applicable');

    assert.equal(result.recoveryAction, 'none');

    console.log('✓ Draft record without funding intent is not applicable');
  }

  {
    const voucher = createVoucher();

    delete voucher.fundingIntent;

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'terminal_error');

    assert.equal(result.reason, 'funding_state_missing_intent');

    console.log('✓ Funding state without durable intent fails closed');
  }

  {
    const voucher = createVoucher();

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'ready_to_submit');

    assert.equal(result.recoveryAction, 'resume_same_transaction');

    console.log(
      '✓ Persisted transaction with no broadcast can resume the same transaction'
    );
  }

  {
    const voucher = createVoucher();

    voucher.fundingBroadcast = {
      status: 'blocked',

      txid: TEST_TXID,

      broadcastEnabled: false,
      requestAttempted: false,

      attemptedAt: BASE_TIME,
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'ready_to_submit');

    assert.equal(result.recoveryAction, 'resume_same_transaction');

    console.log('✓ Blocked pre-request transaction remains resumable');
  }

  {
    const voucher = createVoucher();

    voucher.fundingBroadcast = {
      status: 'definitely_not_broadcast',

      txid: TEST_TXID,

      broadcastEnabled: true,
      requestAttempted: false,

      attemptedAt: BASE_TIME,
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'ready_to_submit');

    assert.equal(result.recoveryAction, 'resume_same_transaction');

    console.log('✓ Definitely-not-broadcast transaction remains resumable');
  }

  {
    const voucher = createVoucher();

    voucher.fundingBroadcast = {
      status: 'broadcasted',

      txid: TEST_TXID,
      serverTxid: TEST_TXID,

      broadcastEnabled: true,
      requestAttempted: true,

      attemptedAt: BASE_TIME,
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'verification_pending');

    assert.equal(result.recoveryAction, 'check_same_transaction');

    console.log('✓ Broadcasted but unverified transaction is check-only');
  }

  {
    const voucher = createVoucher();

    voucher.fundingBroadcast = {
      status: 'uncertain',

      txid: TEST_TXID,

      broadcastEnabled: true,
      requestAttempted: true,

      attemptedAt: BASE_TIME,
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'verification_pending');

    assert.equal(result.recoveryAction, 'check_same_transaction');

    console.log('✓ Uncertain broadcast is check-only');
  }

  {
    const voucher = createVoucher();

    voucher.fundingReconciliation = {
      txid: TEST_TXID,

      status: 'mempool',

      blockHeight: 0,

      serverChecks: [],

      checkedAt: BASE_TIME,

      message: 'Transaction is in mempool.',
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'funded');

    assert.equal(result.recoveryAction, 'none');

    console.log('✓ Mempool evidence makes the exact transaction funded');
  }

  {
    const voucher = createVoucher();

    voucher.fundingReconciliation = {
      txid: TEST_TXID,

      status: 'confirmed',

      blockHeight: 900_000,

      serverChecks: [],

      checkedAt: BASE_TIME,

      message: 'Transaction is confirmed.',
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'funded');

    console.log('✓ Confirmed evidence makes the exact transaction funded');
  }

  {
    const voucher = createVoucher();

    voucher.fundingReconciliation = {
      txid: OTHER_TXID,

      status: 'mempool',

      blockHeight: 0,

      serverChecks: [],

      checkedAt: BASE_TIME,

      message: 'Wrong transaction test.',
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'terminal_error');

    assert.equal(result.reason, 'reconciliation_transaction_mismatch');

    console.log('✓ Mismatched reconciliation transaction fails closed');
  }

  {
    const voucher = createVoucher();

    voucher.fundingBroadcast = {
      status: 'broadcasted',

      txid: OTHER_TXID,

      broadcastEnabled: true,
      requestAttempted: true,

      attemptedAt: BASE_TIME,
    };

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'terminal_error');

    assert.equal(result.reason, 'broadcast_transaction_mismatch');

    console.log('✓ Mismatched broadcast transaction fails closed');
  }

  {
    const voucher = createVoucher();

    if (!voucher.fundingIntent) {
      throw new Error('Test voucher funding intent missing.');
    }

    voucher.fundingIntent.txid = 'not-a-valid-txid';

    const result = getTopupFundingState(voucher);

    assert.equal(result.state, 'terminal_error');

    assert.equal(result.reason, 'invalid_transaction_id');

    console.log('✓ Malformed durable transaction ID fails closed');
  }

  console.log('\nAll 12 Topup funding state tests passed successfully.');
}

runTests();
