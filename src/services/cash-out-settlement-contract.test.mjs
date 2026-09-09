import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  Contract,
  MockNetworkProvider,
  TransactionBuilder,
  randomUtxo,
} from 'cashscript';

/**
 * D1A Cash-out Settlement covenant adversarial tests.
 *
 * Everything in this file is isolated:
 *
 * - MockNetworkProvider only;
 * - no Electrum connection;
 * - no BCH broadcast;
 * - no Treasury mnemonic;
 * - no live Cash-out records;
 * - no real private keys.
 *
 * The purpose is to prove which transactions the normal Cash-out settlement
 * covenant will and will not permit.
 */

const PAYMENT_SATS = 206_000n;
const PLATFORM_FEE_SATS = 2_000n;
const SETTLEMENT_FEE_SATS = 500n;

/**
 * Deterministic fake Cash-out quote-instance commitments.
 *
 * Test values only.
 */
const CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
);

const OTHER_CASH_OUT_COMMITMENT = Uint8Array.from(
  Array.from({ length: 32 }, (_, index) => index + 33)
);

const TREASURY_OUTPUT_SATS =
  PAYMENT_SATS - PLATFORM_FEE_SATS - SETTLEMENT_FEE_SATS;

/**
 * Deterministic fake 20-byte public-key hashes.
 *
 * Test values only.
 */
const TREASURY_PKH = Uint8Array.from([
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
  0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14,
]);

const PLATFORM_PKH = Uint8Array.from([
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d,
  0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34,
]);

const ATTACKER_PKH = Uint8Array.from([
  0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d,
  0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54,
]);

/**
 * Standard P2PKH locking bytecode:
 *
 * OP_DUP OP_HASH160 PUSHBYTES_20 <pkh> OP_EQUALVERIFY OP_CHECKSIG
 */
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
const ATTACKER_LOCK = p2pkhLockingBytecode(ATTACKER_PKH);

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

/**
 * Create one synthetic UTXO belonging to the contract.
 */
function addContractUtxo(provider, contract, satoshis) {
  const utxo = randomUtxo({
    satoshis,
  });

  provider.addUtxo(contract.address, utxo);

  return utxo;
}

/**
 * Build a settlement attempt.
 *
 * Options let adversarial tests mutate:
 *
 * - the selected contract UTXO value;
 * - Treasury destination/value;
 * - Platform destination/value;
 * - output ordering;
 * - additional outputs;
 * - additional inputs;
 * - unrelated UTXOs existing at the same contract address.
 */
