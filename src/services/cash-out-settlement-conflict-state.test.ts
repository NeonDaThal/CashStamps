import {
  applyCashOutSettlementSourceConflictEvidence,
  resolveCashOutSettlementSourceConflictWithConfirmedSettlement,
} from 'src/services/cash-out-settlement-conflict-state';

import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5d3-001';

const CASH_OUT_SERIAL = 'CO-D5D3-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const DIFFERENT_CONFLICT_TXID = '44'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '55'.repeat(32),

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

    message: `D5D.3 ${status}.`,
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

    detectedAt: '2026-09-25T12:02:00.000Z',

    message: 'Different transaction spends exact settlement source.',

    ...overrides,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:01:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    settlementReconciliation: reconciliation('mempool'),

    ...overrides,
  } as CashOutRecord;
}

function restart<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function assertThrows(
  operation: () => unknown,
  expectedMessagePart: string
): void {
  try {
    operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected error containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(`Expected operation to throw "${expectedMessagePart}".`);
}

function runD5D3ATests(): void {
  /**
   * First positive conflict becomes durable state.
   */
  {
    const updated = applyCashOutSettlementSourceConflictEvidence(
      cashOut(),
      conflict()
    );

    assertEqual(
      updated.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    assertEqual(
      evaluateCashOutSettlementMerchantSafety(updated).reason,
      'settlement_source_conflict'
    );

    console.log(
      'PASS: first positive conflict evidence activates durable merchant hard stop'
    );
  }

  /**
   * Repeating the same mempool observation is idempotent.
   */
  {
    const original = cashOut({
      settlementSourceConflict: conflict(),
    });

    const updated = applyCashOutSettlementSourceConflictEvidence(
      original,

      conflict({
        detectedAt: '2026-09-25T12:10:00.000Z',
      })
    );

    assertEqual(updated, original);

    assertEqual(
      updated.settlementSourceConflict?.detectedAt,
      '2026-09-25T12:02:00.000Z'
    );

    console.log(
      'PASS: repeated mempool conflict observation is idempotent and preserves first detection time'
    );
  }

  /**
   * Same concrete conflicting transaction may strengthen to confirmed.
   */
  {
    const original = cashOut({
      settlementSourceConflict: conflict(),
    });

    const updated = applyCashOutSettlementSourceConflictEvidence(
      original,

      conflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 899_999,

        detectedAt: '2026-09-25T12:10:00.000Z',

        message: 'Conflicting transaction is now confirmed.',
      })
    );

    assertEqual(
      updated.settlementSourceConflict?.conflictingTransactionStatus,
      'confirmed'
    );

    assertEqual(
      updated.settlementSourceConflict?.conflictingTransactionBlockHeight,
      899_999
    );

    assertEqual(
      updated.settlementSourceConflict?.detectedAt,
      '2026-09-25T12:02:00.000Z'
    );

    console.log(
      'PASS: same conflicting spender strengthens monotonically from mempool to confirmed'
    );
  }

  /**
   * Confirmed conflict must never downgrade back to mempool.
   */
  {
    const original = cashOut({
      settlementSourceConflict: conflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 899_999,
      }),
    });

    const updated = applyCashOutSettlementSourceConflictEvidence(
      original,
      conflict()
    );

    assertEqual(updated, original);

    assertEqual(
      updated.settlementSourceConflict?.conflictingTransactionStatus,
      'confirmed'
    );

    console.log('PASS: confirmed conflict evidence cannot downgrade');
  }

  /**
   * A new/different conflicting txid cannot silently rewrite durable audit
   * evidence.
   */
  {
    const original = cashOut({
      settlementSourceConflict: conflict(),
    });

    assertThrows(
      () =>
        applyCashOutSettlementSourceConflictEvidence(
          original,

          conflict({
            conflictingTxid: DIFFERENT_CONFLICT_TXID,
          })
        ),

      'different conflicting transaction'
    );

    assertEqual(
      original.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    console.log(
      'PASS: different conflicting transaction cannot silently replace durable conflict evidence'
    );
  }

  /**
   * Mempool settlement evidence is not enough to resolve a previous conflict.
   */
  {
    const original = cashOut({
      settlementSourceConflict: conflict(),
    });

    assertThrows(
      () =>
        resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
          original,

          '2026-09-25T12:20:00.000Z'
        ),

      'only be resolved after confirmed evidence'
    );

    console.log(
      'PASS: mempool settlement evidence cannot clear a durable conflict hard stop'
    );
  }

  /**
   * Exact settlement confirmation is the one permitted normal-path resolution.
   */
  {
    const original = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: conflict(),
    });

    const resolved =
      resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
        original,

        '2026-09-25T12:20:00.000Z'
      );

    assertEqual(resolved.settlementSourceConflict?.state, 'resolved');

    assertEqual(
      resolved.settlementSourceConflict?.resolution,
      'exact_settlement_confirmed'
    );

    assertEqual(
      evaluateCashOutSettlementMerchantSafety(resolved).safeToHandCash,
      true
    );

    console.log(
      'PASS: exact confirmed settlement explicitly resolves prior conflict evidence'
    );
  }

  /**
   * Resolution is itself idempotent.
   */
  {
    const original = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: {
        ...conflict(),

        state: 'resolved',

        resolvedAt: '2026-09-25T12:20:00.000Z',

        resolution: 'exact_settlement_confirmed',
      },
    });

    const resolvedAgain =
      resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
        original,

        '2026-09-25T12:30:00.000Z'
      );

    assertEqual(resolvedAgain, original);

    console.log('PASS: already-resolved conflict remains idempotent');
  }

  /**
   * Once explicitly resolved, ordinary detection cannot silently reactivate the
   * hard stop.
   */
  {
    const original = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: {
        ...conflict(),

        state: 'resolved',

        resolvedAt: '2026-09-25T12:20:00.000Z',

        resolution: 'exact_settlement_confirmed',
      },
    });

    assertThrows(
      () => applyCashOutSettlementSourceConflictEvidence(original, conflict()),

      'Resolved settlement conflict'
    );

    console.log(
      'PASS: resolved conflict cannot be silently reactivated by ordinary detection'
    );
  }

  /**
   * Simulate complete app death after active conflict persistence.
   *
   * The durable evidence alone must recreate the hard stop.
   */
  {
    const withConflict = applyCashOutSettlementSourceConflictEvidence(
      cashOut(),
      conflict()
    );

    const restarted = restart(withConflict);

    const safety = evaluateCashOutSettlementMerchantSafety(restarted);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'settlement_source_conflict');

    assertEqual(
      restarted.settlementSourceConflict?.conflictingTxid,
      CONFLICT_TXID
    );

    console.log(
      'PASS: durable conflict evidence recreates merchant hard stop after complete restart'
    );
  }

  /**
   * A confirmed conflicting spender plus confirmed settlement evidence is
   * contradictory chain state and must never auto-resolve.
   */
  {
    const original = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: conflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 899_999,
      }),
    });

    assertThrows(
      () =>
        resolveCashOutSettlementSourceConflictWithConfirmedSettlement(
          original,

          '2026-09-25T12:20:00.000Z'
        ),

      'Confirmed conflicting-spender evidence'
    );

    assertEqual(
      evaluateCashOutSettlementMerchantSafety(original).reason,

      'settlement_source_conflict'
    );

    console.log(
      'PASS: confirmed conflicting spender cannot be auto-resolved by contradictory settlement confirmation'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5D.3a durable conflict-state tests passed.'
  );
}

runD5D3ATests();
