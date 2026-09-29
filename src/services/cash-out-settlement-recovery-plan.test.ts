import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';

import { buildCashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

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

const CASH_OUT_ID = 'cash-out-recovery-plan-test';

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

function createInputSet(values: number[]) {
  const txids = [TXID_A, TXID_B, TXID_C];

  return buildCashOutSettlementRecoveryInputSet(
    values.map((satoshis, index) => ({
      txid: txids[index],
      vout: index,
      satoshis,
      contractAddress: CONTRACT_ADDRESS,
    }))
  );
}

/**
 * 1-input underpayment.
 *
 * Measured D6C.3 recovery fee:
 * 608 sats.
 */
{
  const plan = buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 608,

    inputSet: createInputSet([180_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  });

  assertEqual(plan.inputCount, 1);

  assertEqual(plan.recoveryInputSats, 180_000);

  assertEqual(plan.treasuryOutputSats, 177_392);

  assertEqual(plan.platformOutputSats, 2_000);

  assertEqual(plan.recoveryFeeSats, 608);

  assertEqual(plan.paymentVarianceSats, -26_000);

  assertEqual(plan.variance, 'underpayment');

  assertEqual(plan.merchantShortfallSats, 26_000);

  assertEqual(plan.customerSurplusSats, 0);

  pass('1-input underpayment produces exact deterministic recovery economics');
}

/**
 * 2-input fragments aggregating to the original required payment.
 */
{
  const plan = buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 1_138,

    inputSet: createInputSet([100_000, 106_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  });

  assertEqual(plan.inputCount, 2);

  assertEqual(plan.recoveryInputSats, 206_000);

  assertEqual(plan.treasuryOutputSats, 202_862);

  assertEqual(plan.paymentVarianceSats, 0);

  assertEqual(plan.variance, 'exact');

  pass(
    '2-input fragmented payment preserves one platform allocation and exact aggregate'
  );
}

/**
 * 3-input fragments.
 */
{
  const plan = buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 1_668,

    inputSet: createInputSet([50_000, 70_000, 86_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  });

  assertEqual(plan.inputCount, 3);

  assertEqual(plan.recoveryInputSats, 206_000);

  assertEqual(plan.treasuryOutputSats, 202_332);

  assertEqual(plan.platformOutputSats, 2_000);

  pass('3-input recovery uses the measured fee and exact two-output economics');
}

/**
 * Overpayment remains customer surplus rather than merchant fee revenue.
 */
{
  const plan = buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 608,

    inputSet: createInputSet([230_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  });

  assertEqual(plan.paymentVarianceSats, 24_000);

  assertEqual(plan.variance, 'overpayment');

  assertEqual(plan.customerSurplusSats, 24_000);

  assertEqual(plan.merchantShortfallSats, 0);

  pass('overpayment surplus is preserved explicitly in the recovery plan');
}

/**
 * Canonical input identity must be immutable.
 */
{
  const inputSet = createInputSet([100_000, 106_000]);

  const mutated = {
    ...inputSet,
    inputSetId: 'manually-mutated',
  };

  assertThrows(() =>
    buildCashOutSettlementRecoveryPlan({
      cashOutId: CASH_OUT_ID,

      requiredSats: 206_000,

      platformFeeSats: 2_000,

      recoveryFeeSats: 1_138,

      inputSet: mutated,

      treasuryDestination: TREASURY_DESTINATION,

      platformDestination: PLATFORM_DESTINATION,
    })
  );

  pass('mutated recovery input-set identity is rejected');
}

/**
 * Treasury/platform destination collapse is forbidden.
 */
assertThrows(() =>
  buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 608,

    inputSet: createInputSet([180_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: {
      address: 'bitcoincash:qother-address',
      publicKeyHashHex: TREASURY_DESTINATION.publicKeyHashHex,
    },
  })
);

pass('Treasury and platform recovery destinations cannot collapse to one PKH');

/**
 * Zero miner fee fails closed.
 */
assertThrows(() =>
  buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 0,

    inputSet: createInputSet([180_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  })
);

pass('zero recovery miner fee is rejected');

/**
 * Destructive miner fee fails through D6B.1 economics.
 */
assertThrows(() =>
  buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 178_000,

    inputSet: createInputSet([180_000]),

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  })
);

pass('recovery fee cannot eliminate the positive Treasury output');

console.log('');

console.log(
  'Cash-out Settlement D6C.4 deterministic recovery plan tests passed.'
);
