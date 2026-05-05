import type {
  TreasuryTopUpRequest,
  TreasuryTopUpUri,
} from 'src/types/treasury-topup';

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value?: string | number
): void {
  if (value === undefined || value === null || value === '') {
    return;
  }

  params.set(key, String(value));
}

export function createTreasuryTopUpUri(
  request: TreasuryTopUpRequest
): TreasuryTopUpUri {
  const address = request.address.trim();

  if (!address) {
    throw new Error('Treasury address is required.');
  }

  const params = new URLSearchParams();

  appendQueryParam(params, 'amount', request.amountBch);
  appendQueryParam(params, 'label', request.label);
  appendQueryParam(params, 'message', request.message);

  const query = params.toString();

  return {
    address,
    uri: query ? `${address}?${query}` : address,
    createdAt: new Date().toISOString(),
  };
}
