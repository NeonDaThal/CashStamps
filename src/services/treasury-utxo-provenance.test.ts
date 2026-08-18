import { strict as assert } from 'assert';

import { createTreasuryFundingPreview } from './treasury-funding';

const preview = createTreasuryFundingPreview({
  treasuryAddress: 'bitcoincash:test-treasury',

  voucherAddress: 'bitcoincash:test-voucher',

  amountSats: 1_000,

  platformFeeSats: 0,
  bufferReserveSats: 0,

  treasuryBalanceSats: 5_000,
  treasuryUtxoCount: 1,

  treasuryUtxos: [
    {
      outpointTransactionHash: '11'.repeat(32),

      outpointIndex: 2,
      valueSats: 5_000,

      address: 'bitcoincash:test-child-address',

      derivationIndex: 3,
    },
  ],
});

assert.equal(preview.selectedUtxos.length, 1);

assert.equal(
  preview.selectedUtxos[0]?.address,
  'bitcoincash:test-child-address'
);

assert.equal(preview.selectedUtxos[0]?.derivationIndex, 3);

console.log('✓ Funding preview preserves selected UTXO address');

console.log('✓ Funding preview preserves selected UTXO derivation index');

console.log('\nAll 2 Treasury UTXO provenance tests passed successfully.');
