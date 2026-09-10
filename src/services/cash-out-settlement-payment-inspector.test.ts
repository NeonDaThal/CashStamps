import {
  bindCashOutSettlementPaymentInspection,
  inspectCashOutSettlementPaymentUsingElectrum,
} from 'src/services/cash-out-settlement-payment-inspector';

import type { ElectrumService } from 'src/services/electrum';

import type { AddressListUnspent } from 'src/services/electrum-types';

import type { CashOutSettlementContractPlan } from 'src/types/cash-out-settlement';

const CONTRACT_ADDRESS =
  'bitcoincash:p076qp762h9z4nzsn8ydxse4s6ju3v8zth5x72ek7lhhe7wqdcjjxyq4jplcj';

const TREASURY_ADDRESS =
  'bitcoincash:qqqsyqcyq5rqwzqfpg9scrgwpugpzysnzstne440kw';

const PLATFORM_ADDRESS =
  'bitcoincash:qqsjygeyy5nzw2pf9g4jctfw9ucrzv3nxsxjm5zeuy';

const CASH_OUT_COMMITMENT = '01'.repeat(32);

const TREASURY_PKH = '01'.repeat(20);

const PLATFORM_PKH = '21'.repeat(20);

const PAYMENT_SATS = 206_000;

const SETTLEMENT_FEE_SATS = 313;

const PLATFORM_FEE_SATS = 2_000;

const TREASURY_OUTPUT_SATS =
  PAYMENT_SATS - PLATFORM_FEE_SATS - SETTLEMENT_FEE_SATS;

const CONTRACT_PLAN: CashOutSettlementContractPlan = {
  version: 'cash_out_settlement_contract_v1',

  settlementPlan: {
    version: 'cash_out_settlement_v1',

    cashOutId: 'cash-out-d2-integration-001',

    cashOutSerial: 'CO-D2-001',

    fiatCurrency: 'GBP',

    quoteLockedAt: '2026-09-10T09:00:00.000Z',

    quoteExpiresAt: '2026-09-10T09:05:00.000Z',

    paymentSats: PAYMENT_SATS,

    marketBchSats: 202_000,

    serviceFeeSats: 4_000,

    merchantFeeSats: 2_000,

    platformFeeSats: PLATFORM_FEE_SATS,

    settlementFeeSats: SETTLEMENT_FEE_SATS,

    treasuryOutputSats: TREASURY_OUTPUT_SATS,

    platformOutputSats: PLATFORM_FEE_SATS,

    totalServiceFeeMinor: 300,

    merchantFeeMinor: 150,

    platformFeeMinor: 150,

    treasuryDestination: {
      address: TREASURY_ADDRESS,

      publicKeyHashHex: TREASURY_PKH,
    },

    platformDestination: {
      address: PLATFORM_ADDRESS,

      publicKeyHashHex: PLATFORM_PKH,
    },

    constructor: {
      treasuryPublicKeyHashHex: TREASURY_PKH,

      platformPublicKeyHashHex: PLATFORM_PKH,

      paymentSats: PAYMENT_SATS,

      platformFeeSats: PLATFORM_FEE_SATS,

      settlementFeeSats: SETTLEMENT_FEE_SATS,
    },
  },

  cashOutCommitmentHex: CASH_OUT_COMMITMENT,

  constructor: {
    cashOutCommitmentHex: CASH_OUT_COMMITMENT,

    treasuryPublicKeyHashHex: TREASURY_PKH,

    platformPublicKeyHashHex: PLATFORM_PKH,

    paymentSats: PAYMENT_SATS,

    platformFeeSats: PLATFORM_FEE_SATS,

    settlementFeeSats: SETTLEMENT_FEE_SATS,
  },

  contractType: 'p2sh32',

  contractAddress: CONTRACT_ADDRESS,

  /**
   * D2 consumes an already-proven D1 plan.
   *
   * These identity fields are not recalculated by the D2 test; their actual
   * deterministic construction is covered by the D1C.3 suite.
   */
  contractLockingBytecodeHex: '00',

  contractBytecodeHex: '00',

  contractBytecodeSize: 1,

  contractOpcodeCount: 1,

  settlementTransactionSizeBytes: 313,

  settlementFeeRateSatsPerByte: 1,

  feePlanningIterations: [
    {
      iteration: 1,

      proposedSettlementFeeSats: 313,

      transactionSizeBytes: 313,

      requiredSettlementFeeSats: 313,
    },
  ],
};

