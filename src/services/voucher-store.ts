import { get, set, update } from 'idb-keyval';

import { applyVoucherFundingBroadcast } from 'src/services/voucher-funding-broadcast';
import { applyVoucherFundingReconciliation } from 'src/services/voucher-funding-reconciliation';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import { synchroniseTopupFundingState } from 'src/services/topup-funding-state';
import { resolvePrintedVoucherRecovery } from 'src/services/voucher-printed-recovery';
import {
  applyVoucherReclaimBroadcast,
  applyVoucherReclaimReconciliation,
} from 'src/services/voucher-reclaim-state';
import {
  canCreatePrintedReplacement,
  linkPrintedReplacement,
} from 'src/services/voucher-replacement';

import { applyVoucherReclaimIntent } from 'src/services/voucher-reclaim';
import {
  beginVoucherDelivery,
  completeVoucherDelivery,
  markVoucherDeliveryUncertain,
  resetVoucherDeliveryAfterDefiniteFailure,
  selectVoucherDeliveryMethod,
} from 'src/services/voucher-delivery';

import type {
  VoucherDeliveryMethod,
  VoucherManualRedemption,
  VoucherPrintedRecoveryResolution,
  VoucherReclaimIntent,
  VoucherRecord,
  VoucherRedemptionDetection,
  VoucherStatus,
} from 'src/types/voucher';

const VOUCHER_RECORDS_KEY = 'bch-voucher-records';

export interface AddVoucherRecordIdempotentResult {
  record: VoucherRecord;
  created: boolean;
}

export interface InsertVoucherRecordIdempotentResult {
  records: VoucherRecord[];
  record: VoucherRecord;
  created: boolean;
}

export interface InsertPrintedReplacementResult {
  originalRecord: VoucherRecord;
  replacementRecord: VoucherRecord;
  created: boolean;
}

export async function getVoucherRecords(): Promise<VoucherRecord[]> {
  const records = await get<VoucherRecord[]>(VOUCHER_RECORDS_KEY);

  return Array.isArray(records) ? records : [];
}

export async function saveVoucherRecords(
  records: VoucherRecord[]
): Promise<void> {
  await set(VOUCHER_RECORDS_KEY, records);
}

export async function addVoucherRecord(
  record: VoucherRecord
): Promise<VoucherRecord> {
  const records = await getVoucherRecords();

  const updatedRecords = [record, ...records];

  await saveVoucherRecords(updatedRecords);

  return record;
}

export async function getVoucherRecordById(
  id: string
): Promise<VoucherRecord | undefined> {
  const records = await getVoucherRecords();

  return records.find((record) => record.id === id);
}

export async function getVoucherRecordByIssueOperationId(
  issueOperationId: string
): Promise<VoucherRecord | undefined> {
  if (!issueOperationId.trim()) {
    return undefined;
  }

  const records = await getVoucherRecords();

  return records.find((record) => record.issueOperationId === issueOperationId);
}

/**
 * Pure idempotency rule used by the IndexedDB atomic update below.
 */
export function insertVoucherRecordIdempotently(
  currentRecords: VoucherRecord[],
  record: VoucherRecord
): InsertVoucherRecordIdempotentResult {
  const issueOperationId = record.issueOperationId?.trim();

  if (!issueOperationId) {
    throw new Error(
      'Cannot use idempotent voucher insertion without an issue operation ID.'
    );
  }

  const existingRecord = currentRecords.find(
    (existing) => existing.issueOperationId === issueOperationId
  );

  if (existingRecord) {
    return {
      records: currentRecords,
      record: existingRecord,
      created: false,
    };
  }

  return {
    records: [record, ...currentRecords],

    record,

    created: true,
  };
}

/**
 * Atomically insert a voucher unless this exact merchant Issue operation has
 * already produced a record.
 *
 * This is the durable second line of defence after the in-memory UI guard.
 */
export async function addVoucherRecordIdempotently(
  record: VoucherRecord
): Promise<AddVoucherRecordIdempotentResult> {
  let result: AddVoucherRecordIdempotentResult | null = null;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const insertion = insertVoucherRecordIdempotently(currentRecords, record);

      result = {
        record: insertion.record,

        created: insertion.created,
      };

      return insertion.records;
    }
  );

  if (!result) {
    throw new Error('Voucher idempotent insertion completed without a result.');
  }

  return result;
}

/**
 * Atomically persist one broadcast result for the exact durable transaction
 * associated with this voucher.
 *
 * Transaction identity is validated by applyVoucherFundingBroadcast before
 * any updated record is written.
 */
