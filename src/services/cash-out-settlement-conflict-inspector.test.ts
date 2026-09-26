import {
  inspectCashOutSettlementSourceConflictWithDependencies,
  type CashOutSettlementConflictHistoryItem,
  type CashOutSettlementConflictInspectorDependencies,
  type CashOutSettlementConflictTransactionInput,
} from 'src/services/cash-out-settlement-conflict-inspector';

import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5d2-001';

const CASH_OUT_SERIAL = 'CO-D5D2-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const UNRELATED_TXID = '33'.repeat(32);

const CONFLICT_TXID = '44'.repeat(32);

const SECOND_CONFLICT_TXID = '55'.repeat(32);

const OTHER_PREVIOUS_TXID = '66'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '77'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: 2,

  sourceValueSats: REQUIRED_SATS,

  rawTransactionHex: '00',

  txid: SETTLEMENT_TXID,

  rawTransactionBytesLength: 1,

  treasuryAddress: 'bitcoincash:q-test-treasury',

  treasuryOutputSats: 203_687,

  platformAddress: 'bitcoincash:q-test-platform',

  platformOutputSats: 2_000,

  actualFeeSats: 313,

  inputCount: 1,

  outputCount: 2,

  broadcastEnabled: false,

  preparedAt: '2026-09-25T12:00:00.000Z',
};

function createReconciliation(): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status: 'mempool',

    blockHeight: 0,

    serverChecks: [],

    checkedAt: '2026-09-25T12:03:00.000Z',

    message: 'D5D.2 test settlement mempool evidence.',
  };
}

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:03:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    settlementReconciliation: createReconciliation(),

    ...overrides,
  } as CashOutRecord;
}

function input(
  previousTxid: string,
  previousOutputIndex: number
): CashOutSettlementConflictTransactionInput {
  return {
    previousTxid,
    previousOutputIndex,
  };
}

