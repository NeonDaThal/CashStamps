import {
  applyConfirmedCashOutSettlementRecoveryToReceived,
  evaluateConfirmedCashOutSettlementRecovery,
} from './cash-out-settlement-recovery-lifecycle';

import type { CashOutRecord } from 'src/types/cash-out';

const CASH_OUT_ID = 'cash-out-d6h-001';

const RECOVERY_TXID =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const INPUT_TXID =
  '1111111111111111111111111111111111111111111111111111111111111111';

const OTHER_TXID =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const RECOVERY_INPUT_SATS = 180_000;

const CONFIRMED_AT = '2026-10-08T16:30:00.000Z';

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

function recoveryIntent(): NonNullable<CashOutRecord['recoveryIntent']> {
  return {
    version: 'cash_out_recovery_signed_transaction_v1',

    cashOutId: CASH_OUT_ID,

    contractAddress: 'bitcoincash:p-d6h-recovery-contract',

    inputSetId: 'd6h-input-set-001',

    rawTransactionHex: '00',

    txid: RECOVERY_TXID,

    transactionBytes: 1,

    actualFeeSats: 608,

    preparedAt: '2026-10-08T16:00:00.000Z',

    signingRequest: {
      version: 'cash_out_recovery_signing_request_v1',

      cashOutId: CASH_OUT_ID,

      contractAddress: 'bitcoincash:p-d6h-recovery-contract',

      inputSetId: 'd6h-input-set-001',

      inputCount: 1,

      totalInputSats: RECOVERY_INPUT_SATS,

      inputs: [
        {
          outpoint: `${INPUT_TXID}:0`,

          txid: INPUT_TXID,

          vout: 0,

          satoshis: RECOVERY_INPUT_SATS,

          height: 900_000,

          networkState: 'confirmed',
        },
      ],

      exceptionalCase: 'underpayment',

      recoveryFeeSats: 608,

      treasuryDestination: {
        address: 'bitcoincash:q-d6h-treasury',

        publicKeyHashHex: '11'.repeat(20),
      },

      treasuryOutputSats: 178_392,

      platformDestination: {
        address: 'bitcoincash:q-d6h-platform',

        publicKeyHashHex: '22'.repeat(20),
      },

      platformOutputSats: 1_000,

      outputCount: 2,
    },

    transactionSummary: {} as NonNullable<
      CashOutRecord['recoveryIntent']
    >['transactionSummary'],
  };
}

function reconciliation(
  status: 'mempool' | 'confirmed' | 'unknown' | 'unavailable',
  txid = RECOVERY_TXID
): NonNullable<CashOutRecord['recoveryReconciliation']> {
  return {
    txid,

    status,

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_001,
        }
      : {}),

    serverChecks: [],

    checkedAt: CONFIRMED_AT,

    message: `D6H synthetic ${status} recovery reconciliation.`,
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: 'CO-D6H-001',

    createdAt: '2026-10-08T15:00:00.000Z',

    updatedAt: '2026-10-08T16:00:00.000Z',

    fiatCurrency: 'GBP',

    fiatAmountMinor: 10_000,

    bchSatsRequired: 206_000,

    status: 'received',

    recoveryIntent: recoveryIntent(),

    recoveryReconciliation: reconciliation('confirmed'),

    ...overrides,
  } as CashOutRecord;
}

/**
 * Confirmed exceptional recovery restores the received business boundary,
 * but does not complete the Cash-out.
 */
{
  const original = cashOut({
    status: 'cancelled',

    cancelledAt: '2026-10-08T15:45:00.000Z',

    bchSatsReceived: undefined,
  });

  const decision = evaluateConfirmedCashOutSettlementRecovery(original);

  assertEqual(decision.readyForReceivedState, true);

  assertEqual(decision.reason, 'recovery_confirmed');

  const restored = applyConfirmedCashOutSettlementRecoveryToReceived(original);

  assertEqual(restored.status, 'received');

  assertEqual(restored.bchSatsReceived, RECOVERY_INPUT_SATS);

  assertEqual(restored.completedAt, undefined);

  assertEqual(restored.cancelledAt, '2026-10-08T15:45:00.000Z');

  console.log(
    'PASS: confirmed late-payment recovery restores cancelled Cash-out to received without completing it'
  );
}

