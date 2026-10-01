import type { AddressListUnspent } from './electrum-types';

import type { CashOutSettlementRecoveryNetworkEvidence } from './cash-out-settlement-recovery-input-binding';

/**
 * Narrow Electrum dependency for D6D.2.
 *
 * The real ElectrumService satisfies this interface, while tests can provide
 * a tiny fake implementation without opening a network connection.
 */
export interface CashOutSettlementRecoveryElectrumReader {
  request(
    endpoint: AddressListUnspent['method'],

    ...params: AddressListUnspent['params']
  ): Promise<AddressListUnspent['response']>;
}

export interface ObserveCashOutSettlementRecoveryNetworkEvidenceInput {
  contractAddress: string;

  electrum: CashOutSettlementRecoveryElectrumReader;
}

function normalizeContractAddress(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    throw new Error('Cash-out recovery contract address is required.');
  }

  return normalized;
}

/**
 * D6D.2
 *
 * Obtain one live Electrum listunspent snapshot for the exact Cash-out
 * contract address and normalize it into the D6D.1 evidence format.
 *
 * Important:
 *
 * - always uses include_tokens;
 * - does not select recovery inputs;
 * - does not assess recovery eligibility;
 * - does not sign;
 * - does not persist;
 * - does not broadcast.
 *
 * A network/query failure is represented as available:false so D6D.1 can
 * fail closed rather than accidentally treating missing evidence as proof.
 */
export async function observeCashOutSettlementRecoveryNetworkEvidence(
  input: ObserveCashOutSettlementRecoveryNetworkEvidenceInput
): Promise<CashOutSettlementRecoveryNetworkEvidence> {
  const contractAddress = normalizeContractAddress(input.contractAddress);

  try {
    const unspents = await input.electrum.request(
      'blockchain.address.listunspent',

      contractAddress,

      'include_tokens'
    );

    if (!Array.isArray(unspents)) {
      return {
        source: 'electrum_listunspent',

        available: false,

        contractAddress,

        utxos: [],
      };
    }

    return {
      source: 'electrum_listunspent',

      available: true,

      contractAddress,

      utxos: unspents.map((unspent) => ({
        txid: unspent.tx_hash,

        vout: unspent.tx_pos,

        satoshis: unspent.value,

        height: unspent.height,

        /**
         * The Electrum type exposes token_data only when this output has
         * CashToken state.
         *
         * Presence alone is enough to fail a selected Recovery v1 input
         * closed in D6D.1.
         */
        tokenDataPresent: unspent.token_data !== undefined,
      })),
    };
  } catch {
    return {
      source: 'electrum_listunspent',

      available: false,

      contractAddress,

      utxos: [],
    };
  }
}
