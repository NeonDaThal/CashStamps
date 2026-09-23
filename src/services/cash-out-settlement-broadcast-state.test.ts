import {
  applyCashOutSettlementBroadcast,
  applyCashOutSettlementReconciliation,
} from 'src/services/cash-out-settlement-broadcast-state';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const OTHER_TXID = 'cd'.repeat(32);

const INTENT = {
  txid: SETTLEMENT_TXID,
} as CashOutSettlementIntent;

const CASH_OUT = {
  id: 'cash-out-d4-001',

  serial: 'CO-D4-001',

  status: 'received',

  settlementIntent: INTENT,
} as CashOutRecord;

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

function assertThrows(operation: () => unknown, message?: string): void {
  let didThrow = false;

  try {
    operation();
  } catch {
    didThrow = true;
  }

  if (!didThrow) {
    throw new Error(message ?? 'Expected operation to throw.');
  }
}

function createBroadcast(
  overrides: Partial<TreasuryBroadcastResult> = {}
): TreasuryBroadcastResult {
  return {
    status: 'broadcasted',

    txid: SETTLEMENT_TXID,

    serverTxid: SETTLEMENT_TXID,

    broadcastEnabled: true,

    requestAttempted: true,

    attemptedAt: '2026-09-17T11:00:00.000Z',

    ...overrides,
  };
}

function createReconciliation(
  status: 'confirmed' | 'mempool' | 'unknown' | 'unavailable'
): TreasuryBroadcastReconciliationResult {
  if (status === 'confirmed') {
    return {
      txid: SETTLEMENT_TXID,

      status,

      blockHeight: 900_000,

      serverChecks: [],

      checkedAt: '2026-09-17T11:01:00.000Z',

      message: 'Confirmed.',
    };
  }

  if (status === 'mempool') {
    return {
      txid: SETTLEMENT_TXID,

      status,

      blockHeight: 0,

      serverChecks: [],

      checkedAt: '2026-09-17T11:01:00.000Z',

      message: 'Mempool.',
    };
  }

  return {
    txid: SETTLEMENT_TXID,

    status,

    serverChecks: [],

    checkedAt: '2026-09-17T11:01:00.000Z',

    message: status === 'unknown' ? 'Unknown.' : 'Unavailable.',
  };
}

/**
 * Exact successful submission may be attached to the D3 transaction.
 */
{
  const result = applyCashOutSettlementBroadcast(CASH_OUT, createBroadcast());

  assertEqual(result.settlementBroadcast?.txid, SETTLEMENT_TXID);

  assertEqual(result.settlementBroadcast?.serverTxid, SETTLEMENT_TXID);

  console.log(
    'PASS: matching settlement broadcast result is bound to the durable D3 transaction'
  );
}

/**
 * Result cannot belong to another transaction.
 */
assertThrows(() => {
  applyCashOutSettlementBroadcast(
    CASH_OUT,
    createBroadcast({
      txid: OTHER_TXID,
    })
  );
});

console.log('PASS: broadcast result for a different txid is rejected');

/**
 * Electrum cannot return another txid and still count as success.
 */
assertThrows(() => {
  applyCashOutSettlementBroadcast(
    CASH_OUT,
    createBroadcast({
      serverTxid: OTHER_TXID,
    })
  );
});

console.log('PASS: contradictory Electrum broadcast txid is rejected');

/**
 * Uncertain means a request really began.
 */
assertThrows(() => {
  applyCashOutSettlementBroadcast(
    CASH_OUT,
    createBroadcast({
      status: 'uncertain',

      serverTxid: undefined,

      requestAttempted: false,
    })
  );
});

console.log(
  'PASS: uncertain settlement cannot claim no broadcast request was attempted'
);

/**
 * Definitely-not-broadcast means the request never began.
 */
{
  const result = applyCashOutSettlementBroadcast(
    CASH_OUT,
    createBroadcast({
      status: 'definitely_not_broadcast',

      serverTxid: undefined,

      requestAttempted: false,
    })
  );

  assertEqual(result.settlementBroadcast?.status, 'definitely_not_broadcast');

  console.log(
    'PASS: definitely-not-broadcast state records a proven pre-request failure'
  );
}