/**
 * Recovery mempool visibility is deliberately not yet sufficient to authorise
 * the recovery lifecycle boundary.
 */
{
  const record = cashOut({
    recoveryReconciliation: reconciliation('mempool'),
  });

  const decision = evaluateConfirmedCashOutSettlementRecovery(record);

  assertEqual(decision.readyForReceivedState, false);

  assertEqual(decision.reason, 'recovery_mempool_wait_for_confirmation');

  assertThrows(
    () => applyConfirmedCashOutSettlementRecoveryToReceived(record),

    'recovery_mempool_wait_for_confirmation'
  );

  console.log(
    'PASS: recovery mempool evidence does not yet authorise physical-cash lifecycle'
  );
}

/**
 * Unknown exact-tx visibility remains unsafe.
 */
{
  const decision = evaluateConfirmedCashOutSettlementRecovery(
    cashOut({
      recoveryReconciliation: reconciliation('unknown'),
    })
  );

  assertEqual(decision.readyForReceivedState, false);

  assertEqual(decision.reason, 'recovery_unknown');

  console.log(
    'PASS: unknown recovery transaction visibility cannot restore received state'
  );
}

/**
 * Network unavailable remains unsafe.
 */
{
  const decision = evaluateConfirmedCashOutSettlementRecovery(
    cashOut({
      recoveryReconciliation: reconciliation('unavailable'),
    })
  );

  assertEqual(decision.readyForReceivedState, false);

  assertEqual(decision.reason, 'recovery_unavailable');

  console.log(
    'PASS: unavailable recovery network state cannot restore received state'
  );
}

/**
 * Reconciliation must belong to the exact persisted recovery transaction.
 */
{
  const decision = evaluateConfirmedCashOutSettlementRecovery(
    cashOut({
      recoveryReconciliation: reconciliation('confirmed', OTHER_TXID),
    })
  );

  assertEqual(decision.readyForReceivedState, false);

  assertEqual(decision.reason, 'recovery_txid_mismatch');

  console.log(
    'PASS: foreign recovery txid evidence cannot advance Cash-out lifecycle'
  );
}

/**
 * The exact frozen recovery input identity is revalidated before business
 * lifecycle state may advance.
 */
{
  const intent = recoveryIntent();

  intent.signingRequest.totalInputSats = RECOVERY_INPUT_SATS + 1;

  const decision = evaluateConfirmedCashOutSettlementRecovery(
    cashOut({
      recoveryIntent: intent,
    })
  );

  assertEqual(decision.readyForReceivedState, false);

  assertEqual(decision.reason, 'recovery_input_identity_invalid');

  console.log('PASS: inconsistent recovery input total fails closed');
}

/**
 * awaiting_payment may become received after confirmed exceptional recovery.
 */
{
  const restored = applyConfirmedCashOutSettlementRecoveryToReceived(
    cashOut({
      status: 'awaiting_payment',

      bchSatsReceived: undefined,
    })
  );

  assertEqual(restored.status, 'received');

  assertEqual(restored.bchSatsReceived, RECOVERY_INPUT_SATS);

  assertEqual(restored.completedAt, undefined);

  console.log(
    'PASS: confirmed exceptional recovery may restore awaiting_payment to received'
  );
}

/**
 * A Cash-out already at received remains a single received business event.
 */
{
  const record = cashOut({
    status: 'received',

    bchSatsReceived: RECOVERY_INPUT_SATS,
  });

  const replay = applyConfirmedCashOutSettlementRecoveryToReceived(record);

  assertEqual(replay, record);

  console.log('PASS: recovery received-state replay is idempotent');
}

/**
 * Completed is terminal and recovery must never reopen it.
 */
{
  const completed = cashOut({
    status: 'completed',

    completedAt: '2026-10-08T16:40:00.000Z',
  });

  const decision = evaluateConfirmedCashOutSettlementRecovery(completed);

  assertEqual(decision.readyForReceivedState, false);

  assertEqual(decision.reason, 'cash_out_already_completed');

  const replay = applyConfirmedCashOutSettlementRecoveryToReceived(completed);

  assertEqual(replay, completed);

  assertEqual(replay.status, 'completed');

  console.log(
    'PASS: completed Cash-out is never reopened by exceptional recovery'
  );
}

console.log('');

console.log('Cash-out Settlement D6H.1 recovery lifecycle tests passed.');
