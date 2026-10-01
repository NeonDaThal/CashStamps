import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';

import { buildCashOutSettlementRecoveryPlan } from './cash-out-settlement-recovery-plan';

import { bindCashOutSettlementRecoveryInputSetToNetworkEvidence } from './cash-out-settlement-recovery-input-binding';

import {
  authorizeCashOutSettlementRecoveryInputs,
  type CashOutSettlementRecoveryInputAuthorization,
} from './cash-out-settlement-recovery-input-authorization';

import {
  buildCashOutSettlementRecoverySigningRequest,
  createCashOutSettlementRecoverySignedTransactionArtifact,
} from './cash-out-settlement-recovery-signing';

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

const CASH_OUT_ID = 'cash-out-d6e1-test';

const CONTRACT_ADDRESS = 'bitcoincash:pr-recovery-contract';

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const SIGNED_TXID =
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const TREASURY_DESTINATION = {
  address: 'bitcoincash:qtreasury-test',

  publicKeyHashHex: '1111111111111111111111111111111111111111',
};

const PLATFORM_DESTINATION = {
  address: 'bitcoincash:qplatform-test',

  publicKeyHashHex: '2222222222222222222222222222222222222222',
};

function createFixture() {
  const inputSet = buildCashOutSettlementRecoveryInputSet([
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

  const plan = buildCashOutSettlementRecoveryPlan({
    cashOutId: CASH_OUT_ID,

    requiredSats: 206_000,

    platformFeeSats: 2_000,

    recoveryFeeSats: 1_138,

    inputSet,

    treasuryDestination: TREASURY_DESTINATION,

    platformDestination: PLATFORM_DESTINATION,
  });

  const binding = bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
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
  });

  const assessment: CashOutSettlementRecoveryAssessment = {
    exceptionalCase: 'fragmented_payment',

    eligibility: 'eligible',

    observedSats: 206_000,

    requiredSats: 206_000,

    observedOutpointCount: 2,

    message: 'Exceptional recovery is eligible.',
  };

  const authorization = authorizeCashOutSettlementRecoveryInputs({
    cashOutId: CASH_OUT_ID,

    recoveryAssessment: assessment,

    inputSet,

    binding,
  });

  return {
    inputSet,
    plan,
    authorization,
  };
}

