import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type { VoucherFundingIntent } from 'src/types/voucher';

function createFallbackOperationId(): string {
  return `topup-issue-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createTopupIssueOperationId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `topup-issue-${globalThis.crypto.randomUUID()}`;
  }

  return createFallbackOperationId();
}

function requireNonNegativeSafeInteger(
  value: number | undefined,
  fieldName: string
): number {
  if (!Number.isSafeInteger(value) || (value ?? -1) < 0) {
    throw new Error(
      `${fieldName} is missing or is not a non-negative safe integer.`
    );
  }

  return value as number;
}

function requirePositiveSafeInteger(
  value: number | undefined,
  fieldName: string
): number {
  if (!Number.isSafeInteger(value) || (value ?? 0) <= 0) {
    throw new Error(
      `${fieldName} is missing or is not a positive safe integer.`
    );
  }

  return value as number;
}

function requireTransactionId(value: string | undefined): string {
  const normalisedValue = value?.trim().toLowerCase() ?? '';

  if (!/^[0-9a-f]{64}$/.test(normalisedValue)) {
    throw new Error(
      'Deterministic funding transaction ID is missing or invalid.'
    );
  }

  return normalisedValue;
}

/**
 * Convert a successfully-created signed treasury draft into the durable
 * funding intent stored with the voucher before any broadcast attempt.
 */
export function createVoucherFundingIntentFromDraft(
  operationId: string,
  draft: TreasuryTransactionDraft
): VoucherFundingIntent {
  if (!operationId.trim()) {
    throw new Error('Topup issue operation ID is missing.');
  }

  if (draft.status !== 'created') {
    throw new Error(
      draft.errorMessage ??
        'Treasury transaction draft was not successfully created.'
    );
  }

  if (!draft.rawTransactionHex?.trim()) {
    throw new Error('Signed transaction hex is missing.');
  }

  /**
   * B5.5 safety boundary:
   *
   * A new durable funding intent may not exist without the deterministic
   * transaction identity of its exact signed raw transaction.
   */
  const txid = requireTransactionId(draft.txid);

  const actualFeeSats = requireNonNegativeSafeInteger(
    draft.actualFeeSats,
    'Actual miner fee'
  );

  const actualChangeSats = requireNonNegativeSafeInteger(
    draft.actualChangeSats,
    'Actual treasury change'
  );

  const dustChangeAbsorbedSats = requireNonNegativeSafeInteger(
    draft.dustChangeAbsorbedSats ?? 0,
    'Dust change absorbed'
  );

  const inputCount = requirePositiveSafeInteger(
    draft.inputCount,
    'Transaction input count'
  );

  const outputCount = requirePositiveSafeInteger(
    draft.outputCount,
    'Transaction output count'
  );

  return {
    operationId,
    status: 'prepared',

    rawTransactionHex: draft.rawTransactionHex,

    txid,

    actualFeeSats,
    actualChangeSats,
    dustChangeAbsorbedSats,

    inputCount,
    outputCount,

    preparedAt: draft.createdAt,
  };
}
