import { strict as assert } from 'assert';

import {
  createTreasuryChangeAllocation,
  isAtOrAboveStandardP2pkhDustLimit,
  STANDARD_P2PKH_DUST_LIMIT_SATS,
} from './treasury-output-safety';

assert.equal(STANDARD_P2PKH_DUST_LIMIT_SATS, 546);

assert.equal(isAtOrAboveStandardP2pkhDustLimit(545), false);
assert.equal(isAtOrAboveStandardP2pkhDustLimit(546), true);

{
  const result = createTreasuryChangeAllocation({
    selectedInputSats: 10_000,
    nonChangeOutputSats: 8_955,
    minimumFeeSats: 500,
  });

  assert.equal(result.isAffordable, true);
  assert.equal(result.changeSats, 0);
  assert.equal(result.dustChangeAbsorbedSats, 545);
  assert.equal(result.finalFeeSats, 1_045);
}

{
  const result = createTreasuryChangeAllocation({
    selectedInputSats: 10_000,
    nonChangeOutputSats: 8_954,
    minimumFeeSats: 500,
  });

  assert.equal(result.isAffordable, true);
  assert.equal(result.changeSats, 546);
  assert.equal(result.dustChangeAbsorbedSats, 0);
  assert.equal(result.finalFeeSats, 500);
}

{
  const result = createTreasuryChangeAllocation({
    selectedInputSats: 10_000,
    nonChangeOutputSats: 9_500,
    minimumFeeSats: 500,
  });

  assert.equal(result.isAffordable, true);
  assert.equal(result.changeSats, 0);
  assert.equal(result.dustChangeAbsorbedSats, 0);
  assert.equal(result.finalFeeSats, 500);
}

{
  const result = createTreasuryChangeAllocation({
    selectedInputSats: 9_999,
    nonChangeOutputSats: 9_500,
    minimumFeeSats: 500,
  });

  assert.equal(result.isAffordable, false);
}

console.log('✓ 545-sat output is below standard dust floor');
console.log('✓ 546-sat output meets standard dust floor');
console.log('✓ sub-dust change is absorbed into miner fee');
console.log('✓ 546-sat change remains a real change output');
console.log('✓ exact-spend and insufficient-input cases are handled');
console.log('\nAll 5 Treasury output safety tests passed successfully.');
