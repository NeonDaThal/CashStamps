import { ELECTRUM_SERVERS } from 'src/config';

import { ElectrumService } from 'src/services/electrum';

import type { TransactionGetHeight } from 'src/services/electrum-types';

import type {
  TreasuryBroadcastReconciliationResult,
  TreasuryBroadcastReconciliationServerCheck,
} from 'src/types/treasury-broadcast-reconciliation';

function normaliseTransactionId(value: string): string {
  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    throw new Error(
      'A valid deterministic transaction ID is required for reconciliation.'
    );
  }

  return normalised;
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
 * Reconcile one already-persisted deterministic transaction ID against the
 * configured Electrum servers.
 *
 * This function performs READ-ONLY network checks.
 *
 * It never:
 * - creates a transaction
 * - signs a transaction
 * - modifies raw transaction hex
 * - broadcasts a transaction
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
