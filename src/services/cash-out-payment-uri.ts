const SATS_PER_BCH = 100_000_000;

export interface CashOutPaymentUriRequest {
  address: string;
  requiredSats: number;
  label?: string;
  message?: string;
}

export interface CashOutPaymentUri {
  address: string;
  uri: string;
  createdAt: string;
}

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value?: string
): void {
  if (value === undefined || value === null || value === '') {
    return;
  }

  params.set(key, value);
}

/**
 * Convert exact integer satoshis into a decimal BCH amount suitable for a BCH
 * payment URI.
 *
 * This deliberately avoids:
 *
 * - floating-point BCH arithmetic;
 * - toFixed() -> Number conversions;
 * - scientific notation.
 */
export function formatCashOutSatsAsBchUriAmount(sats: number): string {
  if (!Number.isSafeInteger(sats) || sats <= 0) {
    throw new Error(
      'Cash-out payment amount must be a positive integer number of satoshis.'
    );
  }

  const wholeBch = Math.floor(sats / SATS_PER_BCH);

  const fractionalSats = sats % SATS_PER_BCH;

  if (fractionalSats === 0) {
    return String(wholeBch);
  }

  const fraction = String(fractionalSats).padStart(8, '0').replace(/0+$/, '');

  return `${wholeBch}.${fraction}`;
}

export function createCashOutPaymentUri(
  request: CashOutPaymentUriRequest
): CashOutPaymentUri {
  const address = request.address.trim();

  if (!address) {
    throw new Error('Cash-out receiving address is required.');
  }

  const amount = formatCashOutSatsAsBchUriAmount(request.requiredSats);

  const params = new URLSearchParams();

  appendQueryParam(params, 'amount', amount);

  appendQueryParam(params, 'label', request.label);

  appendQueryParam(params, 'message', request.message);

  const query = params.toString();

  return {
    address,

    uri: query ? `${address}?${query}` : address,

    createdAt: new Date().toISOString(),
  };
}
