import { validateCashOutSettlementNetworkState } from 'src/services/cash-out-settlement-broadcast-state';

import type { CashOutRecord } from 'src/types/cash-out';

export type CashOutSettlementRecoveryAction =
  | 'submit_same_transaction'
  | 'check_same_transaction'
  | 'none';

/**
 * Decide the ONLY safe next network action for one already-prepared Cash-out
 * settlement.
 *
 * This function performs no networking and no persistence.
 *
 * Important:
 *
 * submit_same_transaction
 *   means submit the exact persisted D3 rawTransactionHex.
 *
 * check_same_transaction
 *   means perform read-only reconciliation of settlementIntent.txid.
 *
 * none
 *   means no submission/reconciliation action should be initiated from this
 *   state.
 */
export function getCashOutSettlementRecoveryAction(
  cashOut: CashOutRecord
): CashOutSettlementRecoveryAction {
  validateCashOutSettlementNetworkState(cashOut);

  const reconciliation = cashOut.settlementReconciliation;

  /**
   * Positive evidence always wins.
   *
   * The exact settlement transaction is already visible on the network, so
   * another broadcast request is forbidden.
   */
  if (
    reconciliation?.status === 'mempool' ||
    reconciliation?.status === 'confirmed'
  ) {
    return 'none';
  }

  const broadcast = cashOut.settlementBroadcast;

  /**
   * No app-side submission has ever been recorded.
   *
   * Unknown/unavailable reconciliation does not change this: submitting the
   * SAME deterministic raw transaction is still safe.
   */
  if (!broadcast) {
    return 'submit_same_transaction';
  }

  switch (broadcast.status) {
    case 'broadcasted':
      return 'check_same_transaction';

    case 'uncertain':
      /**
       * Generic ambiguity remains check-only.
       *
       * The one exception is a narrowly-classified explicit server rejection
       * proving that server did not accept the exact child transaction.
       *
       * Even here, D4 may retry ONLY settlementIntent.rawTransactionHex.
       */
      if (
        broadcast.explicitRejection?.kind === 'input_unavailable' &&
        broadcast.explicitRejection.retrySameTransaction === true
      ) {
        return 'submit_same_transaction';
      }

      return 'check_same_transaction';

    case 'definitely_not_broadcast':
      /**
       * We positively know blockchain.transaction.broadcast never began.
       */
      return 'submit_same_transaction';

    case 'blocked':
      /**
       * The normal development safety guard is retryable because no network
       * request began.
       *
       * A blocked result while real broadcast was supposedly enabled instead
       * indicates a failed precondition/corrupted intent and must not be
       * automatically retried.
       */
      return broadcast.broadcastEnabled ? 'none' : 'submit_same_transaction';
  }
}
