import {
  evaluateCashOutSettlementRecoveryEligibility,
  type CashOutSettlementExceptionalPaymentEvidence,
} from 'src/services/cash-out-settlement-recovery-eligibility';

import type { CashOutRecord } from 'src/types/cash-out';

import type {
  CashOutSettlementExceptionalCase,
  CashOutSettlementSourceConflictEvidence,
} from 'src/types/cash-out-settlement';

import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

const CASH_OUT_ID = 'cash-out-d6a-001';

const CASH_OUT_SERIAL = 'CO-D6A-001';

const CUSTOMER_TXID = '11'.repeat(32);

const SETTLEMENT_TXID = '22'.repeat(32);

const CONFLICT_TXID = '33'.repeat(32);

const REQUIRED_SATS = 206_000;

function reconciliation(
  status: 'mempool' | 'confirmed' | 'unknown' | 'unavailable'
): TreasuryBroadcastReconciliationResult {
  return {
    txid: SETTLEMENT_TXID,

    status,

    ...(status === 'mempool'
      ? {
          blockHeight: 0,
        }
      : {}),

    ...(status === 'confirmed'
      ? {
          blockHeight: 900_000,
        }
      : {}),

    serverChecks: [],

    checkedAt: '2026-09-26T14:00:00.000Z',

    message: `D6A ${status}.`,
  };
}

function conflict(
  status: 'mempool' | 'confirmed'
): CashOutSettlementSourceConflictEvidence {
  return {
    state: 'detected',

    sourcePaymentTxid: CUSTOMER_TXID,

    sourceOutpointIndex: 2,

    expectedSettlementTxid: SETTLEMENT_TXID,

    conflictingTxid: CONFLICT_TXID,

    conflictingTransactionStatus: status,

    conflictingTransactionBlockHeight: status === 'confirmed' ? 899_999 : 0,

    detectedAt: '2026-09-26T14:05:00.000Z',

    message: 'Different transaction spends exact settlement source.',
  };
}

function cashOut(overrides: Partial<CashOutRecord> = {}): CashOutRecord {
  return {
    id: CASH_OUT_ID,

    serial: CASH_OUT_SERIAL,

    createdAt: '2026-09-26T13:00:00.000Z',

    updatedAt: '2026-09-26T14:00:00.000Z',

    fiatCurrency: 'GBP',

    fiatAmountMinor: 10_000,

    customerSendsFiatEquivalentMinor: 10_300,

    marketBchSats: 200_000,

    bchSatsRequired: REQUIRED_SATS,

    quote: {
      source: 'coingecko',

      fiatCurrency: 'GBP',

      marketRate: 500,

      marketRateTimestamp: '2026-09-26T13:00:00.000Z',

      isFallbackQuote: false,
    },

    fee: {
      feeModel: 'cash_out_v1',

      totalServiceFeeBasisPoints: 300,

      totalServiceFeeAmountMinor: 300,

      platformFeeBasisPoints: 150,

      platformFeeAmountMinor: 150,

      merchantFeeBasisPoints: 150,

      merchantFeeAmountMinor: 150,

      settlementMode: 'accounting_only',
    },

    treasuryReceivingAddress: 'bitcoincash:q-test-d6a-contract',

    status: 'received',

    ...overrides,
  } as CashOutRecord;
}

function evidence(
  exceptionalCase: CashOutSettlementExceptionalCase,
  overrides: Partial<CashOutSettlementExceptionalPaymentEvidence> = {}
): CashOutSettlementExceptionalPaymentEvidence {
  return {
    exceptionalCase,

    observedSats: REQUIRED_SATS,

    observedOutpointCount: 1,

    networkEvidenceAvailable: true,

    ...overrides,
  };
}

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

