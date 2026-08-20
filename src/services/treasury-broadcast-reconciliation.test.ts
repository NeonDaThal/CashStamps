import { strict as assert } from 'assert';

import {
  classifyTreasuryBroadcastReconciliation,
  createReconciliationServerCheck,
} from './treasury-broadcast-reconciliation';

const TEST_TXID = '11'.repeat(32);

{
  const check = createReconciliationServerCheck('server-a', 900_000);

  assert.equal(check.status, 'confirmed');

  assert.equal(check.blockHeight, 900_000);

  console.log('✓ Positive transaction height is classified as confirmed');
}

{
  const check = createReconciliationServerCheck('server-a', 0);

  assert.equal(check.status, 'mempool');

  assert.equal(check.blockHeight, 0);

  console.log('✓ Zero transaction height is classified as mempool');
}

{
  const check = createReconciliationServerCheck('server-a', null);

  assert.equal(check.status, 'unknown');

  console.log('✓ Null transaction height is classified as unknown');
}

{
  const result = classifyTreasuryBroadcastReconciliation(TEST_TXID, [
    {
      server: 'server-a',
      status: 'unknown',
    },
    {
      server: 'server-b',
      status: 'confirmed',
      blockHeight: 900_001,
    },
    {
      server: 'server-c',
      status: 'error',
      errorMessage: 'Connection lost',
    },
  ]);

  assert.equal(result.status, 'confirmed');

  assert.equal(result.blockHeight, 900_001);

  console.log(
    '✓ Confirmation evidence from any server wins over unknown/error results'
  );
}

{
  const result = classifyTreasuryBroadcastReconciliation(TEST_TXID, [
    {
      server: 'server-a',
      status: 'unknown',
    },
    {
      server: 'server-b',
      status: 'mempool',
      blockHeight: 0,
    },
    {
      server: 'server-c',
      status: 'error',
      errorMessage: 'Connection lost',
    },
  ]);

  assert.equal(result.status, 'mempool');

  console.log('✓ Mempool evidence wins over unknown/error results');
}

{
  const result = classifyTreasuryBroadcastReconciliation(TEST_TXID, [
    {
      server: 'server-a',
      status: 'unknown',
    },
    {
      server: 'server-b',
      status: 'error',
      errorMessage: 'Connection lost',
    },
  ]);

  assert.equal(result.status, 'unknown');

  console.log(
    '✓ Successful unknown response remains unknown despite another server error'
  );
}

{
  const result = classifyTreasuryBroadcastReconciliation(TEST_TXID, [
    {
      server: 'server-a',
      status: 'error',
      errorMessage: 'Connection lost',
    },
    {
      server: 'server-b',
      status: 'error',
      errorMessage: 'Connection refused',
    },
  ]);

  assert.equal(result.status, 'unavailable');

  console.log(
    '✓ All-server failure is classified as reconciliation unavailable'
  );
}

{
  const result = classifyTreasuryBroadcastReconciliation(
    TEST_TXID.toUpperCase(),
    [
      {
        server: 'server-a',
        status: 'mempool',
        blockHeight: 0,
      },
    ]
  );

  assert.equal(result.txid, TEST_TXID);

  console.log(
    '✓ Reconciliation persists transaction IDs in canonical lowercase form'
  );
}

console.log(
  '\nAll 8 Treasury broadcast reconciliation tests passed successfully.'
);
