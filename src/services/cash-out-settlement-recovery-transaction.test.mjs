import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  Contract,
  MockNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
} from 'cashscript';

/**
 * D6E.2 runtime CashScript test.
 *
 * This file is deliberately ESM (.mjs).
 *
 * The project runs Node 18 and CashScript's libauth dependency uses top-level
 * await, so this runtime boundary must not be executed through the repo's
 * CommonJS-mode standalone tsx path.
 *
 * Pure D6C/D6D/D6E.1 rules are already tested separately in TypeScript.
 * This test concentrates specifically on the real CashScript construction and
 * signing boundary used by D6E.2.
 *
 * No Electrum.
 * No real Treasury mnemonic.
 * No persistence.
 * No broadcast.
 */

const artifactPath = resolve(
  process.cwd(),
  'src/contracts/artifacts/CashOutSettlement.json'
);

const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

const PAYMENT_SATS = 206_000n;

const PLATFORM_FEE_SATS = 2_000n;

/**
 * Original normal-settlement fee remains a constructor value of the contract.
 */
const NORMAL_SETTLEMENT_FEE_SATS = 505n;

/**
 * Already-measured two-input Recovery v1 fixed point.
 *
 * D6E.3 will calculate this dynamically rather than hard-code it.
 */
const RECOVERY_FEE_SATS = 1_138n;

const CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
);

/**
 * Deterministic test-only Treasury key: private scalar = 1.
 */
const MERCHANT_PRIVATE_KEY = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
]);

const MERCHANT_PUBLIC_KEY = Uint8Array.from([
  0x02, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95,
  0xce, 0x87, 0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59,
  0xf2, 0x81, 0x5b, 0x16, 0xf8, 0x17, 0x98,
]);

/**
 * Wrong deterministic test key: private scalar = 2.
 */
const WRONG_PRIVATE_KEY = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
]);

const TREASURY_PKH = Uint8Array.from([
  0x75, 0x1e, 0x76, 0xe8, 0x19, 0x91, 0x96, 0xd4, 0x54, 0x94, 0x1c, 0x45, 0xd1,
  0xb3, 0xa3, 0x23, 0xf1, 0x43, 0x3b, 0xd6,
]);

const PLATFORM_PKH = Uint8Array.from([
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d,
  0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34,
]);

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const NUISANCE_TXID =
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

function p2pkhLockingBytecode(pkh) {
  assert.equal(
    pkh instanceof Uint8Array,
    true,
    'P2PKH public-key hash must be bytes.'
  );

  assert.equal(
    pkh.length,
    20,
    'P2PKH public-key hash must be exactly 20 bytes.'
  );

  return Uint8Array.from([0x76, 0xa9, 0x14, ...pkh, 0x88, 0xac]);
}

const TREASURY_LOCK = p2pkhLockingBytecode(TREASURY_PKH);

const PLATFORM_LOCK = p2pkhLockingBytecode(PLATFORM_PKH);

function createContract(provider) {
  return new Contract(
    artifact,
    [
      CASH_OUT_COMMITMENT,
      TREASURY_PKH,
      PLATFORM_PKH,
      PAYMENT_SATS,
      PLATFORM_FEE_SATS,
      NORMAL_SETTLEMENT_FEE_SATS,
    ],
    {
      provider,
      contractType: 'p2sh32',
    }
  );
}

function addSelectedUtxos(provider, contract) {
  const first = {
    txid: TXID_A,
    vout: 0,
    satoshis: 100_000n,
  };

  const second = {
    txid: TXID_B,
    vout: 1,
    satoshis: 106_000n,
  };

  provider.addUtxo(contract.address, first);
  provider.addUtxo(contract.address, second);

  /**
   * Same contract, but not part of the authorized D6D set.
   */
  provider.addUtxo(contract.address, {
    txid: NUISANCE_TXID,
    vout: 7,
    satoshis: 546n,
  });

  return [first, second];
}

function createRecoveryUnlocker(
  contract,
  privateKey = MERCHANT_PRIVATE_KEY,
  recoveryFeeSats = RECOVERY_FEE_SATS
) {
  return contract.unlock.recover(
    MERCHANT_PUBLIC_KEY,
    new SignatureTemplate(privateKey),
    recoveryFeeSats
  );
}

function buildTwoInputRecovery(
  privateKey = MERCHANT_PRIVATE_KEY,
  recoveryFeeSats = RECOVERY_FEE_SATS
) {
  const provider = new MockNetworkProvider();

  const contract = createContract(provider);

  const selectedInputs = addSelectedUtxos(provider, contract);

  const totalInputSats = selectedInputs.reduce(
    (total, input) => total + input.satoshis,
    0n
  );

  const treasuryOutputSats =
    totalInputSats - PLATFORM_FEE_SATS - recoveryFeeSats;

  const transactionBuilder = new TransactionBuilder({
    provider,
    maximumFeeSatoshis: 10_000n,
    maximumFeeSatsPerByte: 10,
  });

  /**
   * D6E is deliberately given only these exact selected inputs.
   *
   * The nuisance UTXO above is visible to the mock provider but is never
   * discovered or selected by this constructor.
   */
  for (const selectedInput of selectedInputs) {
    transactionBuilder.addInput(
      selectedInput,
      createRecoveryUnlocker(contract, privateKey, recoveryFeeSats)
    );
  }

  transactionBuilder
    .addOutput({
      to: TREASURY_LOCK,
      amount: treasuryOutputSats,
    })
    .addOutput({
      to: PLATFORM_LOCK,
      amount: PLATFORM_FEE_SATS,
    });

  return {
    transactionBuilder,
    selectedInputs,
    totalInputSats,
    treasuryOutputSats,
    contract,
  };
}

