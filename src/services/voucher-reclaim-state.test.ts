import { strict as assert } from 'assert';

import {
  applyVoucherReclaimBroadcast,
  applyVoucherReclaimReconciliation,
  getVoucherReclaimRecoveryAction,
} from './voucher-reclaim-state';

import type { VoucherRecord } from 'src/types/voucher';

const TEST_TIME = '2026-08-24T13:00:00.000Z';

const FUNDING_TXID = 'aa'.repeat(32);

const RECLAIM_TXID = 'bb'.repeat(32);

function createOriginal(withIntent = true): VoucherRecord {
  return {
    id: 'original',

    serial: 'BCHV-RECLAIM-STATE',

    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,

    fiatCurrency: 'GBP',
    fiatAmountMinor: 1100,

    marketBchSats: 200_000,

    fee: {
      type: 'percentage',
      basisPoints: 1000,
      amountMinor: 100,
    },

    finalBchSats: 200_000,

    quote: {
      source: 'coingecko',
      fiatCurrency: 'GBP',
      marketRate: 500,
      marketRateTimestamp: TEST_TIME,
      isFallbackQuote: false,
    },

    derivationIndex: 5,

    address: 'bitcoincash:original',

    fundingTxid: FUNDING_TXID,

    delivery: {
      method: 'printed',
      status: 'uncertain',
      selectedAt: TEST_TIME,
      startedAt: TEST_TIME,
    },

    printedRecovery: {
      previousDeliveryStatus: 'uncertain',

      resolution: 'replacement_required',

      resolvedAt: TEST_TIME,

      reason: 'No usable voucher printed.',

      reclaimStatus: withIntent ? 'in_progress' : 'required',

      replacementVoucherId: 'replacement',

      ...(withIntent
        ? {
            reclaimIntent: {
              status: 'prepared' as const,

              rawTransactionHex: '01020304',

              txid: RECLAIM_TXID,

              sourceFundingTxid: FUNDING_TXID,

              sourceOutpointIndex: 1,

              sourceValueSats: 200_000,

              voucherAddress: 'bitcoincash:original',

              voucherDerivationIndex: 5,

              treasuryAddress: 'bitcoincash:treasury',

              treasuryOutputSats: 199_500,

              actualFeeSats: 500,

              inputCount: 1,

              outputCount: 1,

              preparedAt: TEST_TIME,
            },
          }
        : {}),
    },

    status: 'funded',
  };
}

function createReplacement(): VoucherRecord {
  const original = createOriginal(false);

  return {
    ...original,

    id: 'replacement',

    derivationIndex: 6,

    address: 'bitcoincash:replacement',

    printedRecovery: undefined,

    replacement: {
      originalVoucherId: 'original',

      originalSerial: original.serial,

      reason: 'printed_delivery_failure',

      sequence: 1,

      createdAt: TEST_TIME,

      customerPaymentAlreadyRecorded: true,

      platformFeeAlreadyPaid: true,
    },

    delivery: {
      method: 'printed',

      status: 'selected',

      selectedAt: TEST_TIME,
    },

    status: 'funded',
  };
}

function runTests(): void {
  {
    assert.equal(
      getVoucherReclaimRecoveryAction(
        createOriginal(false),
        createReplacement()
      ),
      'prepare_and_resume'
    );

    console.log('✓ Eligible recovery may prepare its one reclaim transaction');
  }

  {
    const result = applyVoucherReclaimBroadcast(createOriginal(), {
      status: 'blocked',

      txid: RECLAIM_TXID,

      errorMessage: 'Broadcast disabled.',

      broadcastEnabled: false,

      requestAttempted: false,

      attemptedAt: TEST_TIME,
    });

    assert.equal(result.printedRecovery?.reclaimStatus, 'in_progress');

    assert.equal(
      getVoucherReclaimRecoveryAction(result, createReplacement()),
      'resume_same_transaction'
    );

    console.log('✓ Blocked reclaim remains safely resumable');
  }

  {
    const result = applyVoucherReclaimBroadcast(createOriginal(), {
      status: 'uncertain',

      txid: RECLAIM_TXID,

      errorMessage: 'Connection lost.',

      broadcastEnabled: true,

      requestAttempted: true,

      attemptedAt: TEST_TIME,
    });

    assert.equal(result.printedRecovery?.reclaimStatus, 'uncertain');

    assert.equal(
      getVoucherReclaimRecoveryAction(result, createReplacement()),
      'check_same_transaction'
    );

    console.log('✓ Uncertain reclaim can only check the same transaction');
  }

  {
    const result = applyVoucherReclaimReconciliation(createOriginal(), {
      txid: RECLAIM_TXID,

      status: 'mempool',

      blockHeight: 0,

      serverChecks: [],

      checkedAt: TEST_TIME,

      message: 'Visible in mempool.',
    });

    assert.equal(result.status, 'reclaimed');

    assert.equal(result.printedRecovery?.reclaimStatus, 'reclaimed');

    assert.equal(result.printedRecovery?.reclaimTxid, RECLAIM_TXID);

    console.log('✓ Positive reclaim evidence finalizes the original Topup');
  }

  {
    const mempool = applyVoucherReclaimReconciliation(createOriginal(), {
      txid: RECLAIM_TXID,

      status: 'mempool',

      blockHeight: 0,

      serverChecks: [],

      checkedAt: TEST_TIME,

      message: 'Visible in mempool.',
    });

    const weaker = applyVoucherReclaimReconciliation(mempool, {
      txid: RECLAIM_TXID,

      status: 'unknown',

      serverChecks: [],

      checkedAt: '2026-08-24T13:01:00.000Z',

      message: 'Unknown.',
    });

    assert.equal(weaker, mempool);

    console.log('✓ Positive reclaim evidence cannot be downgraded');
  }

  {
    const mempool = applyVoucherReclaimReconciliation(createOriginal(), {
      txid: RECLAIM_TXID,

      status: 'mempool',

      blockHeight: 0,

      serverChecks: [],

      checkedAt: TEST_TIME,

      message: 'Visible in mempool.',
    });

    const confirmed = applyVoucherReclaimReconciliation(mempool, {
      txid: RECLAIM_TXID,

      status: 'confirmed',

      blockHeight: 999_999,

      serverChecks: [],

      checkedAt: '2026-08-24T13:02:00.000Z',

      message: 'Confirmed.',
    });

    assert.equal(
      confirmed.printedRecovery?.reclaimReconciliation?.status,
      'confirmed'
    );

    console.log('✓ Confirmed evidence may strengthen mempool evidence');
  }

  console.log('\nAll 6 voucher reclaim state tests passed successfully.');
}

runTests();
