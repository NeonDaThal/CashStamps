import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  Contract,
  MockNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
  randomToken,
  randomUtxo,
} from 'cashscript';

/**
 * D6B.2 Cash-out exceptional recovery covenant adversarial tests.
 *
 * Everything here is isolated:
 *
 * - MockNetworkProvider only;
 * - no Electrum;
 * - no BCH broadcast;
 * - no Treasury mnemonic;
 * - no live Cash-out records;
 * - deterministic test-only private keys.
 *
 * D1-D5 normal settlement remains tested separately.
 */

const PAYMENT_SATS = 206_000n;
const PLATFORM_FEE_SATS = 2_000n;
const SETTLEMENT_FEE_SATS = 500n;

const RECOVERY_FEE_SATS = 5000n;

/**
 * Deterministic fake Cash-out commitments.
 */
const CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
);

const OTHER_CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 33)
);

/**
 * --------------------------------------------------------------------------
 * TEST-ONLY TREASURY KEY
 * --------------------------------------------------------------------------
 *
 * Private key scalar = 1.
 *
 * Compressed secp256k1 public key:
 *
 * 0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
 *
 * HASH160:
 *
 * 751e76e8199196d454941c45d1b3a323f1433bd6
 *
 * These are public deterministic test values only.
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

const TREASURY_PKH = Uint8Array.from([
  0x75, 0x1e, 0x76, 0xe8, 0x19, 0x91, 0x96, 0xd4, 0x54, 0x94, 0x1c, 0x45, 0xd1,
  0xb3, 0xa3, 0x23, 0xf1, 0x43, 0x3b, 0xd6,
]);

/**
 * Wrong deterministic test key: private scalar = 2.
 */
const WRONG_PRIVATE_KEY = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
]);

const WRONG_PUBLIC_KEY = Uint8Array.from([
  0x02, 0xc6, 0x04, 0x7f, 0x94, 0x41, 0xed, 0x7d, 0x6d, 0x30, 0x45, 0x40, 0x6e,
  0x95, 0xc0, 0x7c, 0xd8, 0x5c, 0x77, 0x8e, 0x4b, 0x8c, 0xef, 0x3c, 0xa7, 0xab,
  0xac, 0x09, 0xb9, 0x5c, 0x70, 0x9e, 0xe5,
]);

/**
 * Fake platform and attacker HASH160 values.
 */
const PLATFORM_PKH = Uint8Array.from([
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d,
  0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34,
]);

const ATTACKER_PKH = Uint8Array.from([
  0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d,
  0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54,
]);

function p2pkhLockingBytecode(pkh) {
  if (!(pkh instanceof Uint8Array) || pkh.length !== 20) {
    throw new Error(
      'P2PKH locking bytecode requires an exact 20-byte public-key hash.'
    );
  }

  return Uint8Array.from([0x76, 0xa9, 0x14, ...pkh, 0x88, 0xac]);
}

const TREASURY_LOCK = p2pkhLockingBytecode(TREASURY_PKH);

const PLATFORM_LOCK = p2pkhLockingBytecode(PLATFORM_PKH);

const ATTACKER_LOCK = p2pkhLockingBytecode(ATTACKER_PKH);

const artifactPath = resolve(
  process.cwd(),
  'src/contracts/artifacts/CashOutSettlement.json'
);

const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

function createContract(provider, cashOutCommitment = CASH_OUT_COMMITMENT) {
  return new Contract(
    artifact,
    [
      cashOutCommitment,
      TREASURY_PKH,
      PLATFORM_PKH,
      PAYMENT_SATS,
      PLATFORM_FEE_SATS,
      SETTLEMENT_FEE_SATS,
    ],
    {
      provider,
    }
  );
}

function addContractUtxo(provider, contract, satoshis, token = undefined) {
  const utxo = randomUtxo({
    satoshis,

    ...(token === undefined
      ? {}
      : {
          token,
        }),
  });

  provider.addUtxo(contract.address, utxo);

  return utxo;
}

