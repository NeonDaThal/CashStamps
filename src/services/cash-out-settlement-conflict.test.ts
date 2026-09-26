import { evaluateCashOutSettlementSourceConflict } from 'src/services/cash-out-settlement-conflict';

import { evaluateCashOutSettlementMerchantSafety } from 'src/services/cash-out-settlement-merchant-safety';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementIntent,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d5d-001';

const CASH_OUT_SERIAL = 'CO-D5D-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '44'.repeat(32);

const REQUIRED_SATS = 206_000;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '33'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: 0,

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

    checkedAt: '2026-09-25T12:03:00.000Z',

    message: `D5D ${status}.`,
  };
}

function activeConflict(
  overrides: Partial<CashOutSettlementSourceConflictEvidence> = {}
): CashOutSettlementSourceConflictEvidence {
  return {
    state: 'detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 0,

    expectedSettlementTxid: SETTLEMENT_TXID,

    conflictingTxid: CONFLICT_TXID,

    conflictingTransactionStatus: 'mempool',

    conflictingTransactionBlockHeight: 0,

    detectedAt: '2026-09-25T12:02:00.000Z',

    message:
      'A different transaction spends the selected customer payment output.',

    ...overrides,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
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

    settlementReconciliation: reconciliation('mempool'),

    ...overrides,
  } as CashOutRecord;
}

function assertEqual(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(actual)} to equal ${String(expected)}.`);
  }
}

function runD5D1Tests(): void {
  {
    const record = cashOut();

    assertEqual(evaluateCashOutSettlementSourceConflict(record), 'none');

    assertEqual(
      evaluateCashOutSettlementMerchantSafety(record).safeToHandCash,
      true
    );

    console.log(
      'PASS: normal positive settlement remains merchant-safe with no conflict evidence'
    );
  }

  {
    const record = cashOut({
      settlementSourceConflict: activeConflict(),
    });

    assertEqual(evaluateCashOutSettlementSourceConflict(record), 'active');

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'settlement_source_conflict');

    console.log(
      'PASS: concrete conflicting spender hard-stops cash handover despite settlement mempool evidence'
    );
  }

  {
    const record = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: activeConflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 899_999,
      }),
    });

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'settlement_source_conflict');

    console.log(
      'PASS: unresolved confirmed conflict remains a hard stop even with contradictory settlement evidence'
    );
  }

  {
    const record = cashOut({
      settlementSourceConflict: activeConflict({
        conflictingTxid: SETTLEMENT_TXID,
      }),
    });

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'invalid_settlement_state');

    console.log(
      'PASS: exact settlement transaction cannot be mislabeled as a conflict'
    );
  }

  {
    const record = cashOut({
      settlementSourceConflict: activeConflict({
        sourceOutpointIndex: 1,
      }),
    });

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'invalid_settlement_state');

    console.log(
      'PASS: conflict evidence for another output cannot poison or authorize this settlement'
    );
  }

  {
    const record = cashOut({
      settlementSourceConflict: activeConflict({
        conflictingTransactionStatus: 'confirmed',

        conflictingTransactionBlockHeight: 0,
      }),
    });

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'invalid_settlement_state');

    console.log('PASS: malformed confirmed conflict evidence fails closed');
  }

  {
    const record = cashOut({
      settlementReconciliation: reconciliation('confirmed'),

      settlementSourceConflict: {
        ...activeConflict(),

        state: 'resolved',

        resolvedAt: '2026-09-25T12:04:00.000Z',

        resolution: 'exact_settlement_confirmed',
      },
    });

    assertEqual(evaluateCashOutSettlementSourceConflict(record), 'resolved');

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, true);

    assertEqual(safety.reason, 'settlement_confirmed');

    console.log(
      'PASS: conflict may be resolved only by confirmed evidence for the exact deterministic settlement'
    );
  }

  {
    const record = cashOut({
      settlementSourceConflict: {
        ...activeConflict(),

        state: 'resolved',

        resolvedAt: '2026-09-25T12:04:00.000Z',

        resolution: 'exact_settlement_confirmed',
      },
    });

    const safety = evaluateCashOutSettlementMerchantSafety(record);

    assertEqual(safety.safeToHandCash, false);

    assertEqual(safety.reason, 'invalid_settlement_state');

    console.log(
      'PASS: conflict cannot be falsely resolved while settlement is only in mempool'
    );
  }

  console.log('');

  console.log('Cash-out Settlement D5D.1 conflict hard-stop tests passed.');
}

runD5D1Tests();
