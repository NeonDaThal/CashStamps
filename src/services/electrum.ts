import { AddressNotification, ElectrumRequest } from './electrum-types.js';

import { ElectrumClient } from '@electrum-cash/network';

export type AddressCallback = (status: string | null) => void;

export type TransactionStatusCallback = (height: number | null) => void;

type TransactionNotification = {
  method: 'blockchain.transaction.subscribe';

  params: [string, number | null];
};

export class ElectrumService {
  electrumClient!: ElectrumClient;

  connectedServer?: string;

  // Address subscriptions.
  addressSubscriptions: {
    [address: string]: AddressCallback;
  } = {};

  // Exact transaction subscriptions.
  transactionSubscriptions: {
    [txid: string]: TransactionStatusCallback;
  } = {};

  constructor(
    public readonly servers: string[],
    public readonly application = 'BCHApp',
    public readonly version = '1.5'
  ) {}

  async start(): Promise<void> {
    this.connectedServer = undefined;

    // TODO: We want to use a Cluster instead of a Client, but as of
    // 2022-07-07 there are issues with Subscriptions on Cluster.
    //
    // We therefore continue using one Electrum Client while trying the
    // configured servers in sequence as connection fallbacks.
    for (const electrumServer of this.servers) {
      const electrum = new ElectrumClient(
        this.application,
        this.version,
        electrumServer,
        50004,
        'wss'
      );

      try {
        await electrum.connect();
      } catch (error) {
        console.warn(error);

        continue;
      }

      this.electrumClient = electrum;

      this.connectedServer = electrumServer;

      this.electrumClient.on('notification', this.onNotification.bind(this));

      return;
    }

    throw new Error(
      'Failed to connect to Electrum. Please try restarting your browser and ensure you are currently connected to the internet.'
    );
  }

  async stop(): Promise<void> {
    if (!this.electrumClient) {
      return;
    }

    try {
      await this.electrumClient.disconnect();
    } catch (error) {
      console.warn(`${error}`);
    }
  }

  async request<T extends ElectrumRequest>(
    endpoint: T['method'],
    ...params: T['params']
  ): Promise<T['response']> {
    const response = await this.electrumClient.request(endpoint, ...params);

    if (response instanceof Error) {
      throw response;
    }

    return response;
  }

  async subscribeAddress(
    address: string,
    callback: AddressCallback
  ): Promise<void> {
    await this.electrumClient.subscribe(
      'blockchain.address.subscribe',
      address
    );

    this.addressSubscriptions[address] = callback;
  }

  async unsubscribeAddress(
    address: string,
    _callback: AddressCallback
  ): Promise<void> {
    if (!this.addressSubscriptions[address]) {
      return;
    }

    delete this.addressSubscriptions[address];

    try {
      await this.electrumClient.unsubscribe(
        'blockchain.address.unsubscribe',
        address
      );
    } catch (error) {
      console.warn(`${error}`);
    }
  }

  /**
   * Subscribe to the confirmation/mempool state of one exact transaction.
   *
   * Fulcrum returns:
   *
   * - null: transaction currently unknown
   * - 0: transaction in mempool
   * - >0: confirmed block height
   *
   * Notifications use the same values.
   */
  async subscribeTransaction(
  txid: string,
  callback:
    TransactionStatusCallback
): Promise<void> {
  const normalisedTxid =
    txid.trim().toLowerCase();

  if (
    !/^[0-9a-f]{64}$/.test(
      normalisedTxid
    )
  ) {
    throw new Error(
      'A valid transaction ID is required for an Electrum transaction subscription.'
    );
  }

  this.transactionSubscriptions[
    normalisedTxid
  ] = callback;

  try {
    /**
     * @electrum-cash/network establishes the subscription here but its
     * subscribe() API is typed as returning void.
     *
     * We therefore use a separate get_height request after subscribing to
     * obtain the transaction's immediate current state.
     */
    await this.electrumClient.subscribe(
      'blockchain.transaction.subscribe',
      normalisedTxid
    );
  } catch (error) {
    delete this
      .transactionSubscriptions[
        normalisedTxid
      ];

    throw error;
  }
}

  async unsubscribeTransaction(
    txid: string,
    _callback: TransactionStatusCallback
  ): Promise<void> {
    const normalisedTxid = txid.trim().toLowerCase();

    if (!this.transactionSubscriptions[normalisedTxid]) {
      return;
    }

    delete this.transactionSubscriptions[normalisedTxid];

    try {
      await this.electrumClient.unsubscribe(
        'blockchain.transaction.unsubscribe',
        normalisedTxid
      );
    } catch (error) {
      console.warn(`${error}`);
    }
  }

  onNotification(data: AddressNotification | TransactionNotification): void {
    if (data.method === 'blockchain.address.subscribe') {
      const address = data.params[0];

      const status = data.params[1];

      const subscription = this.addressSubscriptions[address];

      if (!subscription) {
        console.warn(
          `Notification for address ${address} subscribed to, but has no handler`
        );

        return;
      }

      subscription(status);

      return;
    }

    if (data.method === 'blockchain.transaction.subscribe') {
      const txid = data.params[0].trim().toLowerCase();

      const height = data.params[1];

      const subscription = this.transactionSubscriptions[txid];

      if (!subscription) {
        console.warn(
          `Notification for transaction ${txid} subscribed to, but has no handler`
        );

        return;
      }

      subscription(height);
    }
  }
}
