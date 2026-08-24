import type { VoucherRecord } from 'src/types/voucher';

/**
 * Fail closed before a real physical bearer voucher can be sent to the
 * printer.
 *
 * Ordinary first-print delivery is allowed ONLY from delivery.status =
 * selected.
 *
 * delivery_started is deliberately NOT allowed here because after an app
 * interruption it may mean printer transmission had already begun.
 */
export function assertPrintedVoucherDeliveryAllowed(
  voucher: VoucherRecord
): void {
  const delivery = voucher.delivery;

  if (!delivery) {
    throw new Error('Voucher does not have a committed delivery method.');
  }

  if (delivery.method !== 'printed') {
    throw new Error(
      'This Topup is not a Printed voucher. Its WIF cannot be sent to the printer.'
    );
  }

  if (voucher.status !== 'funded') {
    throw new Error(
      'Printed voucher can only be issued while the Topup is funded and unswept.'
    );
  }

  if (
    voucher.manualRedemption ||
    voucher.redemptionDetection?.status === 'swept'
  ) {
    throw new Error('This Printed Topup has already been redeemed.');
  }

  if (delivery.status === 'delivery_started') {
    throw new Error(
      'Printed voucher delivery previously started and its physical outcome must be investigated before another print attempt.'
    );
  }

  if (delivery.status === 'uncertain') {
    throw new Error(
      'Printed voucher delivery outcome is uncertain. Automatic reprinting is blocked.'
    );
  }

  if (delivery.status === 'delivered') {
    throw new Error(
      'Printed voucher has already been delivered. Ordinary printing cannot create another copy.'
    );
  }

  if (delivery.status !== 'selected') {
    throw new Error(
      'Printed voucher delivery state is not valid for printing.'
    );
  }

  if (
    !Number.isInteger(voucher.derivationIndex) ||
    voucher.derivationIndex < 0
  ) {
    throw new Error('Printed voucher derivation index is invalid.');
  }

  if (!voucher.address.trim()) {
    throw new Error('Printed voucher address is missing.');
  }

  if (voucher.keyMetadata?.hasWif === false) {
    throw new Error('Printed voucher WIF is not available.');
  }
}
