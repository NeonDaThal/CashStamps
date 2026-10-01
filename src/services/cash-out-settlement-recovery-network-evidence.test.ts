import { buildCashOutSettlementRecoveryInputSet } from './cash-out-settlement-recovery-inputs';

import { bindCashOutSettlementRecoveryInputSetToNetworkEvidence } from './cash-out-settlement-recovery-input-binding';

import {
  observeCashOutSettlementRecoveryNetworkEvidence,
  type CashOutSettlementRecoveryElectrumReader,
} from './cash-out-settlement-recovery-network-evidence';

function assertEqual(
  actual: unknown,
  expected: unknown,
  message = 'Expected values to be equal.'
): void {
  if (actual !== expected) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`
    );
  }
}

function assertThrowsAsync(
  action: () => Promise<unknown>,
  message = 'Expected async action to throw.'
): Promise<void> {
  return action()
    .then(() => {
      throw new Error(message);
    })
    .catch((error) => {
      if (error instanceof Error && error.message === message) {
        throw error;
      }
    });
}

function pass(message: string): void {
  console.log(`PASS: ${message}`);
}

const CONTRACT_ADDRESS = 'bitcoincash:pr-recovery-contract';

const TXID_A =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const TXID_B =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const TXID_C =
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

async function main(): Promise<void> {
  /**
   * Exact Electrum RPC shape.
   */
  {
    let observedEndpoint = '';

    let observedAddress = '';

    let observedTokenMode = '';

    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request(endpoint, address, tokenMode) {
        observedEndpoint = endpoint;

        observedAddress = address;

        observedTokenMode = tokenMode;

        return [
          {
            tx_hash: TXID_A,

            tx_pos: 0,

            value: 50_000,

            height: 0,
          },

          {
            tx_hash: TXID_B,

            tx_pos: 1,

            value: 70_000,

            height: 900_001,
          },
        ];
      },
    };

    const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
      contractAddress: CONTRACT_ADDRESS,

      electrum,
    });

    assertEqual(observedEndpoint, 'blockchain.address.listunspent');

    assertEqual(observedAddress, CONTRACT_ADDRESS);

    assertEqual(observedTokenMode, 'include_tokens');

    assertEqual(evidence.available, true);

    assertEqual(evidence.utxos.length, 2);

    assertEqual(evidence.utxos[0]?.txid, TXID_A);

    assertEqual(evidence.utxos[0]?.vout, 0);

    assertEqual(evidence.utxos[0]?.satoshis, 50_000);

    assertEqual(evidence.utxos[0]?.height, 0);

    assertEqual(evidence.utxos[0]?.tokenDataPresent, false);

    pass(
      'D6D.2 queries exact contract listunspent evidence with include_tokens'
    );
  }

  /**
   * CashToken metadata is preserved as a fail-closed boolean.
   */
  {
    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request() {
        return [
          {
            tx_hash: TXID_C,

            tx_pos: 2,

            value: 86_000,

            height: 900_002,

            token_data: {
              amount: '1',

              category:
                'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
            },
          },
        ];
      },
    };

    const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
      contractAddress: CONTRACT_ADDRESS,

      electrum,
    });

    assertEqual(evidence.utxos[0]?.tokenDataPresent, true);

    pass('Electrum token_data presence is preserved for Recovery v1 rejection');
  }

  /**
   * Electrum failure is not interpreted as an empty successful snapshot.
   */
  {
    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request() {
        throw new Error('Electrum unavailable');
      },
    };

    const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
      contractAddress: CONTRACT_ADDRESS,

      electrum,
    });

    assertEqual(evidence.available, false);

    assertEqual(evidence.utxos.length, 0);

    pass('Electrum failure produces unavailable recovery evidence');
  }

  /**
   * A successful empty listunspent response is different from network failure.
   *
   * It means the query succeeded but no current contract UTXOs were observed.
   */
  {
    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request() {
        return [];
      },
    };

    const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
      contractAddress: CONTRACT_ADDRESS,

      electrum,
    });

    assertEqual(evidence.available, true);

    assertEqual(evidence.utxos.length, 0);

    pass('successful empty listunspent snapshot remains available evidence');
  }

  /**
   * Full D6D.2 -> D6D.1 handoff.
   */
  {
    const inputSet = buildCashOutSettlementRecoveryInputSet([
      {
        txid: TXID_A,

        vout: 0,

        satoshis: 50_000,

        contractAddress: CONTRACT_ADDRESS,
      },

      {
        txid: TXID_B,

        vout: 1,

        satoshis: 70_000,

        contractAddress: CONTRACT_ADDRESS,
      },

      {
        txid: TXID_C,

        vout: 2,

        satoshis: 86_000,

        contractAddress: CONTRACT_ADDRESS,
      },
    ]);

    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request() {
        /**
         * Deliberately return these in non-canonical order.
         */
        return [
          {
            tx_hash: TXID_C,

            tx_pos: 2,

            value: 86_000,

            height: 900_003,
          },

          {
            tx_hash: TXID_A,

            tx_pos: 0,

            value: 50_000,

            height: 0,
          },

          {
            tx_hash: TXID_B,

            tx_pos: 1,

            value: 70_000,

            height: 900_002,
          },
        ];
      },
    };

    const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
      contractAddress: CONTRACT_ADDRESS,

      electrum,
    });

    const binding = bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
      cashOutId: 'cash-out-d6d2-test',

      expectedContractAddress: CONTRACT_ADDRESS,

      inputSet,

      networkEvidence: evidence,
    });

    assertEqual(binding.inputCount, 3);

    assertEqual(binding.totalInputSats, 206_000);

    assertEqual(binding.inputs[0]?.txid, TXID_A);

    assertEqual(binding.inputs[1]?.txid, TXID_B);

    assertEqual(binding.inputs[2]?.txid, TXID_C);

    pass(
      'live Electrum-shaped evidence binds into canonical D6D.1 recovery inputs'
    );
  }

  /**
   * Token-bearing selected input survives observation and is then rejected by
   * the D6D.1 security boundary.
   */
  {
    const inputSet = buildCashOutSettlementRecoveryInputSet([
      {
        txid: TXID_A,

        vout: 0,

        satoshis: 50_000,

        contractAddress: CONTRACT_ADDRESS,
      },
    ]);

    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request() {
        return [
          {
            tx_hash: TXID_A,

            tx_pos: 0,

            value: 50_000,

            height: 900_001,

            token_data: {
              amount: '1',

              category:
                'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            },
          },
        ];
      },
    };

    const evidence = await observeCashOutSettlementRecoveryNetworkEvidence({
      contractAddress: CONTRACT_ADDRESS,

      electrum,
    });

    let rejected = false;

    try {
      bindCashOutSettlementRecoveryInputSetToNetworkEvidence({
        cashOutId: 'cash-out-token-test',

        expectedContractAddress: CONTRACT_ADDRESS,

        inputSet,

        networkEvidence: evidence,
      });
    } catch {
      rejected = true;
    }

    assertEqual(rejected, true);

    pass(
      'token-bearing selected input is rejected after real Electrum-shaped observation'
    );
  }

  /**
   * Missing contract address must never trigger an Electrum request.
   */
  {
    let requestCalled = false;

    const electrum: CashOutSettlementRecoveryElectrumReader = {
      async request() {
        requestCalled = true;

        return [];
      },
    };

    await assertThrowsAsync(() =>
      observeCashOutSettlementRecoveryNetworkEvidence({
        contractAddress: '   ',

        electrum,
      })
    );

    assertEqual(requestCalled, false);

    pass('missing recovery contract address is rejected before network access');
  }

  console.log('');

  console.log(
    'Cash-out Settlement D6D.2 Electrum recovery evidence tests passed.'
  );
}

void main().catch((error) => {
  console.error(error);

  throw error;
});
