import assert from 'assert';

import { PLATFORM_FEE_ADDRESS } from './platform-fee-config';

import { resolveCashOutSettlementDestinations } from './cash-out-settlement-destinations';

import { Address } from 'src/utils/address';

const TREASURY_HASH = '0102030405060708090a0b0c0d0e0f1011121314';

const ALTERNATE_PLATFORM_HASH = '2122232425262728292a2b2c2d2e2f3031323334';

const P2SH_HASH = '4142434445464748494a4b4c4d4e4f5051525354';

const TREASURY_ADDRESS = Address.fromHash160Hex(
  TREASURY_HASH,
  'P2PKH'
).toCashAddr('bitcoincash');

const ALTERNATE_PLATFORM_ADDRESS = Address.fromHash160Hex(
  ALTERNATE_PLATFORM_HASH,
  'P2PKH'
).toCashAddr('bitcoincash');

/**
 * --------------------------------------------------------------------------
 * Explicit valid destinations
 * --------------------------------------------------------------------------
 */

{
  const result = resolveCashOutSettlementDestinations({
    treasuryAddress: TREASURY_ADDRESS,

    platformAddress: ALTERNATE_PLATFORM_ADDRESS,
  });

  assert.equal(result.treasuryDestination.address, TREASURY_ADDRESS);

  assert.equal(result.treasuryDestination.publicKeyHashHex, TREASURY_HASH);

  assert.equal(result.platformDestination.address, ALTERNATE_PLATFORM_ADDRESS);

  assert.equal(
    result.platformDestination.publicKeyHashHex,
    ALTERNATE_PLATFORM_HASH
  );

  console.log(
    'PASS: valid mainnet P2PKH destinations resolve to exact HASH160 values'
  );
}

/**
 * --------------------------------------------------------------------------
 * Production configured platform address
 * --------------------------------------------------------------------------
 */

{
  const result = resolveCashOutSettlementDestinations({
    treasuryAddress: TREASURY_ADDRESS,
  });

  assert.equal(
    result.platformDestination.address,
    Address.fromCashAddr(PLATFORM_FEE_ADDRESS).toCashAddr('bitcoincash')
  );

  assert.equal(result.platformDestination.publicKeyHashHex.length, 40);

  assert.notEqual(
    result.treasuryDestination.publicKeyHashHex,
    result.platformDestination.publicKeyHashHex
  );

  console.log(
    'PASS: configured production platform address resolves as valid P2PKH'
  );
}

/**
 * --------------------------------------------------------------------------
 * Empty address
 * --------------------------------------------------------------------------
 */

assert.throws(
  () =>
    resolveCashOutSettlementDestinations({
      treasuryAddress: '',
    }),
  /is required/
);

console.log('PASS: missing Treasury settlement address is rejected');

/**
 * --------------------------------------------------------------------------
 * Testnet must fail closed
 * --------------------------------------------------------------------------
 */

const testnetTreasuryAddress = Address.fromHash160Hex(
  TREASURY_HASH,
  'P2PKH'
).toCashAddr('bchtest');

assert.throws(
  () =>
    resolveCashOutSettlementDestinations({
      treasuryAddress: testnetTreasuryAddress,

      platformAddress: ALTERNATE_PLATFORM_ADDRESS,
    }),
  /mainnet CashAddr/
);

console.log('PASS: testnet CashAddr is rejected');

/**
 * --------------------------------------------------------------------------
 * Legacy addresses must not be silently re-networked
 * --------------------------------------------------------------------------
 */

const legacyTreasuryAddress = Address.fromHash160Hex(
  TREASURY_HASH,
  'P2PKH'
).toLegacy();

assert.throws(
  () =>
    resolveCashOutSettlementDestinations({
      treasuryAddress: legacyTreasuryAddress,

      platformAddress: ALTERNATE_PLATFORM_ADDRESS,
    }),
  /mainnet CashAddr/
);

console.log('PASS: legacy address is rejected at the settlement boundary');

/**
 * --------------------------------------------------------------------------
 * P2SH is not valid for this covenant constructor
 * --------------------------------------------------------------------------
 */

const p2shAddress = Address.fromHash160Hex(P2SH_HASH, 'P2SH20').toCashAddr(
  'bitcoincash'
);

assert.throws(
  () =>
    resolveCashOutSettlementDestinations({
      treasuryAddress: p2shAddress,

      platformAddress: ALTERNATE_PLATFORM_ADDRESS,
    }),
  /must be a P2PKH/
);

console.log('PASS: P2SH Treasury destination is rejected');

/**
 * --------------------------------------------------------------------------
 * Treasury and platform must remain economically distinct
 * --------------------------------------------------------------------------
 */

assert.throws(
  () =>
    resolveCashOutSettlementDestinations({
      treasuryAddress: TREASURY_ADDRESS,

      platformAddress: TREASURY_ADDRESS,
    }),
  /must be different/
);

console.log('PASS: identical Treasury/platform destination is rejected');

console.log('');
console.log('Cash-out Settlement D1C.2 destination tests passed.');
