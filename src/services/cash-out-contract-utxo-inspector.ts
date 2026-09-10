import { ELECTRUM_SERVERS } from 'src/config';

import { classifyCashOutContractPayment } from 'src/services/cash-out-contract-payment-classifier';

import { ElectrumService } from 'src/services/electrum';

import type { AddressListUnspent } from 'src/services/electrum-types';

import type {
  CashOutContractPaymentInspection,
  CashOutContractUtxo,
} from 'src/types/cash-out-contract-payment';

export interface InspectCashOutContractPaymentOptions {
  contractAddress: string;

  requiredSats: number;
}

/**
 * Result of one read-only Electrum inspection.
 *
 * This remains network observation only.
 *
 * It is NOT:
 *
 * - authorization to give physical cash;
 * - a persisted payment selection;
 * - settlement intent;
 * - or settlement broadcast evidence.
 */
export interface CashOutContractPaymentNetworkInspection {
  observedAt: string;

  connectedServer?: string;

  payment: CashOutContractPaymentInspection;
}

function normalizeElectrumUtxo(
  item: AddressListUnspent['response'][number]
): CashOutContractUtxo {
  /**
   * We explicitly requested exclude_tokens.
   *
   * If an Electrum server nevertheless returns token-bearing data, fail closed
   * rather than silently discarding token_data and allowing that output to be
   * mistaken for the customer's normal BCH-only Cash-out payment.
   */
  if (item.token_data !== undefined) {
    throw new Error(
      'Electrum returned a token-bearing Cash-out contract UTXO despite exclude_tokens.'
    );
  }

  return {
    txid: item.tx_hash,

    vout: item.tx_pos,

    satoshis: item.value,

    height: item.height,
  };
}

/**
 * Inspect one contract using an already-started Electrum connection.
 *
 * Exported separately so later watcher/reconciliation code can reuse one
 * connection instead of opening a new socket for every check.
 */
export async function inspectCashOutContractPaymentUsingElectrum(
  electrum: ElectrumService,
  options: InspectCashOutContractPaymentOptions
): Promise<CashOutContractPaymentNetworkInspection> {
  const contractAddress = options.contractAddress.trim();

  if (!contractAddress) {
    throw new Error(
      'Cash-out contract address is required for UTXO inspection.'
    );
  }

  if (
    !Number.isSafeInteger(options.requiredSats) ||
    options.requiredSats <= 0
  ) {
    throw new Error(
      'Cash-out contract required payment must be a positive safe integer number of satoshis.'
    );
  }

  /**
   * Normal Cash-out settlement is BCH-only.
   *
   * A token-bearing output must never accidentally qualify as the exact
   * customer BCH payment merely because its satoshi value matches.
   */
  const unspent = await electrum.request<AddressListUnspent>(
    'blockchain.address.listunspent',
    contractAddress,
    'exclude_tokens'
  );

  const payment = classifyCashOutContractPayment({
    contractAddress,

    requiredSats: options.requiredSats,

    utxos: unspent.map(normalizeElectrumUtxo),
  });

  return {
    observedAt: new Date().toISOString(),

    connectedServer: electrum.connectedServer,

    payment,
  };
}

/**
 * Perform one complete read-only inspection using the application's existing
 * Electrum server configuration.
 *
 * This intentionally creates its own ElectrumService rather than modifying or
 * depending on treasury-incoming-detector.ts.
 *
 * Existing Treasury top-up and legacy Cash-out detection therefore remain
 * unaffected.
 */
export async function inspectCashOutContractPaymentOnce(
  options: InspectCashOutContractPaymentOptions
): Promise<CashOutContractPaymentNetworkInspection> {
  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  await electrum.start();

  try {
    return await inspectCashOutContractPaymentUsingElectrum(electrum, options);
  } finally {
    await electrum.stop();
  }
}
