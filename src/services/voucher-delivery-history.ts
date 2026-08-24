import type { VoucherRecord } from 'src/types/voucher';

function isVoucherRedeemed(voucher: VoucherRecord): boolean {
  return (
    voucher.status === 'redeemed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  );
}

/**
 * The SAME Digital bearer voucher may be shown again while it is still funded
 * and unswept.
 *
 * This never permits Printed → Digital switching.
 */
export function canShowDigitalVoucherFromHistory(
  voucher: VoucherRecord
): boolean {
  if (isVoucherRedeemed(voucher)) {
    return false;
  }

  if (voucher.status !== 'funded' || voucher.delivery?.method !== 'digital') {
    return false;
  }

  return (
    voucher.delivery.status === 'selected' ||
    voucher.delivery.status === 'delivery_started' ||
    voucher.delivery.status === 'delivered'
  );
}

/**
 * Ordinary History printing is allowed only when the durable record positively
 * says the Printed voucher is still in its safely retryable selected state.
 *
 * delivery_started / uncertain / delivered are deliberately blocked.
 */
export function canRetryPrintedVoucherFromHistory(
  voucher: VoucherRecord
): boolean {
  if (isVoucherRedeemed(voucher)) {
    return false;
  }

  return (
    voucher.status === 'funded' &&
    voucher.delivery?.method === 'printed' &&
    voucher.delivery.status === 'selected'
  );
}