/**
 * Exact authorized two-input recovery succeeds.
 */
{
  const candidate = buildTwoInputRecovery();

  assert.doesNotThrow(() => {
    candidate.transactionBuilder.debug();
  });

  const rawTransactionHex = candidate.transactionBuilder
    .build()
    .trim()
    .toLowerCase();

  assert.match(rawTransactionHex, /^[0-9a-f]+$/);

  assert.equal(rawTransactionHex.length % 2, 0);

  const transactionBytes = rawTransactionHex.length / 2;

  const calculatedFee = candidate.transactionBuilder.calculateTransactionFee();

  assert.equal(
    calculatedFee.feeSats,
    RECOVERY_FEE_SATS,
    'Actual two-input recovery fee must equal the frozen recovery fee.'
  );

  assert.equal(
    transactionBytes,
    Number(RECOVERY_FEE_SATS),
    'At 1 sat/byte, the signed transaction byte size must equal its fee.'
  );

  assert.equal(candidate.selectedInputs.length, 2);

  assert.equal(candidate.selectedInputs[0].txid, TXID_A);

  assert.equal(candidate.selectedInputs[1].txid, TXID_B);

  console.log(
    'PASS: exact two-input recovery constructs and signs successfully'
  );
}

/**
 * Building the exact same selected inputs and outputs again must produce the
 * exact same signed serialized transaction.
 */
{
  const first = buildTwoInputRecovery();

  first.transactionBuilder.debug();

  const firstRaw = first.transactionBuilder.build().trim().toLowerCase();

  const second = buildTwoInputRecovery();

  second.transactionBuilder.debug();

  const secondRaw = second.transactionBuilder.build().trim().toLowerCase();

  assert.equal(
    secondRaw,
    firstRaw,
    'Identical recovery construction must produce identical signed bytes.'
  );

  console.log(
    'PASS: exact recovery reconstruction produces deterministic signed bytes'
  );
}

/**
 * The unselected nuisance UTXO must not affect the constructed economics.
 */
{
  const candidate = buildTwoInputRecovery();

  assert.equal(candidate.totalInputSats, PAYMENT_SATS);

  assert.equal(
    candidate.treasuryOutputSats + PLATFORM_FEE_SATS + RECOVERY_FEE_SATS,
    candidate.totalInputSats
  );

  console.log('PASS: unselected nuisance UTXO cannot enter recovery economics');
}

/**
 * Correct merchant public key with the wrong Treasury signing key must fail
 * covenant evaluation.
 */
{
  const candidate = buildTwoInputRecovery(WRONG_PRIVATE_KEY);

  assert.throws(() => {
    candidate.transactionBuilder.debug();
  });

  console.log(
    'PASS: wrong Treasury recovery signature is rejected by recover()'
  );
}

/**
 * D6E.3 fixed-point proof.
 *
 * The final recovery fee must be discovered from the actual final signed
 * transaction rather than hard-coded from previous measurements.
 */
{
  let proposedRecoveryFeeSats = 1n;

  let fixedPoint = null;

  for (let iteration = 1; iteration <= 20; iteration += 1) {
    let candidate;

    try {
      candidate = buildTwoInputRecovery(
        MERCHANT_PRIVATE_KEY,
        proposedRecoveryFeeSats
      );

      candidate.transactionBuilder.debug();
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'TransactionFeePerByteTooLowError' ||
          error.constructor.name === 'TransactionFeePerByteTooLowError')
      ) {
        proposedRecoveryFeeSats *= 2n;

        continue;
      }

      throw error;
    }

    const rawTransactionHex = candidate.transactionBuilder
      .build()
      .trim()
      .toLowerCase();

    const transactionBytes = BigInt(rawTransactionHex.length / 2);

    const requiredRecoveryFeeSats = transactionBytes;

    if (proposedRecoveryFeeSats === requiredRecoveryFeeSats) {
      fixedPoint = {
        iteration,

        recoveryFeeSats: proposedRecoveryFeeSats,

        transactionBytes,
      };

      break;
    }

    proposedRecoveryFeeSats = requiredRecoveryFeeSats;
  }

  assert.notEqual(
    fixedPoint,
    null,
    'Recovery fee planning must reach an exact fixed point.'
  );

  assert.equal(
    fixedPoint.recoveryFeeSats,
    fixedPoint.transactionBytes,
    'Final recovery fee must equal final signed byte size at 1 sat/byte.'
  );

  console.log(
    `PASS: recovery fee reaches signed-transaction fixed point at ${fixedPoint.recoveryFeeSats} sats`
  );
}

console.log('');

console.log(
  'Cash-out Settlement D6E.2 recovery transaction runtime tests passed.'
);
