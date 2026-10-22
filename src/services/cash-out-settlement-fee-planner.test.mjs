import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  Contract,
  MockNetworkProvider,
  TransactionBuilder,
  SignatureTemplate,
  randomUtxo,
} from 'cashscript';

/**
 * D1B.2 — deterministic Cash-out settlement miner-fee prototype.
 *
 * No Electrum.
 * No broadcast.
 * No real BCH.
 * No real Treasury keys.
 */

const PAYMENT_SATS = 206_000n;
const PLATFORM_FEE_SATS = 2_000n;

const CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
);

/**
 * Prototype normal settlement fee rate.
 *
 * 1 sat/byte matches the fee policy already used by the hardened Topup
 * transaction machinery.
 *
 * This value can later become an explicit application policy constant.
 */
const SETTLEMENT_FEE_RATE_SATS_PER_BYTE = 1n;

const MAX_FEE_PLANNING_ITERATIONS = 20;

const TREASURY_PKH = Uint8Array.from([
  0x75, 0x1e, 0x76, 0xe8, 0x19, 0x91, 0x96, 0xd4, 0x54, 0x94, 0x1c, 0x45, 0xd1,
  0xb3, 0xa3, 0x23, 0xf1, 0x43, 0x3b, 0xd6,
]);

const PLATFORM_PKH = Uint8Array.from([
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d,
  0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34,
]);

const TEST_TREASURY_PRIVATE_KEY = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
]);

const TEST_TREASURY_PUBLIC_KEY = Uint8Array.from([
  0x02, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95,
  0xce, 0x87, 0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59,
  0xf2, 0x81, 0x5b, 0x16, 0xf8, 0x17, 0x98,
]);

function p2pkhLockingBytecode(pkh) {
  if (!(pkh instanceof Uint8Array) || pkh.length !== 20) {
    throw new Error(
      'P2PKH locking bytecode requires an exact 20-byte public-key hash.'
    );
  }

  return Uint8Array.from([0x76, 0xa9, 0x14, ...pkh, 0x88, 0xac]);
}

const artifactPath = resolve(
  process.cwd(),
  'src/contracts/artifacts/CashOutSettlement.json'
);

const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

const TREASURY_LOCK = p2pkhLockingBytecode(TREASURY_PKH);

const PLATFORM_LOCK = p2pkhLockingBytecode(PLATFORM_PKH);

/**
 * Build one complete settlement candidate for one exact frozen miner fee.
 */
function createSettlementCandidate(settlementFeeSats) {
  if (typeof settlementFeeSats !== 'bigint' || settlementFeeSats <= 0n) {
    throw new Error('Settlement fee must be a positive bigint.');
  }

  const treasuryOutputSats =
    PAYMENT_SATS - PLATFORM_FEE_SATS - settlementFeeSats;

  if (treasuryOutputSats <= 0n) {
    throw new Error('Settlement fee leaves no positive Treasury output.');
  }

  const provider = new MockNetworkProvider();

  const contract = new Contract(
    artifact,
    [
      CASH_OUT_COMMITMENT,
      TREASURY_PKH,
      PLATFORM_PKH,
      PAYMENT_SATS,
      PLATFORM_FEE_SATS,
      settlementFeeSats,
    ],
    {
      provider,
    }
  );

  const contractUtxo = randomUtxo({
    satoshis: PAYMENT_SATS,
  });

  provider.addUtxo(contract.address, contractUtxo);

  const transactionBuilder = new TransactionBuilder({
    provider,

    /**
     * This is only a safety ceiling.
     *
     * The covenant itself still fixes the exact fee economically.
     */
    maximumFeeSatoshis: 10_000n,

    maximumFeeSatsPerByte: 10,
  })
    .addInput(
      contractUtxo,
      contract.unlock.settle(
        TEST_TREASURY_PUBLIC_KEY,
        new SignatureTemplate(TEST_TREASURY_PRIVATE_KEY)
      )
    )
    .addOutput({
      to: TREASURY_LOCK,
      amount: treasuryOutputSats,
    })
    .addOutput({
      to: PLATFORM_LOCK,
      amount: PLATFORM_FEE_SATS,
    });

  return {
    contract,

    transactionBuilder,

    treasuryOutputSats,
  };
}