function txid(byteHex: string): string {
  return byteHex.repeat(32);
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

function assertDeepEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message ?? 'Expected values to be deeply equal.');
  }
}

function assertThrows(operation: () => unknown, message?: string): void {
  let didThrow = false;

  try {
    operation();
  } catch {
    didThrow = true;
  }

  if (!didThrow) {
    throw new Error(message ?? 'Expected operation to throw.');
  }
}

async function assertRejects(
  operation: () => Promise<unknown>,
  expectedMessage?: string
): Promise<void> {
  let caughtError: unknown;

  try {
    await operation();
  } catch (error) {
    caughtError = error;
  }

  if (!caughtError) {
    throw new Error('Expected asynchronous operation to reject.');
  }

  if (expectedMessage) {
    const message =
      caughtError instanceof Error ? caughtError.message : String(caughtError);

    if (!message.includes(expectedMessage)) {
      throw new Error(
        `Expected rejection containing "${expectedMessage}", received "${message}".`
      );
    }
  }
}

interface FakeElectrumCall {
  endpoint: string;

  params: unknown[];
}

function createFakeElectrum(response: AddressListUnspent['response']): {
  electrum: ElectrumService;

  calls: FakeElectrumCall[];
} {
  const calls: FakeElectrumCall[] = [];

  const electrum = {
    connectedServer: 'unit-test-electrum',

    async request(endpoint: string, ...params: unknown[]): Promise<unknown> {
      calls.push({
        endpoint,

        params,
      });

      return response;
    },
  } as unknown as ElectrumService;

  return {
    electrum,

    calls,
  };
}

