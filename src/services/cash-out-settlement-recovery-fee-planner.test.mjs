import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  Contract,
  MockNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
  randomUtxo,
} from 'cashscript';

/**
 * D6C.3 — Cash-out exceptional recovery fixed-point fee planning.
 *
 * Isolated test only:
 *
 * - MockNetworkProvider;
 * - no Electrum;
 * - no broadcast;
 * - no Treasury mnemonic;
 * - deterministic test-only merchant key.
 *
 * Goal:
 *
 * Measure the actual signed serialized size of Recovery v1 transactions with
 * 1, 2 and 3 contract inputs, then iterate until:
 *
 *   recovery miner fee == serialized transaction size
 *
 * at the current 1 sat/byte policy.
 */

const PAYMENT_SATS = 206_000n;
const PLATFORM_FEE_SATS = 2_000n;

/**
 * Final normal settlement fee measured after the D6 recovery branch was added:
 *
 * 505 bytes -> 505 sats @ 1 sat/byte.
 *
 * This is a constructor argument of the instantiated Cash-out contract even
 * though recover() has its own separately calculated recovery miner fee.
 */
const SETTLEMENT_FEE_SATS = 505n;

const TARGET_SATS_PER_BYTE = 1n;

/**
 * Start deliberately above the expected recovery fee.
 *
 * Unlike the earlier covenant test, this value is not the final fee.
 * It is only a bootstrap value from which the planner converges downward to
 * the exact fixed point.
 */
const INITIAL_RECOVERY_FEE_SATS = 5_000n;

const MAX_FEE_PLANNING_ITERATIONS = 10;

const CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
);

/**
 * Test-only merchant key:
 *
 * private scalar = 1
 *
 * Compressed public key:
 * 0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
 *
 * HASH160:
 * 751e76e8199196d454941c45d1b3a323f1433bd6
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

const PLATFORM_PKH = Uint8Array.from([
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d,
  0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34,
]);

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

const artifactPath = resolve(
  process.cwd(),
  'src/contracts/artifacts/CashOutSettlement.json'
);

const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

function createContract(provider) {
  return new Contract(
    artifact,
    [
      CASH_OUT_COMMITMENT,
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

function buildRecoveryCandidate(recoveryInputSats, recoveryFeeSats) {
  assert.equal(
    recoveryInputSats.length >= 1 && recoveryInputSats.length <= 3,
    true,
    'Recovery v1 requires between one and three inputs.'
  );

  assert.equal(recoveryFeeSats > 0n, true, 'Recovery fee must be positive.');

  const provider = new MockNetworkProvider();

  const contract = createContract(provider);

  const transactionBuilder = new TransactionBuilder({
    provider,
  });

  let totalInputSats = 0n;

  for (const satoshis of recoveryInputSats) {
    totalInputSats += satoshis;

    const utxo = randomUtxo({
      satoshis,
    });

    provider.addUtxo(contract.address, utxo);

    transactionBuilder.addInput(
      utxo,
      contract.unlock.recover(
        MERCHANT_PUBLIC_KEY,
        new SignatureTemplate(MERCHANT_PRIVATE_KEY),
        recoveryFeeSats
      )
    );
  }

  const treasuryOutputSats =
    totalInputSats - PLATFORM_FEE_SATS - recoveryFeeSats;

  assert.equal(
    treasuryOutputSats > 0n,
    true,
    'Recovery fee must leave a positive Treasury output.'
  );

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
    totalInputSats,
    treasuryOutputSats,
  };
}

function getSerializedTransactionSizeBytes(transactionBuilder) {
  /**
   * CashScript TransactionBuilder.build() produces the final raw transaction
   * hex without broadcasting it.
   */
  const rawTransaction = transactionBuilder.build();

  assert.equal(
    typeof rawTransaction,
    'string',
    'Built recovery transaction must be raw hex.'
  );

  assert.equal(
    rawTransaction.length % 2,
    0,
    'Raw recovery transaction hex must have an even length.'
  );

  return {
    rawTransaction,
    sizeBytes: rawTransaction.length / 2,
  };
}

