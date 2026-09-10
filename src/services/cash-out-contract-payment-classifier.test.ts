import { classifyCashOutContractPayment } from 'src/services/cash-out-contract-payment-classifier';

import type { CashOutContractUtxo } from 'src/types/cash-out-contract-payment';

const CONTRACT_ADDRESS =
  'bitcoincash:p076qp762h9z4nzsn8ydxse4s6ju3v8zth5x72ek7lhhe7wqdcjjxyq4jplcj';

const REQUIRED_SATS = 206_000;

function txid(byteHex: string): string {
  return byteHex.repeat(32);
}

function utxo(
  byteHex: string,
  vout: number,
  satoshis: number,
  height = 0
): CashOutContractUtxo {
  return {
    txid: txid(byteHex),

    vout,

    satoshis,

    height,
  };
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

function assertDeepEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message ?? 'Expected values to be deeply equal.');
  }
}

function assertThrows(operation: () => unknown, message?: string): void {
  let didThrow = false;

  try {
    operation();
  } catch {
    didThrow = true;
  }

  if (!didThrow) {
    throw new Error(message ?? 'Expected operation to throw.');
  }
}

/**
 * No UTXOs means no payment candidate.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [],
  });

  assertEqual(result.classification, 'no_utxos');

  assertEqual(result.normalSettlementCandidate, undefined);

  console.log('PASS: empty contract has no payment candidate');
}

/**
 * One exact UTXO is the normal candidate.
 */
{
  const exact = utxo('11', 0, REQUIRED_SATS);

  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [exact],
  });

  assertEqual(result.classification, 'exact');

  assertDeepEqual(result.normalSettlementCandidate, exact);

  console.log('PASS: one exact UTXO becomes the normal settlement candidate');
}

/**
 * Tiny nuisance/dust must not poison the exact candidate.
 */
{
  const exact = utxo('22', 1, REQUIRED_SATS);

  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('21', 0, 546), exact],
  });

  assertEqual(result.classification, 'exact');

  assertDeepEqual(result.normalSettlementCandidate, exact);

  assertEqual(result.underpaymentUtxos.length, 1);

  console.log('PASS: nuisance dust does not poison one exact payment');
}

/**
 * Several smaller nuisance/partial UTXOs still do not poison one exact
 * payment.
 */
{
  const exact = utxo('33', 2, REQUIRED_SATS);

  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('31', 0, 546), exact, utxo('32', 1, 5_000)],
  });

  assertEqual(result.classification, 'exact');

  assertDeepEqual(result.normalSettlementCandidate, exact);

  assertEqual(result.underpaymentUtxos.length, 2);

  console.log(
    'PASS: multiple smaller nuisance UTXOs do not poison one exact payment'
  );
}

/**
 * One underpayment cannot authorize normal settlement.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('41', 0, REQUIRED_SATS - 1)],
  });

  assertEqual(result.classification, 'underpayment');

  assertEqual(result.normalSettlementCandidate, undefined);

  console.log('PASS: one-satoshi underpayment is classified safely');
}

/**
 * One overpayment cannot authorize normal settlement.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('51', 0, REQUIRED_SATS + 1)],
  });

  assertEqual(result.classification, 'overpayment');

  assertEqual(result.normalSettlementCandidate, undefined);

  console.log('PASS: one-satoshi overpayment is classified safely');
}

/**
 * Two partial payments must not be summed even if their total equals the
 * required payment exactly.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('61', 0, 100_000), utxo('62', 1, 106_000)],
  });

  assertEqual(result.classification, 'fragmented_underpayment');

  assertEqual(result.normalSettlementCandidate, undefined);

  assertEqual(result.exactUtxos.length, 0);

  console.log('PASS: fragmented payments are never automatically summed');
}

/**
 * Mixed non-exact payments remain exceptional.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('71', 0, 100_000), utxo('72', 1, REQUIRED_SATS + 10_000)],
  });

  assertEqual(result.classification, 'multiple_non_exact');

  assertEqual(result.normalSettlementCandidate, undefined);

  console.log('PASS: mixed non-exact payments remain exceptional');
}

/**
 * Two exact payments are never resolved by choosing one automatically.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('81', 0, REQUIRED_SATS), utxo('82', 1, REQUIRED_SATS)],
  });

  assertEqual(result.classification, 'multiple_exact');

  assertEqual(result.normalSettlementCandidate, undefined);

  assertEqual(result.exactUtxos.length, 2);

  console.log(
    'PASS: multiple exact payments require exceptional reconciliation'
  );
}

/**
 * Dust does not make multiple exact payments any less ambiguous.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [
      utxo('91', 0, REQUIRED_SATS),

      utxo('92', 1, 546),

      utxo('93', 2, REQUIRED_SATS),
    ],
  });

  assertEqual(result.classification, 'multiple_exact');

  assertEqual(result.normalSettlementCandidate, undefined);

  console.log('PASS: nuisance UTXOs do not hide a multiple-exact exception');
}

/**
 * An exact payment plus a material overpayment remains exceptional.
 */
{
  const result = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('a1', 0, REQUIRED_SATS), utxo('a2', 1, REQUIRED_SATS + 1)],
  });

  assertEqual(result.classification, 'exact_with_overpayment');

  assertEqual(result.normalSettlementCandidate, undefined);

  console.log('PASS: exact payment plus overpayment remains exceptional');
}

/**
 * Classification output must be deterministic regardless of Electrum response
 * ordering.
 */
{
  const first = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [
      utxo('b3', 2, 5_000),

      utxo('b1', 0, 546),

      utxo('b2', 1, REQUIRED_SATS),
    ],
  });

  const second = classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [
      utxo('b2', 1, REQUIRED_SATS),

      utxo('b3', 2, 5_000),

      utxo('b1', 0, 546),
    ],
  });

  assertDeepEqual(first, second);

  console.log(
    'PASS: UTXO classification is deterministic regardless of response order'
  );
}

/**
 * Duplicate outpoints fail closed.
 */
assertThrows(() => {
  classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [utxo('c1', 0, REQUIRED_SATS), utxo('c1', 0, REQUIRED_SATS)],
  });
});

console.log('PASS: duplicate outpoints are rejected');

/**
 * Malformed blockchain data fails closed.
 */
assertThrows(() => {
  classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [
      {
        txid: 'not-a-txid',

        vout: 0,

        satoshis: REQUIRED_SATS,
      },
    ],
  });
});

assertThrows(() => {
  classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [
      {
        txid: txid('d1'),

        vout: -1,

        satoshis: REQUIRED_SATS,
      },
    ],
  });
});

assertThrows(() => {
  classifyCashOutContractPayment({
    contractAddress: CONTRACT_ADDRESS,

    requiredSats: REQUIRED_SATS,

    utxos: [
      {
        txid: txid('d2'),

        vout: 0,

        satoshis: 0,
      },
    ],
  });
});

console.log('PASS: malformed UTXO data is rejected');

console.log('');
console.log(
  'Cash-out Settlement D2A contract payment classification tests passed.'
);
