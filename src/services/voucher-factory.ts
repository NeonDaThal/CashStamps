import type { VoucherRecord } from 'src/types/voucher';
import type { FakeVoucherPricingQuote } from 'src/services/voucher-pricing';

function createVoucherId(): string {
  return `voucher-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createVoucherSerial(): string {
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');

  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `BCHV-${datePart}-${randomPart}`;
}

export function createDraftVoucherRecord(
  fiatAmountMinor: number,
  fiatCurrency = 'GBP',
  pricing?: FakeVoucherPricingQuote
): VoucherRecord {
  const now = new Date().toISOString();

  return {
    id: createVoucherId(),
    serial: createVoucherSerial(),

    createdAt: now,
    updatedAt: now,

    fiatCurrency,
    fiatAmountMinor,

    // Phase 2 placeholder values.
    // These will become real BCH satoshi values in Phase 3.
    marketBchSats: 0,
    fee: {
      type: 'percentage',
      basisPoints: pricing?.serviceFeeBasisPoints ?? 1000,
      amountMinor: pricing?.serviceFeeAmountMinor ?? 0,
      description: 'Phase 2 placeholder service fee',
    },
    finalBchSats: 0,

    quote: {
      source: pricing ? 'manual' : 'unknown',
      fiatCurrency,
      marketRate: 0,
      marketRateTimestamp: pricing?.quoteTimestamp ?? now,
      quoteLockedAt: pricing?.quoteTimestamp,
      isFallbackQuote: false,
    },

    // Phase 1/2 placeholder values.
    // Real derivation index and address are added in Phase 3.
    derivationIndex: -1,
    address: '',

    status: 'draft',
  };
}
