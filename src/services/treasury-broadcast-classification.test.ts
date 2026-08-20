import { strict as assert } from 'assert';

import {
  classifyTreasuryBroadcastResponse,
  createDefinitelyNotBroadcastResult,
  createUncertainBroadcastResult,
} from './treasury-broadcast-classification';

const EXPECTED_TXID = '11'.repeat(32);

{
  const result = classifyTreasuryBroadcastResponse(
    EXPECTED_TXID,
    EXPECTED_TXID
  );

  assert.equal(result.status, 'broadcasted');

  assert.equal(result.txid, EXPECTED_TXID);

  assert.equal(result.serverTxid, EXPECTED_TXID);

  assert.equal(result.requestAttempted, true);

  console.log('✓ Exact expected transaction ID proves broadcast success');
}

{
  const result = classifyTreasuryBroadcastResponse(
    EXPECTED_TXID,
    EXPECTED_TXID.toUpperCase()
  );

  assert.equal(result.status, 'broadcasted');

  assert.equal(result.serverTxid, EXPECTED_TXID);

  console.log('✓ Broadcast transaction IDs are compared canonically');
}

{
  const unexpectedTxid = '22'.repeat(32);

  const result = classifyTreasuryBroadcastResponse(
    EXPECTED_TXID,
    unexpectedTxid
  );

  assert.equal(result.status, 'uncertain');

  assert.equal(result.txid, EXPECTED_TXID);

  assert.equal(result.serverTxid, unexpectedTxid);

  assert.equal(result.requestAttempted, true);

  console.log('✓ Unexpected server transaction ID is classified as uncertain');
}

{
  const result = classifyTreasuryBroadcastResponse(
    EXPECTED_TXID,
    'txn-mempool-conflict'
  );

  assert.equal(result.status, 'uncertain');

  assert.equal(result.requestAttempted, true);

  console.log(
    '✓ Unexpected non-txid broadcast response is classified as uncertain'
  );
}

{
  const result = createUncertainBroadcastResult(
    EXPECTED_TXID,
    'Connection lost'
  );

  assert.equal(result.status, 'uncertain');

  assert.equal(result.txid, EXPECTED_TXID);

  assert.equal(result.requestAttempted, true);

  console.log(
    '✓ Connection loss after request begins is classified as uncertain'
  );
}

{
  const result = createDefinitelyNotBroadcastResult(
    'Could not connect to Electrum.',
    EXPECTED_TXID
  );

  assert.equal(result.status, 'definitely_not_broadcast');

  assert.equal(result.txid, EXPECTED_TXID);

  assert.equal(result.requestAttempted, false);

  console.log(
    '✓ Pre-request connection failure proves no broadcast was attempted'
  );
}

console.log(
  '\nAll 6 Treasury broadcast classification tests passed successfully.'
);