function createDependencies(
  history: CashOutSettlementConflictHistoryItem[],
  inputsByTxid: Record<string, CashOutSettlementConflictTransactionInput[]>
): CashOutSettlementConflictInspectorDependencies {
  return {
    getContractHistory: async (contractAddress) => {
      if (contractAddress !== INTENT.contractAddress) {
        throw new Error('Inspector queried the wrong contract address.');
      }

      return history;
    },

    getTransactionInputs: async (txid) => {
      const inputs = inputsByTxid[txid];

      if (!inputs) {
        throw new Error(`No transaction fixture for ${txid}.`);
      }

      return inputs;
    },

    now: () => '2026-09-25T12:05:00.000Z',
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

async function runD5D2Tests(): Promise<void> {
  /**
   * No contract activity beyond the customer transaction is not a conflict.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: CUSTOMER_TXID,

            height: 0,
          },
        ],

        {}
      )
    );

    assertEqual(result.status, 'no_conflict_observed');

    assertEqual(result.checkedTransactionCount, 0);

    console.log('PASS: customer payment alone is not conflict evidence');
  }

  /**
   * The normal deterministic settlement spending the selected output must
   * never be treated as a conflicting spender.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: CUSTOMER_TXID,

            height: 0,
          },

          {
            txid: SETTLEMENT_TXID,

            height: 0,
          },
        ],

        {}
      )
    );

    assertEqual(result.status, 'no_conflict_observed');

    assertEqual(result.checkedTransactionCount, 0);

    console.log(
      'PASS: exact deterministic settlement is excluded from conflict classification'
    );
  }

  /**
   * Other contract history is harmless unless it consumes the exact selected
   * customer output.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: UNRELATED_TXID,

            height: 0,
          },
        ],

        {
          [UNRELATED_TXID]: [input(OTHER_PREVIOUS_TXID, 2)],
        }
      )
    );

    assertEqual(result.status, 'no_conflict_observed');

    assertEqual(result.checkedTransactionCount, 1);

    console.log(
      'PASS: unrelated contract transaction does not create false conflict evidence'
    );
  }

  /**
   * Even spending another output of the same customer transaction is NOT the
   * exact selected source outpoint.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: UNRELATED_TXID,

            height: 0,
          },
        ],

        {
          [UNRELATED_TXID]: [input(CUSTOMER_TXID, 1)],
        }
      )
    );

    assertEqual(result.status, 'no_conflict_observed');

    console.log(
      'PASS: another output from the same parent transaction does not conflict with selected txid:vout'
    );
  }

  /**
   * A different mempool transaction consuming the exact source is positive
   * conflict evidence.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: CONFLICT_TXID,

            height: 0,
          },
        ],

        {
          [CONFLICT_TXID]: [input(CUSTOMER_TXID, 2)],
        }
      )
    );

    assertEqual(result.status, 'conflict_detected');

    assertEqual(result.evidence?.conflictingTxid, CONFLICT_TXID);

    assertEqual(result.evidence?.conflictingTransactionStatus, 'mempool');

    assertEqual(result.evidence?.conflictingTransactionBlockHeight, 0);

    console.log(
      'PASS: different mempool spender of exact selected outpoint creates conflict evidence'
    );
  }

  /**
   * Negative Electrum-style unconfirmed heights are normalised to mempool
   * conflict evidence rather than invalid confirmation evidence.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: CONFLICT_TXID,

            height: -1,
          },
        ],

        {
          [CONFLICT_TXID]: [input(CUSTOMER_TXID, 2)],
        }
      )
    );

    assertEqual(result.status, 'conflict_detected');

    assertEqual(result.evidence?.conflictingTransactionStatus, 'mempool');

    assertEqual(result.evidence?.conflictingTransactionBlockHeight, 0);

    console.log(
      'PASS: unconfirmed negative history height maps safely to mempool conflict evidence'
    );
  }

  /**
   * A confirmed different spender is stronger positive conflict evidence.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: CONFLICT_TXID,

            height: 899_999,
          },
        ],

        {
          [CONFLICT_TXID]: [input(CUSTOMER_TXID, 2)],
        }
      )
    );

    assertEqual(result.status, 'conflict_detected');

    assertEqual(result.evidence?.conflictingTransactionStatus, 'confirmed');

    assertEqual(result.evidence?.conflictingTransactionBlockHeight, 899_999);

    console.log(
      'PASS: confirmed different spender creates confirmed conflict evidence'
    );
  }

  /**
   * If inconsistent history exposes multiple conflicting spenders, confirmed
   * evidence wins deterministically.
   */
  {
    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),

      createDependencies(
        [
          {
            txid: CONFLICT_TXID,

            height: 0,
          },

          {
            txid: SECOND_CONFLICT_TXID,

            height: 899_999,
          },
        ],

        {
          [CONFLICT_TXID]: [input(CUSTOMER_TXID, 2)],

          [SECOND_CONFLICT_TXID]: [input(CUSTOMER_TXID, 2)],
        }
      )
    );

    assertEqual(result.status, 'conflict_detected');

    assertEqual(result.evidence?.conflictingTxid, SECOND_CONFLICT_TXID);

    assertEqual(result.evidence?.conflictingTransactionStatus, 'confirmed');

    console.log(
      'PASS: strongest concrete conflict evidence is selected deterministically'
    );
  }

  /**
   * An incomplete network inspection cannot be classified as "no conflict".
   */
  {
    const dependencies: CashOutSettlementConflictInspectorDependencies = {
      getContractHistory: async () => [
        {
          txid: UNRELATED_TXID,

          height: 0,
        },
      ],

      getTransactionInputs: async () => {
        throw new Error('Electrum transaction lookup unavailable.');
      },

      now: () => '2026-09-25T12:05:00.000Z',
    };

    const result = await inspectCashOutSettlementSourceConflictWithDependencies(
      createCashOut(),
      dependencies
    );

    assertEqual(result.status, 'inspection_unavailable');

    assertEqual(result.evidence, undefined);

    console.log(
      'PASS: incomplete inspection never creates false no-conflict or conflict evidence'
    );
  }

  /**
   * The evidence produced by the inspector must plug directly into D5D.1's
   * merchant hard stop.
   */
  {
    const baseRecord = createCashOut();

    const inspection =
      await inspectCashOutSettlementSourceConflictWithDependencies(
        baseRecord,

        createDependencies(
          [
            {
              txid: CONFLICT_TXID,

              height: 0,
            },
          ],

          {
            [CONFLICT_TXID]: [input(CUSTOMER_TXID, 2)],
          }
        )
      );

    if (!inspection.evidence) {
      throw new Error('Expected conflict evidence.');
    }

    const recordWithConflict: CashOutRecord = {
      ...baseRecord,

      settlementSourceConflict: inspection.evidence,
    };

    const safety = evaluateCashOutSettlementMerchantSafety(recordWithConflict);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'settlement_source_conflict');

    console.log(
      'PASS: inspector evidence directly activates D5D merchant hard stop'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5D.2a exact-outpoint conflict inspector tests passed.'
  );
}

runD5D2Tests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
