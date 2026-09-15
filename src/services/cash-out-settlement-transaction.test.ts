import { MockNetworkProvider, Network } from 'cashscript';

import { createCashOutSettlementIntent } from 'src/services/cash-out-settlement-transaction';

import { buildCashOutSettlementContractPlan } from 'src/services/cash-out-settlement-contract-plan';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutNormalSettlementCandidate } from 'src/types/cash-out-contract-payment';

import { applyCashOutSettlementIntent } from 'src/services/cash-out-settlement-intent';

import { prepareAndStoreCashOutSettlementWithDependencies } from 'src/services/cash-out-settlement-prepare';

const TREASURY_ADDRESS =
  'bitcoincash:qqqsyqcyq5rqwzqfpg9scrgwpugpzysnzstne440kw';

const CASH_OUT_COMMITMENT = '01'.repeat(32);

const SOURCE_PAYMENT_TXID = 'ab'.repeat(32);

const PREPARED_AT = '2026-09-10T12:00:00.000Z';

const CASH_OUT: CashOutRecord = {
  id: 'cash-out-d3-001',

  serial: 'CO-D3-001',

  createdAt: '2026-09-10T11:00:00.000Z',

  updatedAt: '2026-09-10T11:00:00.000Z',

  fiatCurrency: 'GBP',

  fiatAmountMinor: 10_000,

  customerSendsFiatEquivalentMinor: 10_300,

  marketBchSats: 202_000,

  bchSatsRequired: 206_000,

  quote: {
    source: 'coingecko',

    fiatCurrency: 'GBP',

    marketRate: 400,

    marketRateTimestamp: '2026-09-10T10:59:30.000Z',

    quoteLockedAt: '2026-09-10T11:00:00.000Z',

    quoteExpiresAt: '2026-09-10T11:05:00.000Z',

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

  treasuryMasterAddress: TREASURY_ADDRESS,

  treasuryReceivingAddress: TREASURY_ADDRESS,

  status: 'quote_locked',
};

function createMainnetMockProvider(): MockNetworkProvider {
  const provider = new MockNetworkProvider();

  provider.network = Network.MAINNET;

  return provider;
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

function assertNotEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual === expected) {
    throw new Error(
      message ??
        `Expected ${String(actual)} to differ from ${String(expected)}.`
    );
  }
}

function assertDeepEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message ?? 'Expected values to be deeply equal.');
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

const contractPlan = buildCashOutSettlementContractPlan({
  cashOut: CASH_OUT,

  cashOutCommitmentHex: CASH_OUT_COMMITMENT,

  treasuryAddress: TREASURY_ADDRESS,

  provider: createMainnetMockProvider(),
});

function createCandidate(
  overrides: Partial<CashOutNormalSettlementCandidate> = {}
): CashOutNormalSettlementCandidate {
  return {
    cashOutId: contractPlan.settlementPlan.cashOutId,

    cashOutSerial: contractPlan.settlementPlan.cashOutSerial,

    cashOutCommitmentHex: contractPlan.cashOutCommitmentHex,

    contractAddress: contractPlan.contractAddress,

    paymentSats: contractPlan.settlementPlan.paymentSats,

    txid: SOURCE_PAYMENT_TXID,

    vout: 2,

    satoshis: contractPlan.settlementPlan.paymentSats,

    height: 0,

    ...overrides,
  };
}

/**
 * Same frozen contract + same exact outpoint must produce byte-for-byte the
 * same transaction.
 */
{
  const first = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });

  const second = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });

  assertDeepEqual(first, second);

  assertEqual(
    first.rawTransactionBytesLength,
    contractPlan.settlementTransactionSizeBytes
  );

  assertEqual(
    first.actualFeeSats,
    contractPlan.settlementPlan.settlementFeeSats
  );

  assertEqual(first.inputCount, 1);

  assertEqual(first.outputCount, 2);

  assertEqual(first.broadcastEnabled, false);

  console.log(
    'PASS: same contract plan and outpoint produce identical raw transaction and txid'
  );
}

/**
 * Timestamp is audit metadata only and must not affect transaction identity.
 */
{
  const first = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: createMainnetMockProvider(),

    preparedAt: '2026-09-10T12:00:00.000Z',
  });

  const second = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: createMainnetMockProvider(),

    preparedAt: '2026-09-10T12:01:00.000Z',
  });

  assertEqual(first.rawTransactionHex, second.rawTransactionHex);

  assertEqual(first.txid, second.txid);

  console.log(
    'PASS: prepared timestamp does not affect settlement transaction identity'
  );
}