function planRecoveryFee(name, recoveryInputSats) {
  let proposedFeeSats = INITIAL_RECOVERY_FEE_SATS;

  const iterations = [];

  for (
    let iteration = 1;
    iteration <= MAX_FEE_PLANNING_ITERATIONS;
    iteration += 1
  ) {
    const candidate = buildRecoveryCandidate(
      recoveryInputSats,
      proposedFeeSats
    );

    const { rawTransaction, sizeBytes } = getSerializedTransactionSizeBytes(
      candidate.transactionBuilder
    );

    const requiredFeeSats = BigInt(sizeBytes) * TARGET_SATS_PER_BYTE;

    iterations.push({
      iteration,
      proposedFeeSats,
      sizeBytes,
      requiredFeeSats,
    });

    if (proposedFeeSats === requiredFeeSats) {
      /**
       * Execute the covenant as a final proof that the fixed-point transaction
       * is not merely serializable, but actually accepted by recover().
       */
      assert.doesNotThrow(() => {
        candidate.transactionBuilder.debug();
      }, `${name}: fixed-point recovery must satisfy the covenant.`);

      const actualFeeSats =
        candidate.totalInputSats -
        candidate.treasuryOutputSats -
        PLATFORM_FEE_SATS;

      assert.equal(
        actualFeeSats,
        proposedFeeSats,
        `${name}: actual transaction fee must equal the frozen recovery fee.`
      );

      return {
        name,
        inputCount: recoveryInputSats.length,
        totalInputSats: candidate.totalInputSats,
        treasuryOutputSats: candidate.treasuryOutputSats,
        platformOutputSats: PLATFORM_FEE_SATS,
        recoveryFeeSats: proposedFeeSats,
        sizeBytes,
        rawTransaction,
        iterations,
      };
    }

    proposedFeeSats = requiredFeeSats;
  }

  throw new Error(
    `${name}: recovery fee planner did not reach a fixed point within ${MAX_FEE_PLANNING_ITERATIONS} iterations.`
  );
}

function printPlan(plan) {
  console.log('');
  console.log(`${plan.name} fee-planning iterations:`);

  for (const iteration of plan.iterations) {
    console.log(
      `  ${iteration.iteration}: proposed=${iteration.proposedFeeSats} sats, size=${iteration.sizeBytes} bytes, required=${iteration.requiredFeeSats} sats`
    );
  }

  console.log(`Final size: ${plan.sizeBytes} bytes`);

  console.log(`Frozen recovery fee: ${plan.recoveryFeeSats} sats`);

  console.log(`Treasury output: ${plan.treasuryOutputSats} sats`);

  console.log(`Platform output: ${plan.platformOutputSats} sats`);
}

/**
 * --------------------------------------------------------------------------
 * 1 INPUT
 * --------------------------------------------------------------------------
 *
 * Representative underpayment.
 */
const oneInputPlan = planRecoveryFee('1-input recovery', [180_000n]);

printPlan(oneInputPlan);

/**
 * --------------------------------------------------------------------------
 * 2 INPUTS
 * --------------------------------------------------------------------------
 *
 * Representative fragmented payment that aggregates to the original required
 * customer amount.
 */
const twoInputPlan = planRecoveryFee('2-input recovery', [100_000n, 106_000n]);

printPlan(twoInputPlan);

/**
 * --------------------------------------------------------------------------
 * 3 INPUTS
 * --------------------------------------------------------------------------
 */
const threeInputPlan = planRecoveryFee('3-input recovery', [
  50_000n,
  70_000n,
  86_000n,
]);

printPlan(threeInputPlan);

/**
 * Every plan must exactly satisfy the current 1 sat/byte policy.
 */
for (const plan of [oneInputPlan, twoInputPlan, threeInputPlan]) {
  assert.equal(
    plan.recoveryFeeSats,
    BigInt(plan.sizeBytes) * TARGET_SATS_PER_BYTE
  );

  assert.equal(
    plan.treasuryOutputSats + plan.platformOutputSats + plan.recoveryFeeSats,
    plan.totalInputSats
  );
}

console.log('');
console.log('PASS: 1-input recovery reaches an exact fixed-point miner fee');

console.log('PASS: 2-input recovery reaches an exact fixed-point miner fee');

console.log('PASS: 3-input recovery reaches an exact fixed-point miner fee');

assert.equal(
  twoInputPlan.sizeBytes > oneInputPlan.sizeBytes,
  true,
  'Two-input recovery should serialize larger than one-input recovery.'
);

assert.equal(
  threeInputPlan.sizeBytes > twoInputPlan.sizeBytes,
  true,
  'Three-input recovery should serialize larger than two-input recovery.'
);

console.log(
  'PASS: recovery transaction size increases with each additional contract input'
);

console.log('');
console.log(
  'Cash-out Settlement D6C.3 recovery fixed-point fee-planning tests passed.'
);
