import {
  recoverCashOutSettlementConflictAwareAfterRestartWithDependencies,
  type CashOutSettlementConflictAwareRestartDependencies,
  type CashOutSettlementRestartRecoveryResult,
} from 'src/services/cash-out-settlement-restart-recovery';

import type { CashOutSettlementConflictInspectionResult } from 'src/services/cash-out-settlement-conflict-inspector';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5d3c-001';

const CASH_OUT_SERIAL = 'CO-D5D3C-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '44'.repeat(32),

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

function reconciliation(
  status: 'mempool' | 'confirmed'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    blockHeight: status === 'confirmed' ? 900_000 : 0,

    serverChecks: [],

    checkedAt: '2026-09-25T12:05:00.000Z',

    message: `D5D.3c ${status}.`,
  };
}

function conflict(
  overrides: Partial<CashOutSettlementSourceConflictEvidence> = {}
): CashOutSettlementSourceConflictEvidence {
  return {
    state: 'detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    conflictingTxid: CONFLICT_TXID,

    conflictingTransactionStatus: 'mempool',

    conflictingTransactionBlockHeight: 0,

    detectedAt: '2026-09-25T12:06:00.000Z',

    message: 'Different transaction spends exact settlement source.',

    ...overrides,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:05:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    settlementReconciliation: reconciliation('mempool'),

    ...overrides,
  } as CashOutRecord;
}

function inspection(
  status: 'no_conflict_observed' | 'inspection_unavailable'
): CashOutSettlementConflictInspectionResult {
  return {
    status,

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    checkedTransactionCount: 1,

    ...(status === 'inspection_unavailable'
      ? {
          errorMessage: 'Electrum unavailable.',
        }
      : {}),
  };
}

