import { get, set, update } from 'idb-keyval';

import { applyVoucherFundingBroadcast } from 'src/services/voucher-funding-broadcast';
import { applyVoucherFundingReconciliation } from 'src/services/voucher-funding-reconciliation';

import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasuryBroadcastReconciliationResult } from 'src/types/treasury-broadcast-reconciliation';

import { synchroniseTopupFundingState } from 'src/services/topup-funding-state';

import type {
  VoucherManualRedemption,
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
  return updateVoucherRecord(id, {
    manualRedemption: undefined,
    status: 'funded',
  });
}

export async function updateVoucherRedemptionDetection(
  id: string,
  detection: VoucherRedemptionDetection
): Promise<VoucherRecord | undefined> {
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