function createSettlementTransaction(options = {}) {
  const provider = new MockNetworkProvider();

  const contract = createContract(provider);

  const selectedPaymentUtxo = addContractUtxo(
    provider,
    contract,
    options.paymentInputSats ?? PAYMENT_SATS
  );

  /**
   * Additional UTXOs may exist at the contract address without being selected
   * as transaction inputs.
   *
   * This models nuisance dust and duplicate/unexpected payments.
   */
  for (const satoshis of options.unselectedContractUtxoSats ?? []) {
    addContractUtxo(provider, contract, satoshis);
  }

  const transactionBuilder = new TransactionBuilder({
    provider,
  });

  transactionBuilder.addInput(selectedPaymentUtxo, contract.unlock.settle());

  /**
   * Add a second actual transaction input when requested.
   *
   * We deliberately use another contract UTXO rather than a placeholder
   * P2PKH input. This avoids introducing a fake-signature failure into the
   * test: the covenant's tx.inputs.length rule must reject the transaction
   * regardless of the additional input's script type.
   */
  if (options.extraInputSats !== undefined) {
    const extraInput = addContractUtxo(
      provider,
      contract,
      options.extraInputSats
    );

    transactionBuilder.addInput(extraInput, contract.unlock.settle());
  }

  const treasuryOutput = {
    to: options.treasuryLock ?? TREASURY_LOCK,

    amount: options.treasuryOutputSats ?? TREASURY_OUTPUT_SATS,
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

  if (options.extraOutput) {
    transactionBuilder.addOutput({
      to: options.extraOutput.to ?? ATTACKER_LOCK,
      amount: options.extraOutput.amount,
    });
  }

  return transactionBuilder;
}

function assertSettlementAccepts(name, createAttempt) {
  assert.doesNotThrow(() => {
    const transactionBuilder = createAttempt();

    transactionBuilder.debug();
  }, `${name}: expected settlement to be accepted.`);

  console.log(`PASS: ${name}`);
}

function assertSettlementRejects(name, createAttempt) {
  let rejected = false;

  try {
    const transactionBuilder = createAttempt();

    transactionBuilder.debug();
  } catch {
    rejected = true;
  }

  assert.equal(rejected, true, `${name}: expected settlement to be rejected.`);

  console.log(`PASS: ${name}`);
}

/**
 * --------------------------------------------------------------------------
 * BASE COVENANT PROOF
 * --------------------------------------------------------------------------
 */

assertSettlementAccepts('exact Treasury and platform settlement succeeds', () =>
  createSettlementTransaction()
);

assertSettlementRejects('wrong Treasury destination is rejected', () =>
  createSettlementTransaction({
    treasuryLock: ATTACKER_LOCK,
  })
);

assertSettlementRejects('wrong platform destination is rejected', () =>
  createSettlementTransaction({
    platformLock: ATTACKER_LOCK,
  })
);

assertSettlementRejects('wrong platform amount is rejected', () =>
  createSettlementTransaction({
    platformOutputSats: PLATFORM_FEE_SATS + 1n,
  })
);

assertSettlementRejects('wrong Treasury amount is rejected', () =>
  createSettlementTransaction({
    treasuryOutputSats: TREASURY_OUTPUT_SATS - 1n,
  })
);

/**
 * --------------------------------------------------------------------------
 * D1A ADVERSARIAL PAYMENT TESTS
 * --------------------------------------------------------------------------
 */

/**
 * The selected normal payment must be exact.
 *
 * One satoshi short must not pass.
 *
 * Outputs remain otherwise completely correct, so this directly exercises
 * the contract's selected-input value check.
 */
assertSettlementRejects('one-satoshi underpayment is rejected', () =>
  createSettlementTransaction({
    paymentInputSats: PAYMENT_SATS - 1n,
  })
);

/**
 * Likewise, an overpayment is not automatically interpreted as a valid
 * normal-path Cash-out.
 */
assertSettlementRejects('one-satoshi overpayment is rejected', () =>
  createSettlementTransaction({
    paymentInputSats: PAYMENT_SATS + 1n,
  })
);

/**
 * A dust UTXO sitting beside the real payment must not poison the selected
 * exact payment.
 *
 * The contract is UTXO-based, not balance-based.
 */
assertSettlementAccepts(
  'unselected dust UTXO does not poison an exact payment',
  () =>
    createSettlementTransaction({
      unselectedContractUtxoSats: [546n],
    })
);

/**
 * Several nuisance UTXOs also do not matter if the exact intended payment
 * UTXO has been positively selected.
 */
assertSettlementAccepts(
  'multiple unselected nuisance UTXOs do not poison an exact payment',
  () =>
    createSettlementTransaction({
      unselectedContractUtxoSats: [546n, 1_000n, 5_000n],
    })
);

/**
 * Important architectural property:
 *
 * The covenant evaluates the UTXO being spent. It cannot inspect the global
 * UTXO set and discover that another exact-payment UTXO exists at the same
 * contract address.
 *
 * Therefore the selected exact UTXO remains individually spendable.
 *
 * Application reconciliation must detect "multiple exact candidates" and
 * treat that Cash-out as exceptional so the merchant is never instructed to
 * give physical cash twice.
 */
assertSettlementAccepts(
  'selected exact payment remains valid when another exact UTXO exists',
  () =>
    createSettlementTransaction({
      unselectedContractUtxoSats: [PAYMENT_SATS],
    })
);

/**
 * --------------------------------------------------------------------------
 * TRANSACTION-SHAPE ATTACKS
 * --------------------------------------------------------------------------
 */

/**
 * A second input changes tx.inputs.length from 1 to 2.
 *
 * The extra 1,000 sats simply becomes additional transaction fee in this
 * synthetic attack, keeping construction straightforward.
 */
assertSettlementRejects('extra transaction input is rejected', () =>
  createSettlementTransaction({
    extraInputSats: 1_000n,
  })
);

/**
 * Output order is contractual:
 *
 * output 0 = Treasury
 * output 1 = Platform
 */
assertSettlementRejects('Treasury and platform outputs cannot be swapped', () =>
  createSettlementTransaction({
    swapOutputs: true,
  })
);

/**
 * Add an attacker output while reducing the Treasury output by the same
 * amount.
 *
 * This preserves:
 *
 * total input value
 * total economic outputs
 * exact 500-sat miner fee
 *
 * so it represents a genuine attempt to divert merchant value rather than
 * merely constructing an economically invalid transaction.
 */
assertSettlementRejects('extra attacker output is rejected', () =>
  createSettlementTransaction({
    treasuryOutputSats: TREASURY_OUTPUT_SATS - 546n,

    extraOutput: {
      amount: 546n,
    },
  })
);

/**
 * --------------------------------------------------------------------------
 * MINER-FEE MANIPULATION
 * --------------------------------------------------------------------------
 */

/**
 * Reduce Treasury by one satoshi:
 *
 * actual miner fee becomes 501 instead of the frozen 500.
 */
assertSettlementRejects('caller cannot increase the settlement miner fee', () =>
  createSettlementTransaction({
    treasuryOutputSats: TREASURY_OUTPUT_SATS - 1n,
  })
);

/**
 * Increase Treasury by one satoshi:
 *
 * actual miner fee becomes 499 instead of the frozen 500.
 */
assertSettlementRejects('caller cannot decrease the settlement miner fee', () =>
  createSettlementTransaction({
    treasuryOutputSats: TREASURY_OUTPUT_SATS + 1n,
  })
);

/**
 * Try moving one satoshi from Platform to Treasury while keeping the overall
 * miner fee unchanged.
 *
 * Both economic allocations are frozen independently.
 */
assertSettlementRejects(
  'caller cannot move platform allocation to the merchant',
  () =>
    createSettlementTransaction({
      treasuryOutputSats: TREASURY_OUTPUT_SATS + 1n,

      platformOutputSats: PLATFORM_FEE_SATS - 1n,
    })
);

/**
 * --------------------------------------------------------------------------
 * D1C.3 CONTRACT-IDENTITY BINDING
 * --------------------------------------------------------------------------
 */

/**
 * Re-instantiating the same frozen Cash-out commitment must produce exactly
 * the same contract identity.
 */
{
  const firstContract = createContract(new MockNetworkProvider());

  const secondContract = createContract(new MockNetworkProvider());

  assert.equal(firstContract.address, secondContract.address);

  console.log(
    'PASS: same Cash-out commitment produces the same contract identity'
  );
}

/**
 * A different Cash-out commitment must produce a different contract identity,
 * even when all economic values and settlement destinations are otherwise
 * identical.
 */
{
  const firstContract = createContract(new MockNetworkProvider());

  const differentCashOutContract = createContract(
    new MockNetworkProvider(),
    OTHER_CASH_OUT_COMMITMENT
  );

  assert.notEqual(firstContract.address, differentCashOutContract.address);

  console.log(
    'PASS: different Cash-out commitment produces a different contract identity'
  );
}

console.log('');
console.log('Cash-out Settlement D1A adversarial covenant tests passed.');
