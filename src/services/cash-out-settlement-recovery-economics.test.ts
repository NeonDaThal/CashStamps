import { calculateCashOutSettlementRecoveryEconomics } from 'src/services/cash-out-settlement-recovery-economics';

const CASH_OUT_ID = 'cash-out-d6b-001';

const REQUIRED_SATS = 206_000;

const PLATFORM_FEE_SATS = 2_000;

const RECOVERY_FEE_SATS = 400;

function calculate(recoveryInputSats: number) {
  return calculateCashOutSettlementRecoveryEconomics({
    cashOutId: CASH_OUT_ID,

    requiredSats: REQUIRED_SATS,

    recoveryInputSats,

    platformFeeSats: PLATFORM_FEE_SATS,

    recoveryFeeSats: RECOVERY_FEE_SATS,
  });
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

function runD6B1Tests(): void {
  /**
   * Exact total recovered through the exceptional path.
   */
  {
    const result = calculate(REQUIRED_SATS);

    assertEqual(result.version, 'cash_out_recovery_v1');

    assertEqual(result.variance, 'exact');

    assertEqual(result.paymentVarianceSats, 0);

    assertEqual(result.platformFeeSats, PLATFORM_FEE_SATS);

    assertEqual(result.treasuryOutputSats, 203_600);

    assertEqual(result.merchantShortfallSats, 0);

    assertEqual(result.customerSurplusSats, 0);

    console.log(
      'PASS: exact exceptional recovery preserves original platform allocation'
    );
  }

  /**
   * Underpayment.
   *
   * Platform remains whole.
   * Miner fee remains merchant-side.
   * Merchant receives less Treasury BCH.
   */
  {
    const result = calculate(180_000);

    assertEqual(result.variance, 'underpayment');

    assertEqual(result.paymentVarianceSats, -26_000);

    assertEqual(result.merchantShortfallSats, 26_000);

    assertEqual(result.customerSurplusSats, 0);

    assertEqual(result.platformFeeSats, PLATFORM_FEE_SATS);

    assertEqual(result.treasuryOutputSats, 177_600);

    console.log(
      'PASS: underpayment shortfall is merchant-side while platform allocation remains protected'
    );
  }

  /**
   * Overpayment.
   *
   * The customer mistake does not increase platform revenue.
   */
  {
    const result = calculate(230_000);

    assertEqual(result.variance, 'overpayment');

    assertEqual(result.paymentVarianceSats, 24_000);

    assertEqual(result.customerSurplusSats, 24_000);

    assertEqual(result.merchantShortfallSats, 0);

    assertEqual(result.platformFeeSats, PLATFORM_FEE_SATS);

    assertEqual(result.treasuryOutputSats, 227_600);

    console.log(
      'PASS: overpayment surplus goes Treasury without increasing platform fee'
    );
  }

  /**
   * Fragmented payments are economically based on their exact selected total.
   *
   * D6D will later prove the individual outpoints.
   */
  {
    const fragmentA = 100_000;

    const fragmentB = 106_000;

    const result = calculate(fragmentA + fragmentB);

    assertEqual(result.variance, 'exact');

    assertEqual(result.recoveryInputSats, REQUIRED_SATS);

    assertEqual(result.treasuryOutputSats, 203_600);

    console.log(
      'PASS: fragmented payment economics use exact aggregate recovery input value'
    );
  }

  /**
   * Two exact payments still represent one original Cash-out.
   *
   * Platform receives one original platform allocation, not two.
   */
  {
    const result = calculate(REQUIRED_SATS * 2);

    assertEqual(result.variance, 'overpayment');

    assertEqual(result.customerSurplusSats, REQUIRED_SATS);

    assertEqual(result.platformFeeSats, PLATFORM_FEE_SATS);

    assertEqual(result.treasuryOutputSats, 409_600);

    console.log(
      'PASS: duplicate exact payments do not duplicate the platform service fee'
    );
  }

  /**
   * Miner fee always comes from Treasury.
   */
  {
    const lowFee = calculateCashOutSettlementRecoveryEconomics({
      cashOutId: CASH_OUT_ID,

      requiredSats: REQUIRED_SATS,

      recoveryInputSats: REQUIRED_SATS,

      platformFeeSats: PLATFORM_FEE_SATS,

      recoveryFeeSats: 300,
    });

    const highFee = calculateCashOutSettlementRecoveryEconomics({
      cashOutId: CASH_OUT_ID,

      requiredSats: REQUIRED_SATS,

      recoveryInputSats: REQUIRED_SATS,

      platformFeeSats: PLATFORM_FEE_SATS,

      recoveryFeeSats: 500,
    });

    assertEqual(lowFee.platformFeeSats, highFee.platformFeeSats);

    assertEqual(lowFee.treasuryOutputSats - highFee.treasuryOutputSats, 200);

    console.log(
      'PASS: increased recovery miner fee is deducted only from Treasury'
    );
  }

  /**
   * Too-small recovery cannot dilute the protected platform allocation.
   */
  {
    assertThrows(
      () =>
        calculateCashOutSettlementRecoveryEconomics({
          cashOutId: CASH_OUT_ID,

          requiredSats: REQUIRED_SATS,

          recoveryInputSats: PLATFORM_FEE_SATS + RECOVERY_FEE_SATS,

          platformFeeSats: PLATFORM_FEE_SATS,

          recoveryFeeSats: RECOVERY_FEE_SATS,
        }),

      'too small to preserve the platform allocation'
    );

    console.log(
      'PASS: too-small exceptional payment cannot dilute platform protection'
    );
  }

  /**
   * Even one positive Treasury sat is economically valid at this pure layer.
   *
   * Dust/output-standardness rules belong in transaction planning later.
   */
  {
    const result = calculateCashOutSettlementRecoveryEconomics({
      cashOutId: CASH_OUT_ID,

      requiredSats: REQUIRED_SATS,

      recoveryInputSats: PLATFORM_FEE_SATS + RECOVERY_FEE_SATS + 1,

      platformFeeSats: PLATFORM_FEE_SATS,

      recoveryFeeSats: RECOVERY_FEE_SATS,
    });

    assertEqual(result.treasuryOutputSats, 1);

    console.log(
      'PASS: pure recovery economics leave dust/standardness enforcement to transaction planning'
    );
  }

  /**
   * Malformed monetary inputs fail closed.
   */
  {
    assertThrows(
      () =>
        calculateCashOutSettlementRecoveryEconomics({
          cashOutId: CASH_OUT_ID,

          requiredSats: 0,

          recoveryInputSats: REQUIRED_SATS,

          platformFeeSats: PLATFORM_FEE_SATS,

          recoveryFeeSats: RECOVERY_FEE_SATS,
        }),

      'original required sats'
    );

    console.log('PASS: invalid original required amount fails closed');
  }

  {
    assertThrows(
      () =>
        calculateCashOutSettlementRecoveryEconomics({
          cashOutId: CASH_OUT_ID,

          requiredSats: REQUIRED_SATS,

          recoveryInputSats: -1,

          platformFeeSats: PLATFORM_FEE_SATS,

          recoveryFeeSats: RECOVERY_FEE_SATS,
        }),

      'Recovery input sats'
    );

    console.log('PASS: invalid recovery input amount fails closed');
  }

  {
    assertThrows(
      () =>
        calculateCashOutSettlementRecoveryEconomics({
          cashOutId: CASH_OUT_ID,

          requiredSats: REQUIRED_SATS,

          recoveryInputSats: REQUIRED_SATS,

          platformFeeSats: -1,

          recoveryFeeSats: RECOVERY_FEE_SATS,
        }),

      'platform fee sats'
    );

    console.log('PASS: invalid platform allocation fails closed');
  }

  {
    assertThrows(
      () =>
        calculateCashOutSettlementRecoveryEconomics({
          cashOutId: CASH_OUT_ID,

          requiredSats: REQUIRED_SATS,

          recoveryInputSats: REQUIRED_SATS,

          platformFeeSats: PLATFORM_FEE_SATS,

          recoveryFeeSats: 0,
        }),

      'Recovery miner fee'
    );

    console.log('PASS: zero recovery miner fee fails closed');
  }

  console.log('');

  console.log('Cash-out Settlement D6B.1 recovery economics tests passed.');
}

runD6B1Tests();
