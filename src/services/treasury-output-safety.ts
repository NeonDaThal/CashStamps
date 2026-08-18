/**
 * Conservative standard relay floor for the P2PKH outputs used by the current
 * Topup funding flow.
 *
 * This is a relay-policy safety threshold, not a BCH consensus minimum.
 */
export const STANDARD_P2PKH_DUST_LIMIT_SATS = 546;

export interface TreasuryChangeAllocation {
  isAffordable: boolean;

  minimumFeeSats: number;
  finalFeeSats: number;

  changeSats: number;
  dustChangeAbsorbedSats: number;
}

function assertNonNegativeSafeInteger(value: number, fieldName: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      `${fieldName} must be a non-negative safe integer in satoshis.`
    );
  }
}

export function isAtOrAboveStandardP2pkhDustLimit(valueSats: number): boolean {
  return (
    Number.isSafeInteger(valueSats) &&
    valueSats >= STANDARD_P2PKH_DUST_LIMIT_SATS
  );
}

/**
 * Allocate treasury remainder after non-change outputs and the required miner
 * fee.
 *
 * A positive remainder below the standard dust floor is absorbed into the
 * miner fee instead of creating a dust change output.
 */
export function createTreasuryChangeAllocation(input: {
  selectedInputSats: number;
  nonChangeOutputSats: number;
  minimumFeeSats: number;
}): TreasuryChangeAllocation {
  assertNonNegativeSafeInteger(input.selectedInputSats, 'Selected input total');

  assertNonNegativeSafeInteger(
    input.nonChangeOutputSats,
    'Non-change output total'
  );

  assertNonNegativeSafeInteger(input.minimumFeeSats, 'Minimum miner fee');

  const remainderSats =
    input.selectedInputSats - input.nonChangeOutputSats - input.minimumFeeSats;

  if (remainderSats < 0) {
    return {
      isAffordable: false,
      minimumFeeSats: input.minimumFeeSats,
      finalFeeSats: input.minimumFeeSats,
      changeSats: 0,
      dustChangeAbsorbedSats: 0,
    };
  }

  if (remainderSats > 0 && remainderSats < STANDARD_P2PKH_DUST_LIMIT_SATS) {
    return {
      isAffordable: true,
      minimumFeeSats: input.minimumFeeSats,
      finalFeeSats: input.minimumFeeSats + remainderSats,
      changeSats: 0,
      dustChangeAbsorbedSats: remainderSats,
    };
  }

  return {
    isAffordable: true,
    minimumFeeSats: input.minimumFeeSats,
    finalFeeSats: input.minimumFeeSats,
    changeSats: remainderSats,
    dustChangeAbsorbedSats: 0,
  };
}