/**
 * Changing the selected parent outpoint must change the settlement txid.
 */
{
  const first = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });

  const second = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      txid: 'cd'.repeat(32),
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });

  assertNotEqual(first.rawTransactionHex, second.rawTransactionHex);

  assertNotEqual(first.txid, second.txid);

  console.log(
    'PASS: different customer payment outpoint produces a different settlement transaction'
  );
}

/**
 * Different vout from the same parent transaction also means a different
 * outpoint and therefore a different settlement transaction.
 */
{
  const first = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      vout: 1,
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });

  const second = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      vout: 2,
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });

  assertNotEqual(first.txid, second.txid);

  console.log(
    'PASS: different output index produces a different settlement transaction'
  );
}

/**
 * Candidate cannot be borrowed from another Cash-out or contract.
 */
assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      cashOutId: 'different-cash-out',
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });
});

assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      contractAddress: 'bitcoincash:pdifferentcontractaddressfortestonly',
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });
});

console.log(
  'PASS: candidate cannot be rebound to another Cash-out or contract'
);

/**
 * Under/over-valued candidates fail closed even if someone constructs the
 * type manually instead of going through D2.
 */
assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      satoshis: contractPlan.settlementPlan.paymentSats - 1,
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });
});

assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      satoshis: contractPlan.settlementPlan.paymentSats + 1,
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });
});

console.log('PASS: non-exact manually-constructed candidates fail closed');

/**
 * Malformed outpoints fail closed.
 */
assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      txid: 'abcd',
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });
});

assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      vout: -1,
    }),

    provider: createMainnetMockProvider(),

    preparedAt: PREPARED_AT,
  });
});

console.log('PASS: malformed settlement outpoints are rejected');

/**
 * D3 transaction construction must remain mainnet-bound.
 */
assertThrows(() => {
  createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: new MockNetworkProvider(),

    preparedAt: PREPARED_AT,
  });
});

console.log('PASS: non-mainnet settlement construction is rejected');

/**
 * --------------------------------------------------------------------------
 * D3B WRITE-AHEAD / NON-REPLACEMENT RULE
 * --------------------------------------------------------------------------
 */

const preparedIntent = createCashOutSettlementIntent({
  contractPlan,

  candidate: createCandidate(),

  provider: createMainnetMockProvider(),

  preparedAt: PREPARED_AT,
});

const RECEIVED_CASH_OUT: CashOutRecord = {
  ...CASH_OUT,

  status: 'received',

  bchSatsReceived: contractPlan.settlementPlan.paymentSats,

  receivedTxid: SOURCE_PAYMENT_TXID,

  detectedAt: '2026-09-10T11:59:59.000Z',
};

/**
 * First exact settlement intent crosses the write-ahead boundary.
 */
const withIntent = applyCashOutSettlementIntent(
  RECEIVED_CASH_OUT,
  preparedIntent
);

assertEqual(withIntent.settlementIntent?.txid, preparedIntent.txid);

assertEqual(
  withIntent.settlementIntent?.rawTransactionHex,
  preparedIntent.rawTransactionHex
);

console.log(
  'PASS: exact settlement transaction crosses the write-ahead boundary'
);

/**
 * Re-applying the SAME deterministic settlement remains idempotent.
 */
{
  const sameTransactionLaterTimestamp = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate(),

    provider: createMainnetMockProvider(),

    preparedAt: '2026-09-10T12:05:00.000Z',
  });

  const reapplied = applyCashOutSettlementIntent(
    withIntent,
    sameTransactionLaterTimestamp
  );

  assertEqual(reapplied, withIntent);

  assertEqual(reapplied.settlementIntent?.preparedAt, PREPARED_AT);

  console.log(
    'PASS: same settlement transaction is idempotent and preserves first persisted intent'
  );
}

/**
 * Once persisted, another customer outpoint cannot replace it.
 */
assertThrows(() => {
  const differentIntent = createCashOutSettlementIntent({
    contractPlan,

    candidate: createCandidate({
      txid: 'cd'.repeat(32),
    }),

    provider: createMainnetMockProvider(),

    preparedAt: '2026-09-10T12:05:00.000Z',
  });

  applyCashOutSettlementIntent(withIntent, differentIntent);
});

console.log(
  'PASS: different second settlement transaction is permanently rejected'
);