function conflictInspection(
  evidence: CashOutSettlementSourceConflictEvidence
): CashOutSettlementConflictInspectionResult {
  return {
    status: 'conflict_detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    checkedTransactionCount: 1,

    evidence,
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

function createHarness(
  initialRecord: CashOutRecord,
  conflictResult: CashOutSettlementConflictInspectionResult
): {
  dependencies: CashOutSettlementConflictAwareRestartDependencies;

  getRecord: () => CashOutRecord;

  getStoreCalls: () => number;

  getResolveCalls: () => number;
} {
  let durableRecord = JSON.parse(
    JSON.stringify(initialRecord)
  ) as CashOutRecord;

  let storeCalls = 0;

  let resolveCalls = 0;

  const dependencies: CashOutSettlementConflictAwareRestartDependencies = {
    recoverNetwork: async () => {
      const result: CashOutSettlementRestartRecoveryResult = {
        record: durableRecord,

        networkOutcome:
          durableRecord.settlementReconciliation?.status === 'confirmed'
            ? 'confirmed'
            : 'mempool',

        merchantSafety: {
          safeToHandCash: true,

          reason:
            durableRecord.settlementReconciliation?.status === 'confirmed'
              ? 'settlement_confirmed'
              : 'settlement_mempool',

          settlementEvidence:
            durableRecord.settlementReconciliation?.status === 'confirmed'
              ? 'confirmed'
              : 'mempool',

          message: 'Pre-conflict-check D5C result.',
        },
      };

      return result;
    },

    inspectConflict: async () => conflictResult,

    storeConflict: async (_id, evidence) => {
      storeCalls += 1;

      durableRecord = {
        ...durableRecord,

        settlementSourceConflict: evidence,

        updatedAt: evidence.detectedAt,
      };

      return durableRecord;
    },

    resolveConflict: async (_id, resolvedAt) => {
      resolveCalls += 1;

      const existing = durableRecord.settlementSourceConflict;

      if (!existing) {
        throw new Error('Expected active conflict.');
      }

      durableRecord = {
        ...durableRecord,

        settlementSourceConflict: {
          ...existing,

          state: 'resolved',

          resolvedAt,

          resolution: 'exact_settlement_confirmed',
        },

        updatedAt: resolvedAt,
      };

      return durableRecord;
    },

    now: () => '2026-09-25T12:10:00.000Z',
  };

  return {
    dependencies,

    getRecord: () => JSON.parse(JSON.stringify(durableRecord)) as CashOutRecord,

    getStoreCalls: () => storeCalls,

    getResolveCalls: () => resolveCalls,
  };
}

async function runD5D3CTests(): Promise<void> {
  /**
   * This is the core D5D security test:
   *
   * D5C initially thinks mempool settlement evidence is safe.
   * D5D discovers a concrete conflicting spender.
   * Conflict is persisted BEFORE the final merchant decision.
   */
  {
    const evidence = conflict();

    const harness = createHarness(
      cashOut(),

      conflictInspection(evidence)
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(harness.getStoreCalls(), 1);

    assertEqual(
      result.record.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    assertEqual(result.merchantSafety.safeToHandCash, false);

    assertEqual(result.merchantSafety.reason, 'settlement_source_conflict');

    console.log(
      'PASS: proven conflict is persisted before restart recovery may authorise merchant cash'
    );
  }

  /**
   * No observed conflict leaves ordinary positive settlement evidence safe.
   */
  {
    const record = cashOut();

    const harness = createHarness(
      record,

      inspection('no_conflict_observed')
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(harness.getStoreCalls(), 0);

    assertEqual(harness.getResolveCalls(), 0);

    assertEqual(result.merchantSafety.safeToHandCash, true);

    assertEqual(result.merchantSafety.reason, 'settlement_mempool');

    console.log(
      'PASS: absence of positive conflict evidence preserves normal mempool settlement safety'
    );
  }

  /**
   * Failure to complete the additional conflict scan does not invent a
   * conflict, nor does it erase authoritative positive settlement evidence.
   */
  {
    const record = cashOut();

    const harness = createHarness(
      record,

      inspection('inspection_unavailable')
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(result.conflictInspection.status, 'inspection_unavailable');

    assertEqual(result.merchantSafety.safeToHandCash, true);

    console.log(
      'PASS: unavailable auxiliary conflict inspection does not fabricate contradictory evidence'
    );
  }

  /**
   * However, unavailable inspection can NEVER erase an already-durable
   * conflict.
   */
  {
    const record = cashOut({
      settlementSourceConflict: conflict(),
    });

    const harness = createHarness(
      record,

      inspection('inspection_unavailable')
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(harness.getResolveCalls(), 0);

    assertEqual(result.merchantSafety.safeToHandCash, false);

    assertEqual(result.merchantSafety.reason, 'settlement_source_conflict');

    console.log(
      'PASS: network uncertainty cannot clear durable conflict evidence after restart'
    );
  }

  /**
   * A previous mempool conflict may disappear, but that alone is insufficient.
   *
   * Exact settlement confirmation is additionally required.
   */
  {
    const record = cashOut({
      settlementSourceConflict: conflict(),
    });

    const harness = createHarness(
      record,

      inspection('no_conflict_observed')
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(harness.getResolveCalls(), 0);

    assertEqual(result.merchantSafety.safeToHandCash, false);

    console.log(
      'PASS: disappearing mempool conflict cannot clear hard stop while settlement remains unconfirmed'
    );
  }

  /**
   * Previous mempool conflict + no current conflict + exact confirmed
   * settlement is the narrow normal resolution path.
   */
  {
    const record = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: conflict(),
    });

    const harness = createHarness(
      record,

      inspection('no_conflict_observed')
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(harness.getResolveCalls(), 1);

    assertEqual(result.record.settlementSourceConflict?.state, 'resolved');

    assertEqual(result.merchantSafety.safeToHandCash, true);

    assertEqual(result.merchantSafety.reason, 'settlement_confirmed');

    console.log(
      'PASS: exact confirmation explicitly resolves a disappeared mempool conflict after restart'
    );
  }

  /**
   * Confirmed conflict evidence remains a hard stop even when current scan no
   * longer observes it and another source claims settlement confirmation.
   */
  {
    const record = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: conflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 899_999,
      }),
    });

    const harness = createHarness(
      record,

      inspection('no_conflict_observed')
    );

    const result =
      await recoverCashOutSettlementConflictAwareAfterRestartWithDependencies(
        CASH_OUT_ID,
        harness.dependencies
      );

    assertEqual(harness.getResolveCalls(), 0);

    assertEqual(result.merchantSafety.safeToHandCash, false);

    assertEqual(result.merchantSafety.reason, 'settlement_source_conflict');

    console.log(
      'PASS: contradictory confirmed conflict evidence remains a hard stop after restart'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5D.3c conflict-aware restart tests passed.'
  );
}

runD5D3CTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
