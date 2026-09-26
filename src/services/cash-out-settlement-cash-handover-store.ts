import { mutateCashOutRecordAtomically } from 'src/services/cash-out-store';

import {
  applyCashOutCashHandoverConfirmation,
  type CashOutCashHandoverConfirmation,
} from 'src/services/cash-out-settlement-cash-handover';

import type { CashOutRecord } from 'src/types/cash-out';

export interface CashOutCashHandoverStoreDependencies {
  mutateCashOutRecordAtomically: (
    id: string,
    updater: (record: CashOutRecord) => CashOutRecord
  ) => Promise<CashOutRecord | undefined>;
}

const productionDependencies: CashOutCashHandoverStoreDependencies = {
  mutateCashOutRecordAtomically,
};

/**
 * Atomically perform the physical-cash completion boundary.
 *
 * Security-critical detail:
 *
 * D5E safety is evaluated INSIDE the atomic Cash-out mutation against the
 * newest durable record.
 *
 * An earlier UI/preflight decision is never trusted for the final write.
 */
export async function confirmCashOutCashHandoverAtomicallyWithDependencies(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation,
  dependencies: CashOutCashHandoverStoreDependencies
): Promise<CashOutRecord | undefined> {
  return dependencies.mutateCashOutRecordAtomically(
    cashOutId,

    (current) => applyCashOutCashHandoverConfirmation(current, confirmation)
  );
}

export async function confirmCashOutCashHandoverAtomically(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation
): Promise<CashOutRecord | undefined> {
  return confirmCashOutCashHandoverAtomicallyWithDependencies(
    cashOutId,
    confirmation,
    productionDependencies
  );
}

export interface CashOutCashHandoverPreflightResult {
  record: CashOutRecord;

  merchantSafety: {
    safeToHandCash: boolean;

    reason: string;
  };
}

export interface CashOutCashHandoverConfirmationDependencies
  extends CashOutCashHandoverStoreDependencies {
  recoverConflictAware: (
    cashOutId: string
  ) => Promise<CashOutCashHandoverPreflightResult>;
}

export interface CashOutCashHandoverConfirmationResult {
  preflight: CashOutCashHandoverPreflightResult;

  record: CashOutRecord;

  completedNow: boolean;
}

/**
 * Full D5E merchant confirmation path.
 *
 * 1. Perform current conflict-aware restart/network preflight.
 * 2. Require that preflight to consider the Cash-out safe.
 * 3. Perform the actual received -> completed transition atomically.
 * 4. Re-evaluate safety inside that atomic mutation against the newest durable
 *    record.
 *
 * This closes the race between "UI looked safe" and "merchant pressed confirm".
 */
export async function confirmCashOutCashHandoverWithDependencies(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation,
  dependencies: CashOutCashHandoverConfirmationDependencies
): Promise<CashOutCashHandoverConfirmationResult> {
  const preflight = await dependencies.recoverConflictAware(cashOutId);

  /**
   * completed is handled idempotently below. For an ordinary received record,
   * positive D5 safety is mandatory before even attempting completion.
   */
  if (
    preflight.record.status !== 'completed' &&
    !preflight.merchantSafety.safeToHandCash
  ) {
    throw new Error(
      `Cash handover preflight is unsafe: ${preflight.merchantSafety.reason}.`
    );
  }

  const wasAlreadyCompleted = preflight.record.status === 'completed';

  const stored = await confirmCashOutCashHandoverAtomicallyWithDependencies(
    cashOutId,
    confirmation,
    dependencies
  );

  if (!stored) {
    throw new Error(
      'Cash-out disappeared before cash-handover confirmation could be persisted.'
    );
  }

  return {
    preflight,

    record: stored,

    completedNow: !wasAlreadyCompleted && stored.status === 'completed',
  };
}

/**
 * Production D5E entry point.
 *
 * Load the conflict-aware restart path lazily because that path eventually
 * reaches Electrum/libauth.
 */
export async function confirmCashOutCashHandover(
  cashOutId: string,
  confirmation: CashOutCashHandoverConfirmation
): Promise<CashOutCashHandoverConfirmationResult> {
  const { recoverCashOutSettlementConflictAwareAfterRestart } = await import(
    'src/services/cash-out-settlement-restart-recovery'
  );

  return confirmCashOutCashHandoverWithDependencies(
    cashOutId,

    confirmation,

    {
      mutateCashOutRecordAtomically,

      recoverConflictAware: recoverCashOutSettlementConflictAwareAfterRestart,
    }
  );
}
