import type { NetworkProvider } from 'cashscript';

import {
  prepareAndStoreCashOutSettlementRecoveryWithDependencies,
  type PrepareCashOutSettlementRecoveryInput,
} from './cash-out-settlement-recovery-prepare';

import type { CashOutSettlementRecoveryInputBinding } from './cash-out-settlement-recovery-input-binding';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementContractPlan,
  CashOutSettlementRecoveryAssessment,
} from 'src/types/cash-out-settlement';

const CASH_OUT_ID = 'cash-out-d6i-recovery-freshness-001';

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

const TEST_INPUT: PrepareCashOutSettlementRecoveryInput = {
  contractPlan: {
    settlementPlan: {
      cashOutId: CASH_OUT_ID,
    },
  } as CashOutSettlementContractPlan,

  inputSet: {} as PrepareCashOutSettlementRecoveryInput['inputSet'],

  recoveryAssessment: {} as CashOutSettlementRecoveryAssessment,

  binding: {} as CashOutSettlementRecoveryInputBinding,

  provider: {} as NetworkProvider,
};

async function assertBlockedBeforeSigning(
  current: CashOutRecord,
  expectedMessagePart: string,
  passMessage: string
): Promise<void> {
  let finalizeCalls = 0;
  let storeCalls = 0;

  await assertRejectsContaining(async () => {
    await prepareAndStoreCashOutSettlementRecoveryWithDependencies(TEST_INPUT, {
      async getCashOutRecordById() {
        return current;
      },

      async storeCashOutSettlementRecoveryIntent() {
        storeCalls += 1;

        return current;
      },

      async finalizeCashOutSettlementRecoveryTransaction() {
        finalizeCalls += 1;

        throw new Error(
          'Recovery finalizer must not be called after recovery authorization becomes stale.'
        );
      },
    });
  }, expectedMessagePart);

  if (finalizeCalls !== 0) {
    throw new Error(
      `Expected zero recovery finalizer calls, received ${finalizeCalls}.`
    );
  }

  if (storeCalls !== 0) {
    throw new Error(
      `Expected zero recovery store calls, received ${storeCalls}.`
    );
  }

  console.log(`PASS: ${passMessage}`);
}

/**
 * Authorization created earlier must not survive completion of the Cash-out.
 */
await assertBlockedBeforeSigning(
  {
    id: CASH_OUT_ID,

    status: 'completed',

    bchSatsRequired: 206_000,
  } as CashOutRecord,
  'Completed Cash-outs',
  'completed Cash-out blocks stale recovery authorization before signing'
);

/**
 * Authorization created earlier must not survive positive normal-settlement
 * network evidence.
 */
await assertBlockedBeforeSigning(
  {
    id: CASH_OUT_ID,

    status: 'received',

    bchSatsRequired: 206_000,

    settlementReconciliation: {
      status: 'confirmed',
    },
  } as CashOutRecord,
  'positive network evidence',
  'confirmed normal settlement blocks stale recovery authorization before signing'
);

/**
 * Authorization created earlier must not survive newly-detected source
 * conflict evidence.
 */
await assertBlockedBeforeSigning(
  {
    id: CASH_OUT_ID,

    status: 'received',

    bchSatsRequired: 206_000,

    settlementSourceConflict: {
      state: 'detected',
    },
  } as CashOutRecord,
  'conflicting-spender evidence',
  'active source conflict blocks stale recovery authorization before signing'
);

console.log('');
console.log('Cash-out D6I.1C recovery preparation freshness tests passed.');
