import { ELECTRUM_SERVERS } from 'src/config';
import { inspectCashOutSettlementPaymentUsingElectrum } from './cash-out-settlement-payment-inspector';
import { reconcileCashOutSettlementIntentWithDependencies } from './cash-out-settlement-reconciliation';
import { inspectCashOutSettlementSourceConflictFromNetworkWithDependencies } from './cash-out-settlement-conflict-electrum';
import type { ElectrumService } from './electrum';
import type {
  ElectrumRequest,
  TransactionGetHeight,
  AddressGetHistory,
  TransactionGet,
} from './electrum-types';
import type { CashOutRecord } from 'src/types/cash-out';
import type {
  CashOutSettlementContractPlan,
  CashOutSettlementIntent,
} from 'src/types/cash-out-settlement';
import type { CashOutSettlementPaymentInspection } from 'src/types/cash-out-contract-payment';
import type { CashOutSettlementConflictInspectionResult } from './cash-out-settlement-conflict-inspector';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

export type CashOutObservationReader = Pick<
  ElectrumService,
  'request' | 'connectedServer'
>;
export interface CashOutObservationConnection {
  reader: CashOutObservationReader;
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribeAddress?(address: string, notify: () => void): Promise<void>;
  isConnected?(): boolean;
}

export interface CashOutContractNetworkDependencies {
  createConnection(
    server: string,
    timeoutMilliseconds: number
  ): Promise<CashOutObservationConnection>;
  observePayment(
    reader: CashOutObservationReader,
    plan: CashOutSettlementContractPlan
  ): Promise<CashOutSettlementPaymentInspection>;
  observeSettlement(
    reader: CashOutObservationReader,
    intent: CashOutSettlementIntent
  ): Promise<TreasuryBroadcastReconciliationResult>;
  inspectConflict(
    reader: CashOutObservationReader,
    record: CashOutRecord
  ): Promise<CashOutSettlementConflictInspectionResult>;
}

export interface CashOutContractNetworkOptions {
  servers?: readonly string[];
  preferredServer?: string;
  /** Whole per-server attempt, including connect and every required read. */
  timeoutMilliseconds?: number;
  cleanupTimeoutMilliseconds?: number;
}

export type CashOutPaymentObservation =
  | {
      status: 'observed';
      server: string;
      observation: CashOutSettlementPaymentInspection;
    }
  | { status: 'unavailable'; errors: { server: string; message: string }[] };

const READ_METHODS = new Set([
  'blockchain.address.listunspent',
  'blockchain.transaction.get_height',
  'blockchain.address.get_history',
  'blockchain.transaction.get',
]);

const DEFAULT_DEPENDENCIES: CashOutContractNetworkDependencies = {
  async createConnection(server, timeoutMilliseconds) {
    const { ElectrumClient, ConnectionStatus } = await import(
      '@electrum-cash/network'
    );
    // Own the client BEFORE connect: ElectrumService.start() only exposes its
    // client after successful connection, too late to force-close a dead dial.
    // Same WSS/protocol settings as ElectrumService; shared behavior is unchanged.
    const client = new ElectrumClient(
      'BCHApp',
      '1.5',
      server,
      50004,
      'wss',
      timeoutMilliseconds
    );
    return {
      start: () => client.connect(),
      async stop() {
        await client.disconnect(true);
      },
      isConnected: () =>
        client.connection.status === ConnectionStatus.CONNECTED,
      async subscribeAddress(address, notify) {
        client.on('connected', notify); // Reconnection requests a fresh E2 read.
        client.on('notification', (notification) => {
          if (
            notification.method === 'blockchain.address.subscribe' &&
            notification.params[0] === address
          )
            notify();
        });
        await client.subscribe('blockchain.address.subscribe', address);
      },
      reader: {
        connectedServer: server,
        async request<T extends ElectrumRequest>(
          endpoint: T['method'],
          ...params: T['params']
        ): Promise<T['response']> {
          const response = await client.request(endpoint, ...params);
          if (response instanceof Error) throw response;
          return response as T['response'];
        },
      },
    };
  },
  observePayment: inspectCashOutSettlementPaymentUsingElectrum,
  async observeSettlement(reader, intent) {
    const {
      createReconciliationServerCheck,
      classifyTreasuryBroadcastReconciliation,
    } = await import('./treasury-broadcast-reconciliation');
    return reconcileCashOutSettlementIntentWithDependencies(intent, {
      async reconcile(txid) {
        const height = await reader.request<TransactionGetHeight>(
          'blockchain.transaction.get_height',
          txid
        );
        return classifyTreasuryBroadcastReconciliation(txid, [
          createReconciliationServerCheck(
            reader.connectedServer ?? 'Electrum',
            height
          ),
        ]);
      },
    });
  },
  inspectConflict: (reader, record) =>
    inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(record, {
      async getContractHistory(address) {
        const history = await reader.request<AddressGetHistory>(
          'blockchain.address.get_history',
          address,
          0,
          -1
        );
        return history.map((entry) => ({
          txid: entry.tx_hash,
          height: entry.height,
        }));
      },
      getRawTransaction: (txid) =>
        reader.request<TransactionGet>(
          'blockchain.transaction.get',
          txid,
          false
        ),
      now: () => new Date().toISOString(),
    }),
};

