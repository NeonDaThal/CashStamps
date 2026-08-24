import type { VoucherRecord } from 'src/types/voucher';

/**
 * Fail closed before a real digital bearer voucher is exposed.
 *
 * Redisplaying the SAME already-delivered digital voucher is allowed while
 * the voucher remains funded and unswept.
 */
export function assertDigitalVoucherDeliveryAllowed(
  voucher: VoucherRecord
): void {
  const delivery = voucher.delivery;

  if (!delivery) {
    throw new Error('Voucher does not have a committed delivery method.');
  }

  if (delivery.method !== 'digital') {
    throw new Error(
      'This Topup is not a digital voucher. Its WIF cannot be displayed.'
    );
  }

  /**
   * Digital delivery is only available while the voucher still holds the BCH.
   *
   * Once redeemed/reclaimed/etc. there is no normal merchant reason to expose
   * its bearer key again.
   */
  if (voucher.status !== 'funded') {
    throw new Error(
      'Digital voucher can only be displayed while the Topup is funded and unswept.'
    );
  }

  if (
    voucher.manualRedemption ||
    voucher.redemptionDetection?.status === 'swept'
  ) {
    throw new Error('This Digital Topup has already been redeemed.');
  }

  if (delivery.status === 'uncertain') {
    throw new Error(
      'Digital voucher delivery is in an uncertain state and requires investigation.'
    );
  }

  if (
    delivery.status !== 'selected' &&
    delivery.status !== 'delivery_started' &&
    delivery.status !== 'delivered'
  ) {
    throw new Error('Digital voucher delivery state is not valid for display.');
  }

  if (
    !Number.isInteger(voucher.derivationIndex) ||
    voucher.derivationIndex < 0
  ) {
    throw new Error('Digital voucher derivation index is invalid.');
  }

  if (!voucher.address.trim()) {
    throw new Error('Digital voucher address is missing.');
  }

  if (voucher.keyMetadata?.hasWif === false) {
    throw new Error('Digital voucher WIF is not available.');
  }
}
