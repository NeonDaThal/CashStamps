import { strict as assert } from 'assert';

import type { VoucherRecord } from 'src/types/voucher';
import { buildMerchantReport } from './merchant-reports';

interface MerchantReportTest {
  name: string;
  run: () => void;
}

const REPORT_NOW = new Date('2026-08-15T12:00:00.000Z');
const RECORD_DATE = '2026-08-14T10:00:00.000Z';

function createTopupV1Voucher(options?: {
  id?: string;
  status?: VoucherRecord['status'];
}): VoucherRecord {
  return {
    id: options?.id ?? 'voucher-v1',
    serial: 'TOPUP-V1',
    createdAt: RECORD_DATE,
    updatedAt: RECORD_DATE,
    printedAt: RECORD_DATE,

    fiatCurrency: 'GBP',

    // Compatibility field = actual customer cash collected.
    fiatAmountMinor: 2_200,

    marketBchSats: 20_000_000,
    finalBchSats: 20_000_000,

    fee: {
      type: 'percentage',
      basisPoints: 1_000,
      amountMinor: 200,
    },

    feeModel: {
      version: 'topup_v1',

      principalMinor: 2_000,
      serviceFeeMinor: 200,

      merchantFeeMinor: 100,
      platformFeeMinor: 100,
    },

    derivationIndex: 1,
    address: 'bitcoincash:test-v1-address',

    status: options?.status ?? 'printed',
  } as unknown as VoucherRecord;
}

function createLegacyVoucher(): VoucherRecord {
  return {
    id: 'voucher-legacy',
    serial: 'TOPUP-LEGACY',
    createdAt: RECORD_DATE,
    updatedAt: RECORD_DATE,
    printedAt: RECORD_DATE,

    fiatCurrency: 'GBP',

    // Historical customer cash collected.
    fiatAmountMinor: 600,

    marketBchSats: 6_000_000,

    // Historical subtractive model loaded £5.40 of BCH.
    finalBchSats: 5_400_000,

    fee: {
      type: 'percentage',
      basisPoints: 1_000,
      amountMinor: 60,
    },

    derivationIndex: 2,
    address: 'bitcoincash:test-legacy-address',

    status: 'printed',
  } as unknown as VoucherRecord;
}

function buildReport(voucherRecords: VoucherRecord[]) {
  return buildMerchantReport({
    range: 'all_time',
    now: REPORT_NOW,
    voucherRecords,
    cashOutRecords: [],
  });
}

