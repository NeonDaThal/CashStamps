import { PLATFORM_FEE_ADDRESS } from 'src/services/platform-fee-config';

import type { CashOutSettlementP2pkhDestination } from 'src/types/cash-out-settlement';

import { Address } from 'src/utils/address';

export interface ResolveCashOutSettlementDestinationsInput {
  treasuryAddress: string;

  /**
   * Test/runtime override only.
   *
   * Production callers normally omit this so the configured platform
   * destination is used.
   */
  platformAddress?: string;
}

export interface CashOutSettlementDestinations {
  treasuryDestination: CashOutSettlementP2pkhDestination;

  platformDestination: CashOutSettlementP2pkhDestination;
}

function requireMainnetP2pkhDestination(
  address: string,
  fieldName: string
): CashOutSettlementP2pkhDestination {
  const normalized = address.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  /**
   * Cash-out settlement v1 is mainnet-only.
   *
   * Do not silently accept:
   *
   * - testnet/regtest CashAddr;
   * - legacy addresses whose network version could otherwise be lost during
   *   normalization;
   * - prefixless values.
   *
   * Both the Treasury wallet and configured production platform address are
   * already generated/stored as full mainnet CashAddr values.
   */
  if (!normalized.toLowerCase().startsWith('bitcoincash:')) {
    throw new Error(
      `${fieldName} must be a full Bitcoin Cash mainnet CashAddr.`
    );
  }

  let decoded: Address;

  try {
    decoded = Address.fromCashAddr(normalized);
  } catch (error) {
    throw new Error(
      `${fieldName} is not a valid Bitcoin Cash mainnet CashAddr: ${
        error instanceof Error ? error.message : 'address decoding failed'
      }`
    );
  }

  if (decoded.type() !== 'P2PKH') {
    throw new Error(`${fieldName} must be a P2PKH address.`);
  }

  const publicKeyHashHex = decoded.toHash160Hex().toLowerCase();

  if (!/^[0-9a-f]{40}$/.test(publicKeyHashHex)) {
    throw new Error(
      `${fieldName} did not decode to an exact 20-byte public-key hash.`
    );
  }

  /**
   * Always persist/compare the canonical mainnet representation rather than
   * whichever capitalization was supplied by the caller.
   */
  const canonicalAddress = decoded.toCashAddr('bitcoincash');

  return {
    address: canonicalAddress,

    publicKeyHashHex,
  };
}

export function resolveCashOutSettlementDestinations(
  input: ResolveCashOutSettlementDestinationsInput
): CashOutSettlementDestinations {
  const treasuryDestination = requireMainnetP2pkhDestination(
    input.treasuryAddress,
    'Treasury settlement address'
  );

  const platformDestination = requireMainnetP2pkhDestination(
    input.platformAddress ?? PLATFORM_FEE_ADDRESS,
    'Platform settlement address'
  );

  if (
    treasuryDestination.publicKeyHashHex ===
    platformDestination.publicKeyHashHex
  ) {
    throw new Error(
      'Treasury and platform settlement destinations must be different.'
    );
  }

  return {
    treasuryDestination,

    platformDestination,
  };
}
