import type { VoucherRecord } from 'src/types/voucher';
import { getTopupRecordValues, isTopupFeeModelV1 } from './topup-record-values';

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(expected)}, received ${String(actual)}`
    );
  }
}

function test(name: string, run: () => void): void {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('Fee Model v1 keeps principal separate from customer payment', () => {
  const voucher = {
    fiatAmountMinor: 2400,
    finalBchSats: 20_000_000,
    fee: {
      type: 'fixed',
      basisPoints: 0,
      amountMinor: 400,
    },
    feeModel: {
      version: 'topup_v1',
      principalMinor: 2000,
      serviceFeeMinor: 400,
    },
  } as unknown as VoucherRecord;

  const values = getTopupRecordValues(voucher);

  assertEqual(isTopupFeeModelV1(voucher), true);
  assertEqual(values.model, 'topup_v1');
  assertEqual(values.principalMinor, 2000);
  assertEqual(values.serviceFeeMinor, 400);
  assertEqual(values.customerPaysMinor, 2400);
  assertEqual(values.bchLoadedSats, 20_000_000);
});

test('legacy Topup preserves historical subtractive fee semantics', () => {
  const voucher = {
    fiatAmountMinor: 600,
    finalBchSats: 5_400_000,
    fee: {
      type: 'percentage',
      basisPoints: 1000,
      amountMinor: 60,
    },
  } as unknown as VoucherRecord;

  const values = getTopupRecordValues(voucher);

  assertEqual(values.model, 'legacy');
  assertEqual(values.customerPaysMinor, 600);
  assertEqual(values.serviceFeeMinor, 60);
  assertEqual(values.principalMinor, 540);
});

test('legacy no-fee record treats the full cash amount as principal', () => {
  const voucher = {
    fiatAmountMinor: 1000,
    finalBchSats: 10_000_000,
    fee: {
      type: 'none',
      basisPoints: 0,
      amountMinor: 0,
    },
  } as unknown as VoucherRecord;

  const values = getTopupRecordValues(voucher);

  assertEqual(values.customerPaysMinor, 1000);
  assertEqual(values.serviceFeeMinor, 0);
  assertEqual(values.principalMinor, 1000);
});

test('invalid legacy fee cannot produce a negative principal', () => {
  const voucher = {
    fiatAmountMinor: 100,
    finalBchSats: 1,
    fee: {
      type: 'fixed',
      basisPoints: 0,
      amountMinor: 200,
    },
  } as unknown as VoucherRecord;

  const values = getTopupRecordValues(voucher);

  assertEqual(values.principalMinor, 0);
});

console.log(
  '\nAll 4 Topup record value compatibility tests passed successfully.'
);