function bounded<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(new Error('Cash-out Electrum observation deadline exceeded.')),
      milliseconds
    );
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** Read-only observations and E3 notification triggers; no lifecycle actions. */
export function createCashOutContractNetwork(
  options: CashOutContractNetworkOptions = {},
  overrides: Partial<CashOutContractNetworkDependencies> = {}
) {
  // Stable deduplication preserves configured order. No second default host list.
  const servers = [
    ...new Set(
      (options.servers ?? ELECTRUM_SERVERS)
        .map((server) => server.trim())
        .filter(Boolean)
    ),
  ];
  let preferred = options.preferredServer?.trim();
  const timeout = options.timeoutMilliseconds ?? 5_000;
  const cleanupTimeout = options.cleanupTimeoutMilliseconds ?? 1_000;
  for (const duration of [timeout, cleanupTimeout]) {
    if (
      !Number.isSafeInteger(duration) ||
      duration <= 0 ||
      duration > 2_147_483_647
    )
      throw new Error(
        'Cash-out observation deadlines must be positive timer durations.'
      );
  }
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides };
  const inFlight = new Map<string, Promise<unknown>>();
  let queue: Promise<unknown> = Promise.resolve();

  function singleFlight<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;
    const running = queue.then(operation);
    queue = running.catch(() => undefined);
    inFlight.set(key, running);
    const remove = () => {
      inFlight.delete(key);
    };
    void running.then(remove, remove);
    return running;
  }

  async function cleanup(connection: CashOutObservationConnection) {
    // SDK disconnect(force=true) tears down a connecting/connected socket and
    // cancels reconnect/subscription state. A bad cleanup cannot hang the pool.
    try {
      await bounded(
        Promise.resolve().then(() => connection.stop()),
        cleanupTimeout
      );
    } catch {
      /* The observation is still never accepted from a closed attempt. */
    }
  }

  async function attempt<T>(
    server: string,
    observe: (reader: CashOutObservationReader) => Promise<T>
  ): Promise<T> {
    let active = true;
    let connection: CashOutObservationConnection | undefined;
    const work = (async () => {
      connection = await dependencies.createConnection(server, timeout);
      if (!active) {
        await cleanup(connection);
        throw new Error('Superseded Electrum connection.');
      }
      await connection.start();
      if (!active) {
        await cleanup(connection);
        throw new Error('Superseded Electrum connection.');
      }
      const opened = connection;
      const reader: CashOutObservationReader = {
        connectedServer: server,
        async request<TRequest extends ElectrumRequest>(
          endpoint: TRequest['method'],
          ...params: TRequest['params']
        ): Promise<TRequest['response']> {
          if (!active || !READ_METHODS.has(endpoint))
            throw new Error(
              'Only active read-only Cash-out observations are permitted.'
            );
          const response = await opened.reader.request<TRequest>(
            endpoint,
            ...params
          );
          if (!active) throw new Error('Superseded Electrum observation.');
          return response;
        },
      };
      return observe(reader);
    })();
    try {
      return await bounded(work, timeout);
    } finally {
      active = false;
      if (connection) await cleanup(connection);
    }
  }

  async function failover<T>(
    observe: (reader: CashOutObservationReader) => Promise<T>,
    usable: (value: T) => boolean
  ) {
    const order =
      preferred && servers.includes(preferred)
        ? [preferred, ...servers.filter((server) => server !== preferred)]
        : servers;
    const errors: { server: string; message: string }[] = [];
    for (const server of order) {
      try {
        const observation = await attempt(server, observe);
        if (usable(observation)) {
          preferred = server;
          return { status: 'observed' as const, server, observation };
        }
        errors.push({
          server,
          message: 'Production observation is unavailable.',
        });
      } catch (error) {
        errors.push({
          server,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { status: 'unavailable' as const, errors };
  }

  return {
    /** E3 notifications are hints only. E2 observations remain authoritative. */
    async subscribePaymentNotifications(
      record: CashOutRecord,
      notify: () => void,
      signal: AbortSignal
    ) {
      const address = record.settlementContractPlan?.contractAddress;
      if (!address)
        throw new Error('Contract subscription requires a persisted plan.');
      let live = true;
      let current: CashOutObservationConnection | undefined;
      const stop = async () => {
        live = false;
        signal.removeEventListener('abort', abort);
        if (current) await cleanup(current);
      };
      const abort = () => {
        void stop();
      };
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        await stop();
        return undefined;
      }
      const order =
        preferred && servers.includes(preferred)
          ? [preferred, ...servers.filter((server) => server !== preferred)]
          : servers;
      for (const server of order) {
        let attemptActive = true;
        let connection: CashOutObservationConnection | undefined;
        const connecting = (async () => {
          connection = await dependencies.createConnection(server, timeout);
          if (!live || !attemptActive) {
            await cleanup(connection);
            return;
          }
          current = connection;
          await connection.start();
          if (!live || !attemptActive) {
            await cleanup(connection);
            return;
          }
          if (!connection.subscribeAddress)
            throw new Error('Address subscription is unavailable.');
          await connection.subscribeAddress(address, () => {
            if (live && attemptActive && !signal.aborted) notify();
          });
        })();
        try {
          await bounded(connecting, timeout);
          if (!live || signal.aborted) {
            await stop();
            return undefined;
          }
          return {
            isConnected: () =>
              live && !signal.aborted && (connection?.isConnected?.() ?? true),
            stop,
          };
        } catch {
          attemptActive = false;
          if (connection) await cleanup(connection);
          if (!live || signal.aborted) {
            await stop();
            return undefined;
          }
        }
      }
      await stop();
      return undefined;
    },
    observePayment(record: CashOutRecord): Promise<CashOutPaymentObservation> {
      const plan = structuredClone(record.settlementContractPlan);
      if (!plan || plan.settlementPlan.cashOutId !== record.id)
        return Promise.reject(
          new Error(
            "Payment observation requires this Cash-out's persisted frozen contract plan."
          )
        );
      return singleFlight(`payment:${JSON.stringify(plan)}`, () =>
        failover(
          (reader) => dependencies.observePayment(reader, plan),
          () => true
        )
      );
    },
    // These two signatures directly fit D5 current-handover dependency seams.
    observeSettlement(
      intent: CashOutSettlementIntent
    ): Promise<TreasuryBroadcastReconciliationResult> {
      const snapshot = structuredClone(intent);
      return singleFlight(
        `settlement:${JSON.stringify(snapshot)}`,
        async () => {
          const result = await failover(
            (reader) => dependencies.observeSettlement(reader, snapshot),
            (observation) => observation.status !== 'unavailable'
          );
          if (result.status === 'observed') return result.observation;
          return reconcileCashOutSettlementIntentWithDependencies(snapshot, {
            reconcile: async (txid) => ({
              txid,
              status: 'unavailable',
              checkedAt: new Date().toISOString(),
              serverChecks: result.errors.map(({ server, message }) => ({
                server,
                status: 'error',
                errorMessage: message,
              })),
              message:
                'All configured Cash-out Electrum servers are unavailable.',
            }),
          });
        }
      );
    },
    inspectConflict(
      record: CashOutRecord
    ): Promise<CashOutSettlementConflictInspectionResult> {
      const snapshot = structuredClone(record);
      return singleFlight(`conflict:${JSON.stringify(snapshot)}`, async () => {
        const result = await failover(
          (reader) => dependencies.inspectConflict(reader, snapshot),
          (observation) => observation.status !== 'inspection_unavailable'
        );
        // Concrete conflict is a usable result: never shop for a safer answer.
        if (result.status === 'observed') return result.observation;
        return inspectCashOutSettlementSourceConflictFromNetworkWithDependencies(
          snapshot,
          {
            getContractHistory: async () => {
              throw new Error(
                'All configured Cash-out Electrum servers are unavailable.'
              );
            },
            getRawTransaction: async () => {
              throw new Error('No active observation connection.');
            },
            now: () => new Date().toISOString(),
          }
        );
      });
    },
  };
}
