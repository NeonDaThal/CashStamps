import { reconcileCashOutSettlementIntentWithDependencies } from 'src/services/cash-out-settlement-reconciliation';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const OTHER_TXID = 'cd'.repeat(32);

function createIntent(
  overrides: Partial<CashOutSettlementIntent> = {}
): CashOutSettlementIntent {
  return {
    status: 'prepared',

    cashOutId: 'cash-out-d4-001',

    cashOutSerial: 'CO-D4-001',

    cashOutCommitmentHex: '11'.repeat(32),

    contractAddress: 'bitcoincash:ptestcontract',

    sourcePaymentTxid: '22'.repeat(32),

    sourceOutpointIndex: 0,

    sourceValueSats: 206_000,

    rawTransactionHex: '01020304',

    txid: SETTLEMENT_TXID,

    rawTransactionBytesLength: 4,

    treasuryAddress: 'bitcoincash:qtreasury',

    treasuryOutputSats: 203_687,

    platformAddress: 'bitcoincash:qplatform',

    platformOutputSats: 2_000,

    actualFeeSats: 313,

    inputCount: 1,

    outputCount: 2,

    broadcastEnabled: false,

    preparedAt: '2026-09-17T11:00:00.000Z',

    ...overrides,
  };
}

function createReconciliation(
  status: 'confirmed' | 'mempool' | 'unknown' | 'unavailable',
  txid = SETTLEMENT_TXID
): TreasuryBroadcastReconciliationResult {
  if (status === 'confirmed') {
    return {
      txid,

      status,

      blockHeight: 900_000,

      serverChecks: [],

      checkedAt: '2026-09-17T11:05:00.000Z',

      message: 'Transaction is confirmed.',
    };
  }

  if (status === 'mempool') {
    return {
      txid,

      status,

      blockHeight: 0,

      serverChecks: [],

      checkedAt: '2026-09-17T11:05:00.000Z',

      message: 'Transaction is visible in the BCH mempool.',
    };
  }

  return {
    txid,

    status,

    serverChecks: [],

    checkedAt: '2026-09-17T11:05:00.000Z',

    message:
      status === 'unknown'
        ? 'Transaction is not currently visible.'
        : 'Transaction status is unavailable.',
  };
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(actual)} to equal ${String(expected)}.`
    );
  }
}

async function assertRejects(
  operation: () => Promise<unknown>,
  message?: string
): Promise<void> {
  let didReject = false;

  try {
    await operation();
  } catch {
    didReject = true;
  }

  if (!didReject) {
    throw new Error(message ?? 'Expected asynchronous operation to reject.');
  }
}

async function runD4CReconciliationTests(): Promise<void> {
  /**
   * Reconciliation must query exactly the D3 deterministic txid.
   */
  {
    let requestedTxid: string | undefined;

    const result = await reconcileCashOutSettlementIntentWithDependencies(
      createIntent(),
      {
        reconcile: async (txid) => {
          requestedTxid = txid;

          return createReconciliation('mempool');
        },
      }
    );

    assertEqual(requestedTxid, SETTLEMENT_TXID);

    assertEqual(result.txid, SETTLEMENT_TXID);

    assertEqual(result.status, 'mempool');

    console.log(
      'PASS: D4C reconciles only the exact deterministic D3 settlement txid'
    );
  }

  /**
   * Confirmed evidence is preserved.
   */
  {
    const result = await reconcileCashOutSettlementIntentWithDependencies(
      createIntent(),
      {
        reconcile: async () => createReconciliation('confirmed'),
      }
    );

    assertEqual(result.status, 'confirmed');

    assertEqual(result.blockHeight, 900_000);

    console.log('PASS: confirmed settlement evidence is accepted');
  }

  /**
   * Unknown is a valid read-only result.
   *
   * It does NOT mean the transaction was definitely never broadcast.
   */
  {
    const result = await reconcileCashOutSettlementIntentWithDependencies(
      createIntent(),
      {
        reconcile: async () => createReconciliation('unknown'),
      }
    );

    assertEqual(result.status, 'unknown');

    console.log(
      'PASS: unknown settlement evidence remains distinct from definitely-not-broadcast'
    );
  }

  /**
   * Network unavailability is also distinct from transaction absence.
   */
  {
    const result = await reconcileCashOutSettlementIntentWithDependencies(
      createIntent(),
      {
        reconcile: async () => createReconciliation('unavailable'),
      }
    );

    assertEqual(result.status, 'unavailable');

    console.log(
      'PASS: unavailable settlement evidence is preserved without inventing transaction state'
    );
  }

  /**
   * Evidence for another transaction must fail closed.
   */
  await assertRejects(async () => {
    await reconcileCashOutSettlementIntentWithDependencies(createIntent(), {
      reconcile: async () => createReconciliation('mempool', OTHER_TXID),
    });
  });

  console.log('PASS: reconciliation evidence for another txid is rejected');

  /**
   * Malformed persisted txid must fail before any network check.
   */
  {
    let reconcileCalled = false;

    await assertRejects(async () => {
      await reconcileCashOutSettlementIntentWithDependencies(
        createIntent({
          txid: 'invalid-txid',
        }),
        {
          reconcile: async () => {
            reconcileCalled = true;

            return createReconciliation('unknown');
          },
        }
      );
    });

    assertEqual(reconcileCalled, false);

    console.log(
      'PASS: malformed D3 settlement txid is rejected before reconciliation'
    );
  }

  /**
   * A non-prepared intent must never enter reconciliation.
   */
  {
    let reconcileCalled = false;

    await assertRejects(async () => {
      await reconcileCashOutSettlementIntentWithDependencies(
        createIntent({
          status: 'invalid' as CashOutSettlementIntent['status'],
        }),
        {
          reconcile: async () => {
            reconcileCalled = true;

            return createReconciliation('unknown');
          },
        }
      );
    });

    assertEqual(reconcileCalled, false);

    console.log(
      'PASS: non-prepared settlement intent cannot enter D4 reconciliation'
    );
  }

  /**
   * Contradictory confirmation metadata must fail closed.
   */
  await assertRejects(async () => {
    await reconcileCashOutSettlementIntentWithDependencies(createIntent(), {
      reconcile: async () => ({
        ...createReconciliation('confirmed'),

        blockHeight: 0,
      }),
    });
  });

  console.log('PASS: malformed confirmed settlement evidence is rejected');

  /**
   * Contradictory mempool metadata must also fail closed.
   */
  await assertRejects(async () => {
    await reconcileCashOutSettlementIntentWithDependencies(createIntent(), {
      reconcile: async () => ({
        ...createReconciliation('mempool'),

        blockHeight: 123,
      }),
    });
  });

  console.log('PASS: malformed mempool settlement evidence is rejected');

  console.log('');

  console.log(
    'Cash-out Settlement D4C exact-txid reconciliation tests passed.'
  );
}

runD4CReconciliationTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
