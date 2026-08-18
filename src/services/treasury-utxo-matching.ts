import type { TreasuryFundingPreviewSelectedUtxo } from 'src/types/treasury-funding';

interface TreasuryInputDirectiveOutpoint {
  outpointTransactionHash: Uint8Array;
  outpointIndex: number;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normaliseTransactionId(value: string): string {
  return value.trim().toLowerCase();
}

export function reverseTransactionIdByteOrder(transactionId: string): string {
  const normalised = normaliseTransactionId(transactionId);

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    return '';
  }

  const bytes = normalised.match(/.{2}/g);

  if (!bytes) {
    return '';
  }

  return bytes.reverse().join('');
}

/**
 * Get the exact treasury child-wallet indexes required to sign the selected
 * UTXOs.
 *
 * New funding previews must preserve this provenance.
 *
 * Historical previews may not contain it; those fail closed rather than
 * guessing which private key owns an input.
 */
export function getSelectedTreasuryDerivationIndexes(
  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[]
): number[] {
  const derivationIndexes = selectedUtxos.map((utxo) => {
    const derivationIndex = utxo.derivationIndex;

    if (
      !Number.isInteger(derivationIndex) ||
      derivationIndex === undefined ||
      derivationIndex < 0
    ) {
      throw new Error(
        'Selected treasury UTXO is missing valid derivation-index provenance.'
      );
    }

    return derivationIndex;
  });

  return [...new Set(derivationIndexes)].sort((a, b) => a - b);
}

/**
 * Match one treasury UTXO against one signable wallet directive.
 *
 * Both direct and reversed transaction-hash representations are accepted at
 * this comparison boundary only. The directive itself is never modified.
 */
export function doesTreasuryInputDirectiveMatchSelectedUtxo(
  selectedUtxo: TreasuryFundingPreviewSelectedUtxo,
  inputDirective: TreasuryInputDirectiveOutpoint
): boolean {
  if (selectedUtxo.outpointIndex !== inputDirective.outpointIndex) {
    return false;
  }

  const selectedTransactionId = normaliseTransactionId(
    selectedUtxo.outpointTransactionHash
  );

  const directiveTransactionId = bytesToHex(
    inputDirective.outpointTransactionHash
  ).toLowerCase();

  const reversedDirectiveTransactionId = reverseTransactionIdByteOrder(
    directiveTransactionId
  );

  return (
    selectedTransactionId === directiveTransactionId ||
    selectedTransactionId === reversedDirectiveTransactionId
  );
}