function recoveryUnlocker(contract, options = {}) {
  const merchantPublicKey = options.merchantPublicKey ?? MERCHANT_PUBLIC_KEY;

  const signerPrivateKey = options.signerPrivateKey ?? MERCHANT_PRIVATE_KEY;

  const declaredRecoveryFeeSats =
    options.declaredRecoveryFeeSats ?? RECOVERY_FEE_SATS;

  return contract.unlock.recover(
    merchantPublicKey,
    new SignatureTemplate(signerPrivateKey),
    declaredRecoveryFeeSats
  );
}

/**
 * Build one exceptional recovery attempt.
 *
 * recoveryInputSats:
 *   exact selected contract UTXO values.
 *
 * outputRecoveryFeeSats:
 *   fee used to calculate the Treasury output.
 *
 * declaredRecoveryFeeSats:
 *   fee argument supplied to recover().
 *
 * Keeping those two separately controllable lets us prove that callers cannot
 * declare one recovery fee while constructing outputs for another.
 */
function createRecoveryTransaction(options = {}) {
  const provider = new MockNetworkProvider();

  const contract = createContract(provider);

  const recoveryInputSats = options.recoveryInputSats ?? [PAYMENT_SATS];

  const declaredRecoveryFeeSats =
    options.declaredRecoveryFeeSats ?? RECOVERY_FEE_SATS;

  const outputRecoveryFeeSats =
    options.outputRecoveryFeeSats ?? declaredRecoveryFeeSats;

  const transactionBuilder = new TransactionBuilder({
    provider,

    /**
     * Token-bearing input attacks must reach the covenant rather than being
     * rejected first by the SDK's default implicit-burn safety mechanism.
     */
    allowImplicitFungibleTokenBurn: options.allowImplicitTokenBurn === true,
  });

  let totalRecoveryInputSats = 0n;

  for (let index = 0; index < recoveryInputSats.length; index += 1) {
    const satoshis = recoveryInputSats[index];

    totalRecoveryInputSats += satoshis;

    const token =
      options.tokenInputIndex === index
        ? randomToken({
            amount: 1n,
          })
        : undefined;

    const utxo = addContractUtxo(provider, contract, satoshis, token);

    transactionBuilder.addInput(
      utxo,
      recoveryUnlocker(contract, {
        merchantPublicKey: options.merchantPublicKey,

        signerPrivateKey: options.signerPrivateKey,

        declaredRecoveryFeeSats,
      })
    );
  }

  /**
   * Optional same-looking but DIFFERENT contract instance.
   *
   * Only the Cash-out commitment differs, so this is a strong test that
   * recovery cannot mix another Cash-out's contract UTXO into this one.
   */
  if (options.foreignContractInputSats !== undefined) {
    const foreignContract = createContract(provider, OTHER_CASH_OUT_COMMITMENT);

    const foreignUtxo = addContractUtxo(
      provider,
      foreignContract,
      options.foreignContractInputSats
    );

    totalRecoveryInputSats += options.foreignContractInputSats;

    transactionBuilder.addInput(
      foreignUtxo,
      recoveryUnlocker(foreignContract, {
        declaredRecoveryFeeSats,
      })
    );
  }

  const defaultTreasuryOutputSats =
    totalRecoveryInputSats - PLATFORM_FEE_SATS - outputRecoveryFeeSats;

  const treasuryOutput = {
    to: options.treasuryLock ?? TREASURY_LOCK,

    amount: options.treasuryOutputSats ?? defaultTreasuryOutputSats,
  };

  const platformOutput = {
    to: options.platformLock ?? PLATFORM_LOCK,

    amount: options.platformOutputSats ?? PLATFORM_FEE_SATS,
  };

  if (options.swapOutputs === true) {
    transactionBuilder.addOutput(platformOutput).addOutput(treasuryOutput);
  } else {
    transactionBuilder.addOutput(treasuryOutput).addOutput(platformOutput);
  }

  if (options.extraOutput !== undefined) {
    transactionBuilder.addOutput({
      to: options.extraOutput.to ?? ATTACKER_LOCK,

      amount: options.extraOutput.amount,
    });
  }

  return transactionBuilder;
}

