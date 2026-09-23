import { advanceCashOutSettlementNetworkLifecycleWithDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import {
  applyCashOutSettlementBroadcast,
  applyCashOutSettlementReconciliation,
} from 'src/services/cash-out-settlement-broadcast-state';

import type { CashOutSettlementNetworkLifecycleDependencies } from 'src/services/cash-out-settlement-network-lifecycle';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementBroadcastResult,
  CashOutSettlementIntent,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d4g2-001';

const SETTLEMENT_TXID = 'ab'.repeat(32);

const INTENT = {
  status: 'prepared',

  txid: SETTLEMENT_TXID,
} as CashOutSettlementIntent;

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: 'CO-D4G2-001',

    createdAt: '2026-09-17T13:00:00.000Z',

    updatedAt: '2026-09-17T13:00:00.000Z',

    status: 'received',

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function createExplicitInputUnavailable(): CashOutSettlementBroadcastResult {
  return {
    status: 'uncertain',

    txid: SETTLEMENT_TXID,

    errorMessage: 'bad-txns-inputs-missingorspent',

    broadcastEnabled: true,

    requestAttempted: true,

    attemptedAt: '2026-09-17T13:01:00.000Z',

    explicitRejection: {
      kind: 'input_unavailable',

      retrySameTransaction: true,
    },
  };
}

function createBroadcasted(): CashOutSettlementBroadcastResult {
  return {
    status: 'broadcasted',

    txid: SETTLEMENT_TXID,

    serverTxid: SETTLEMENT_TXID,

    broadcastEnabled: true,

    requestAttempted: true,

    attemptedAt: '2026-09-17T13:02:00.000Z',
  };
}

function createReconciliation(
  status: 'unknown' | 'mempool'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    serverChecks: [],

    checkedAt:
      status === 'unknown'
        ? '2026-09-17T13:01:30.000Z'
        : '2026-09-17T13:02:30.000Z',

    message:
      status === 'unknown'
        ? 'Settlement is not yet visible.'
        : 'Settlement is visible in the mempool.',
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

async function runD4G2Tests(): Promise<void> {
  let record: CashOutRecord | undefined = createCashOut();

  let broadcastCalls = 0;

  let reconciliationCalls = 0;

  const broadcastResults: CashOutSettlementBroadcastResult[] = [
    createExplicitInputUnavailable(),

    createBroadcasted(),
  ];

  const reconciliationResults: TreasuryBroadcastReconciliationResult[] = [
    createReconciliation('unknown'),

    createReconciliation('mempool'),
  ];

  const dependencies: CashOutSettlementNetworkLifecycleDependencies = {
    async getCashOutRecordById(id) {
      if (!record || record.id !== id) {
        return undefined;
      }

      return record;
    },

    async storeBroadcast(id, broadcast) {
      if (!record || record.id !== id) {
        return undefined;
      }

      record = applyCashOutSettlementBroadcast(record, broadcast);

      return record;
    },

    async storeReconciliation(id, reconciliation) {
      if (!record || record.id !== id) {
        return undefined;
      }

      record = applyCashOutSettlementReconciliation(record, reconciliation);

      return record;
    },

    async broadcast(intent) {
      broadcastCalls += 1;

      assertEqual(
        intent,
        INTENT,
        'D4G.2 did not reuse the exact persisted settlement intent.'
      );

      const next = broadcastResults.shift();

      if (!next) {
        throw new Error('Unexpected extra settlement broadcast.');
      }

      return next;
    },

    async reconcile(intent) {
      reconciliationCalls += 1;

      assertEqual(
        intent,
        INTENT,
        'D4G.2 did not reconcile the exact persisted settlement intent.'
      );

      const next = reconciliationResults.shift();

      if (!next) {
        throw new Error('Unexpected extra settlement reconciliation.');
      }

      return next;
    },
  };

  /**
   * First attempt:
   *
   * server explicitly rejects because input is unavailable;
   * exact txid reconciliation is still unknown.
   */
  const first = await advanceCashOutSettlementNetworkLifecycleWithDependencies(
    CASH_OUT_ID,
    dependencies
  );

  assertEqual(first.outcome, 'uncertain');

  assertEqual(
    first.record.settlementBroadcast?.explicitRejection?.kind,
    'input_unavailable'
  );

  assertEqual(broadcastCalls, 1);

  assertEqual(reconciliationCalls, 1);

  /**
   * Second invocation:
   *
   * because the rejection was explicit rather than ambiguous, D4 may resubmit
   * the SAME persisted child transaction.
   *
   * No new transaction or txid is created.
   */
  const second = await advanceCashOutSettlementNetworkLifecycleWithDependencies(
    CASH_OUT_ID,
    dependencies
  );

  assertEqual(second.outcome, 'mempool');

  assertEqual(broadcastCalls, 2);

  assertEqual(reconciliationCalls, 2);

  assertEqual(second.record.settlementIntent, INTENT);

  assertEqual(second.record.settlementBroadcast?.txid, SETTLEMENT_TXID);

  assertEqual(second.record.settlementReconciliation?.txid, SETTLEMENT_TXID);

  console.log(
    'PASS: explicit input-unavailable rejection safely retries the same persisted settlement child'
  );

  console.log(
    'PASS: parent/input propagation recovery never constructs a replacement transaction'
  );

  console.log('');

  console.log(
    'Cash-out Settlement D4G.2 input-propagation retry tests passed.'
  );
}

runD4G2Tests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