function assertThrows(
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

function assertEligible(
  exceptionalCase: CashOutSettlementExceptionalCase,
  input: Partial<CashOutSettlementExceptionalPaymentEvidence> = {}
): void {
  const result = evaluateCashOutSettlementRecoveryEligibility(
    cashOut(),
    evidence(exceptionalCase, input)
  );

  assertEqual(
    result.eligibility,
    'eligible',
    `${exceptionalCase} should be recovery eligible.`
  );

  assertEqual(result.blockReason, undefined);
}

function runD6A3Tests(): void {
  /**
   * Underpayment is not valid normal settlement, but positively observed value
   * may proceed to exceptional recovery planning.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut(),

      evidence('underpayment', {
        observedSats: REQUIRED_SATS - 1,
      })
    );

    assertEqual(result.eligibility, 'eligible');

    assertEqual(result.observedSats, REQUIRED_SATS - 1);

    console.log(
      'PASS: positively observed underpayment is eligible for exceptional recovery planning'
    );
  }

  /**
   * Overpayment.
   */
  {
    assertEligible('overpayment', {
      observedSats: REQUIRED_SATS + 1,
    });

    console.log(
      'PASS: positively observed overpayment is eligible for exceptional recovery planning'
    );
  }

  /**
   * Multiple fragments.
   */
  {
    assertEligible('fragmented_payment', {
      observedOutpointCount: 3,
    });

    console.log(
      'PASS: fragmented customer payment may enter exceptional recovery planning'
    );
  }

  /**
   * Multiple exact UTXOs are exceptional rather than arbitrarily selecting one
   * as though the payment were normal.
   */
  {
    assertEligible('multiple_exact_payments', {
      observedSats: REQUIRED_SATS * 2,

      observedOutpointCount: 2,
    });

    console.log(
      'PASS: multiple exact payments remain exceptional and recovery eligible'
    );
  }

  /**
   * Exact payment plus an additional overpayment cannot silently use the normal
   * one-input path.
   */
  {
    assertEligible('exact_plus_overpayment', {
      observedSats: REQUIRED_SATS + 10_000,

      observedOutpointCount: 2,
    });

    console.log(
      'PASS: exact plus overpayment remains an exceptional recovery case'
    );
  }

  /**
   * Late value after quote expiry.
   */
  {
    assertEligible('late_payment_after_expiry');

    console.log(
      'PASS: positively observed late payment after expiry may enter recovery planning'
    );
  }

  /**
   * Late value after merchant cancellation.
   */
  {
    assertEligible('late_payment_after_cancellation');

    console.log(
      'PASS: positively observed late payment after cancellation may enter recovery planning'
    );
  }

  /**
   * No BCH means there is nothing to recover.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut(),

      evidence('underpayment', {
        observedSats: 0,

        observedOutpointCount: 0,
      })
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'no_customer_value_received');

    console.log('PASS: zero customer value cannot create exceptional recovery');
  }

  /**
   * Lack of customer-payment network evidence is not permission to recover.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut(),

      evidence('overpayment', {
        networkEvidenceAvailable: false,
      })
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'network_state_unavailable');

    console.log(
      'PASS: unavailable customer-payment network evidence fails closed'
    );
  }

  /**
   * Existing D5 conflict hard stop must dominate D6.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        settlementSourceConflict: conflict('mempool'),
      }),

      evidence('overpayment')
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'source_conflict_active');

    console.log(
      'PASS: active mempool conflicting spender blocks exceptional recovery'
    );
  }

  /**
   * Confirmed conflicting spender is an even stronger hard stop.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        settlementSourceConflict: conflict('confirmed'),
      }),

      evidence('fragmented_payment')
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'confirmed_conflicting_spender');

    console.log(
      'PASS: confirmed conflicting spender blocks exceptional recovery'
    );
  }

  /**
   * A completed physical Cash-out is terminal for normal recovery planning.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        status: 'completed',

        completedAt: '2026-09-26T14:10:00.000Z',
      }),

      evidence('overpayment')
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'cash_out_already_completed');

    console.log(
      'PASS: completed Cash-out cannot re-enter exceptional recovery'
    );
  }

  /**
   * Normal settlement already visible in mempool:
   *
   * D6 cannot bypass it.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        settlementReconciliation: reconciliation('mempool'),
      }),

      evidence('normal_settlement_problem', {
        normalSettlementState: 'demonstrably_unusable',
      })
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'normal_settlement_available');

    console.log(
      'PASS: mempool-visible normal settlement cannot be bypassed by recovery'
    );
  }

  /**
   * Normal settlement confirmed:
   *
   * recovery is unnecessary and forbidden.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        settlementReconciliation: reconciliation('confirmed'),
      }),

      evidence('normal_settlement_problem', {
        normalSettlementState: 'demonstrably_unusable',
      })
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'normal_settlement_available');

    console.log(
      'PASS: confirmed normal settlement cannot be bypassed by recovery'
    );
  }

  /**
   * Ambiguous/unknown normal settlement is NOT enough.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        settlementReconciliation: reconciliation('unknown'),
      }),

      evidence('normal_settlement_problem', {
        normalSettlementState: 'unknown',
      })
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'normal_settlement_not_proven_unusable');

    console.log(
      'PASS: unknown normal settlement cannot unlock exceptional recovery'
    );
  }

  /**
   * Even if reconciliation is unavailable, D6 still must not infer that normal
   * settlement is impossible.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut({
        settlementReconciliation: reconciliation('unavailable'),
      }),

      evidence('normal_settlement_problem')
    );

    assertEqual(result.eligibility, 'blocked');

    assertEqual(result.blockReason, 'normal_settlement_not_proven_unusable');

    console.log(
      'PASS: unavailable settlement network state is not proof normal settlement is unusable'
    );
  }

  /**
   * The exceptional route opens only after another layer has positively
   * established that the deterministic normal settlement cannot be used.
   *
   * Later D6 stages will define and prove that evidence.
   */
  {
    const result = evaluateCashOutSettlementRecoveryEligibility(
      cashOut(),

      evidence('normal_settlement_problem', {
        normalSettlementState: 'demonstrably_unusable',
      })
    );

    assertEqual(result.eligibility, 'eligible');

    console.log(
      'PASS: demonstrably unusable normal settlement may proceed to exceptional recovery planning'
    );
  }

  /**
   * Runtime validation remains necessary even though TypeScript callers are
   * typed.
   */
  {
    assertThrows(
      () =>
        evaluateCashOutSettlementRecoveryEligibility(
          cashOut(),

          evidence('underpayment', {
            observedSats: -1,
          })
        ),

      'observedSats'
    );

    console.log('PASS: negative observed recovery amount fails closed');
  }

  {
    assertThrows(
      () =>
        evaluateCashOutSettlementRecoveryEligibility(
          cashOut(),

          evidence('fragmented_payment', {
            observedOutpointCount: 1.5,
          })
        ),

      'observedOutpointCount'
    );

    console.log('PASS: malformed observed outpoint count fails closed');
  }

  {
    assertThrows(
      () =>
        evaluateCashOutSettlementRecoveryEligibility(
          cashOut({
            bchSatsRequired: 0,
          }),

          evidence('underpayment')
        ),

      'required sats'
    );

    console.log('PASS: invalid required Cash-out amount fails closed');
  }

  console.log('');

  console.log(
    'Cash-out Settlement D6A exceptional recovery eligibility tests passed.'
  );
}

runD6A3Tests();