function assertRecoveryAccepts(name, createAttempt) {
  assert.doesNotThrow(() => {
    const transactionBuilder = createAttempt();

    transactionBuilder.debug();
  }, `${name}: expected recovery to be accepted.`);

  console.log(`PASS: ${name}`);
}

function assertRecoveryRejects(name, createAttempt) {
  let rejected = false;

  try {
    const transactionBuilder = createAttempt();

    transactionBuilder.debug();
  } catch {
    rejected = true;
  }

  assert.equal(rejected, true, `${name}: expected recovery to be rejected.`);

  console.log(`PASS: ${name}`);
}

/**
 * --------------------------------------------------------------------------
 * MERCHANT AUTHORIZATION
 * --------------------------------------------------------------------------
 */

assertRecoveryAccepts('authorized merchant recovery succeeds', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],
  })
);

assertRecoveryRejects('wrong merchant public key is rejected', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    merchantPublicKey: WRONG_PUBLIC_KEY,

    signerPrivateKey: WRONG_PRIVATE_KEY,
  })
);

assertRecoveryRejects(
  'correct merchant public key with wrong signature is rejected',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      merchantPublicKey: MERCHANT_PUBLIC_KEY,

      signerPrivateKey: WRONG_PRIVATE_KEY,
    })
);

/**
 * --------------------------------------------------------------------------
 * EXCEPTIONAL PAYMENT SHAPES
 * --------------------------------------------------------------------------
 */

/**
 * Underpayment.
 */
assertRecoveryAccepts(
  'underpayment recovery succeeds while preserving platform allocation',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],
    })
);

/**
 * Overpayment.
 */
assertRecoveryAccepts(
  'overpayment recovery succeeds without increasing platform allocation',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [230_000n],
    })
);

/**
 * Two fragments totalling exactly the original required amount.
 */
assertRecoveryAccepts('two-input fragmented payment recovery succeeds', () =>
  createRecoveryTransaction({
    recoveryInputSats: [100_000n, 106_000n],
  })
);

/**
 * Three fragments.
 */
assertRecoveryAccepts('three-input fragmented payment recovery succeeds', () =>
  createRecoveryTransaction({
    recoveryInputSats: [50_000n, 70_000n, 86_000n],
  })
);

/**
 * Recovery v1 deliberately supports no more than three selected contract
 * inputs. Four inputs must fail closed at the covenant itself, not only in
 * the off-chain planner.
 */
assertRecoveryRejects(
  'four-input recovery fails closed under Recovery v1',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [50_000n, 50_000n, 50_000n, 56_000n],
    })
);

/**
 * Two complete exact customer payments still represent one Cash-out.
 *
 * Only one original platform allocation is permitted.
 */
assertRecoveryAccepts(
  'multiple exact payments recover together with one platform allocation',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [PAYMENT_SATS, PAYMENT_SATS],
    })
);

/**
 * --------------------------------------------------------------------------
 * INPUT-BINDING ATTACKS
 * --------------------------------------------------------------------------
 */

/**
 * A UTXO from another Cash-out contract has a different locking bytecode,
 * despite otherwise sharing Treasury/platform economics.
 */
assertRecoveryRejects(
  'different Cash-out contract input cannot be mixed into recovery',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      foreignContractInputSats: 10_000n,
    })
);

/**
 * Token-bearing contract value is outside Recovery v1.
 *
 * We explicitly allow implicit token burn at the SDK builder layer so the
 * covenant's own tokenCategory check is what must reject this transaction.
 */
assertRecoveryRejects('token-bearing exceptional input is rejected', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    tokenInputIndex: 0,

    allowImplicitTokenBurn: true,
  })
);

/**
 * --------------------------------------------------------------------------
 * DESTINATION ATTACKS
 * --------------------------------------------------------------------------
 */

