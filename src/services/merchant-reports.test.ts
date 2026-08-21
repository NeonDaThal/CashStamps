import { strict as assert } from 'assert';

import type { VoucherRecord } from 'src/types/voucher';
import { buildMerchantReport } from './merchant-reports';

interface MerchantReportTest {
  name: string;
  run: () => void;
}

type TestNetworkFeeStatus =
  | 'final'
  | 'estimated'
  | 'not_calculated'
  | 'missing';

const REPORT_NOW = new Date('2026-08-15T12:00:00.000Z');

const RECORD_DATE = '2026-08-14T10:00:00.000Z';

function createTopupV1Voucher(options?: {
  id?: string;
  status?: VoucherRecord['status'];
  networkFeeStatus?: TestNetworkFeeStatus;
  networkFeeSats?: number;
  fundingIntentActualFeeSats?: number;
}): VoucherRecord {
  const networkFeeStatus = options?.networkFeeStatus ?? 'final';

  const networkFeeSats = options?.networkFeeSats ?? 437;

  const feeModel: Record<string, unknown> = {
    version: 'topup_v1',

    principalMinor: 2_000,
    serviceFeeMinor: 200,

    merchantFeeMinor: 100,
    platformFeeMinor: 100,

    customerTotalMinor: 2_200,
  };

  if (networkFeeStatus === 'final') {
    feeModel.networkFee = {
      status: 'final',
      feeSats: networkFeeSats,
      recoveryMinor: 0,
    };
  } else if (networkFeeStatus === 'estimated') {
    feeModel.networkFee = {
      status: 'estimated',
      feeSats: networkFeeSats,
    };

    delete feeModel.customerTotalMinor;
  } else if (networkFeeStatus === 'not_calculated') {
    feeModel.networkFee = {
      status: 'not_calculated',
    };

    delete feeModel.customerTotalMinor;
  }

  const voucher: Record<string, unknown> = {
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

    feeModel,

    derivationIndex: 1,
    address: 'bitcoincash:test-v1-address',

    status: options?.status ?? 'printed',
  };

  if (options?.fundingIntentActualFeeSats !== undefined) {
    voucher.fundingIntent = {
      actualFeeSats: options.fundingIntentActualFeeSats,
    };
  }

  return voucher as unknown as VoucherRecord;
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
    name: 'Topup v1 reports commercial values and actual miner fee separately',
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

      assert.equal(totals.actualMinerFeeSats, 437);

      assert.equal(totals.estimatedMinerFeeSats, 0);

      assert.equal(totals.finalMinerFeeCount, 1);

      assert.equal(totals.estimatedMinerFeeCount, 0);

      assert.equal(totals.networkFeeNotCalculatedCount, 0);

      assert.equal(totals.networkFeeUnknownCount, 0);

      assert.equal(totals.customerNetworkFeeRecoveryMinor, 0);

      assert.equal(totals.customerNetworkFeeRecoveryKnownCount, 1);

      assert.equal(totals.averageOrderValueMinor, 2_000);

      // Compatibility aliases retain their B4 meanings.
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

      assert.equal(report.current.overall.topupActualMinerFeeSats, 437);

      assert.equal(report.current.overall.topupEstimatedMinerFeeSats, 0);

      assert.equal(report.current.overall.topupFinalMinerFeeCount, 1);

      assert.equal(report.current.overall.topupEstimatedMinerFeeCount, 0);

      assert.equal(report.current.overall.topupNetworkFeeNotCalculatedCount, 0);

      assert.equal(report.current.overall.topupNetworkFeeUnknownCount, 0);

      assert.equal(
        report.current.overall.topupCustomerNetworkFeeRecoveryMinor,
        0
      );

      assert.equal(
        report.current.overall.topupCustomerNetworkFeeRecoveryKnownCount,
        1
      );

      /**
       * Miner fee remains a BCH treasury operating cost.
       * It does not alter fiat report revenue/movement.
       */
      assert.equal(report.current.overall.grossFiatMovementMinor, 2_200);

      assert.equal(report.current.overall.netFiatMovementMinor, 2_000);

      assert.equal(report.current.overall.serviceFeeMinor, 200);

      const activity = report.current.activityItems[0];

      assert.equal(activity?.networkFeeStatus, 'final');

      assert.equal(activity?.actualMinerFeeSats, 437);

      assert.equal(activity?.estimatedMinerFeeSats, undefined);

      assert.equal(activity?.customerNetworkFeeRecoveryMinor, 0);
    },
  },

  {
    name: 'legacy Topup preserves historical values and reports miner fee as unknown',
    run: () => {
      const report = buildReport([createLegacyVoucher()]);

      const totals = report.current.vouchers;

      assert.equal(totals.customerCashCollectedMinor, 600);

      assert.equal(totals.principalMinor, 540);

      assert.equal(totals.serviceFeeMinor, 60);

      assert.equal(totals.merchantFeeRevenueMinor, 0);

      assert.equal(totals.platformFeeMinor, 0);

      assert.equal(totals.feeSplitUnknownCount, 1);

      assert.equal(totals.actualMinerFeeSats, 0);

      assert.equal(totals.estimatedMinerFeeSats, 0);

      assert.equal(totals.finalMinerFeeCount, 0);

      assert.equal(totals.estimatedMinerFeeCount, 0);

      assert.equal(totals.networkFeeNotCalculatedCount, 0);

      assert.equal(totals.networkFeeUnknownCount, 1);

      assert.equal(totals.customerNetworkFeeRecoveryMinor, 0);

      assert.equal(totals.customerNetworkFeeRecoveryKnownCount, 0);

      assert.equal(totals.averageOrderValueMinor, 540);

      const activity = report.current.activityItems[0];

      assert.equal(activity?.fiatAmountMinor, 600);

      assert.equal(activity?.principalMinor, 540);

      assert.equal(activity?.feeAmountMinor, 60);

      assert.equal(activity?.feeSplitKnown, false);

      assert.equal(activity?.networkFeeStatus, 'unknown');

      assert.equal(activity?.actualMinerFeeSats, undefined);

      assert.equal(activity?.estimatedMinerFeeSats, undefined);

      assert.equal(activity?.customerNetworkFeeRecoveryMinor, undefined);

      assert.equal(activity?.merchantFeeAmountMinor, undefined);

      assert.equal(activity?.platformFeeAmountMinor, undefined);
    },
  },

  {
    name: 'mixed legacy and v1 Topups aggregate without inventing historical miner fees',
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

      // £2.00 + historical £0.60 service fee.
      assert.equal(totals.serviceFeeMinor, 260);

      // Only the v1 split is explicitly known.
      assert.equal(totals.merchantFeeRevenueMinor, 100);

      assert.equal(totals.platformFeeMinor, 100);

      assert.equal(totals.feeSplitUnknownCount, 1);

      /**
       * Only the v1 record has a trustworthy final miner fee.
       */
      assert.equal(totals.actualMinerFeeSats, 437);

      assert.equal(totals.estimatedMinerFeeSats, 0);

      assert.equal(totals.finalMinerFeeCount, 1);

      assert.equal(totals.estimatedMinerFeeCount, 0);

      assert.equal(totals.networkFeeUnknownCount, 1);

      assert.equal(totals.customerNetworkFeeRecoveryKnownCount, 1);

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

      assert.equal(gbp.voucherActualMinerFeeSats, 437);

      assert.equal(gbp.voucherEstimatedMinerFeeSats, 0);

      assert.equal(gbp.voucherFinalMinerFeeCount, 1);

      assert.equal(gbp.voucherEstimatedMinerFeeCount, 0);

      assert.equal(gbp.voucherNetworkFeeUnknownCount, 1);

      assert.equal(gbp.voucherCustomerNetworkFeeRecoveryKnownCount, 1);
    },
  },

  {
    name: 'estimated miner fee remains separate from actual merchant cost',
    run: () => {
      const report = buildReport([
        createTopupV1Voucher({
          id: 'estimated-fee-voucher',
          networkFeeStatus: 'estimated',
          networkFeeSats: 500,
        }),
      ]);

      const totals = report.current.vouchers;

      assert.equal(totals.actualMinerFeeSats, 0);

      assert.equal(totals.estimatedMinerFeeSats, 500);

      assert.equal(totals.finalMinerFeeCount, 0);

      assert.equal(totals.estimatedMinerFeeCount, 1);

      assert.equal(totals.networkFeeNotCalculatedCount, 0);

      assert.equal(totals.networkFeeUnknownCount, 0);

      assert.equal(totals.customerNetworkFeeRecoveryKnownCount, 0);

      const activity = report.current.activityItems[0];

      assert.equal(activity?.networkFeeStatus, 'estimated');

      assert.equal(activity?.actualMinerFeeSats, undefined);

      assert.equal(activity?.estimatedMinerFeeSats, 500);

      assert.equal(activity?.customerNetworkFeeRecoveryMinor, undefined);
    },
  },

  {
    name: 'not-calculated miner fee remains distinct from unknown historical fee',
    run: () => {
      const report = buildReport([
        createTopupV1Voucher({
          id: 'not-calculated-voucher',
          networkFeeStatus: 'not_calculated',
        }),
      ]);

      const totals = report.current.vouchers;

      assert.equal(totals.actualMinerFeeSats, 0);

      assert.equal(totals.estimatedMinerFeeSats, 0);

      assert.equal(totals.finalMinerFeeCount, 0);

      assert.equal(totals.estimatedMinerFeeCount, 0);

      assert.equal(totals.networkFeeNotCalculatedCount, 1);

      assert.equal(totals.networkFeeUnknownCount, 0);

      assert.equal(totals.customerNetworkFeeRecoveryKnownCount, 0);

      const activity = report.current.activityItems[0];

      assert.equal(activity?.networkFeeStatus, 'not_calculated');
    },
  },

  {
    name: 'B5.5 record uses durable funding-intent actual fee instead of stale estimate',
    run: () => {
      const report = buildReport([
        createTopupV1Voucher({
          id: 'b5-5-voucher',

          networkFeeStatus: 'estimated',

          networkFeeSats: 500,

          fundingIntentActualFeeSats: 431,
        }),
      ]);

      const totals = report.current.vouchers;

      assert.equal(totals.actualMinerFeeSats, 431);

      assert.equal(totals.estimatedMinerFeeSats, 0);

      assert.equal(totals.finalMinerFeeCount, 1);

      assert.equal(totals.estimatedMinerFeeCount, 0);

      assert.equal(totals.networkFeeUnknownCount, 0);

      assert.equal(totals.customerNetworkFeeRecoveryMinor, 0);

      assert.equal(totals.customerNetworkFeeRecoveryKnownCount, 1);

      const activity = report.current.activityItems[0];

      assert.equal(activity?.networkFeeStatus, 'final');

      assert.equal(activity?.actualMinerFeeSats, 431);

      assert.equal(activity?.estimatedMinerFeeSats, undefined);

      assert.equal(activity?.customerNetworkFeeRecoveryMinor, 0);
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

      assert.equal(report.current.vouchers.actualMinerFeeSats, 437);

      assert.equal(report.current.vouchers.finalMinerFeeCount, 1);

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
