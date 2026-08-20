import { strict as assert } from 'assert';

import { reconcileTreasuryBroadcastWithRetry } from './treasury-broadcast-reconciliation';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const TEST_TXID = '11'.repeat(32);

function createResult(
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

    serverChecks: [],

    checkedAt: new Date().toISOString(),

    message: `Test result: ${status}`,
  };
}

async function runTests(): Promise<void> {
  {
    const responses = [createResult('unknown'), createResult('mempool')];

    let responseIndex = 0;

    const waits: number[] = [];

    const result = await reconcileTreasuryBroadcastWithRetry(TEST_TXID, {
      delaysMilliseconds: [0, 150, 350, 750, 1_500, 2_500],

      async reconcile() {
        const response = responses[responseIndex];

        responseIndex += 1;

        if (!response) {
          throw new Error('Test ran out of reconciliation responses.');
        }

        return response;
      },

      async wait(milliseconds) {
        waits.push(milliseconds);
      },
    });

    assert.equal(result.status, 'mempool');

    assert.equal(responseIndex, 2);

    assert.deepEqual(waits, [150]);

    console.log(
      '✓ Retry detects early mempool propagation without waiting for the full window'
    );
  }

  {
    const responses = [
      createResult('unavailable'),
      createResult('unknown'),
      createResult('unknown'),
      createResult('unknown'),
      createResult('unknown'),
      createResult('confirmed'),
    ];

    let responseIndex = 0;

    const waits: number[] = [];

    const result = await reconcileTreasuryBroadcastWithRetry(TEST_TXID, {
      delaysMilliseconds: [0, 150, 350, 750, 1_500, 2_500],

      async reconcile() {
        const response = responses[responseIndex];

        responseIndex += 1;

        if (!response) {
          throw new Error('Test ran out of reconciliation responses.');
        }

        return response;
      },

      async wait(milliseconds) {
        waits.push(milliseconds);
      },
    });

    assert.equal(result.status, 'confirmed');

    assert.equal(responseIndex, 6);

    assert.deepEqual(waits, [150, 350, 750, 1_500, 2_500]);

    console.log('✓ Retry preserves the full propagation-tolerance window');
  }

  {
    const responses = [
      createResult('unknown'),
      createResult('unknown'),
      createResult('unknown'),
      createResult('unknown'),
      createResult('unknown'),
      createResult('unknown'),
    ];

    let responseIndex = 0;

    const result = await reconcileTreasuryBroadcastWithRetry(TEST_TXID, {
      delaysMilliseconds: [0, 150, 350, 750, 1_500, 2_500],

      async reconcile() {
        const response = responses[responseIndex];

        responseIndex += 1;

        if (!response) {
          throw new Error('Test ran out of reconciliation responses.');
        }

        return response;
      },

      async wait() {
        // Deliberately no real delay in tests.
      },
    });

    assert.equal(result.status, 'unknown');

    assert.equal(responseIndex, 6);

    console.log(
      '✓ Exhausted retries remain unknown rather than inventing success'
    );
  }

  {
    let reconciliationCount = 0;

    const result = await reconcileTreasuryBroadcastWithRetry(TEST_TXID, {
      delaysMilliseconds: [0, 150, 350],

      async reconcile() {
        reconciliationCount += 1;

        return createResult('confirmed');
      },

      async wait() {
        throw new Error(
          'No wait should occur after immediate positive evidence.'
        );
      },
    });

    assert.equal(result.status, 'confirmed');

    assert.equal(reconciliationCount, 1);

    console.log(
      '✓ Immediate positive evidence completes without unnecessary waiting'
    );
  }

  {
    let pollingCount = 0;

    const result = await reconcileTreasuryBroadcastWithRetry(TEST_TXID, {
      async observe() {
        return createResult('mempool');
      },

      async reconcile() {
        pollingCount += 1;

        return createResult('unknown');
      },

      async wait() {
        // No real delay.
      },
    });

    assert.equal(result.status, 'mempool');

    assert.equal(pollingCount, 0);

    console.log(
      '✓ Transaction subscription fast-path completes before polling when mempool evidence is available'
    );
  }

  {
    let pollingCount = 0;

    const result = await reconcileTreasuryBroadcastWithRetry(TEST_TXID, {
      delaysMilliseconds: [0],

      async observe() {
        return undefined;
      },

      async reconcile() {
        pollingCount += 1;

        return createResult('mempool');
      },

      async wait() {
        // No real delay.
      },
    });

    assert.equal(result.status, 'mempool');

    assert.equal(pollingCount, 1);

    console.log(
      '✓ Polling remains the fallback when subscription observation does not resolve funding'
    );
  }

  console.log('\nAll 6 Treasury broadcast retry tests passed successfully.');
}

void runTests();
