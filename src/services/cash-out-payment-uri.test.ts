import { strict as assert } from 'assert';

import {
  createCashOutPaymentUri,
  formatCashOutSatsAsBchUriAmount,
} from 'src/services/cash-out-payment-uri';

{
  assert.equal(formatCashOutSatsAsBchUriAmount(1), '0.00000001');

  console.log('✓ One satoshi is encoded exactly');
}

{
  assert.equal(formatCashOutSatsAsBchUriAmount(20_600_000), '0.206');

  console.log('✓ Cash-out BCH amount is encoded without floating-point drift');
}

{
  assert.equal(formatCashOutSatsAsBchUriAmount(100_000_000), '1');

  console.log('✓ Whole BCH amounts are encoded canonically');
}

{
  const result = createCashOutPaymentUri({
    address: 'bitcoincash:qtestaddress',

    requiredSats: 20_600_000,

    label: 'BCH Cash-out',

    message: 'CO-TEST',
  });

  assert.equal(result.address, 'bitcoincash:qtestaddress');

  assert.equal(result.uri.includes('amount=0.206'), true);

  assert.equal(result.uri.includes('label=BCH+Cash-out'), true);

  assert.equal(result.uri.includes('message=CO-TEST'), true);

  console.log('✓ Cash-out URI contains the exact required sats amount');
}

{
  assert.throws(
    () => formatCashOutSatsAsBchUriAmount(1.5),
    /integer number of satoshis/
  );

  console.log('✓ Non-integer satoshi amounts fail closed');
}

console.log('All Cash-out payment URI tests passed successfully.');
