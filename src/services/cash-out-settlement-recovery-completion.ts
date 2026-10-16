import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import {
  applyCashOutPhysicalCashHandoverConfirmation,
  type CashOutCashHandoverConfirmation,
} from 'src/services/cash-out-settlement-cash-handover';

import { evaluateConfirmedCashOutSettlementRecovery } from 'src/services/cash-out-settlement-recovery-lifecycle';

import {
  reconcileConfirmedCashOutSettlementRecoveryLifecycle,
  type CashOutSettlementRecoveryLifecycleStoreResult,
} from 'src/services/cash-out-settlement-recovery-lifecycle-store';

import {
  reconcileCompletedCashOutAccounting,
  type CashOutSettlementAccountingResult,
} from 'src/services/cash-out-settlement-accounting';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutSettlementRecoveryCompletionDependencies {
  reconcileRecoveryLifecycle: (
    cashOutId: string
  ) => Promise<CashOutSettlementRecoveryLifecycleStoreResult>;

  mutateCashOutRecordAtomically: (
    id: string,
    updater: (record: CashOutRecord) => CashOutRecord
  ) => Promise<CashOutRecord | undefined>;

  reconcileAccounting: (
    cashOutId: string
  ) => Promise<CashOutSettlementAccountingResult>;
}

export interface CashOutSettlementRecoveryCashHandoverResult {
  record: CashOutRecord;

  /**
   * True only when this call created the durable completed business event.
   *
   * Restart/replay after completion returns false.
   */
  completedNow: boolean;
}

export interface CashOutSettlementRecoveryCompletionResult {
  recoveryLifecycle: CashOutSettlementRecoveryLifecycleStoreResult;

  handover: CashOutSettlementRecoveryCashHandoverResult;

  accounting: CashOutSettlementAccountingResult;
}

const productionDependencies: CashOutSettlementRecoveryCompletionDependencies =
  {
    reconcileRecoveryLifecycle:
      reconcileConfirmedCashOutSettlementRecoveryLifecycle,

    mutateCashOutRecordAtomically,

    reconcileAccounting: reconcileCompletedCashOutAccounting,
  };

/**
 * Recovery-specific physical-cash confirmation boundary.
 *
 * Security-critical distinction:
 *
 * This function does NOT use the normal D5 settlement-safety evaluator.
 *
 * Normal settlement and exceptional recovery prove BCH safety differently.
 * Recovery therefore revalidates its own exact persisted recovery transaction
 * and confirmed reconciliation evidence inside the atomic Cash-out write.
 *
 * Only after those checks succeed does it call the shared physical-cash
 * received -> completed transition.
 */
export async function confirmRecoveredCashOutCashHandoverAtomicallyWithDependencies(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation,
  dependencies: Pick<
    CashOutSettlementRecoveryCompletionDependencies,
    'mutateCashOutRecordAtomically'
  >
): Promise<CashOutSettlementRecoveryCashHandoverResult> {
  let completedNow = false;

  const stored = await dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (current) => {
      /**
       * Duplicate/restart confirmation after the physical business event has
       * already been persisted is idempotent.
       *
       * completedAt must never be replaced.
       */
      if (current.status === 'completed') {
        return current;
      }

      /**
       * Revalidate the exact confirmed recovery evidence INSIDE the atomic
       * mutation.
       *
       * D6H.2A may have performed an earlier preflight/lifecycle transition,
       * but that earlier result is never blindly trusted for the final
       * physical-cash write.
       */
      const recoveryDecision =
        evaluateConfirmedCashOutSettlementRecovery(current);

      if (
        !recoveryDecision.readyForReceivedState ||
        !Number.isSafeInteger(recoveryDecision.recoveryInputSats)
      ) {
        throw new Error(
          `Recovery cash handover is blocked: ${recoveryDecision.reason}. ${recoveryDecision.message}`
        );
      }

      /**
       * Recovery must have crossed the durable BCH-side lifecycle boundary
       * before physical cash may be completed.
       */
      if (current.status !== 'received') {
        throw new Error(
          'Recovery cash handover requires the Cash-out to be durably received before physical cash completion.'
        );
      }

      /**
       * The durable received amount must still equal the exact frozen recovery
       * input total.
       *
       * This catches malformed/corrupt state between D6H.2A and the merchant
       * handover boundary.
       */
      if (
        !Number.isSafeInteger(current.bchSatsReceived) ||
        current.bchSatsReceived !== recoveryDecision.recoveryInputSats
      ) {
        throw new Error(
          'Recovery cash handover is blocked because the durable BCH received amount does not match the confirmed recovery input total.'
        );
      }

      const next = applyCashOutPhysicalCashHandoverConfirmation(
        current,
        confirmation
      );

      completedNow = next.status === 'completed';

      return next;
    }
  );

  if (!stored) {
    throw new Error(
      'Cash-out disappeared before recovered cash-handover confirmation could be persisted.'
    );
  }

  return {
    record: stored,

    completedNow,
  };
}

