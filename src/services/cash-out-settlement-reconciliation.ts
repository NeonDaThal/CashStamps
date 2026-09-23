import type { CashOutSettlementIntent } from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

export interface CashOutSettlementReconciliationDependencies {
  reconcile(txid: string): Promise<TreasuryBroadcastReconciliationResult>;
}

function normaliseTransactionId(
  value: string | undefined,
  fieldName: string
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} is required.`);
  }

  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    throw new Error(
      `${fieldName} must be exactly 32 bytes encoded as hexadecimal.`
    );
  }

  return normalised;
}

function requireNonEmptyString(value: string, fieldName: string): string {
  const normalised = value.trim();

  if (!normalised) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalised;
}

function validateReconciliationResult(
  result: TreasuryBroadcastReconciliationResult,
  expectedTxid: string
): TreasuryBroadcastReconciliationResult {
  const resultTxid = normaliseTransactionId(
    result.txid,
    'Cash-out settlement reconciliation transaction ID'
  );

  if (resultTxid !== expectedTxid) {
    throw new Error(
      'Cash-out settlement reconciliation returned evidence for a different transaction.'
    );
  }

  requireNonEmptyString(
    result.checkedAt,
    'Cash-out settlement reconciliation timestamp'
  );

  requireNonEmptyString(
    result.message,
    'Cash-out settlement reconciliation message'
  );

  if (!Array.isArray(result.serverChecks)) {
    throw new Error(
      'Cash-out settlement reconciliation server evidence is invalid.'
    );
  }

  switch (result.status) {
    case 'confirmed': {
      if (
        !Number.isInteger(result.blockHeight) ||
        (result.blockHeight ?? 0) <= 0
      ) {
        throw new Error(
          'Confirmed Cash-out settlement reconciliation requires a positive block height.'
        );
      }

      break;
    }

    case 'mempool': {
      if (result.blockHeight !== 0) {
        throw new Error(
          'Mempool Cash-out settlement reconciliation requires block height zero.'
        );
      }

      break;
    }

    case 'unknown':
    case 'unavailable': {
      if (result.blockHeight !== undefined) {
        throw new Error(
          'Unknown or unavailable Cash-out settlement reconciliation must not contain a block height.'
        );
      }

      break;
    }
  }

  return {
    ...result,

    txid: resultTxid,
  };
}

/**
 * Reconcile ONLY the exact deterministic txid already frozen by D3.
 *
 * This function:
 *
 * - never constructs a transaction;
 * - never modifies a transaction;
 * - never broadcasts;
 * - never searches for an "equivalent" settlement;
 * - only asks for evidence concerning settlementIntent.txid.
 */
export async function reconcileCashOutSettlementIntentWithDependencies(
  intent: CashOutSettlementIntent,
  dependencies: CashOutSettlementReconciliationDependencies
): Promise<TreasuryBroadcastReconciliationResult> {
  if (intent.status !== 'prepared') {
    throw new Error(
      'Cash-out settlement reconciliation requires a prepared D3 settlement intent.'
    );
  }

  const expectedTxid = normaliseTransactionId(
    intent.txid,
    'Cash-out settlement intent transaction ID'
  );

  const reconciliation = await dependencies.reconcile(expectedTxid);

  return validateReconciliationResult(reconciliation, expectedTxid);
}

/**
 * Production entry point.
 *
 * Load the shared Treasury reconciliation runtime only when a real network
 * check is actually requested.
 *
 * Keeping this import lazy prevents injected D4 unit tests from loading the
 * Electrum/WebSocket runtime under the current Node 18 test environment.
 */
export async function reconcileCashOutSettlementIntent(
  intent: CashOutSettlementIntent
): Promise<TreasuryBroadcastReconciliationResult> {
  const { reconcileTreasuryBroadcastWithRetry } = await import(
    'src/services/treasury-broadcast-reconciliation'
  );

  return reconcileCashOutSettlementIntentWithDependencies(intent, {
    reconcile: reconcileTreasuryBroadcastWithRetry,
  });
}