/**
 * Intent cannot be persisted before the Cash-out reaches received.
 */
assertThrows(() => {
  applyCashOutSettlementIntent(CASH_OUT, preparedIntent);
});

console.log(
  'PASS: settlement write-ahead boundary requires received payment state'
);

/**
 * Raw transaction and deterministic txid must cryptographically agree.
 */
assertThrows(() => {
  applyCashOutSettlementIntent(RECEIVED_CASH_OUT, {
    ...preparedIntent,

    txid: 'ff'.repeat(32),
  });
});

console.log('PASS: contradictory raw transaction and txid fail closed');

/**
 * Economics cannot be altered at persistence time.
 */
assertThrows(() => {
  applyCashOutSettlementIntent(RECEIVED_CASH_OUT, {
    ...preparedIntent,

    treasuryOutputSats: preparedIntent.treasuryOutputSats - 1,
  });
});

console.log('PASS: mutated settlement economics fail closed');

/**
 * Transaction shape remains frozen.
 */
assertThrows(() => {
  applyCashOutSettlementIntent(RECEIVED_CASH_OUT, {
    ...preparedIntent,

    outputCount: 3 as 2,
  });
});

/**
 * Persisted state must be revalidated on recovery rather than trusted merely
 * because settlementIntent already exists.
 */
assertThrows(() => {
  const corruptedPersistedRecord: CashOutRecord = {
    ...withIntent,

    settlementIntent: withIntent.settlementIntent
      ? {
          ...withIntent.settlementIntent,

          sourceValueSats: withIntent.settlementIntent.sourceValueSats + 1,
        }
      : undefined,
  };

  if (!corruptedPersistedRecord.settlementIntent) {
    throw new Error('Test requires a persisted settlement intent.');
  }

  applyCashOutSettlementIntent(
    corruptedPersistedRecord,
    corruptedPersistedRecord.settlementIntent
  );
});

console.log(
  'PASS: corrupted persisted settlement intent is rejected during recovery'
);

/**
 * Persisted settlement must remain bound to the exact payment recorded by the
 * Cash-out.
 */
assertThrows(() => {
  const contradictoryReceivedRecord: CashOutRecord = {
    ...withIntent,

    receivedTxid: 'ee'.repeat(32),
  };

  if (!contradictoryReceivedRecord.settlementIntent) {
    throw new Error('Test requires a persisted settlement intent.');
  }

  applyCashOutSettlementIntent(
    contradictoryReceivedRecord,
    contradictoryReceivedRecord.settlementIntent
  );
});

/**
 * --------------------------------------------------------------------------
 * D3C PREPARATION / RE-ENTRY ORCHESTRATION
 * --------------------------------------------------------------------------
 */

