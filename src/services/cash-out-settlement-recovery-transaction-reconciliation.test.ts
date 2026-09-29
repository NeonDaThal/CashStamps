import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';

import { buildCashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

import {
  assertCashOutSettlementRecoveryTransactionMatchesPlan,
  type CashOutSettlementRecoveryTransactionSummary,
} from './cash-out-settlement-recovery-transaction-reconciliation';

function pass(message: string): void {
  console.log(`PASS: ${message}`);
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

const CASH_OUT_ID = 'cash-out-d6c5-test';

const CONTRACT_ADDRESS = 'bitcoincash:pr-recovery-contract';

const TREASURY_DESTINATION = {
  address: 'bitcoincash:qtreasury-test',
  publicKeyHashHex: '1111111111111111111111111111111111111111',
};

const PLATFORM_DESTINATION = {
  address: 'bitcoincash:qplatform-test',
  publicKeyHashHex: '2222222222222222222222222222222222222222',
};

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const TXID_C =
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

function createThreeInputPlan() {
  const inputSet = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 50_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 1,
      satoshis: 70_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_C,
      vout: 2,
      satoshis: 86_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  return buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 1_668,

    inputSet,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  });
}

function createValidSummary(
  plan: ReturnType<typeof createThreeInputPlan>
): CashOutSettlementRecoveryTransactionSummary {
  return {
    cashOutId: plan.cashOutId,

    contractAddress: plan.contractAddress,

    inputCount: plan.inputCount,

    inputs: plan.inputs.map((input) => ({
      txid: input.txid,

      vout: input.vout,

      satoshis: input.satoshis,
    })),

    outputCount: 2,

    outputs: [
      {
        index: 0,

        publicKeyHashHex: plan.treasuryDestination.publicKeyHashHex,

        satoshis: plan.treasuryOutputSats,
      },
      {
        index: 1,

        publicKeyHashHex: plan.platformDestination.publicKeyHashHex,

        satoshis: plan.platformOutputSats,
      },
    ],

    feeSats: plan.recoveryFeeSats,
  };
}

const plan = createThreeInputPlan();

const validSummary = createValidSummary(plan);

assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, validSummary);

pass('exact recovery transaction summary matches its deterministic plan');

/**
 * Input order is transaction identity and must remain canonical.
 */
{
  const mutated = {
    ...validSummary,

    inputs: [
      validSummary.inputs[1],
      validSummary.inputs[0],
      validSummary.inputs[2],
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('reordered recovery inputs are rejected');
}

/**
 * Source transaction substitution.
 */
{
  const mutated = {
    ...validSummary,

    inputs: validSummary.inputs.map((input, index) =>
      index === 0
        ? {
            ...input,
            txid: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
          }
        : input
    ),
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('substituted recovery source txid is rejected');
}

/**
 * Source vout substitution.
 */
{
  const mutated = {
    ...validSummary,

    inputs: validSummary.inputs.map((input, index) =>
      index === 0
        ? {
            ...input,
            vout: input.vout + 1,
          }
        : input
    ),
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('substituted recovery source output index is rejected');
}

/**
 * Source-value mutation.
 */
{
  const mutated = {
    ...validSummary,

    inputs: validSummary.inputs.map((input, index) =>
      index === 0
        ? {
            ...input,
            satoshis: input.satoshis + 1,
          }
        : input
    ),
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('mutated recovery input value is rejected');
}

/**
 * Extra selected input.
 */
{
  const mutated = {
    ...validSummary,

    inputCount: 4,

    inputs: [
      ...validSummary.inputs,
      {
        txid: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',

        vout: 0,

        satoshis: 1,
      },
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('extra recovery transaction input is rejected');
}

/**
 * Treasury redirection.
 */
{
  const mutated = {
    ...validSummary,

    outputs: [
      {
        ...validSummary.outputs[0],

        publicKeyHashHex: '3333333333333333333333333333333333333333',
      },

      validSummary.outputs[1],
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('Treasury recovery destination redirection is rejected');
}

/**
 * Platform redirection.
 */
{
  const mutated = {
    ...validSummary,

    outputs: [
      validSummary.outputs[0],

      {
        ...validSummary.outputs[1],

        publicKeyHashHex: '4444444444444444444444444444444444444444',
      },
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('platform recovery destination redirection is rejected');
}

/**
 * Treasury amount manipulation.
 */
{
  const mutated = {
    ...validSummary,

    outputs: [
      {
        ...validSummary.outputs[0],

        satoshis: validSummary.outputs[0].satoshis - 1,
      },

      validSummary.outputs[1],
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('one-satoshi Treasury output reduction is rejected');
}

/**
 * Platform amount manipulation.
 */
{
  const mutated = {
    ...validSummary,

    outputs: [
      validSummary.outputs[0],

      {
        ...validSummary.outputs[1],

        satoshis: validSummary.outputs[1].satoshis + 1,
      },
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('one-satoshi platform output increase is rejected');
}

/**
 * Output ordering is covenant-significant.
 */
{
  const mutated = {
    ...validSummary,

    outputs: [
      {
        ...validSummary.outputs[1],
        index: 0,
      },

      {
        ...validSummary.outputs[0],
        index: 1,
      },
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('swapped Treasury and platform outputs are rejected');
}

/**
 * Extra output.
 */
{
  const mutated = {
    ...validSummary,

    outputCount: 3,

    outputs: [
      ...validSummary.outputs,

      {
        index: 2,

        publicKeyHashHex: '5555555555555555555555555555555555555555',

        satoshis: 1,
      },
    ],
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('extra recovery output is rejected');
}

/**
 * Miner-fee mutation.
 */
{
  const mutated = {
    ...validSummary,

    feeSats: validSummary.feeSats + 1,
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('recovery miner-fee mutation is rejected');
}

/**
 * Even if the caller lies about feeSats, arithmetic itself is checked.
 */
{
  const mutated = {
    ...validSummary,

    outputs: [
      {
        ...validSummary.outputs[0],

        satoshis: validSummary.outputs[0].satoshis - 1,
      },

      validSummary.outputs[1],
    ],

    feeSats: validSummary.feeSats,
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('transaction input/output/fee arithmetic must reconcile exactly');
}

/**
 * Plan identity cannot be reused for another Cash-out.
 */
{
  const mutated = {
    ...validSummary,

    cashOutId: 'different-cash-out',
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('recovery transaction cannot be rebound to another Cash-out');
}

/**
 * Contract identity cannot be substituted.
 */
{
  const mutated = {
    ...validSummary,

    contractAddress: 'bitcoincash:pr-different-contract',
  };

  assertThrows(() =>
    assertCashOutSettlementRecoveryTransactionMatchesPlan(plan, mutated)
  );

  pass('recovery transaction cannot be rebound to another contract');
}

console.log('');

console.log(
  'Cash-out Settlement D6C.5 recovery transaction/plan reconciliation tests passed.'
);
