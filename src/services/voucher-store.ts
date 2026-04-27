import { get, set } from 'idb-keyval';
import type { VoucherRecord, VoucherStatus } from 'src/types/voucher';

const VOUCHER_RECORDS_KEY = 'bch-voucher-records';

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

export async function clearVoucherRecords(): Promise<void> {
  await saveVoucherRecords([]);
}