async function runTests(): Promise<void> {
  /**
   * ------------------------------------------------------------------------
   * EXACT PAYMENT THROUGH THE FULL D2 NETWORK ADAPTER
   * ------------------------------------------------------------------------
   */

  {
    const exactTxid = txid('11');

    const fake = createFakeElectrum([
      {
        height: 0,

        tx_hash: txid('10'),

        tx_pos: 0,

        value: 546,
      },
      {
        height: 0,

        tx_hash: exactTxid,

        tx_pos: 2,

        value: PAYMENT_SATS,
      },
    ]);

    const result = await inspectCashOutSettlementPaymentUsingElectrum(
      fake.electrum,
      CONTRACT_PLAN
    );

    assertEqual(fake.calls.length, 1);

    assertEqual(fake.calls[0]?.endpoint, 'blockchain.address.listunspent');

    assertDeepEqual(fake.calls[0]?.params, [
      CONTRACT_ADDRESS,
      'exclude_tokens',
    ]);

    assertEqual(result.cashOutId, 'cash-out-d2-integration-001');

    assertEqual(result.cashOutSerial, 'CO-D2-001');

    assertEqual(result.cashOutCommitmentHex, CASH_OUT_COMMITMENT);

    assertEqual(result.contractAddress, CONTRACT_ADDRESS);

    assertEqual(result.requiredSats, PAYMENT_SATS);

    assertEqual(result.connectedServer, 'unit-test-electrum');

    assertEqual(result.payment.classification, 'exact');

    assertEqual(result.payment.underpaymentUtxos.length, 1);

    assertDeepEqual(result.normalSettlementCandidate, {
      cashOutId: 'cash-out-d2-integration-001',

      cashOutSerial: 'CO-D2-001',

      cashOutCommitmentHex: CASH_OUT_COMMITMENT,

      contractAddress: CONTRACT_ADDRESS,

      paymentSats: PAYMENT_SATS,

      txid: exactTxid,

      vout: 2,

      satoshis: PAYMENT_SATS,

      height: 0,
    });

    console.log(
      'PASS: Electrum listunspent exact UTXO is bound to the correct D1 contract plan'
    );
  }

  /**
   * ------------------------------------------------------------------------
   * MULTIPLE EXACT PAYMENTS MUST NEVER PRODUCE A NORMAL CANDIDATE
   * ------------------------------------------------------------------------
   */

  {
    const fake = createFakeElectrum([
      {
        height: 0,

        tx_hash: txid('21'),

        tx_pos: 0,

        value: PAYMENT_SATS,
      },
      {
        height: 0,

        tx_hash: txid('22'),

        tx_pos: 1,

        value: PAYMENT_SATS,
      },
    ]);

    const result = await inspectCashOutSettlementPaymentUsingElectrum(
      fake.electrum,
      CONTRACT_PLAN
    );

    assertEqual(result.payment.classification, 'multiple_exact');

    assertEqual(result.normalSettlementCandidate, undefined);

    console.log(
      'PASS: multiple exact Electrum UTXOs remain exceptional and unbound'
    );
  }

  /**
   * ------------------------------------------------------------------------
   * SERVER CONTRADICTION: TOKEN OUTPUT DESPITE exclude_tokens
   * ------------------------------------------------------------------------
   */

  {
    const fake = createFakeElectrum([
      {
        height: 0,

        tx_hash: txid('31'),

        tx_pos: 0,

        value: PAYMENT_SATS,

        token_data: {
          amount: '1',

          category: txid('ff'),
        },
      },
    ]);

    await assertRejects(
      () =>
        inspectCashOutSettlementPaymentUsingElectrum(
          fake.electrum,
          CONTRACT_PLAN
        ),
      'token-bearing'
    );

    console.log('PASS: unexpected token-bearing Electrum UTXO fails closed');
  }

  /**
   * ------------------------------------------------------------------------
   * CONTRACT ADDRESS / PAYMENT AMOUNT CANNOT BE MIXED BETWEEN CASH-OUTS
   * ------------------------------------------------------------------------
   */

  {
    const fake = createFakeElectrum([
      {
        height: 0,

        tx_hash: txid('41'),

        tx_pos: 0,

        value: PAYMENT_SATS,
      },
    ]);

    const validInspection = await inspectCashOutSettlementPaymentUsingElectrum(
      fake.electrum,
      CONTRACT_PLAN
    );

    assertThrows(() => {
      bindCashOutSettlementPaymentInspection(CONTRACT_PLAN, {
        observedAt: validInspection.observedAt,

        connectedServer: validInspection.connectedServer,

        payment: {
          ...validInspection.payment,

          contractAddress: 'bitcoincash:pdifferentcontractaddressfortestonly',
        },
      });
    });

    assertThrows(() => {
      bindCashOutSettlementPaymentInspection(CONTRACT_PLAN, {
        observedAt: validInspection.observedAt,

        connectedServer: validInspection.connectedServer,

        payment: {
          ...validInspection.payment,

          requiredSats: PAYMENT_SATS + 1,
        },
      });
    });

    console.log(
      'PASS: observed payment data cannot be rebound to a different contract or payment amount'
    );
  }

  /**
   * ------------------------------------------------------------------------
   * EXCEPTIONAL CLASSIFICATION MUST NOT SMUGGLE A NORMAL CANDIDATE THROUGH
   * ------------------------------------------------------------------------
   */

  {
    const fake = createFakeElectrum([
      {
        height: 0,

        tx_hash: txid('51'),

        tx_pos: 0,

        value: PAYMENT_SATS - 1,
      },
    ]);

    const underpayment = await inspectCashOutSettlementPaymentUsingElectrum(
      fake.electrum,
      CONTRACT_PLAN
    );

    assertEqual(underpayment.payment.classification, 'underpayment');

    assertEqual(underpayment.normalSettlementCandidate, undefined);

    console.log(
      'PASS: underpayment observation cannot produce a bound normal settlement candidate'
    );
  }

  console.log('');

  console.log(
    'Cash-out Settlement D2B/D2C payment inspection integration tests passed.'
  );
}

runTests().catch((error) => {
  console.error(error);

  throw error;
});