export async function updateVoucherFundingBroadcast(
  id: string,
  result: TreasuryBroadcastResult
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const existingRecord = currentRecords.find((record) => record.id === id);

      if (!existingRecord) {
        return currentRecords;
      }

      const broadcastRecord = applyVoucherFundingBroadcast(
        existingRecord,
        result
      );

      const synchronisedRecord = synchroniseTopupFundingState(broadcastRecord);

      const nextRecord: VoucherRecord = {
        ...synchronisedRecord,

        updatedAt: new Date().toISOString(),
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === id ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

/**
 * Atomically apply reconciliation evidence for the exact durable funding
 * transaction associated with one voucher.
 *
 * The pure reconciliation helper validates transaction identity and prevents
 * stronger network evidence from being downgraded.
 */
export async function updateVoucherFundingReconciliation(
  id: string,
  reconciliation: TreasuryBroadcastReconciliationResult
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const existingRecord = currentRecords.find((record) => record.id === id);

      if (!existingRecord) {
        return currentRecords;
      }

      const reconciliationRecord = applyVoucherFundingReconciliation(
        existingRecord,
        reconciliation
      );

      const synchronisedRecord =
        synchroniseTopupFundingState(reconciliationRecord);

      const nextRecord: VoucherRecord = {
        ...synchronisedRecord,

        updatedAt: new Date().toISOString(),
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === id ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

/**
 * Re-evaluate one persisted voucher using the B5.7 funding-state classifier
 * without performing any BCH network operation.
 *
 * Used before lifecycle recovery so malformed or contradictory persisted
 * funding state fails closed before reconciliation/broadcast is attempted.
 */
export async function updateVoucherFundingState(
  id: string
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const existingRecord = currentRecords.find((record) => record.id === id);

      if (!existingRecord) {
        return currentRecords;
      }

      const synchronisedRecord = synchroniseTopupFundingState(existingRecord);

      if (synchronisedRecord === existingRecord) {
        updatedRecord = existingRecord;

        return currentRecords;
      }

      const nextRecord: VoucherRecord = {
        ...synchronisedRecord,

        updatedAt: new Date().toISOString(),
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === id ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

/**
 * Atomically lock one voucher to its customer-selected delivery method.
 *
 * The pure delivery state machine rejects any attempt to change an existing
 * printed choice to digital or an existing digital choice to printed.
 */
export async function selectVoucherDelivery(
  id: string,
  method: VoucherDeliveryMethod,
  selectedAt: string = new Date().toISOString()
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(VOUCHER_RECORDS_KEY, (storedRecords = []) => {
    const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

    const existingRecord = currentRecords.find((record) => record.id === id);

    if (!existingRecord) {
      return currentRecords;
    }

    const deliveryRecord = selectVoucherDeliveryMethod(
      existingRecord,
      method,
      selectedAt
    );

    /**
     * Re-selecting the SAME method is intentionally idempotent.
     */
    if (deliveryRecord === existingRecord) {
      updatedRecord = existingRecord;

      return currentRecords;
    }

    const nextRecord: VoucherRecord = {
      ...deliveryRecord,

      updatedAt: selectedAt,
    };

    updatedRecord = nextRecord;

    return currentRecords.map((record) =>
      record.id === id ? nextRecord : record
    );
  });

  return updatedRecord;
}

/**
 * Atomically cross the bearer-secret finality boundary immediately BEFORE the
 * selected delivery side effect begins.
 *
 * digital:
 *   call before rendering the real WIF QR.
 *
 * printed:
 *   call before passing the real WIF receipt to the native printer bridge.
 */
export async function startVoucherDelivery(
  id: string,
  method: VoucherDeliveryMethod,
  startedAt: string = new Date().toISOString()
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(VOUCHER_RECORDS_KEY, (storedRecords = []) => {
    const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

    const existingRecord = currentRecords.find((record) => record.id === id);

    if (!existingRecord) {
      return currentRecords;
    }

    const deliveryRecord = beginVoucherDelivery(
      existingRecord,
      method,
      startedAt
    );

    if (deliveryRecord === existingRecord) {
      updatedRecord = existingRecord;

      return currentRecords;
    }

    const nextRecord: VoucherRecord = {
      ...deliveryRecord,

      updatedAt: startedAt,
    };

    updatedRecord = nextRecord;

    return currentRecords.map((record) =>
      record.id === id ? nextRecord : record
    );
  });

  return updatedRecord;
}

/**
 * Atomically mark the selected bearer-secret delivery as completed.
 *
 * For printed delivery we retain the historical printedAt/status fields for
 * compatibility with existing reports/history while delivery remains the
 * authoritative B5.8 finality model.
 */
export async function completeStoredVoucherDelivery(
  id: string,
  method: VoucherDeliveryMethod,
  deliveredAt: string = new Date().toISOString()
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(VOUCHER_RECORDS_KEY, (storedRecords = []) => {
    const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

    const existingRecord = currentRecords.find((record) => record.id === id);

    if (!existingRecord) {
      return currentRecords;
    }

    const deliveryRecord = completeVoucherDelivery(
      existingRecord,
      method,
      deliveredAt
    );

    if (deliveryRecord === existingRecord) {
      updatedRecord = existingRecord;

      return currentRecords;
    }

    const nextRecord: VoucherRecord = {
      ...deliveryRecord,

      /**
       * Preserve the existing physical-print lifecycle fields only for the
       * physical delivery route.
       */
      ...(method === 'printed'
        ? {
            printedAt: existingRecord.printedAt ?? deliveredAt,

            status:
              existingRecord.status === 'redeemed' ||
              existingRecord.status === 'reclaimed'
                ? existingRecord.status
                : ('printed' as const),
          }
        : {}),

      updatedAt: deliveredAt,
    };

    updatedRecord = nextRecord;

    return currentRecords.map((record) =>
      record.id === id ? nextRecord : record
    );
  });

  return updatedRecord;
}

/**
 * Atomically fail closed when delivery may have occurred but cannot be proven.
 *
 * This is particularly important for physical printing: an uncertain print
 * must not be silently sent again.
 */
export async function markStoredVoucherDeliveryUncertain(
  id: string,
  method: VoucherDeliveryMethod,
  uncertaintyReason: string
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  const updatedAt = new Date().toISOString();

  await update<VoucherRecord[]>(VOUCHER_RECORDS_KEY, (storedRecords = []) => {
    const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

    const existingRecord = currentRecords.find((record) => record.id === id);

    if (!existingRecord) {
      return currentRecords;
    }

    const deliveryRecord = markVoucherDeliveryUncertain(
      existingRecord,
      method,
      uncertaintyReason
    );

    const nextRecord: VoucherRecord = {
      ...deliveryRecord,

      updatedAt,
    };

    updatedRecord = nextRecord;

    return currentRecords.map((record) =>
      record.id === id ? nextRecord : record
    );
  });

  return updatedRecord;
}

/**
 * Atomically return a delivery to its selected state after the external
 * delivery mechanism has positively proved that no bearer delivery occurred.
 *
 * For B5.8 Printed vouchers this is ONLY used when the native printer reports
 * definitely_not_printed.
 *
 * It must never be used for an uncertain print result.
 */
export async function resetStoredVoucherDeliveryAfterDefiniteFailure(
  id: string,
  method: VoucherDeliveryMethod
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  const updatedAt = new Date().toISOString();

  await update<VoucherRecord[]>(VOUCHER_RECORDS_KEY, (storedRecords = []) => {
    const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

    const existingRecord = currentRecords.find((record) => record.id === id);

    if (!existingRecord) {
      return currentRecords;
    }

    const deliveryRecord = resetVoucherDeliveryAfterDefiniteFailure(
      existingRecord,
      method
    );

    if (deliveryRecord === existingRecord) {
      updatedRecord = existingRecord;

      return currentRecords;
    }

    const nextRecord: VoucherRecord = {
      ...deliveryRecord,

      updatedAt,
    };

    updatedRecord = nextRecord;

    return currentRecords.map((record) =>
      record.id === id ? nextRecord : record
    );
  });

  return updatedRecord;
}

/**
 * Atomically resolve an exceptional Printed delivery whose physical outcome
 * could not originally be proven.
 *
 * This transition NEVER unlocks the old bearer credential for printing.
 */
export async function resolveStoredPrintedVoucherRecovery(
  id: string,
  resolution: VoucherPrintedRecoveryResolution,
  resolvedAt: string = new Date().toISOString()
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const existingRecord = currentRecords.find((record) => record.id === id);

      if (!existingRecord) {
        return currentRecords;
      }

      const recoveryRecord = resolvePrintedVoucherRecovery(
        existingRecord,
        resolution,
        resolvedAt
      );

      if (recoveryRecord === existingRecord) {
        updatedRecord = existingRecord;

        return currentRecords;
      }

      const nextRecord: VoucherRecord = {
        ...recoveryRecord,

        updatedAt: resolvedAt,
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === id ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

/**
 * Atomically insert one replacement voucher and link it to the original failed
 * Printed Topup.
 *
 * This prevents:
 *
 * - two replacement records racing into existence;
 * - an inserted replacement without the original being linked;
 * - a second replacement being silently created later.
 */
export async function insertPrintedReplacementVoucher(
  originalVoucherId: string,
  replacementRecord: VoucherRecord
): Promise<InsertPrintedReplacementResult> {
  let result: InsertPrintedReplacementResult | null = null;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const originalRecord = currentRecords.find(
        (record) => record.id === originalVoucherId
      );

      if (!originalRecord) {
        throw new Error('Original Printed Topup record could not be found.');
      }

      const alreadyLinkedId =
        originalRecord.printedRecovery?.replacementVoucherId;

      if (alreadyLinkedId) {
        const existingReplacement = currentRecords.find(
          (record) => record.id === alreadyLinkedId
        );

        if (!existingReplacement) {
          throw new Error(
            'Original Topup references a replacement record that could not be found.'
          );
        }

        result = {
          originalRecord,
          replacementRecord: existingReplacement,
          created: false,
        };

        return currentRecords;
      }

      if (!canCreatePrintedReplacement(originalRecord)) {
        throw new Error(
          'Original Printed Topup is not eligible for replacement.'
        );
      }

      if (
        replacementRecord.replacement?.originalVoucherId !== originalRecord.id
      ) {
        throw new Error(
          'Replacement record is not linked to this original Topup.'
        );
      }

      const duplicateReplacement = currentRecords.find(
        (record) => record.replacement?.originalVoucherId === originalRecord.id
      );

      if (duplicateReplacement) {
        const linkedOriginal = linkPrintedReplacement(
          originalRecord,
          duplicateReplacement.id
        );

        result = {
          originalRecord: linkedOriginal,

          replacementRecord: duplicateReplacement,

          created: false,
        };

        return currentRecords.map((record) =>
          record.id === originalRecord.id
            ? {
                ...linkedOriginal,

                updatedAt: new Date().toISOString(),
              }
            : record
        );
      }

      if (currentRecords.some((record) => record.id === replacementRecord.id)) {
        throw new Error('Replacement voucher record ID already exists.');
      }

      const linkedOriginal = linkPrintedReplacement(
        originalRecord,
        replacementRecord.id
      );

      const updatedAt = new Date().toISOString();

      const nextOriginal: VoucherRecord = {
        ...linkedOriginal,

        updatedAt,
      };

      result = {
        originalRecord: nextOriginal,

        replacementRecord,

        created: true,
      };

      return [
        replacementRecord,

        ...currentRecords.map((record) =>
          record.id === originalRecord.id ? nextOriginal : record
        ),
      ];
    }
  );

  if (!result) {
    throw new Error(
      'Replacement voucher insertion completed without a result.'
    );
  }

  return result;
}

/**
 * Atomically cross the reclaim write-ahead boundary.
 *
 * The replacement record is re-checked inside the same IndexedDB update so an
 * obsolete or conflicting recovery state cannot acquire a reclaim intent.
 */
export async function storeVoucherReclaimIntent(
  originalVoucherId: string,
  intent: VoucherReclaimIntent
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const original = currentRecords.find(
        (record) => record.id === originalVoucherId
      );

      if (!original) {
        return currentRecords;
      }

      const replacementVoucherId =
        original.printedRecovery?.replacementVoucherId;

      if (!replacementVoucherId) {
        throw new Error(
          'Original Topup does not have a linked replacement voucher.'
        );
      }

      const replacement = currentRecords.find(
        (record) => record.id === replacementVoucherId
      );

      if (!replacement) {
        throw new Error('Linked replacement Topup record could not be found.');
      }

      const reclaimRecord = applyVoucherReclaimIntent(
        original,
        replacement,
        intent
      );

      if (reclaimRecord === original) {
        updatedRecord = original;

        return currentRecords;
      }

      const nextRecord: VoucherRecord = {
        ...reclaimRecord,

        updatedAt: intent.preparedAt,
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === originalVoucherId ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

/**
 * Atomically persist one submission result for the exact durable reclaim
 * transaction.
 */
export async function updateVoucherReclaimBroadcast(
  id: string,
  result: TreasuryBroadcastResult
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const existingRecord = currentRecords.find((record) => record.id === id);

      if (!existingRecord) {
        return currentRecords;
      }

      const reclaimRecord = applyVoucherReclaimBroadcast(
        existingRecord,
        result
      );

      const nextRecord: VoucherRecord = {
        ...reclaimRecord,

        updatedAt: result.attemptedAt,
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === id ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

/**
 * Atomically persist read-only network evidence for the exact reclaim txid.
 *
 * Positive evidence may finalize the original voucher as reclaimed.
 */
export async function updateVoucherReclaimReconciliation(
  id: string,
  reconciliation: TreasuryBroadcastReconciliationResult
): Promise<VoucherRecord | undefined> {
  let updatedRecord: VoucherRecord | undefined;

  await update<VoucherRecord[]>(
    VOUCHER_RECORDS_KEY,

    (storedRecords = []) => {
      const currentRecords = Array.isArray(storedRecords) ? storedRecords : [];

      const existingRecord = currentRecords.find((record) => record.id === id);

      if (!existingRecord) {
        return currentRecords;
      }

      const reclaimRecord = applyVoucherReclaimReconciliation(
        existingRecord,
        reconciliation
      );

      if (reclaimRecord === existingRecord) {
        updatedRecord = existingRecord;

        return currentRecords;
      }

      const nextRecord: VoucherRecord = {
        ...reclaimRecord,

        updatedAt: reconciliation.checkedAt,
      };

      updatedRecord = nextRecord;

      return currentRecords.map((record) =>
        record.id === id ? nextRecord : record
      );
    }
  );

  return updatedRecord;
}

export async function updateVoucherRecord(
  id: string,
  updates: Partial<VoucherRecord>
): Promise<VoucherRecord | undefined> {
  const records = await getVoucherRecords();

  const existingRecord = records.find((record) => record.id === id);

  if (!existingRecord) {
    return undefined;
  }

  const updatedRecord: VoucherRecord = {
    ...existingRecord,
    ...updates,

    updatedAt: new Date().toISOString(),
  };

  const updatedRecords = records.map((record) =>
    record.id === id ? updatedRecord : record
  );

  await saveVoucherRecords(updatedRecords);

  return updatedRecord;
}

export async function updateVoucherStatus(
  id: string,
  status: VoucherStatus,
  errorMessage?: string
): Promise<VoucherRecord | undefined> {
  return updateVoucherRecord(id, {
    status,
    errorMessage,
  });
}

export async function markVoucherManuallyRedeemed(
  id: string,
  redemption: Omit<VoucherManualRedemption, 'status' | 'redeemedAt'> & {
    redeemedAt?: string;
  }
): Promise<VoucherRecord | undefined> {
  const existingRecord = await getVoucherRecordById(id);

  if (existingRecord?.status === 'reclaimed') {
    throw new Error('A reclaimed Topup cannot be marked as customer-redeemed.');
  }
  return updateVoucherRecord(id, {
    manualRedemption: {
      status: 'swept',

      txid: redemption.txid,

      note: redemption.note,

      redeemedAt: redemption.redeemedAt ?? new Date().toISOString(),
    },

    status: 'redeemed',
  });
}

export async function clearVoucherManualRedemption(
  id: string
): Promise<VoucherRecord | undefined> {
  const existingRecord = await getVoucherRecordById(id);

  if (existingRecord?.status === 'reclaimed') {
    throw new Error('A reclaimed Topup cannot return to the funded state.');
  }
  return updateVoucherRecord(id, {
    manualRedemption: undefined,
    status: 'funded',
  });
}

export async function updateVoucherRedemptionDetection(
  id: string,
  detection: VoucherRedemptionDetection
): Promise<VoucherRecord | undefined> {
  const existingRecord = await getVoucherRecordById(id);

  if (!existingRecord) {
    return undefined;
  }

  /**
   * Reclaim is a terminal lifecycle state for this failed bearer voucher.
   *
   * A later ordinary redemption check must never relabel it as funded or
   * redeemed.
   */
  if (existingRecord.status === 'reclaimed') {
    return updateVoucherRecord(id, {
      redemptionDetection: detection,
    });
  }

  const nextStatus: VoucherStatus | undefined =
    detection.status === 'swept'
      ? 'redeemed'
      : detection.status === 'funded'
      ? 'funded'
      : undefined;

  return updateVoucherRecord(id, {
    redemptionDetection: detection,

    ...(nextStatus
      ? {
          status: nextStatus,
        }
      : {}),
  });
}

export async function clearVoucherRecords(): Promise<void> {
  await saveVoucherRecords([]);
}
