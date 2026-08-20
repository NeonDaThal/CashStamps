import { ELECTRUM_SERVERS } from 'src/config';

import {
  ElectrumService,
  type TransactionStatusCallback,
} from 'src/services/electrum';

import type { TransactionGetHeight } from 'src/services/electrum-types';

import type {
  TreasuryBroadcastReconciliationResult,
  TreasuryBroadcastReconciliationServerCheck,
} from 'src/types/treasury-broadcast-reconciliation';

/**
 * Delays before each post-broadcast reconciliation attempt.
 *
 * Attempt 1 is immediate.
 *
 * Total additional waiting time before the final attempt:
 * 750ms + 1500ms + 3000ms = 5250ms.
 *
 * These are READ-ONLY checks. No transaction is re-created or broadcast here.
 */
export const POST_BROADCAST_RECONCILIATION_DELAYS_MILLISECONDS = [
  0, 150, 350, 750, 1_500, 2_500,
] as const;

export const TRANSACTION_SUBSCRIPTION_FAST_PATH_TIMEOUT_MILLISECONDS = 500;

export interface TreasuryBroadcastReconciliationRetryOptions {
  delaysMilliseconds?: readonly number[];

  /**
   * Injectable polling reconciliation for tests.
   */
  reconcile?: (txid: string) => Promise<TreasuryBroadcastReconciliationResult>;

  /**
   * Injectable fast observation for tests.
   */
  observe?: (
    txid: string
  ) => Promise<TreasuryBroadcastReconciliationResult | undefined>;

  /**
   * Injectable for tests so no real waiting is required.
   */
  wait?: (milliseconds: number) => Promise<void>;
}

function normaliseTransactionId(value: string): string {
  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    throw new Error(
      'A valid deterministic transaction ID is required for reconciliation.'
    );
  }

  return normalised;
}

function waitForDelay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

/**
 * Convert one successful Electrum get_height response into explicit evidence.
 */
export function createReconciliationServerCheck(
  server: string,
  response: number | null
): TreasuryBroadcastReconciliationServerCheck {
  if (response === null) {
    return {
      server,
      status: 'unknown',
    };
  }

  if (Number.isInteger(response) && response > 0) {
    return {
      server,
      status: 'confirmed',
      blockHeight: response,
    };
  }

  if (response === 0) {
    return {
      server,
      status: 'mempool',
      blockHeight: 0,
    };
  }

  return {
    server,
    status: 'error',

    errorMessage: 'Electrum returned an invalid transaction-height response.',
  };
}

/**
 * Combine evidence from all Electrum servers.
 *
 * Positive evidence wins:
 *
 * confirmed > mempool > unknown > unavailable
 *
 * One lagging or unavailable server must never override another server that
 * can already see the transaction.
 */
export function classifyTreasuryBroadcastReconciliation(
  txid: string,
  serverChecks: TreasuryBroadcastReconciliationServerCheck[]
): TreasuryBroadcastReconciliationResult {
  const normalisedTxid = normaliseTransactionId(txid);

  const confirmedChecks = serverChecks.filter(
    (check) =>
      check.status === 'confirmed' &&
      typeof check.blockHeight === 'number' &&
      check.blockHeight > 0
  );

  if (confirmedChecks.length > 0) {
    const confirmedHeight = Math.max(
      ...confirmedChecks.map((check) => check.blockHeight as number)
    );

    return {
      txid: normalisedTxid,

      status: 'confirmed',

      blockHeight: confirmedHeight,

      serverChecks,

      checkedAt: new Date().toISOString(),

      message: `Transaction is confirmed at block height ${confirmedHeight}.`,
    };
  }

  const hasMempoolEvidence = serverChecks.some(
    (check) => check.status === 'mempool'
  );

  if (hasMempoolEvidence) {
    return {
      txid: normalisedTxid,

      status: 'mempool',

      blockHeight: 0,

      serverChecks,

      checkedAt: new Date().toISOString(),

      message: 'Transaction is visible in the BCH mempool.',
    };
  }

  const hasSuccessfulUnknownCheck = serverChecks.some(
    (check) => check.status === 'unknown'
  );

  if (hasSuccessfulUnknownCheck) {
    return {
      txid: normalisedTxid,

      status: 'unknown',

      serverChecks,

      checkedAt: new Date().toISOString(),

      message:
        'Transaction is not currently visible to the successfully queried Electrum servers.',
    };
  }

  return {
    txid: normalisedTxid,

    status: 'unavailable',

    serverChecks,

    checkedAt: new Date().toISOString(),

    message:
      'Transaction status could not be checked because no Electrum server returned a usable response.',
  };
}

/**
 * Perform one read-only reconciliation of one already-known transaction ID
 * against every configured Electrum server.
 */
export async function reconcileTreasuryBroadcast(
  txid: string
): Promise<TreasuryBroadcastReconciliationResult> {
  const normalisedTxid = normaliseTransactionId(txid);

  const serverChecks = await Promise.all(
    ELECTRUM_SERVERS.map(
      async (server): Promise<TreasuryBroadcastReconciliationServerCheck> => {
        const electrum = new ElectrumService([server]);

        try {
          await electrum.start();

          const response = await electrum.request<TransactionGetHeight>(
            'blockchain.transaction.get_height',
            normalisedTxid
          );

          return createReconciliationServerCheck(server, response);
        } catch (error) {
          return {
            server,

            status: 'error',

            errorMessage:
              error instanceof Error
                ? error.message
                : 'Electrum reconciliation request failed.',
          };
        }
      }
    )
  );

  return classifyTreasuryBroadcastReconciliation(normalisedTxid, serverChecks);
}

