import { strict as assert } from 'assert';

import {
  doesTreasuryInputDirectiveMatchSelectedUtxo,
  getSelectedTreasuryDerivationIndexes,
  reverseTransactionIdByteOrder,
} from './treasury-utxo-matching';

const uiTransactionId =
  '000102030405060708090a0b0c0d0e0f' + '101112131415161718191a1b1c1d1e1f';

const reversedTransactionId =
  '1f1e1d1c1b1a19181716151413121110' + '0f0e0d0c0b0a09080706050403020100';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

assert.equal(
  reverseTransactionIdByteOrder(uiTransactionId),
  reversedTransactionId
);

console.log('✓ Transaction ID byte order can be reversed deterministically');

{
  const matched = doesTreasuryInputDirectiveMatchSelectedUtxo(
    {
      outpointTransactionHash: uiTransactionId,

      outpointIndex: 2,
      valueSats: 50_000,

      address: 'bitcoincash:test-address',

      derivationIndex: 0,
    },
    {
      outpointTransactionHash: hexToBytes(uiTransactionId),

      outpointIndex: 2,
    }
  );

  assert.equal(matched, true);

  console.log(
    '✓ Treasury UTXO matches a signing directive in direct byte order'
  );
}

{
  const matched = doesTreasuryInputDirectiveMatchSelectedUtxo(
    {
      outpointTransactionHash: uiTransactionId,

      outpointIndex: 2,
      valueSats: 50_000,

      address: 'bitcoincash:test-address',

      derivationIndex: 2,
    },
    {
      outpointTransactionHash: hexToBytes(reversedTransactionId),

      outpointIndex: 2,
    }
  );

  assert.equal(matched, true);

  console.log(
    '✓ Treasury UTXO matches a signing directive in reversed byte order'
  );
}

{
  const matched = doesTreasuryInputDirectiveMatchSelectedUtxo(
    {
      outpointTransactionHash: uiTransactionId,

      outpointIndex: 2,
      valueSats: 50_000,

      derivationIndex: 0,
    },
    {
      outpointTransactionHash: hexToBytes(uiTransactionId),

      outpointIndex: 3,
    }
  );

  assert.equal(matched, false);

  console.log('✓ Same transaction with the wrong output index does not match');
}

{
  const differentTransactionId =
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  const matched = doesTreasuryInputDirectiveMatchSelectedUtxo(
    {
      outpointTransactionHash: uiTransactionId,

      outpointIndex: 2,
      valueSats: 50_000,

      derivationIndex: 0,
    },
    {
      outpointTransactionHash: hexToBytes(differentTransactionId),

      outpointIndex: 2,
    }
  );

  assert.equal(matched, false);

  console.log('✓ Different transaction ID does not match');
}

{
  const derivationIndexes = getSelectedTreasuryDerivationIndexes([
    {
      outpointTransactionHash: '11'.repeat(32),

      outpointIndex: 0,
      valueSats: 10_000,
      derivationIndex: 0,
    },
    {
      outpointTransactionHash: '22'.repeat(32),

      outpointIndex: 1,
      valueSats: 20_000,
      derivationIndex: 2,
    },
    {
      outpointTransactionHash: '33'.repeat(32),

      outpointIndex: 0,
      valueSats: 30_000,
      derivationIndex: 2,
    },
    {
      outpointTransactionHash: '44'.repeat(32),

      outpointIndex: 3,
      valueSats: 40_000,
      derivationIndex: 5,
    },
  ]);

  assert.deepEqual(derivationIndexes, [0, 2, 5]);

  console.log('✓ Selected UTXOs preserve unique treasury derivation indexes');
}

{
  assert.throws(
    () =>
      getSelectedTreasuryDerivationIndexes([
        {
          outpointTransactionHash: '55'.repeat(32),

          outpointIndex: 0,
          valueSats: 10_000,
        },
      ]),
    /derivation-index provenance/
  );

  console.log('✓ Missing treasury derivation provenance fails closed');
}

console.log('\nAll 6 Treasury UTXO matching tests passed successfully.');
