import { get, set } from 'idb-keyval';

import type {
  CashOutCancellationReason,
  CashOutPaymentDetection,
  CashOutRecord,
  CashOutStatus,
} from 'src/types/cash-out';

const CASH_OUT_RECORDS_KEY = 'bch-voucher-cash-out-records';

/**
 * Cash-out records are stored as one IndexedDB array.
 *
 * Every mutation therefore involves:
 *
 * read current array
 * → modify it
 * → write complete array
 *
 * Those operations must be serialized. Otherwise two overlapping mutations
 * can both read the same old array and the later write can accidentally erase
 * the earlier mutation.
 */
let cashOutRecordsMutationQueue: Promise<void> = Promise.resolve();

function enqueueCashOutRecordsMutation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = cashOutRecordsMutationQueue.then(operation, operation);

  cashOutRecordsMutationQueue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}

async function writeCashOutRecords(records: CashOutRecord[]): Promise<void> {
  await set(CASH_OUT_RECORDS_KEY, records);
}

export async function getCashOutRecords(): Promise<CashOutRecord[]> {
  const records = await get<CashOutRecord[]>(CASH_OUT_RECORDS_KEY);

  return Array.isArray(records) ? records : [];
}

export async function saveCashOutRecords(
  records: CashOutRecord[]
): Promise<void> {
  await enqueueCashOutRecordsMutation(async () => {
    await writeCashOutRecords(records);
  });
}

export async function addCashOutRecord(
  record: CashOutRecord
): Promise<CashOutRecord> {
  return enqueueCashOutRecordsMutation(async () => {
    const records = await getCashOutRecords();

    const updatedRecords = [record, ...records];

    await writeCashOutRecords(updatedRecords);

    return record;
  });
}

export async function getCashOutRecordById(
  id: string
): Promise<CashOutRecord | undefined> {
  const records = await getCashOutRecords();

  return records.find((record) => record.id === id);
}

export async function updateCashOutRecord(
  id: string,
  updates: Partial<CashOutRecord>
): Promise<CashOutRecord | undefined> {
  return enqueueCashOutRecordsMutation(async () => {
    const records = await getCashOutRecords();

    const existingRecord = records.find((record) => record.id === id);

    if (!existingRecord) {
      return undefined;
    }

    const updatedRecord: CashOutRecord = {
      ...existingRecord,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedRecords = records.map((record) =>
      record.id === id ? updatedRecord : record
    );

    await writeCashOutRecords(updatedRecords);

    return updatedRecord;
  });
}

export async function updateCashOutStatus(
  id: string,
  status: CashOutStatus,
  errorMessage?: string
): Promise<CashOutRecord | undefined> {
  const timestampFieldUpdates: Partial<CashOutRecord> = {};

  if (status === 'cancelled') {
    timestampFieldUpdates.cancelledAt = new Date().toISOString();
  }

  if (status === 'failed') {
    timestampFieldUpdates.failedAt = new Date().toISOString();
  }

  if (status === 'completed') {
    timestampFieldUpdates.completedAt = new Date().toISOString();
  }

  return updateCashOutRecord(id, {
    status,
    errorMessage,
    ...timestampFieldUpdates,
  });
}

export async function cancelAwaitingCashOut(
  id: string,
  cancellationReason: CashOutCancellationReason
): Promise<CashOutRecord | undefined> {
  return enqueueCashOutRecordsMutation(async () => {
    const records = await getCashOutRecords();

    const existingRecord = records.find((record) => record.id === id);

    if (!existingRecord) {
      return undefined;
    }

    /**
     * Payment detection or another terminal transition always wins over a
     * stale cancellation request.
     */
    if (existingRecord.status !== 'awaiting_payment') {
      return existingRecord;
    }

    const now = new Date().toISOString();

    const updatedRecord: CashOutRecord = {
      ...existingRecord,

      status: 'cancelled',

      cancellationReason,

      cancelledAt: now,

      updatedAt: now,
    };

    const updatedRecords = records.map((record) =>
      record.id === id ? updatedRecord : record
    );

    await writeCashOutRecords(updatedRecords);

    return updatedRecord;
  });
}

export async function markCashOutPaymentDetected(
  id: string,
  detection: CashOutPaymentDetection
): Promise<CashOutRecord | undefined> {
  return updateCashOutRecord(id, {
    status: 'received',

    bchSatsReceived: detection.receivedSats,

    receivedTxid: detection.txid,

    detectedAt: detection.detectedAt,

    paymentDetection: detection,
  });
}

export async function markCashOutCompleted(
  id: string,
  printedAt?: string
): Promise<CashOutRecord | undefined> {
  const now = new Date().toISOString();

  const updates: Partial<CashOutRecord> = {
    status: 'completed',
    completedAt: now,
  };

  if (printedAt) {
    updates.printedAt = printedAt;
  }

  return updateCashOutRecord(id, updates);
}

export async function clearCashOutRecords(): Promise<void> {
  await enqueueCashOutRecordsMutation(async () => {
    await writeCashOutRecords([]);
  });
}
