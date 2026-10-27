import type { NetworkProvider } from 'cashscript';

import { applyCashOutSettlementIntent } from './cash-out-settlement-intent';

import { prepareAndStoreCashOutSettlementWithDependencies } from './cash-out-settlement-prepare';

import { applyCashOutSettlementRecoveryIntent } from './cash-out-settlement-recovery-store';

import { prepareAndStoreCashOutSettlementRecoveryWithDependencies } from './cash-out-settlement-recovery-prepare';

import type { CashOutSettlementRecoverySignedTransactionArtifact } from './cash-out-settlement-recovery-signing';

import type { FinalizeCashOutSettlementRecoveryTransactionInput } from './cash-out-settlement-recovery-transaction';

import type { CashOutRecord } from 'src/types/cash-out';

import type { CashOutNormalSettlementCandidate } from 'src/types/cash-out-contract-payment';

import type {
  CashOutSettlementContractPlan,
  CashOutSettlementIntent,
  CashOutSettlementRecoveryAssessment,
} from 'src/types/cash-out-settlement';

import type { CashOutSettlementRecoveryInputBinding } from './cash-out-settlement-recovery-input-binding';

const CASH_OUT_ID = 'cash-out-d6i-one-fee-001';

function assertEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(actual)} to equal ${String(expected)}.`
    );
  }
}

function assertThrowsContaining(
  operation: () => unknown,
  expectedMessagePart: string
): void {
  try {
    operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected error containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(`Expected operation to throw "${expectedMessagePart}".`);
}

async function assertRejectsContaining(
  operation: () => Promise<unknown>,
  expectedMessagePart: string
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessagePart)) {
      throw new Error(
        `Expected rejection containing "${expectedMessagePart}", received "${message}".`
      );
    }

    return;
  }

  throw new Error(`Expected operation to reject "${expectedMessagePart}".`);
}

/**
 * These deliberately minimal objects are enough for this focused boundary
 * test because each case must fail at the cross-path guard BEFORE deeper
 * settlement/recovery validation or signing is reached.
 */
const NORMAL_INTENT = {} as CashOutSettlementIntent;

const RECOVERY_INTENT = {
  cashOutId: CASH_OUT_ID,
} as CashOutSettlementRecoverySignedTransactionArtifact;

const RECORD_WITH_NORMAL_INTENT = {
  id: CASH_OUT_ID,
  settlementIntent: NORMAL_INTENT,
  status: 'received',
} as CashOutRecord;

const RECORD_WITH_RECOVERY_INTENT = {
  id: CASH_OUT_ID,
  recoveryIntent: RECOVERY_INTENT,
  status: 'received',
} as CashOutRecord;

/**
 * Durable state boundary:
 *
 * recovery first -> normal intent forbidden.
 */
assertThrowsContaining(
  () =>
    applyCashOutSettlementIntent(RECORD_WITH_RECOVERY_INTENT, NORMAL_INTENT),
  'durable recovery transaction'
);

console.log('PASS: durable recovery intent blocks normal settlement intent');

/**
 * Durable state boundary:
 *
 * normal first -> recovery intent forbidden.
 */
assertThrowsContaining(
  () =>
    applyCashOutSettlementRecoveryIntent(
      RECORD_WITH_NORMAL_INTENT,
      RECOVERY_INTENT
    ),
  'durable normal settlement transaction'
);

console.log('PASS: durable normal settlement intent blocks recovery intent');

/**
 * Normal preparation must stop BEFORE constructing/signing a normal
 * transaction when recovery already owns the Cash-out fee-paying path.
 */
{
  let createCalls = 0;
  let storeCalls = 0;

  const contractPlan = {
    settlementPlan: {
      cashOutId: CASH_OUT_ID,
    },
  } as CashOutSettlementContractPlan;

  const candidate = {
    cashOutId: CASH_OUT_ID,
  } as CashOutNormalSettlementCandidate;

  await assertRejectsContaining(async () => {
    await prepareAndStoreCashOutSettlementWithDependencies(
      {
        contractPlan,

        candidate,

        provider: {} as NetworkProvider,
      },
      {
        async getCashOutRecordById() {
          return RECORD_WITH_RECOVERY_INTENT;
        },

        async storeCashOutSettlementIntent() {
          storeCalls += 1;

          return RECORD_WITH_RECOVERY_INTENT;
        },

        async createCashOutSettlementIntent() {
          createCalls += 1;

          return NORMAL_INTENT;
        },
      }
    );
  }, 'durable recovery transaction');

  assertEqual(createCalls, 0);
  assertEqual(storeCalls, 0);

  console.log(
    'PASS: recovery intent blocks normal settlement before signing or storage'
  );
}

/**
 * Recovery preparation must stop BEFORE finalization/Treasury signing when a
 * normal settlement already owns the Cash-out fee-paying path.
 */
{
  let finalizeCalls = 0;
  let storeCalls = 0;
  let observationCalls = 0;

  const contractPlan = {
    settlementPlan: {
      cashOutId: CASH_OUT_ID,
    },
  } as CashOutSettlementContractPlan;

  await assertRejectsContaining(async () => {
    await prepareAndStoreCashOutSettlementRecoveryWithDependencies(
      {
        contractPlan,

        inputSet:
          {} as FinalizeCashOutSettlementRecoveryTransactionInput['inputSet'],

        recoveryAssessment: {} as CashOutSettlementRecoveryAssessment,

        binding: {} as CashOutSettlementRecoveryInputBinding,

        provider: {} as NetworkProvider,
      },
      {
        async getCashOutRecordById() {
          return RECORD_WITH_NORMAL_INTENT;
        },

        async observeRecoveryNetworkEvidence() {
          observationCalls += 1;
          throw new Error('Normal intent must block recovery network observation.');
        },

        async storeCashOutSettlementRecoveryIntent() {
          storeCalls += 1;

          return RECORD_WITH_NORMAL_INTENT;
        },

        async finalizeCashOutSettlementRecoveryTransaction() {
          finalizeCalls += 1;

          throw new Error(
            'Recovery finalizer must not be called when normal settlement intent exists.'
          );
        },
      }
    );
  }, 'durable normal settlement transaction');

  assertEqual(finalizeCalls, 0);
  assertEqual(storeCalls, 0);
  assertEqual(observationCalls, 0);

  console.log(
    'PASS: normal settlement intent blocks recovery before signing or storage'
  );
}

console.log('');
console.log('Cash-out D6I.1B one-fee path guard tests passed.');