assertRecoveryRejects('recovery cannot redirect Treasury output', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    treasuryLock: ATTACKER_LOCK,
  })
);

assertRecoveryRejects('recovery cannot redirect platform output', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    platformLock: ATTACKER_LOCK,
  })
);

/**
 * --------------------------------------------------------------------------
 * PLATFORM PROTECTION
 * --------------------------------------------------------------------------
 */

assertRecoveryRejects('recovery cannot reduce platform allocation', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    platformOutputSats: PLATFORM_FEE_SATS - 1n,

    /**
     * Give the stolen satoshi to Treasury so total transaction fee stays
     * unchanged.
     */
    treasuryOutputSats: 180_000n - PLATFORM_FEE_SATS - RECOVERY_FEE_SATS + 1n,
  })
);

assertRecoveryRejects('recovery cannot increase platform allocation', () =>
  createRecoveryTransaction({
    recoveryInputSats: [230_000n],

    platformOutputSats: PLATFORM_FEE_SATS + 1n,

    treasuryOutputSats: 230_000n - PLATFORM_FEE_SATS - RECOVERY_FEE_SATS - 1n,
  })
);

/**
 * --------------------------------------------------------------------------
 * TRANSACTION-SHAPE ATTACKS
 * --------------------------------------------------------------------------
 */

assertRecoveryRejects(
  'Treasury and platform recovery outputs cannot be swapped',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      swapOutputs: true,
    })
);

/**
 * Divert 546 sats from Treasury to an attacker while preserving the intended
 * total miner fee.
 */
assertRecoveryRejects('extra attacker output is rejected', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    treasuryOutputSats: 180_000n - PLATFORM_FEE_SATS - RECOVERY_FEE_SATS - 546n,

    extraOutput: {
      amount: 546n,
    },
  })
);

assertRecoveryRejects(
  'recovery cannot arbitrarily reduce Treasury output',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      treasuryOutputSats: 180_000n - PLATFORM_FEE_SATS - RECOVERY_FEE_SATS - 1n,
    })
);

assertRecoveryRejects(
  'recovery cannot arbitrarily increase Treasury output',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      treasuryOutputSats: 180_000n - PLATFORM_FEE_SATS - RECOVERY_FEE_SATS + 1n,
    })
);

/**
 * --------------------------------------------------------------------------
 * RECOVERY-FEE ECONOMICS
 * --------------------------------------------------------------------------
 */

/**
 * Outputs are calculated as though the recovery fee were 500 sats, but the
 * function argument claims 501 sats.
 *
 * The covenant must reject the mismatch.
 */
assertRecoveryRejects(
  'declared recovery fee must match the enforced output economics',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      declaredRecoveryFeeSats: 501n,

      outputRecoveryFeeSats: 500n,
    })
);

/**
 * Likewise in the opposite direction.
 */
assertRecoveryRejects(
  'caller cannot claim a smaller recovery fee than the outputs imply',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [180_000n],

      declaredRecoveryFeeSats: 499n,

      outputRecoveryFeeSats: 500n,
    })
);

/**
 * Recovery input equals:
 *
 * platform allocation + recovery miner fee.
 *
 * That leaves Treasury exactly zero, which the covenant must reject.
 */
assertRecoveryRejects(
  'too-small recovery cannot eliminate Treasury output',
  () =>
    createRecoveryTransaction({
      recoveryInputSats: [PLATFORM_FEE_SATS + RECOVERY_FEE_SATS],
    })
);

/**
 * A zero recovery fee is forbidden directly by the covenant.
 */
assertRecoveryRejects('zero recovery miner fee is rejected', () =>
  createRecoveryTransaction({
    recoveryInputSats: [180_000n],

    declaredRecoveryFeeSats: 0n,

    outputRecoveryFeeSats: 0n,
  })
);

console.log('');

console.log(
  'Cash-out Settlement D6B.2 exceptional recovery covenant tests passed.'
);
