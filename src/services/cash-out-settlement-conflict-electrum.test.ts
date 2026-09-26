import {
  binToHex,
  encodeTransaction,
  hashTransaction,
  hexToBin,
} from '@bitauth/libauth';

import {
  decodeCashOutSettlementConflictTransactionInputs,
  inspectCashOutSettlementSourceConflictFromNetworkWithDependencies,
  type CashOutSettlementConflictNetworkDependencies,
} from 'src/services/cash-out-settlement-conflict-electrum';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

const CASH_OUT_ID = 'cash-out-d5d2b-001';

const CASH_OUT_SERIAL = 'CO-D5D2B-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const OTHER_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

const SOURCE_OUTPOINT_INDEX = 2;

const INTENT: CashOutSettlementIntent = {
  status: 'prepared',

  cashOutId: CASH_OUT_ID,

  cashOutSerial: CASH_OUT_SERIAL,

  cashOutCommitmentHex: '44'.repeat(32),

  contractAddress: 'bitcoincash:p-test-contract-address',

  sourcePaymentTxid: CUSTOMER_TXID,

  sourceOutpointIndex: SOURCE_OUTPOINT_INDEX,

  sourceValueSats: REQUIRED_SATS,

  rawTransactionHex: '00',

  txid: SETTLEMENT_TXID,

  rawTransactionBytesLength: 1,

  treasuryAddress: 'bitcoincash:q-test-treasury',

  treasuryOutputSats: 203_687,

  platformAddress: 'bitcoincash:q-test-platform',

  platformOutputSats: 2_000,

  actualFeeSats: 313,

  inputCount: 1,

  outputCount: 2,

  broadcastEnabled: false,

  preparedAt: '2026-09-25T12:00:00.000Z',
};

function createCashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-25T11:55:00.000Z',

    updatedAt: '2026-09-25T12:05:00.000Z',

    status: 'received',

    bchSatsRequired: REQUIRED_SATS,

    bchSatsReceived: REQUIRED_SATS,

    receivedTxid: CUSTOMER_TXID,

    settlementIntent: INTENT,

    ...overrides,
  } as CashOutRecord;
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(actual)} to equal ${String(expected)}.`
    );
  }
}

function assertThrows(
  operation: () => unknown,
  expectedMessagePart: string
): void {
  try {
    operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected error containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(`Expected operation to throw "${expectedMessagePart}".`);
}

/**
 * Build a minimal serializable BCH transaction spending one chosen outpoint.
 *
 * The previous transaction hash supplied to libauth is in serialized/internal
 * byte order, so the normal display txid is reversed before being placed into
 * the input.
 */
function createRawSpenderTransaction(
  previousTxid: string,
  previousOutputIndex: number
): {
  rawTransactionHex: string;

  txid: string;
} {
  const previousHashBytes = Uint8Array.from(hexToBin(previousTxid));

  previousHashBytes.reverse();

  const encoded = encodeTransaction({
    version: 2,

    inputs: [
      {
        outpointTransactionHash: previousHashBytes,

        outpointIndex: previousOutputIndex,

        unlockingBytecode: new Uint8Array(),

        sequenceNumber: 0xffffffff,
      },
    ],

    outputs: [
      {
        lockingBytecode: new Uint8Array(),

        valueSatoshis: 1_000n,
      },
    ],

    locktime: 0,
  });

  return {
    rawTransactionHex: binToHex(encoded),

    txid: hashTransaction(encoded).trim().toLowerCase(),
  };
}

async function runD5D2BTests(): Promise<void> {
  /**
   * First prove the byte-order conversion explicitly.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    const inputs = decodeCashOutSettlementConflictTransactionInputs(
      spender.rawTransactionHex,
      spender.txid
    );

    assertEqual(inputs.length, 1);

    assertEqual(
      inputs[0]?.previousTxid,
      CUSTOMER_TXID,
      'Decoded BCH input previous hash was not converted back to display txid byte order.'
    );

    assertEqual(inputs[0]?.previousOutputIndex, SOURCE_OUTPOINT_INDEX);

    console.log(
      'PASS: decoded BCH previous-output hash is converted to Electrum/display txid byte order'
    );
  }

  /**
   * Never trust transaction contents unless their raw bytes hash back to the
   * exact txid requested from Electrum.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    assertThrows(
      () =>
        decodeCashOutSettlementConflictTransactionInputs(
          spender.rawTransactionHex,

          OTHER_TXID
        ),

      'does not match the requested transaction ID'
    );

    console.log(
      'PASS: raw transaction txid mismatch is rejected before input evidence is trusted'
    );
  }

  /**
   * Real network adapter semantics:
   *
   * contract history says candidate transaction exists;
   * raw transaction proves it spends exact customer txid:vout;
   * inspector produces positive conflict evidence.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    let historyCalls = 0;

    let rawTransactionCalls = 0;

    const dependencies: CashOutSettlementConflictNetworkDependencies = {
      getContractHistory: async (address) => {
        historyCalls += 1;

        assertEqual(address, INTENT.contractAddress);

        return [
          {
            txid: CUSTOMER_TXID,

            height: 0,
          },

          {
            txid: spender.txid,

            height: 0,
          },
        ];
      },

      getRawTransaction: async (txid) => {
        rawTransactionCalls += 1;

        assertEqual(txid, spender.txid);

        return spender.rawTransactionHex;
      },

      now: () => '2026-09-25T12:06:00.000Z',
    };

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),
        dependencies
      );

    assertEqual(historyCalls, 1);

    assertEqual(rawTransactionCalls, 1);

    assertEqual(result.status, 'conflict_detected');

    assertEqual(result.evidence?.conflictingTxid, spender.txid);

    assertEqual(result.evidence?.sourcePaymentTxid, CUSTOMER_TXID);

    assertEqual(result.evidence?.sourceOutpointIndex, SOURCE_OUTPOINT_INDEX);

    console.log(
      'PASS: Electrum/raw-transaction adapter proves exact different spender conflict'
    );
  }

  /**
   * A raw transaction spending another output of the same customer transaction
   * must not be classified as a conflict.
   */
  {
    const spender = createRawSpenderTransaction(
      CUSTOMER_TXID,

      SOURCE_OUTPOINT_INDEX + 1
    );

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => [
            {
              txid: spender.txid,

              height: 0,
            },
          ],

          getRawTransaction: async () => spender.rawTransactionHex,

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'no_conflict_observed');

    console.log('PASS: real transaction decoder preserves exact vout matching');
  }

  /**
   * The deterministic settlement is filtered before raw transaction lookup.
   *
   * This protects the normal settlement from ever being mistaken for a
   * double-spend conflict.
   */
  {
    let rawTransactionCalls = 0;

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => [
            {
              txid: CUSTOMER_TXID,

              height: 0,
            },

            {
              txid: SETTLEMENT_TXID,

              height: 0,
            },
          ],

          getRawTransaction: async () => {
            rawTransactionCalls += 1;

            throw new Error(
              'Settlement raw transaction should not have been requested.'
            );
          },

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'no_conflict_observed');

    assertEqual(rawTransactionCalls, 0);

    console.log(
      'PASS: exact deterministic settlement is excluded before raw transaction decoding'
    );
  }

  /**
   * A bad/mismatching Electrum raw transaction makes the inspection
   * unavailable. It must not produce either positive conflict evidence or a
   * false "no conflict" answer.
   */
  {
    const realTransaction = createRawSpenderTransaction(
      CUSTOMER_TXID,
      SOURCE_OUTPOINT_INDEX
    );

    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => [
            {
              txid: OTHER_TXID,

              height: 0,
            },
          ],

          getRawTransaction: async () => realTransaction.rawTransactionHex,

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'inspection_unavailable');

    assertEqual(result.evidence, undefined);

    console.log(
      'PASS: mismatching Electrum raw transaction fails closed as inspection unavailable'
    );
  }

  /**
   * Ordinary network failure also remains unavailable rather than being
   * interpreted as absence of a conflict.
   */
  {
    const result =
      await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
        createCashOut(),

        {
          getContractHistory: async () => {
            throw new Error('Electrum unavailable.');
          },

          getRawTransaction: async () => {
            throw new Error('Unexpected raw transaction request.');
          },

          now: () => '2026-09-25T12:06:00.000Z',
        }
      );

    assertEqual(result.status, 'inspection_unavailable');

    assertEqual(result.evidence, undefined);

    console.log(
      'PASS: Electrum history failure cannot become false no-conflict evidence'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5D.2b Electrum conflict adapter tests passed.'
  );
}

runD5D2BTests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