function isKnownTransactionHeight(height: number | null): height is number {
  return (
    typeof height === 'number' &&
    (height === 0 || (Number.isInteger(height) && height > 0))
  );
}
/**
 * FAST PATH
 *
 * Subscribe to the exact deterministic txid for a short period.
 *
 * If the server already knows the transaction, subscribe() immediately returns
 * either 0 (mempool) or a positive block height.
 *
 * If it is initially unknown, a notification may arrive as soon as that server
 * observes the transaction.
 *
 * Failure or timeout here is NOT a funding failure. The normal multi-server
 * reconciliation retry loop remains the fallback.
 */
export async function observeTreasuryBroadcastBySubscription(
  txid: string
): Promise<TreasuryBroadcastReconciliationResult | undefined> {
  const normalisedTxid = normaliseTransactionId(txid);

  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  let subscriptionCreated = false;

  let resolveNotification: ((height: number) => void) | undefined;

  const notificationPromise = new Promise<number>((resolve) => {
    resolveNotification = resolve;
  });

  const callback: TransactionStatusCallback = (height) => {
    if (isKnownTransactionHeight(height)) {
      resolveNotification?.(height);
    }
  };

  try {
    await electrum.start();

    const server = electrum.connectedServer ?? 'Electrum subscription';

    await electrum.subscribeTransaction(normalisedTxid, callback);

    subscriptionCreated = true;

    /**
     * The network library does not expose the subscription method's initial
     * protocol result, so immediately query get_height after establishing the
     * subscription.
     *
     * This gives us both:
     *
     * - an immediate current-state check; and
     * - notification coverage if the transaction appears just afterwards.
     */
    const initialHeight = await electrum.request<TransactionGetHeight>(
      'blockchain.transaction.get_height',
      normalisedTxid
    );

    if (isKnownTransactionHeight(initialHeight)) {
      return classifyTreasuryBroadcastReconciliation(normalisedTxid, [
        createReconciliationServerCheck(server, initialHeight),
      ]);
    }

    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      timeoutId = globalThis.setTimeout(() => {
        resolve('timeout');
      }, TRANSACTION_SUBSCRIPTION_FAST_PATH_TIMEOUT_MILLISECONDS);
    });

    const observed = await Promise.race<number | 'timeout'>([
      notificationPromise,
      timeoutPromise,
    ]);

    if (observed === 'timeout') {
      return undefined;
    }

    return classifyTreasuryBroadcastReconciliation(normalisedTxid, [
      createReconciliationServerCheck(server, observed),
    ]);
  } catch (error) {
    /**
     * Subscription support is a speed enhancement only.
     *
     * Unsupported methods, connection errors, or timeouts fall through to the
     * proven polling reconciliation path.
     */
    console.warn('Transaction subscription fast-path unavailable:', error);

    return undefined;
  } finally {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }

    if (subscriptionCreated) {
      await electrum.unsubscribeTransaction(normalisedTxid, callback);
    }

    await electrum.stop();
  }
}

/**
 * Retry READ-ONLY reconciliation for a short propagation window.
 *
 * Stop immediately as soon as the exact transaction is positively observed
 * in either:
 *
 * - the mempool, or
 * - a confirmed block.
 *
 * Unknown/unavailable responses are retried.
 *
 * IMPORTANT:
 * This function never broadcasts or rebuilds a transaction.
 */
export async function reconcileTreasuryBroadcastWithRetry(
  txid: string,
  options: TreasuryBroadcastReconciliationRetryOptions = {}
): Promise<TreasuryBroadcastReconciliationResult> {
  const normalisedTxid = normaliseTransactionId(txid);

  /**
   * Production uses the transaction-subscription fast path first.
   *
   * Unit tests which inject their own reconcile() automatically skip live
   * Electrum observation unless they explicitly inject observe().
   */
  const shouldUseFastObservation =
    Boolean(options.observe) || !options.reconcile;

  if (shouldUseFastObservation) {
    const observe = options.observe ?? observeTreasuryBroadcastBySubscription;

    try {
      const observed = await observe(normalisedTxid);

      if (observed?.status === 'mempool' || observed?.status === 'confirmed') {
        return observed;
      }
    } catch (error) {
      console.warn(
        'Fast transaction observation failed; falling back to reconciliation polling:',
        error
      );
    }
  }

  const delaysMilliseconds =
    options.delaysMilliseconds ??
    POST_BROADCAST_RECONCILIATION_DELAYS_MILLISECONDS;

  if (delaysMilliseconds.length === 0) {
    throw new Error('At least one reconciliation attempt is required.');
  }

  const reconcile = options.reconcile ?? reconcileTreasuryBroadcast;

  const wait = options.wait ?? waitForDelay;

  let latestResult: TreasuryBroadcastReconciliationResult | undefined;

  for (
    let attemptIndex = 0;
    attemptIndex < delaysMilliseconds.length;
    attemptIndex += 1
  ) {
    const delayMilliseconds = delaysMilliseconds[attemptIndex] ?? 0;

    if (delayMilliseconds > 0) {
      await wait(delayMilliseconds);
    }

    latestResult = await reconcile(normalisedTxid);

    if (
      latestResult.status === 'mempool' ||
      latestResult.status === 'confirmed'
    ) {
      return latestResult;
    }
  }

  if (!latestResult) {
    throw new Error('Reconciliation retry completed without a result.');
  }

  return latestResult;
}
