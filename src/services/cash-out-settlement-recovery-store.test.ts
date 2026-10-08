import { applyCashOutSettlementRecoveryIntent } from './cash-out-settlement-recovery-store';

import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';

import type { CashOutRecord } from 'src/types/cash-out';

function assertEqual(
  actual: unknown,
  expected: unknown,
  message = 'Expected values to be equal.'
): void {
  if (actual !== expected) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`
    );
  }
}

function assertThrows(
  action: () => unknown,
  message = 'Expected action to throw.'
): void {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  if (!threw) {
    throw new Error(message);
  }
}

function pass(message: string): void {
  console.log(`PASS: ${message}`);
}

const CASH_OUT_ID = 'cash-out-d6e4-test';

function createRecord(): CashOutRecord {
  return {
    id: CASH_OUT_ID,
    updatedAt: '2026-10-08T12:00:00.000Z',
  } as CashOutRecord;
}

function createIntent(
  txidCharacter = 'a',
  rawTransactionHex = '00aa'
): CashOutSettlementRecoverySignedTransactionArtifact {
  const txid = txidCharacter.repeat(64);

  return {
    version: 'cash_out_recovery_signed_transaction_v1',

    cashOutId: CASH_OUT_ID,

    contractAddress: 'bitcoincash:precovery-contract-test',

    inputSetId: 'recovery-input-set-test',

    rawTransactionHex,

    txid,

    transactionBytes: rawTransactionHex.length / 2,

    actualFeeSats: 1_138,

    preparedAt: '2026-10-08T12:00:00.000Z',

    signingRequest: {
      version: 'cash_out_recovery_signing_request_v1',

      cashOutId: CASH_OUT_ID,

      contractAddress: 'bitcoincash:precovery-contract-test',

      inputSetId: 'recovery-input-set-test',

      inputCount: 1,

      totalInputSats: 206_000,

      inputs: [],

      exceptionalCase: 'underpayment',

      recoveryFeeSats: 1_138,

      treasuryDestination: {
        address: 'bitcoincash:qtreasury-test',

        publicKeyHashHex: '1111111111111111111111111111111111111111',
      },

      treasuryOutputSats: 202_862,

      platformDestination: {
        address: 'bitcoincash:qplatform-test',

        publicKeyHashHex: '2222222222222222222222222222222222222222',
      },

      platformOutputSats: 2_000,

      outputCount: 2,
    },

    transactionSummary: {
      cashOutId: CASH_OUT_ID,

      contractAddress: 'bitcoincash:precovery-contract-test',

      inputCount: 1,

      inputs: [],

      outputCount: 2,

      outputs: [],

      feeSats: 1_138,
    },
  };
}

/**
 * First recovery transaction crosses the write-ahead boundary.
 */
{
  const original = createRecord();

  const intent = createIntent();

  const updated = applyCashOutSettlementRecoveryIntent(original, intent);

  assertEqual(updated.recoveryIntent, intent);

  pass('first recovery transaction is attached to the Cash-out record');
}

/**
 * Exact same deterministic transaction is idempotent.
 */
{
  const intent = createIntent();

  const record = {
    ...createRecord(),

    recoveryIntent: intent,
  };

  const result = applyCashOutSettlementRecoveryIntent(record, {
    ...intent,

    /**
     * Timestamp may differ across a concurrent deterministic preparation.
     * Existing durable metadata remains authoritative.
     */
    preparedAt: '2026-10-08T12:00:01.000Z',
  });

  assertEqual(result, record);

  pass('same deterministic recovery transaction is idempotent');
}

/**
 * A different second recovery transaction must never replace the persisted one.
 */
{
  const firstIntent = createIntent('a', '00aa');

  const record = {
    ...createRecord(),

    recoveryIntent: firstIntent,
  };

  const differentIntent = createIntent('b', '00bb');

  assertThrows(() =>
    applyCashOutSettlementRecoveryIntent(record, differentIntent)
  );

  pass('different second recovery transaction is rejected');
}

console.log('');

console.log(
  'Cash-out Settlement D6E.4 recovery write-ahead store tests passed.'
);
