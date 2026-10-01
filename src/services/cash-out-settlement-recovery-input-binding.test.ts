import {
  buildCashOutSettlementRecoveryInputSet,
} from './cash-out-settlement-recovery-inputs';

import {
  bindCashOutSettlementRecoveryInputSetToNetworkEvidence,
  type CashOutSettlementRecoveryNetworkEvidence,
} from './cash-out-settlement-recovery-input-binding';

function assertEqual(
  actual: unknown,
  expected: unknown,
  message = 'Expected values to be equal.'
): void {
  if (
    actual !==
    expected
  ) {
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
    throw new Error(
      message
    );
  }
}

function pass(
  message: string
): void {
  console.log(
    `PASS: ${message}`
  );
}

const CASH_OUT_ID =
  'cash-out-d6d1-test';

const CONTRACT_ADDRESS =
  'bitcoincash:pr-recovery-contract';

const DIFFERENT_CONTRACT_ADDRESS =
  'bitcoincash:pr-different-contract';

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const TXID_C =
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const TXID_D =
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

function createThreeInputSet() {
  return buildCashOutSettlementRecoveryInputSet([
    {
      txid:
        TXID_A,

      vout: 0,

      satoshis:
        50_000,

      contractAddress:
        CONTRACT_ADDRESS,
    },
    {
      txid:
        TXID_B,

      vout: 1,

      satoshis:
        70_000,

      contractAddress:
        CONTRACT_ADDRESS,
    },
    {
      txid:
        TXID_C,

      vout: 2,

      satoshis:
        86_000,

      contractAddress:
        CONTRACT_ADDRESS,
    },
  ]);
}

function createEvidence():
  CashOutSettlementRecoveryNetworkEvidence {
  return {
    source:
      'electrum_listunspent',

    available:
      true,

    contractAddress:
      CONTRACT_ADDRESS,

    utxos: [
      {
        txid:
          TXID_C,

        vout: 2,

        satoshis:
          86_000,

        height:
          900_003,

        tokenDataPresent:
          false,
      },
      {
        txid:
          TXID_A,

        vout: 0,

        satoshis:
          50_000,

        height:
          0,

        tokenDataPresent:
          false,
      },
      {
        txid:
          TXID_B,

        vout: 1,

        satoshis:
          70_000,

        height:
          900_002,

        tokenDataPresent:
          false,
      },
    ],
  };
}

/**
 * Exact 3-input binding succeeds and returns inputs in canonical D6C order,
 * not arbitrary Electrum response order.
 */
{
  const inputSet =
    createThreeInputSet();

  const binding =
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet,

      networkEvidence:
        createEvidence(),
    });

  assertEqual(
    binding.inputSetId,
    inputSet.inputSetId
  );

  assertEqual(
    binding.inputCount,
    3
  );

  assertEqual(
    binding.totalInputSats,
    206_000
  );

  assertEqual(
    binding.inputs[0]?.txid,
    TXID_A
  );

  assertEqual(
    binding.inputs[1]?.txid,
    TXID_B
  );

  assertEqual(
    binding.inputs[2]?.txid,
    TXID_C
  );

  assertEqual(
    binding.inputs[0]?.networkState,
    'mempool'
  );

  assertEqual(
    binding.inputs[1]?.networkState,
    'confirmed'
  );

  pass(
    'canonical 3-input recovery set binds to exact current network UTXOs'
  );
}

/**
 * Electrum response ordering must not change deterministic input identity.
 */
{
  const inputSet =
    createThreeInputSet();

  const evidence =
    createEvidence();

  const reversedEvidence = {
    ...evidence,

    utxos:
      [...evidence.utxos]
        .reverse(),
  };

  const first =
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet,

      networkEvidence:
        evidence,
    });

  const second =
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet,

      networkEvidence:
        reversedEvidence,
    });

  assertEqual(
    first.inputSetId,
    second.inputSetId
  );

  assertEqual(
    first.inputs
      .map((item) =>
        `${item.txid}:${item.vout}`
      )
      .join('|'),

    second.inputs
      .map((item) =>
        `${item.txid}:${item.vout}`
      )
      .join('|')
  );

  pass(
    'network response ordering cannot alter canonical recovery input binding'
  );
}

/**
 * Extra unselected nuisance UTXO does not poison already-selected Recovery v1
 * inputs.
 */
{
  const inputSet =
    createThreeInputSet();

  const evidence =
    createEvidence();

  evidence.utxos.push({
    txid:
      TXID_D,

    vout: 0,

    satoshis:
      546,

    height:
      0,

    tokenDataPresent:
      false,
  });

  const binding =
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet,

      networkEvidence:
        evidence,
    });

  assertEqual(
    binding.inputCount,
    3
  );

  assertEqual(
    binding.totalInputSats,
    206_000
  );

  pass(
    'unselected nuisance UTXO does not silently enter the recovery input set'
  );
}

/**
 * No trustworthy network snapshot -> fail closed.
 */
{
  const evidence =
    createEvidence();

  evidence.available =
    false;

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'unavailable recovery network evidence fails closed'
  );
}

/**
 * Evidence obtained for another contract cannot be rebound.
 */
{
  const evidence =
    createEvidence();

  evidence.contractAddress =
    DIFFERENT_CONTRACT_ADDRESS;

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'network evidence from another Cash-out contract is rejected'
  );
}

/**
 * Missing selected outpoint means it is not presently proven unspent.
 */
{
  const evidence =
    createEvidence();

  evidence.utxos =
    evidence.utxos.filter(
      (item) =>
        item.txid !==
        TXID_B
    );

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'selected recovery outpoint missing from listunspent evidence is rejected'
  );
}

/**
 * Same outpoint but different amount must fail.
 */
{
  const evidence =
    createEvidence();

  evidence.utxos =
    evidence.utxos.map(
      (item) =>
        item.txid ===
        TXID_B
          ? {
              ...item,

              satoshis:
                item.satoshis +
                1,
            }
          : item
    );

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'network value mismatch for selected recovery outpoint is rejected'
  );
}

/**
 * Selected CashToken-bearing UTXO cannot enter Recovery v1.
 */
{
  const evidence =
    createEvidence();

  evidence.utxos =
    evidence.utxos.map(
      (item) =>
        item.txid ===
        TXID_C
          ? {
              ...item,

              tokenDataPresent:
                true,
            }
          : item
    );

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'selected token-bearing recovery UTXO is rejected'
  );
}

/**
 * Duplicate network observations are ambiguous and fail closed.
 */
{
  const evidence =
    createEvidence();

  evidence.utxos.push({
    ...evidence.utxos[0],
  });

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'duplicate observed recovery outpoint is rejected'
  );
}

/**
 * Malformed network height is not trustworthy evidence.
 */
{
  const evidence =
    createEvidence();

  evidence.utxos[0] = {
    ...evidence.utxos[0],

    height:
      -1,
  };

  assertThrows(() =>
    bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId:
        CASH_OUT_ID,

      expectedContractAddress:
        CONTRACT_ADDRESS,

      inputSet:
        createThreeInputSet(),

      networkEvidence:
        evidence,
    })
  );

  pass(
    'malformed recovery UTXO network height is rejected'
  );
}

console.log('');

console.log(
  'Cash-out Settlement D6D.1 exceptional recovery input-binding tests passed.'
);
