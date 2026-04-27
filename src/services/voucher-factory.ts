import type { VoucherRecord } from 'src/types/voucher';

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
  fiatCurrency = 'GBP'
): VoucherRecord {
  const now = new Date().toISOString();

  return {
    id: createVoucherId(),
    serial: createVoucherSerial(),

    createdAt: now,
    updatedAt: now,

    fiatCurrency,
    fiatAmountMinor,

    // Phase 1/2 placeholder values.
    // These will be replaced by real pricing and fee calculations later.
    marketBchSats: 0,
    fee: {
      type: 'percentage',
      basisPoints: 1000,
      amountMinor: 0,
      description: 'Initial MVP placeholder fee',
    },
    finalBchSats: 0,

    quote: {
      source: 'unknown',
      fiatCurrency,
      marketRate: 0,
      marketRateTimestamp: now,
      isFallbackQuote: false,
    },

    // Phase 1/2 placeholder values.
    // Real derivation index and address are added in Phase 3.
    derivationIndex: -1,
    address: '',

    status: 'draft',
  };
}
