import type {
  VoucherPrintedRecoveryResolution,
  VoucherRecord,
} from 'src/types/voucher';

function isValidTimestamp(value: string): boolean {
  return Boolean(value.trim()) && Number.isFinite(new Date(value).getTime());
}

function isRedeemed(voucher: VoucherRecord): boolean {
  return (
    voucher.status === 'redeemed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  );
}

/**
 * The exceptional resolution UI is available ONLY when:
 *
 * - customer selected Printed;
 * - the Topup is still funded/unswept;
 * - printing crossed the safety boundary;
 * - no earlier exceptional resolution exists.
 */
export function canResolvePrintedVoucherRecovery(
  voucher: VoucherRecord
): boolean {
  if (
    voucher.delivery?.method !== 'printed' ||
    voucher.status !== 'funded' ||
    isRedeemed(voucher) ||
    voucher.printedRecovery
  ) {
    return false;
  }

  return (
    voucher.delivery.status === 'delivery_started' ||
    voucher.delivery.status === 'uncertain'
  );
}

export function resolvePrintedVoucherRecovery(
  voucher: VoucherRecord,
  resolution: VoucherPrintedRecoveryResolution,
  resolvedAt: string
): VoucherRecord {
  if (!isValidTimestamp(resolvedAt)) {
    throw new Error('Printed voucher recovery timestamp is invalid.');
  }

  /**
   * Same resolution is idempotent.
   *
   * A conflicting second resolution is never allowed.
   */
  if (voucher.printedRecovery) {
    if (voucher.printedRecovery.resolution === resolution) {
      return voucher;
    }

    throw new Error(
      'Printed voucher recovery has already been resolved differently.'
    );
  }

  if (!canResolvePrintedVoucherRecovery(voucher)) {
    throw new Error(
      'This voucher is not eligible for exceptional Printed recovery.'
    );
  }

  const delivery = voucher.delivery;

  if (!delivery) {
    throw new Error('Printed voucher delivery state is missing.');
  }

  const previousDeliveryStatus = delivery.status;

  if (
    previousDeliveryStatus !== 'delivery_started' &&
    previousDeliveryStatus !== 'uncertain'
  ) {
    throw new Error(
      'Printed voucher does not have an unresolved print outcome.'
    );
  }

  if (resolution === 'confirmed_printed') {
    return {
      ...voucher,

      delivery: {
        ...delivery,

        status: 'delivered',

        startedAt: delivery.startedAt ?? resolvedAt,

        deliveredAt: delivery.deliveredAt ?? resolvedAt,

        uncertaintyReason: undefined,
      },

      printedRecovery: {
        previousDeliveryStatus,

        resolution: 'confirmed_printed',

        resolvedAt,

        reason:
          'Merchant physically confirmed that a complete usable Printed voucher was produced.',

        reclaimStatus: 'not_required',
      },

      printedAt: voucher.printedAt ?? resolvedAt,

      status: 'printed',
    };
  }

  /**
   * A failed/partial physical print NEVER returns to selected.
   *
   * The old bearer credential remains permanently blocked from ordinary
   * reprinting and Digital exposure.
   */
  return {
    ...voucher,

    delivery: {
      ...delivery,

      status: 'uncertain',

      startedAt: delivery.startedAt ?? resolvedAt,

      uncertaintyReason:
        'Merchant confirmed that no complete usable voucher was available. The original voucher is locked and requires replacement plus reclaim.',
    },

    printedRecovery: {
      previousDeliveryStatus,

      resolution: 'replacement_required',

      resolvedAt,

      reason:
        'Merchant physically confirmed that no complete usable Printed voucher was available.',

      reclaimStatus: 'required',
    },
  };
}