/**
 * Find a fixed point:
 *
 * frozen fee
 *   =
 * fully serialized settlement size
 *   ×
 * chosen fee rate
 *
 * We iterate because settlementFeeSats is itself embedded in the instantiated
 * contract's redeem script. A change in its encoded integer length can change
 * the transaction size.
 */
function planSettlementFee() {
  let proposedFeeSats = 1n;

  const iterations = [];

  for (
    let iteration = 1;
    iteration <= MAX_FEE_PLANNING_ITERATIONS;
    iteration += 1
  ) {
    const { transactionBuilder } = createSettlementCandidate(proposedFeeSats);

    const transactionSizeBytes = transactionBuilder.getTransactionSize();

    const requiredFeeSats =
      transactionSizeBytes * SETTLEMENT_FEE_RATE_SATS_PER_BYTE;

    iterations.push({
      iteration,
      proposedFeeSats,
      transactionSizeBytes,
      requiredFeeSats,
    });

    if (requiredFeeSats === proposedFeeSats) {
      return {
        settlementFeeSats: proposedFeeSats,

        transactionSizeBytes,

        iterations,
      };
    }

    proposedFeeSats = requiredFeeSats;
  }

  throw new Error('Cash-out settlement fee planning did not converge.');
}

const plan = planSettlementFee();

console.log('Cash-out Settlement D1B.2 fee-planning iterations:');

for (const iteration of plan.iterations) {
  console.log(
    `  ${iteration.iteration}: ` +
      `proposed=${iteration.proposedFeeSats} sats, ` +
      `size=${iteration.transactionSizeBytes} bytes, ` +
      `required=${iteration.requiredFeeSats} sats`
  );
}

const { transactionBuilder, treasuryOutputSats } = createSettlementCandidate(
  plan.settlementFeeSats
);

/**
 * Verify the final transaction actually evaluates under the covenant.
 */
assert.doesNotThrow(() => {
  transactionBuilder.debug();
}, 'Final fee-planned settlement must satisfy the covenant.');

console.log('PASS: fee-planned settlement satisfies covenant');

/**
 * Verify the serialized size is still exactly the size used by the planner.
 */
const finalTransactionSize = transactionBuilder.getTransactionSize();

assert.equal(finalTransactionSize, plan.transactionSizeBytes);

console.log('PASS: final serialized transaction size is stable');

/**
 * Verify actual economic fee:
 *
 * input - outputs
 *
 * exactly matches the frozen settlement fee.
 */
const actualFee = transactionBuilder.calculateTransactionFee();

assert.equal(actualFee.feeSats, plan.settlementFeeSats);

console.log('PASS: actual transaction fee equals frozen contract fee');

/**
 * At 1 sat/byte the frozen fee must equal serialized size.
 */
assert.equal(
  plan.settlementFeeSats,
  finalTransactionSize * SETTLEMENT_FEE_RATE_SATS_PER_BYTE
);

console.log('PASS: frozen fee exactly satisfies 1 sat/byte policy');

/**
 * The merchant side absorbs the miner fee.
 */
assert.equal(
  treasuryOutputSats,
  PAYMENT_SATS - PLATFORM_FEE_SATS - plan.settlementFeeSats
);

console.log(
  'PASS: settlement miner fee is deducted only from Treasury allocation'
);

console.log('');
console.log(`Final settlement size: ${finalTransactionSize} bytes`);

console.log(`Frozen settlement fee: ${plan.settlementFeeSats} sats`);

console.log(`Reported fee rate: ${actualFee.feeSatsPerByte} sats/byte`);

console.log(`Treasury output: ${treasuryOutputSats} sats`);

console.log(`Platform output: ${PLATFORM_FEE_SATS} sats`);

console.log('');
console.log('Cash-out Settlement D1B.2 fee-planning tests passed.');
