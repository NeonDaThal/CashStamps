import { del, get, set } from 'idb-keyval';

import type { VoucherQuote } from 'src/types/voucher';

const LAST_GOOD_QUOTES_KEY = 'bch-voucher-last-good-quotes';

export type LastGoodQuoteMap = Record<string, VoucherQuote>;

function getQuoteKey(fiatCurrency: string): string {
  return fiatCurrency.toUpperCase();
}

export async function getLastGoodQuotes(): Promise<LastGoodQuoteMap> {
  const quotes = await get<LastGoodQuoteMap>(LAST_GOOD_QUOTES_KEY);

  return quotes && typeof quotes === 'object' ? quotes : {};
}

export async function getLastGoodQuote(
  fiatCurrency: string
): Promise<VoucherQuote | undefined> {
  const quotes = await getLastGoodQuotes();

  return quotes[getQuoteKey(fiatCurrency)];
}

export async function saveLastGoodQuote(quote: VoucherQuote): Promise<void> {
  const quotes = await getLastGoodQuotes();

  const updatedQuotes: LastGoodQuoteMap = {
    ...quotes,
    [getQuoteKey(quote.fiatCurrency)]: quote,
  };

  await set(LAST_GOOD_QUOTES_KEY, updatedQuotes);
}

export async function clearLastGoodQuotes(): Promise<void> {
  await del(LAST_GOOD_QUOTES_KEY);
}
