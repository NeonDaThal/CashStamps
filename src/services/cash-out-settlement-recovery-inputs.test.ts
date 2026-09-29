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

function assertDeepEqual(
  actual: unknown,
  expected: unknown,
  message = 'Expected values to be deeply equal.'
): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`
    );
  }
}

function assertThrowsAction(
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

const assert = {
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  throws: assertThrowsAction,
};

import {
  buildCashOutSettlementRecoveryInputSet,
  CASH_OUT_RECOVERY_MAX_INPUTS,
} from './cash-out-settlement-recovery-inputs';

const CONTRACT_ADDRESS = 'bitcoincash:pr-test-cash-out-contract';

const OTHER_CONTRACT_ADDRESS = 'bitcoincash:pr-other-cash-out-contract';

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const TXID_C =
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const TXID_D =
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

function pass(name: string): void {
  console.log(`PASS: ${name}`);
}

function assertThrows(name: string, action: () => unknown): void {
  assert.throws(action);
  pass(name);
}

/**
 * One exceptional UTXO.
 */
{
  const result = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 180_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  assert.equal(result.inputCount, 1);

  assert.equal(result.totalInputSats, 180_000);

  assert.equal(result.inputs[0].outpoint, `${TXID_A}:0`);

  assert.equal(result.contractAddress, CONTRACT_ADDRESS);

  pass(
    'one exceptional contract UTXO produces one deterministic recovery input set'
  );
}

/**
 * Two fragments.
 */
{
  const result = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 1,
      satoshis: 100_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 0,
      satoshis: 106_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  assert.equal(result.inputCount, 2);

  assert.equal(result.totalInputSats, 206_000);

  pass('two fragmented contract UTXOs reconcile to their exact aggregate');
}

/**
 * Three fragments.
 */
{
  const result = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 50_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 0,
      satoshis: 70_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_C,
      vout: 0,
      satoshis: 86_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  assert.equal(result.inputCount, 3);

  assert.equal(result.totalInputSats, 206_000);

  pass('three fragmented contract UTXOs are supported by Recovery v1');
}

/**
 * Input order from Electrum/network discovery must not change the frozen set.
 */
{
  const first = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_C,
      vout: 2,
      satoshis: 30_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_A,
      vout: 5,
      satoshis: 80_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 1,
      satoshis: 96_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  const second = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_B,
      vout: 1,
      satoshis: 96_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_C,
      vout: 2,
      satoshis: 30_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_A,
      vout: 5,
      satoshis: 80_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  assert.deepEqual(first, second);

  assert.equal(first.inputs[0].txid, TXID_A);

  assert.equal(first.inputs[1].txid, TXID_B);

  assert.equal(first.inputs[2].txid, TXID_C);

  pass(
    'recovery input identity is deterministic regardless of discovery order'
  );
}

/**
 * Multiple exact customer payments are still one input set, not multiple
 * Cash-out sales.
 */
{
  const result = buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 206_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 0,
      satoshis: 206_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ]);

  assert.equal(result.totalInputSats, 412_000);

  assert.equal(result.inputCount, 2);

  pass(
    'multiple exact payments remain one explicitly bound recovery input set'
  );
}

assertThrows('empty recovery input set is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([])
);

assertThrows('four recovery inputs fail closed under Recovery v1', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 50_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 0,
      satoshis: 50_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_C,
      vout: 0,
      satoshis: 50_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_D,
      vout: 0,
      satoshis: 56_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

assert.equal(CASH_OUT_RECOVERY_MAX_INPUTS, 3);

assertThrows('duplicate recovery outpoint is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 100_000,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 106_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

assertThrows(
  'recovery inputs from different Cash-out contracts cannot be mixed',
  () =>
    buildCashOutSettlementRecoveryInputSet([
      {
        txid: TXID_A,
        vout: 0,
        satoshis: 100_000,
        contractAddress: CONTRACT_ADDRESS,
      },
      {
        txid: TXID_B,
        vout: 0,
        satoshis: 106_000,
        contractAddress: OTHER_CONTRACT_ADDRESS,
      },
    ])
);

assertThrows('malformed recovery txid is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: 'not-a-txid',
      vout: 0,
      satoshis: 100_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

assertThrows('negative recovery output index is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: -1,
      satoshis: 100_000,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

assertThrows('zero-value recovery input is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 0,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

assertThrows('non-integer recovery satoshi value is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 100_000.5,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

assertThrows('missing recovery contract identity is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: 100_000,
      contractAddress: '   ',
    },
  ])
);

assertThrows('unsafe aggregate recovery value is rejected', () =>
  buildCashOutSettlementRecoveryInputSet([
    {
      txid: TXID_A,
      vout: 0,
      satoshis: Number.MAX_SAFE_INTEGER,
      contractAddress: CONTRACT_ADDRESS,
    },
    {
      txid: TXID_B,
      vout: 0,
      satoshis: 1,
      contractAddress: CONTRACT_ADDRESS,
    },
  ])
);

console.log('');

console.log(
  'Cash-out Settlement D6C.2 deterministic recovery input-set tests passed.'
);
