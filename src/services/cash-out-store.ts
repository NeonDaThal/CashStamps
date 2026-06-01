import { get, set } from 'idb-keyval';
import type {
  CashOutPaymentDetection,
  CashOutRecord,
  CashOutStatus,
} from 'src/types/cash-out';

const CASH_OUT_RECORDS_KEY = 'bch-voucher-cash-out-records';

export async function getCashOutRecords(): Promise<CashOutRecord[]> {
  const records = await get<CashOutRecord[]>(CASH_OUT_RECORDS_KEY);
  return Array.isArray(records) ? records : [];
}

export async function saveCashOutRecords(
  records: CashOutRecord[]
): Promise<void> {
  await set(CASH_OUT_RECORDS_KEY, records);
}

export async function addCashOutRecord(
  record: CashOutRecord
): Promise<CashOutRecord> {
  const records = await getCashOutRecords();
  const updatedRecords = [record, ...records];

  await saveCashOutRecords(updatedRecords);

  return record;
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

  await saveCashOutRecords(updatedRecords);

  return updatedRecord;
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

  return updateCashOutRecord(id, {
    status: 'completed',
    completedAt: now,
    printedAt: printedAt ?? now,
  });
}

export async function clearCashOutRecords(): Promise<void> {
  await saveCashOutRecords([]);
}