/**
 * A blocked safety-guard result must not claim network submission.
 */
{
  const result = applyCashOutSettlementBroadcast(
    CASH_OUT,
    createBroadcast({
      status: 'blocked',

      serverTxid: undefined,

      broadcastEnabled: false,

      requestAttempted: false,
    })
  );

  assertEqual(result.settlementBroadcast?.status, 'blocked');

  console.log('PASS: blocked settlement remains a no-request outcome');
}

/**
 * Positive mempool evidence attaches to the exact deterministic txid.
 */
{
  const result = applyCashOutSettlementReconciliation(
    CASH_OUT,
    createReconciliation('mempool')
  );

  assertEqual(result.settlementReconciliation?.status, 'mempool');

  console.log(
    'PASS: exact settlement txid can acquire positive mempool evidence'
  );
}

/**
 * Mempool → confirmed is a valid monotonic upgrade.
 */
{
  const mempool = applyCashOutSettlementReconciliation(
    CASH_OUT,
    createReconciliation('mempool')
  );

  const confirmed = applyCashOutSettlementReconciliation(
    mempool,
    createReconciliation('confirmed')
  );

  assertEqual(confirmed.settlementReconciliation?.status, 'confirmed');

  console.log(
    'PASS: settlement reconciliation upgrades from mempool to confirmed'
  );
}

/**
 * Positive evidence cannot be downgraded by a later lagging server result.
 */
{
  const mempool = applyCashOutSettlementReconciliation(
    CASH_OUT,
    createReconciliation('mempool')
  );

  const laterUnknown = applyCashOutSettlementReconciliation(
    mempool,
    createReconciliation('unknown')
  );

  assertEqual(laterUnknown, mempool);

  console.log('PASS: later unknown evidence cannot downgrade mempool evidence');
}

{
  const confirmed = applyCashOutSettlementReconciliation(
    CASH_OUT,
    createReconciliation('confirmed')
  );

  const laterUnavailable = applyCashOutSettlementReconciliation(
    confirmed,
    createReconciliation('unavailable')
  );

  assertEqual(laterUnavailable, confirmed);

  console.log(
    'PASS: later unavailable evidence cannot downgrade confirmed evidence'
  );
}

/**
 * Network evidence for another transaction is never accepted.
 */
assertThrows(() => {
  applyCashOutSettlementReconciliation(CASH_OUT, {
    ...createReconciliation('mempool'),

    txid: OTHER_TXID,
  });
});

console.log('PASS: reconciliation for a different transaction is rejected');

/**
 * D4 network state cannot exist without the durable D3 write-ahead intent.
 */
assertThrows(() => {
  applyCashOutSettlementBroadcast(
    {
      ...CASH_OUT,

      settlementIntent: undefined,
    },
    createBroadcast()
  );
});

console.log('PASS: settlement broadcast state requires a durable D3 intent');

/**
 * Once submission may have happened, a later definitely-not-broadcast result
 * must never erase that safety boundary.
 */
{
  const uncertain = applyCashOutSettlementBroadcast(
    CASH_OUT,
    createBroadcast({
      status: 'uncertain',

      serverTxid: undefined,

      errorMessage: 'Injected ambiguous response loss.',
    })
  );

  assertThrows(() => {
    applyCashOutSettlementBroadcast(
      uncertain,
      createBroadcast({
        status: 'definitely_not_broadcast',

        serverTxid: undefined,

        requestAttempted: false,

        attemptedAt: '2026-09-17T11:02:00.000Z',
      })
    );
  });

  console.log(
    'PASS: uncertain submission state cannot be overwritten by definitely-not-broadcast'
  );
}

/**
 * Positive network evidence permanently prevents another broadcast attempt
 * from being attached to the record.
 */
{
  const mempool = applyCashOutSettlementReconciliation(
    CASH_OUT,
    createReconciliation('mempool')
  );

  assertThrows(() => {
    applyCashOutSettlementBroadcast(mempool, createBroadcast());
  });

  console.log(
    'PASS: positive settlement network evidence blocks later broadcast-state mutation'
  );
}



console.log('');

console.log(
  'Cash-out Settlement D4A broadcast/reconciliation state tests passed.'
);
