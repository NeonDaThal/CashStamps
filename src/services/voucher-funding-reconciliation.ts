import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';
import type { VoucherRecord } from 'src/types/voucher';

function normaliseTransactionId(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalised = value.trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalised)) {
    return undefined;
  }

  return normalised;
}

function cloneReconciliation(
  reconciliation: TreasuryBroadcastReconciliationResult
): TreasuryBroadcastReconciliationResult {
  return {
    ...reconciliation,

    serverChecks: reconciliation.serverChecks.map((serverCheck) => ({
      ...serverCheck,
    })),
  };
}

function getReconciliationStrength(
  reconciliation: TreasuryBroadcastReconciliationResult
): number {
  switch (reconciliation.status) {
    case 'confirmed':
      return 4;

    case 'mempool':
      return 3;

    case 'unknown':
      return 2;

    case 'unavailable':
      return 1;
  }
}

/**
 * Preserve the strongest network evidence ever obtained for this transaction.
 *
 * Evidence may upgrade:
 *
 * unavailable -> unknown -> mempool -> confirmed
 *
 * It must never downgrade.
 */
function selectStrongestReconciliation(
  existing: TreasuryBroadcastReconciliationResult | undefined,
  incoming: TreasuryBroadcastReconciliationResult
): TreasuryBroadcastReconciliationResult {
  if (!existing) {
    return incoming;
  }

  if (
    getReconciliationStrength(existing) > getReconciliationStrength(incoming)
  ) {
    return existing;
  }

  return incoming;
}

/**
 * Apply read-only network reconciliation evidence to one VoucherRecord.
 *
 * Safety rules:
 *
 * - reconciliation must refer to the exact txid in the durable funding intent
 * - existing funding/broadcast txids may not conflict
 * - positive evidence is monotonic
 * - mempool or confirmed proves the exact transaction is on the BCH network
 * - unknown/unavailable never authorises creation of a replacement transaction
 */
export function applyVoucherFundingReconciliation(
  record: VoucherRecord,
  reconciliation: TreasuryBroadcastReconciliationResult
): VoucherRecord {
  const fundingIntentTxid = normaliseTransactionId(record.fundingIntent?.txid);

  if (!fundingIntentTxid) {
    throw new Error(
      'Voucher does not contain a valid durable funding transaction ID.'
    );
  }

  const reconciliationTxid = normaliseTransactionId(reconciliation.txid);

  if (!reconciliationTxid) {
    throw new Error(
      'Funding reconciliation does not contain a valid transaction ID.'
    );
  }

  if (reconciliationTxid !== fundingIntentTxid) {
    throw new Error(
      'Funding reconciliation transaction ID does not match the durable funding intent.'
    );
  }

  if (record.fundingTxid) {
    const existingFundingTxid = normaliseTransactionId(record.fundingTxid);

    if (!existingFundingTxid || existingFundingTxid !== fundingIntentTxid) {
      throw new Error(
        'Existing voucher funding transaction ID conflicts with the durable funding intent.'
      );
    }
  }

  if (record.fundingBroadcast?.txid) {
    const existingBroadcastTxid = normaliseTransactionId(
      record.fundingBroadcast.txid
    );

    if (!existingBroadcastTxid || existingBroadcastTxid !== fundingIntentTxid) {
      throw new Error(
        'Existing broadcast transaction ID conflicts with the durable funding intent.'
      );
    }
  }

  if (record.fundingReconciliation) {
    const existingReconciliationTxid = normaliseTransactionId(
      record.fundingReconciliation.txid
    );

    if (
      !existingReconciliationTxid ||
      existingReconciliationTxid !== fundingIntentTxid
    ) {
      throw new Error(
        'Existing reconciliation transaction ID conflicts with the durable funding intent.'
      );
    }
  }

  const strongestReconciliation = selectStrongestReconciliation(
    record.fundingReconciliation,
    reconciliation
  );

  const persistedReconciliation = cloneReconciliation(strongestReconciliation);

  const hasPositiveNetworkEvidence =
    persistedReconciliation.status === 'mempool' ||
    persistedReconciliation.status === 'confirmed';

  return {
    ...record,

    fundingReconciliation: persistedReconciliation,

    ...(hasPositiveNetworkEvidence
      ? {
          fundingTxid: fundingIntentTxid,

          fundingDetectedAt:
            record.fundingDetectedAt ?? persistedReconciliation.checkedAt,

          status: 'funded' as const,

          errorMessage: undefined,
        }
      : {}),

    updatedAt: new Date().toISOString(),
  };
}