async function runD3CPreparationTests(): Promise<void> {
  /**
   * First preparation:
   *
   * exactly one transaction is constructed and exactly one write-ahead store
   * operation occurs.
   */
  {
    let createCalls = 0;

    let storeCalls = 0;

    let persistedRecord: CashOutRecord = {
      ...RECEIVED_CASH_OUT,
    };

    const result = await prepareAndStoreCashOutSettlementWithDependencies(
      {
        contractPlan,

        candidate: createCandidate(),

        provider: createMainnetMockProvider(),

        preparedAt: PREPARED_AT,
      },
      {
        async getCashOutRecordById(id) {
          assertEqual(id, RECEIVED_CASH_OUT.id);

          return persistedRecord;
        },

        async storeCashOutSettlementIntent(id, intent) {
          storeCalls += 1;

          assertEqual(id, RECEIVED_CASH_OUT.id);

          persistedRecord = applyCashOutSettlementIntent(
            persistedRecord,
            intent
          );

          return persistedRecord;
        },

        createCashOutSettlementIntent(input) {
          createCalls += 1;

          return createCashOutSettlementIntent(input);
        },
      }
    );

    assertEqual(createCalls, 1);

    assertEqual(storeCalls, 1);

    assertEqual(result.settlementIntent?.txid, preparedIntent.txid);

    assertEqual(
      result.settlementIntent?.rawTransactionHex,
      preparedIntent.rawTransactionHex
    );

    console.log(
      'PASS: first D3 preparation constructs once and durably stores once'
    );
  }

  /**
   * Restart/re-entry:
   *
   * persisted bytes are authoritative.
   *
   * No new transaction is built.
   * No second store operation is attempted.
   */
  {
    let createCalls = 0;

    let storeCalls = 0;

    const alreadyPersisted: CashOutRecord = {
      ...RECEIVED_CASH_OUT,

      settlementIntent: preparedIntent,
    };

    const result = await prepareAndStoreCashOutSettlementWithDependencies(
      {
        contractPlan,

        candidate: createCandidate(),

        provider: createMainnetMockProvider(),

        preparedAt: '2026-09-10T13:00:00.000Z',
      },
      {
        async getCashOutRecordById() {
          return alreadyPersisted;
        },

        async storeCashOutSettlementIntent() {
          storeCalls += 1;

          throw new Error(
            'Store must not be called during persisted-intent recovery.'
          );
        },

        createCashOutSettlementIntent() {
          createCalls += 1;

          throw new Error(
            'Transaction builder must not be called during persisted-intent recovery.'
          );
        },
      }
    );

    assertEqual(createCalls, 0);

    assertEqual(storeCalls, 0);

    assertEqual(result.settlementIntent, alreadyPersisted.settlementIntent);

    assertEqual(result.settlementIntent?.preparedAt, PREPARED_AT);

    console.log(
      'PASS: restart recovery reuses persisted bytes without rebuilding or storing'
    );
  }

  /**
   * A caller cannot recover an existing intent under a different customer
   * outpoint.
   */
  {
    let createCalls = 0;

    let storeCalls = 0;

    const alreadyPersisted: CashOutRecord = {
      ...RECEIVED_CASH_OUT,

      settlementIntent: preparedIntent,
    };

    await assertRejects(async () => {
      await prepareAndStoreCashOutSettlementWithDependencies(
        {
          contractPlan,

          candidate: createCandidate({
            txid: 'cd'.repeat(32),
          }),

          provider: createMainnetMockProvider(),

          preparedAt: PREPARED_AT,
        },
        {
          async getCashOutRecordById() {
            return alreadyPersisted;
          },

          async storeCashOutSettlementIntent() {
            storeCalls += 1;

            return alreadyPersisted;
          },

          createCashOutSettlementIntent() {
            createCalls += 1;

            return preparedIntent;
          },
        }
      );
    });

    assertEqual(createCalls, 0);

    assertEqual(storeCalls, 0);

    console.log(
      'PASS: persisted settlement cannot be recovered under a different customer outpoint'
    );
  }

  /**
   * Missing Cash-out record fails before transaction construction.
   */
  {
    let createCalls = 0;

    let storeCalls = 0;

    await assertRejects(async () => {
      await prepareAndStoreCashOutSettlementWithDependencies(
        {
          contractPlan,

          candidate: createCandidate(),

          provider: createMainnetMockProvider(),

          preparedAt: PREPARED_AT,
        },
        {
          async getCashOutRecordById() {
            return undefined;
          },

          async storeCashOutSettlementIntent() {
            storeCalls += 1;

            return undefined;
          },

          createCashOutSettlementIntent() {
            createCalls += 1;

            return preparedIntent;
          },
        }
      );
    });

    assertEqual(createCalls, 0);

    assertEqual(storeCalls, 0);

    console.log(
      'PASS: missing Cash-out record fails before settlement construction'
    );
  }

  /**
   * If persistence cannot return a durable intent, preparation must fail
   * rather than allowing the in-memory transaction to continue toward D4.
   */
  {
    let createCalls = 0;

    let storeCalls = 0;

    await assertRejects(async () => {
      await prepareAndStoreCashOutSettlementWithDependencies(
        {
          contractPlan,

          candidate: createCandidate(),

          provider: createMainnetMockProvider(),

          preparedAt: PREPARED_AT,
        },
        {
          async getCashOutRecordById() {
            return RECEIVED_CASH_OUT;
          },

          async storeCashOutSettlementIntent() {
            storeCalls += 1;

            return undefined;
          },

          createCashOutSettlementIntent(input) {
            createCalls += 1;

            return createCashOutSettlementIntent(input);
          },
        }
      );
    });

    assertEqual(createCalls, 1);

    assertEqual(storeCalls, 1);

    console.log(
      'PASS: failed durable write-ahead prevents settlement preparation from succeeding'
    );
  }
}

await runD3CPreparationTests();

console.log(
  'PASS: persisted settlement cannot contradict the recorded customer payment'
);

console.log('PASS: mutated normal settlement transaction shape fails closed');

console.log('');

console.log(
  'Cash-out Settlement D3A/D3B/D3C transaction and write-ahead lifecycle tests passed.'
);
