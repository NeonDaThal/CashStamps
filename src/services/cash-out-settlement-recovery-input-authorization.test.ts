import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';

import { bindCashOutSettlementRecoveryInputSetToNetworkEvidence } from './cash-out-settlement-recovery-input-binding';

import { authorizeCashOutSettlementRecoveryInputs } from './cash-out-settlement-recovery-input-authorization';

import type { CashOutSettlementRecoveryAssessment } from 'src/types/cash-out-settlement';

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

const CASH_OUT_ID = 'cash-out-d6d3-test';

const CONTRACT_ADDRESS = 'bitcoincash:pr-recovery-contract';

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function createInputSet() {
  return buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,

      vout: 0,

      satoshis: 100_000,

      contractAddress: CONTRACT_ADDRESS,
    },

    {
      txid: TXID_B,

      vout: 1,

      satoshis: 106_000,

      contractAddress: CONTRACT_ADDRESS,
    },
  ]);
}

function createEligibleAssessment(): CashOutSettlementRecoveryAssessment {
  return {
    exceptionalCase: 'fragmented_payment',

    eligibility: 'eligible',

    observedSats: 206_000,

    requiredSats: 206_000,

    observedOutpointCount: 2,

    message: 'Exceptional recovery is eligible.',
  };
}

function createBinding() {
  const inputSet = createInputSet();

  return {
    inputSet,

    binding: bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId: CASH_OUT_ID,

      expectedContractAddress: CONTRACT_ADDRESS,

      inputSet,

      networkEvidence: {
        source: 'electrum_listunspent',

        available: true,

        contractAddress: CONTRACT_ADDRESS,

        utxos: [
          {
            txid: TXID_A,

            vout: 0,

            satoshis: 100_000,

            height: 0,

            tokenDataPresent: false,
          },

          {
            txid: TXID_B,

            vout: 1,

            satoshis: 106_000,

            height: 900_001,

            tokenDataPresent: false,
          },
        ],
      },
    }),
  };
}

/**
 * Fully eligible + bound input set succeeds.
 */
{
  const { inputSet, binding } = createBinding();

  const authorization = authorizeCashOutSettlementRecoveryInputs({
    cashOutId: CASH_OUT_ID,

    recoveryAssessment: createEligibleAssessment(),

    inputSet,

    binding,
  });

  assertEqual(authorization.eligibility, 'eligible');

  assertEqual(authorization.inputCount, 2);

  assertEqual(authorization.totalInputSats, 206_000);

  assertEqual(authorization.inputSetId, inputSet.inputSetId);

  assertEqual(authorization.exceptionalCase, 'fragmented_payment');

  pass(
    'eligible recovery assessment and exact bound inputs produce authorization'
  );
}

/**
 * D6A blocked assessment cannot be bypassed by valid UTXOs.
 */
{
  const { inputSet, binding } = createBinding();

  const blocked: CashOutSettlementRecoveryAssessment = {
    exceptionalCase: 'fragmented_payment',

    eligibility: 'blocked',

    observedSats: 206_000,

    requiredSats: 206_000,

    observedOutpointCount: 2,

    blockReason: 'source_conflict_active',

    message: 'Recovery is blocked by active source conflict.',
  };

  assertThrows(() =>
    authorizeCashOutSettlementRecoveryInputs({
      cashOutId: CASH_OUT_ID,

      recoveryAssessment: blocked,

      inputSet,

      binding,
    })
  );

  pass('valid bound UTXOs cannot bypass a blocked D6A recovery assessment');
}

/**
 * Binding from another Cash-out is rejected.
 */
{
  const { inputSet, binding } = createBinding();

  assertThrows(() =>
    authorizeCashOutSettlementRecoveryInputs({
      cashOutId: 'different-cash-out',

      recoveryAssessment: createEligibleAssessment(),

      inputSet,

      binding,
    })
  );

  pass('recovery binding cannot be rebound to another Cash-out');
}

/**
 * Mutated input-set identity is rejected.
 */
{
  const { inputSet, binding } = createBinding();

  const mutatedInputSet = {
    ...inputSet,

    inputSetId: 'mutated-input-set',
  };

  assertThrows(() =>
    authorizeCashOutSettlementRecoveryInputs({
      cashOutId: CASH_OUT_ID,

      recoveryAssessment: createEligibleAssessment(),

      inputSet: mutatedInputSet,

      binding,
    })
  );

  pass('mutated canonical recovery input-set identity is rejected');
}

/**
 * Mutated binding total is rejected.
 */
{
  const { inputSet, binding } = createBinding();

  const mutatedBinding = {
    ...binding,

    totalInputSats: binding.totalInputSats + 1,
  };

  assertThrows(() =>
    authorizeCashOutSettlementRecoveryInputs({
      cashOutId: CASH_OUT_ID,

      recoveryAssessment: createEligibleAssessment(),

      inputSet,

      binding: mutatedBinding,
    })
  );

  pass('mutated bound recovery total is rejected');
}

/**
 * Reordered bound inputs are rejected.
 */
{
  const { inputSet, binding } = createBinding();

  const mutatedBinding = {
    ...binding,

    inputs: [binding.inputs[1], binding.inputs[0]],
  };

  assertThrows(() =>
    authorizeCashOutSettlementRecoveryInputs({
      cashOutId: CASH_OUT_ID,

      recoveryAssessment: createEligibleAssessment(),

      inputSet,

      binding: mutatedBinding,
    })
  );

  pass('bound recovery input ordering must remain canonical');
}

console.log('');

console.log(
  'Cash-out Settlement D6D.3 recovery input authorization tests passed.'
);