/**
 * D6H.2B — complete one exceptional-recovery Cash-out.
 *
 * Ordering:
 *
 * 1. Persist confirmed recovery as the BCH-side `received` state.
 * 2. Revalidate confirmed recovery inside a second atomic mutation.
 * 3. Persist the merchant-confirmed physical cash event as `completed`.
 * 4. Reconcile the existing optional Cash-on-Hand bookkeeping.
 *
 * Crash safety:
 *
 * - crash after step 1 -> record remains safely received;
 * - crash after step 3 -> completed business event is durable;
 * - accounting can be replayed afterward;
 * - repeated completion cannot create another physical payout event;
 * - existing recordCashOutPaid() idempotency prevents another Cash-on-Hand
 *   movement.
 *
 * Recovery BCH variance NEVER changes the original fiat payout amount.
 * Existing accounting continues to use cashOut.fiatAmountMinor.
 */
export async function completeRecoveredCashOutSettlementWithDependencies(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation,
  dependencies: CashOutSettlementRecoveryCompletionDependencies
): Promise<CashOutSettlementRecoveryCompletionResult> {
  /**
   * First make the confirmed BCH-side recovery durable as received.
   *
   * If a previous process already did this, D6H.2A is idempotent.
   *
   * If the record is already completed, D6H.2A also leaves it terminal.
   */
  const recoveryLifecycle = await dependencies.reconcileRecoveryLifecycle(
    cashOutId
  );

  const handover =
    await confirmRecoveredCashOutCashHandoverAtomicallyWithDependencies(
      cashOutId,
      confirmation,
      dependencies
    );

  if (handover.record.status !== 'completed') {
    throw new Error(
      'Recovered Cash-out completion did not persist before accounting reconciliation.'
    );
  }

  /**
   * Reuse the exact existing D5F accounting service.
   *
   * This intentionally means:
   *
   * - Cash on Hand remains optional;
   * - negative Cash on Hand remains allowed;
   * - one relatedRecordId creates at most one cash_out_paid movement;
   * - fiatAmountMinor remains the physical customer cash payout;
   * - recovery BCH shortfall/surplus does not redefine the cash amount.
   */
  const accounting = await dependencies.reconcileAccounting(cashOutId);

  if (accounting.status === 'missing_cash_out') {
    throw new Error(
      'Completed recovered Cash-out disappeared before accounting reconciliation.'
    );
  }

  if (accounting.status === 'not_completed') {
    throw new Error(
      'Recovered Cash-out accounting observed a non-completed record after completion was persisted.'
    );
  }

  /**
   * cash_on_hand_not_set_up is deliberately valid.
   *
   * Cash on Hand is merchant-local bookkeeping only and has no authority over
   * Cash-out validity or completion.
   */
  return {
    recoveryLifecycle,

    handover,

    accounting,
  };
}

export async function completeRecoveredCashOutSettlement(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation
): Promise<CashOutSettlementRecoveryCompletionResult> {
  return completeRecoveredCashOutSettlementWithDependencies(
    cashOutId,
    confirmation,
    productionDependencies
  );
}
