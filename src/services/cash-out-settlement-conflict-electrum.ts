import {
  binToHex,
  decodeTransaction,
  hashTransaction,
  hexToBin,
} from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';

import {
  inspectCashOutSettlementSourceConflictWithDependencies,
  type CashOutSettlementConflictHistoryItem,
  type CashOutSettlementConflictInspectionResult,
  type CashOutSettlementConflictTransactionInput,
} from 'src/services/cash-out-settlement-conflict-inspector';

import type {
  AddressGetHistory,
  TransactionGet,
} from 'src/services/electrum-types';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutSettlementConflictNetworkDependencies {
  /**
   * Return the contract-address transaction history using normal display txids.
   */
  getContractHistory: (
    contractAddress: string
  ) => Promise<CashOutSettlementConflictHistoryItem[]>;

  /**
   * Return the exact raw transaction bytes for the requested display txid.
   */
  getRawTransaction: (txid: string) => Promise<string>;

  now: () => string;
}

function normaliseTransactionId(value: string, fieldName: string): string {
  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    throw new Error(
      `${fieldName} must be a valid 64-character transaction ID.`
    );
  }

  return normalised;
}

function normaliseRawTransactionHex(value: string): string {
  const normalised = value.trim().toLowerCase();

  if (!/^(?:[0-9a-f]{2})+$/.test(normalised)) {
    throw new Error('Electrum returned invalid raw transaction hexadecimal.');
  }

  return normalised;
}

/**
 * Convert the raw previous-transaction hash stored inside a BCH transaction
 * input into the normal display/Electrum txid representation.
 *
 * BCH transaction serialization stores this 32-byte hash in the opposite byte
 * order from the txid normally presented to users and returned by Electrum.
 */
function outpointTransactionHashToDisplayTxid(
  outpointTransactionHash: Uint8Array
): string {
  if (outpointTransactionHash.length !== 32) {
    throw new Error(
      'Decoded transaction input contains an invalid previous transaction hash length.'
    );
  }

  const displayOrderBytes = Uint8Array.from(outpointTransactionHash);

  displayOrderBytes.reverse();

  return binToHex(displayOrderBytes);
}

/**
 * Decode one raw BCH transaction into only the previous outpoints consumed by
 * its inputs.
 *
 * Security checks:
 *
 * 1. raw bytes must be valid hexadecimal;
 * 2. the deterministic txid calculated from those exact bytes must equal the
 *    txid requested from Electrum;
 * 3. the transaction must decode successfully;
 * 4. previous transaction hashes are converted from serialized byte order to
 *    normal display/Electrum txid order.
 */
export function decodeCashOutSettlementConflictTransactionInputs(
  rawTransactionHex: string,
  expectedTransactionTxid: string
): CashOutSettlementConflictTransactionInput[] {
  const rawHex = normaliseRawTransactionHex(rawTransactionHex);

  const expectedTxid = normaliseTransactionId(
    expectedTransactionTxid,
    'Expected transaction txid'
  );

  const transactionBytes = hexToBin(rawHex);

  const calculatedTxid = hashTransaction(transactionBytes).trim().toLowerCase();

  if (calculatedTxid !== expectedTxid) {
    throw new Error(
      'Electrum raw transaction does not match the requested transaction ID.'
    );
  }

  const decoded = decodeTransaction(transactionBytes);

  if (typeof decoded === 'string') {
    throw new Error(`Could not decode Electrum transaction: ${decoded}`);
  }

  return decoded.inputs.map((input) => ({
    previousTxid: outpointTransactionHashToDisplayTxid(
      input.outpointTransactionHash
    ),

    previousOutputIndex: input.outpointIndex,
  }));
}

/**
 * Connect the pure D5D.2a conflict inspector to transaction-history/raw-
 * transaction network dependencies.
 *
 * This layer still performs NO persistence and makes NO merchant-state change.
 */
export async function inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
  cashOut: CashOutRecord,
  dependencies: CashOutSettlementConflictNetworkDependencies
): Promise<CashOutSettlementConflictInspectionResult> {
  return inspectCashOutSettlementSourceConflictWithDependencies(
    cashOut,

    {
      getContractHistory: dependencies.getContractHistory,

      getTransactionInputs: async (txid) => {
        const rawTransactionHex = await dependencies.getRawTransaction(txid);

        return decodeCashOutSettlementConflictTransactionInputs(
          rawTransactionHex,
          txid
        );
      },

      now: dependencies.now,
    }
  );
}

/**
 * Production read-only Electrum conflict inspection.
 *
 * Electrum is started lazily by the first network request. This is important:
 * connection failures occur inside the pure inspector's dependency boundary,
 * allowing them to produce `inspection_unavailable` rather than being mistaken
 * for "no conflict".
 */
export async function inspectCashOutSettlementSourceConflictFromNetwork(
  cashOut: CashOutRecord
): Promise<CashOutSettlementConflictInspectionResult> {
  /**
   * Lazy-load the real Electrum transport.
   *
   * @electrum-cash/network currently crosses an ESM/CommonJS boundary which
   * Node 18's Vite SSR test environment cannot evaluate through a static
   * import.
   *
   * The production app can load it normally at runtime, while pure/injected
   * settlement tests remain independent of the network package.
   */
  const { ElectrumService } = await import('src/services/electrum');

  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  let electrumStarted = false;

  async function ensureElectrumStarted(): Promise<void> {
    if (electrumStarted) {
      return;
    }

    await electrum.start();

    electrumStarted = true;
  }

  try {
    return await inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
      cashOut,

      {
        getContractHistory: async (contractAddress) => {
          await ensureElectrumStarted();

          const history = await electrum.request<AddressGetHistory>(
            'blockchain.address.get_history',

            contractAddress,

            0,

            -1
          );

          return history.map((item) => ({
            txid: item.tx_hash.trim().toLowerCase(),

            height: item.height,
          }));
        },

        getRawTransaction: async (txid) => {
          await ensureElectrumStarted();

          return electrum.request<TransactionGet>(
            'blockchain.transaction.get',

            txid,

            false
          );
        },

        now: () => new Date().toISOString(),
      }
    );
  } finally {
    if (electrumStarted) {
      await electrum.stop();
    }
  }
}