const tests: MerchantReportTest[] = [
  {
    name: 'Topup v1 reports customer cash, principal, service fee and explicit split separately',
    run: () => {
      const report = buildReport([createTopupV1Voucher()]);

      const totals = report.current.vouchers;

      assert.equal(totals.count, 1);

      assert.equal(totals.customerCashCollectedMinor, 2_200);
      assert.equal(totals.principalMinor, 2_000);
      assert.equal(totals.serviceFeeMinor, 200);

      assert.equal(totals.merchantFeeRevenueMinor, 100);
      assert.equal(totals.platformFeeMinor, 100);
      assert.equal(totals.feeSplitUnknownCount, 0);

      assert.equal(totals.averageOrderValueMinor, 2_000);

      // Compatibility aliases retain their defined B4a meanings.
      assert.equal(totals.grossFiatRevenueMinor, 2_200);
      assert.equal(totals.netFiatRevenueMinor, 2_000);
      assert.equal(totals.feeRevenueMinor, 200);

      assert.equal(
        report.current.overall.topupCustomerCashCollectedMinor,
        2_200
      );
      assert.equal(report.current.overall.topupPrincipalMinor, 2_000);
      assert.equal(report.current.overall.topupServiceFeeMinor, 200);
      assert.equal(report.current.overall.topupMerchantFeeRevenueMinor, 100);
      assert.equal(report.current.overall.topupPlatformFeeMinor, 100);

      assert.equal(report.current.overall.grossFiatMovementMinor, 2_200);
      assert.equal(report.current.overall.netFiatMovementMinor, 2_000);
      assert.equal(report.current.overall.serviceFeeMinor, 200);
    },
  },

  {
    name: 'legacy Topup preserves historical subtractive values without inventing a fee split',
    run: () => {
      const report = buildReport([createLegacyVoucher()]);

      const totals = report.current.vouchers;

      assert.equal(totals.customerCashCollectedMinor, 600);
      assert.equal(totals.principalMinor, 540);
      assert.equal(totals.serviceFeeMinor, 60);

      assert.equal(totals.merchantFeeRevenueMinor, 0);
      assert.equal(totals.platformFeeMinor, 0);
      assert.equal(totals.feeSplitUnknownCount, 1);

      assert.equal(totals.averageOrderValueMinor, 540);

      const activity = report.current.activityItems[0];

      assert.equal(activity?.fiatAmountMinor, 600);
      assert.equal(activity?.principalMinor, 540);
      assert.equal(activity?.feeAmountMinor, 60);
      assert.equal(activity?.feeSplitKnown, false);

      assert.equal(activity?.merchantFeeAmountMinor, undefined);
      assert.equal(activity?.platformFeeAmountMinor, undefined);
    },
  },

  {
    name: 'mixed legacy and v1 Topups aggregate without recalculating historical records',
    run: () => {
      const report = buildReport([
        createTopupV1Voucher(),
        createLegacyVoucher(),
      ]);

      const totals = report.current.vouchers;

      assert.equal(totals.count, 2);

      // £22.00 + £6.00 customer cash.
      assert.equal(totals.customerCashCollectedMinor, 2_800);

      // £20.00 + historical £5.40 value loaded.
      assert.equal(totals.principalMinor, 2_540);

      // £2.00 + historical £0.60 fee.
      assert.equal(totals.serviceFeeMinor, 260);

      // Only the v1 split is explicitly known.
      assert.equal(totals.merchantFeeRevenueMinor, 100);
      assert.equal(totals.platformFeeMinor, 100);
      assert.equal(totals.feeSplitUnknownCount, 1);

      // (£20.00 + £5.40) / 2.
      assert.equal(totals.averageOrderValueMinor, 1_270);

      const gbp = report.current.currencyTotals.find(
        (item) => item.currency === 'GBP'
      );

      assert.ok(gbp);

      assert.equal(gbp.voucherCustomerCashCollectedMinor, 2_800);
      assert.equal(gbp.voucherPrincipalMinor, 2_540);
      assert.equal(gbp.voucherServiceFeeMinor, 260);
      assert.equal(gbp.voucherMerchantFeeRevenueMinor, 100);
      assert.equal(gbp.voucherPlatformFeeMinor, 100);
      assert.equal(gbp.voucherFeeSplitUnknownCount, 1);
    },
  },

  {
    name: 'draft Topups remain excluded from merchant report accounting',
    run: () => {
      const completedVoucher = createTopupV1Voucher({
        id: 'completed-voucher',
        status: 'printed',
      });

      const draftVoucher = createTopupV1Voucher({
        id: 'draft-voucher',
        status: 'draft',
      });

      const report = buildReport([completedVoucher, draftVoucher]);

      assert.equal(report.current.vouchers.count, 1);
      assert.equal(report.current.vouchers.principalMinor, 2_000);

      assert.equal(report.sourceRecordCounts.vouchersLoaded, 2);
      assert.equal(report.sourceRecordCounts.reportableVouchers, 1);
    },
  },
];

let passedTests = 0;

for (const test of tests) {
  try {
    test.run();

    passedTests += 1;

    console.log(`✓ ${test.name}`);
  } catch (error) {
    console.error(`✗ ${test.name}`);

    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error(
    `\n${passedTests}/${tests.length} Merchant Report accounting tests passed.`
  );
} else {
  console.log(
    `\nAll ${passedTests} Merchant Report accounting tests passed successfully.`
  );
}