function createValidSummary(
  plan: ReturnType<typeof buildCashOutSettlementRecoveryPlan>
) {
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

/**
 * Exact D6C plan + D6D authorization becomes one frozen signing request.
 */
{
  const { plan, authorization } = createFixture();

  const request = buildCashOutSettlementRecoverySigningRequest(
    plan,
    authorization
  );

  assertEqual(request.cashOutId, CASH_OUT_ID);

  assertEqual(request.inputCount, 2);

  assertEqual(request.totalInputSats, 206_000);

  assertEqual(request.recoveryFeeSats, 1_138);

  assertEqual(request.treasuryOutputSats, 202_862);

  assertEqual(request.platformOutputSats, 2_000);

  pass(
    'exact D6C plan and D6D authorization produce one frozen recovery signing request'
  );
}

/**
 * Signer cannot receive reordered authorized inputs.
 */
{
  const { plan, authorization } = createFixture();

  const mutated = {
    ...authorization,

    inputs: [authorization.inputs[1], authorization.inputs[0]],
  } as CashOutSettlementRecoveryInputAuthorization;

  assertThrows(() =>
    buildCashOutSettlementRecoverySigningRequest(plan, mutated)
  );

  pass('reordered recovery signing inputs are rejected');
}

/**
 * Signer cannot receive a different recovery fee.
 */
{
  const { plan, authorization } = createFixture();

  const mutatedPlan = {
    ...plan,

    recoveryFeeSats: plan.recoveryFeeSats + 1,
  };

  assertThrows(() =>
    buildCashOutSettlementRecoverySigningRequest(mutatedPlan, authorization)
  );

  pass('mutated recovery miner fee fails before signing');
}

/**
 * A synthetic signed result representing the exact frozen plan is accepted.
 *
 * D6E.3 will replace this synthetic material with actual CashScript-produced
 * signed bytes and a txid derived locally from those exact bytes.
 */
{
  const { plan, authorization } = createFixture();

  const artifact = createCashOutSettlementRecoverySignedTransactionArtifact({
    plan,

    authorization,

    signed: {
      rawTransactionHex: '00aa',

      txid: SIGNED_TXID,

      transactionBytes: 2,

      transactionSummary: createValidSummary(plan),
    },

    preparedAt: '2026-10-01T12:00:00.000Z',
  });

  assertEqual(artifact.txid, SIGNED_TXID);

  assertEqual(artifact.actualFeeSats, 1_138);

  assertEqual(artifact.transactionBytes, 2);

  assertEqual(artifact.inputSetId, plan.inputSetId);

  pass('exact signed recovery material freezes into the write-ahead artifact');
}

/**
 * Raw bytes and reported byte length must agree exactly.
 */
{
  const { plan, authorization } = createFixture();

  assertThrows(() =>
    createCashOutSettlementRecoverySignedTransactionArtifact({
      plan,

      authorization,

      signed: {
        rawTransactionHex: '00aa',

        txid: SIGNED_TXID,

        transactionBytes: 3,

        transactionSummary: createValidSummary(plan),
      },

      preparedAt: '2026-10-01T12:00:00.000Z',
    })
  );

  pass('signed recovery byte-length mismatch is rejected');
}

/**
 * Mutating even one Treasury sat in the signed transaction summary is rejected
 * through the already-proven D6C.5 reconciliation boundary.
 */
{
  const { plan, authorization } = createFixture();

  const summary = createValidSummary(plan);

  const treasuryOutput = summary.outputs[0];

  if (!treasuryOutput) {
    throw new Error('Expected Treasury recovery output 0 to exist.');
  }

  summary.outputs[0] = {
    ...treasuryOutput,

    satoshis: treasuryOutput.satoshis - 1,
  };

  assertThrows(() =>
    createCashOutSettlementRecoverySignedTransactionArtifact({
      plan,

      authorization,

      signed: {
        rawTransactionHex: '00aa',

        txid: SIGNED_TXID,

        transactionBytes: 2,

        transactionSummary: summary,
      },

      preparedAt: '2026-10-01T12:00:00.000Z',
    })
  );

  pass('one-satoshi signed Treasury-output mutation is rejected');
}

/**
 * Malformed txid is rejected before write-ahead persistence.
 */
{
  const { plan, authorization } = createFixture();

  assertThrows(() =>
    createCashOutSettlementRecoverySignedTransactionArtifact({
      plan,

      authorization,

      signed: {
        rawTransactionHex: '00aa',

        txid: 'not-a-txid',

        transactionBytes: 2,

        transactionSummary: createValidSummary(plan),
      },

      preparedAt: '2026-10-01T12:00:00.000Z',
    })
  );

  pass('malformed signed recovery transaction ID is rejected');
}

/**
 * Timestamp metadata does not alter transaction identity.
 */
{
  const { plan, authorization } = createFixture();

  const signed = {
    rawTransactionHex: '00aa',

    txid: SIGNED_TXID,

    transactionBytes: 2,

    transactionSummary: createValidSummary(plan),
  };

  const first = createCashOutSettlementRecoverySignedTransactionArtifact({
    plan,

    authorization,

    signed,

    preparedAt: '2026-10-01T12:00:00.000Z',
  });

  const second = createCashOutSettlementRecoverySignedTransactionArtifact({
    plan,

    authorization,

    signed,

    preparedAt: '2026-10-01T13:00:00.000Z',
  });

  assertEqual(first.rawTransactionHex, second.rawTransactionHex);

  assertEqual(first.txid, second.txid);

  pass('prepared timestamp cannot alter signed recovery transaction identity');
}

console.log('');

console.log(
  'Cash-out Settlement D6E.1 recovery signing-boundary tests passed.'
);
