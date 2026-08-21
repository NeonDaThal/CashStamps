import { strict as assert } from 'assert';

import {
  advanceTopupFundingLifecycle,
  reconcileExistingTopupFunding,
  type TopupFundingLifecycleDependencies,
} from './topup-funding-lifecycle';

import { synchroniseTopupFundingState } from './topup-funding-state';

import { applyVoucherFundingBroadcast } from './voucher-funding-broadcast';

import { applyVoucherFundingReconciliation } from './voucher-funding-reconciliation';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TXID = '11'.repeat(32);

const BASE_TIME = '2026-08-20T12:00:00.000Z';

function createVoucher(): VoucherRecord {
  return {
    id: 'voucher-lifecycle-test',

    serial: 'TEST-LIFECYCLE',

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

    issueOperationId: 'topup-issue-lifecycle-test',

    fundingIntent: {
      operationId: 'topup-issue-lifecycle-test',

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
  status: TreasuryBroadcastReconciliationResult['status']
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

    checkedAt: BASE_TIME,

    message: `Test reconciliation: ${status}`,
  };
}

function createBroadcastResult(
  status: TreasuryBroadcastResult['status']
): TreasuryBroadcastResult {
  return {
    status,

    txid: TEST_TXID,

    ...(status === 'broadcasted'
      ? {
          serverTxid: TEST_TXID,
        }
      : {}),

    broadcastEnabled: true,

    requestAttempted: status === 'broadcasted' || status === 'uncertain',

    attemptedAt: BASE_TIME,

    ...(status === 'blocked' ||
    status === 'definitely_not_broadcast' ||
    status === 'uncertain'
      ? {
          errorMessage: `Test broadcast result: ${status}`,
        }
      : {}),
  };
}

function createDependencies(input: {
  reconciliations: TreasuryBroadcastReconciliationResult[];

  broadcastResult: TreasuryBroadcastResult;

  initialRecord?: VoucherRecord;
}) {
  let currentRecord = input.initialRecord ?? createVoucher();

  let reconciliationIndex = 0;

  let broadcastCallCount = 0;

  const dependencies: TopupFundingLifecycleDependencies = {
    async getVoucherRecordById() {
      return currentRecord;
    },

    async updateVoucherFundingState() {
      currentRecord = synchroniseTopupFundingState(currentRecord);

      return currentRecord;
    },

    async reconcileTreasuryBroadcast() {
      const reconciliation = input.reconciliations[reconciliationIndex];

      reconciliationIndex += 1;

      if (!reconciliation) {
        throw new Error('Test ran out of reconciliation responses.');
      }

      return reconciliation;
    },

    async reconcileTreasuryBroadcastWithRetry() {
      const reconciliation = input.reconciliations[reconciliationIndex];

      reconciliationIndex += 1;

      if (!reconciliation) {
        throw new Error('Test ran out of reconciliation responses.');
      }

      return reconciliation;
    },

    async updateVoucherFundingReconciliation(_id, reconciliation) {
      currentRecord = applyVoucherFundingReconciliation(
        currentRecord,
        reconciliation
      );

      return currentRecord;
    },

    async broadcastTreasuryFundingIntent(fundingIntent) {
      broadcastCallCount += 1;

      assert.equal(fundingIntent.txid, TEST_TXID);

      assert.equal(fundingIntent.rawTransactionHex, '01020304');

      return input.broadcastResult;
    },

    async updateVoucherFundingBroadcast(_id, result) {
      currentRecord = applyVoucherFundingBroadcast(currentRecord, result);

      return currentRecord;
    },
  };

  return {
    dependencies,

    getBroadcastCallCount() {
      return broadcastCallCount;
    },
  };
}

async function runTests(): Promise<void> {
  {
    const test = createDependencies({
      reconciliations: [createReconciliation('mempool')],

      broadcastResult: createBroadcastResult('broadcasted'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'funded');

    assert.equal(test.getBroadcastCallCount(), 0);

    console.log('✓ Already-observed transaction is never broadcast again');
  }

  {
    const test = createDependencies({
      reconciliations: [
        createReconciliation('unknown'),

        createReconciliation('mempool'),
      ],

      broadcastResult: createBroadcastResult('broadcasted'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'funded');

    assert.equal(test.getBroadcastCallCount(), 1);

    assert.equal(result.record.status, 'funded');

    console.log(
      '✓ Unknown transaction is broadcast once and becomes funded after mempool evidence'
    );
  }

  {
    const test = createDependencies({
      reconciliations: [
        createReconciliation('unknown'),

        createReconciliation('confirmed'),
      ],

      broadcastResult: createBroadcastResult('uncertain'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'funded');

    assert.equal(result.record.fundingReconciliation?.status, 'confirmed');

    console.log(
      '✓ Uncertain broadcast becomes funded when reconciliation finds the exact transaction'
    );
  }

  {
    const test = createDependencies({
      reconciliations: [createReconciliation('unknown')],

      broadcastResult: createBroadcastResult('definitely_not_broadcast'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'definitely_not_broadcast');

    assert.equal(test.getBroadcastCallCount(), 1);

    assert.equal(result.record.status, 'funding');

    console.log(
      '✓ Proven pre-request failure leaves the voucher safely in funding state'
    );
  }

  {
    const test = createDependencies({
      reconciliations: [
        createReconciliation('unknown'),

        createReconciliation('unknown'),
      ],

      broadcastResult: createBroadcastResult('uncertain'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'uncertain');

    assert.equal(result.record.status, 'funding');

    assert.equal(test.getBroadcastCallCount(), 1);

    console.log(
      '✓ Unresolved uncertain broadcast never creates a replacement transaction'
    );
  }

  {
    const test = createDependencies({
      reconciliations: [
        createReconciliation('unavailable'),

        createReconciliation('unavailable'),
      ],

      broadcastResult: createBroadcastResult('broadcasted'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'broadcasted_pending_detection');

    assert.equal(result.record.status, 'funding');

    console.log(
      '✓ Broadcast success without follow-up network visibility remains safely pending detection'
    );
  }

  {
    const test = createDependencies({
      reconciliations: [createReconciliation('mempool')],

      broadcastResult: createBroadcastResult('broadcasted'),
    });

    const result = await reconcileExistingTopupFunding(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.reconciliation.status, 'mempool');

    assert.equal(result.record.status, 'funded');

    assert.equal(test.getBroadcastCallCount(), 0);

    console.log(
      '✓ Existing funding voucher can be reconciled without any broadcast'
    );
  }

  {
    const initialRecord = createVoucher();

    initialRecord.fundingBroadcast = {
      status: 'broadcasted',

      txid: TEST_TXID,
      serverTxid: TEST_TXID,

      broadcastEnabled: true,
      requestAttempted: true,

      attemptedAt: BASE_TIME,
    };

    const test = createDependencies({
      initialRecord,

      reconciliations: [createReconciliation('mempool')],

      broadcastResult: createBroadcastResult('broadcasted'),
    });

    const result = await advanceTopupFundingLifecycle(
      'voucher-lifecycle-test',
      test.dependencies
    );

    assert.equal(result.outcome, 'funded');

    assert.equal(test.getBroadcastCallCount(), 0);

    assert.equal(result.record.status, 'funded');

    console.log(
      '✓ Existing broadcasted voucher uses verification-only recovery and is never rebroadcast'
    );
  }

  console.log('\nAll 9 Topup funding lifecycle tests passed successfully.');
}

void runTests();
