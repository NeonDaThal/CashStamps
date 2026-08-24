import type {
  VoucherDelivery,
  VoucherDeliveryMethod,
  VoucherRecord,
} from 'src/types/voucher';

function requireTimestamp(value: string, label: string): string {
  const timestamp = value.trim();

  if (!timestamp) {
    throw new Error(`${label} timestamp is required.`);
  }

  if (Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`${label} timestamp is invalid.`);
  }

  return timestamp;
}

function requireMatchingDelivery(
  record: VoucherRecord,
  method: VoucherDeliveryMethod
): VoucherDelivery {
  const delivery = record.delivery;

  if (!delivery) {
    throw new Error('Voucher delivery method has not been selected.');
  }

  if (delivery.method !== method) {
    throw new Error(
      `Voucher delivery method is already locked to ${delivery.method}.`
    );
  }

  return delivery;
}

/**
 * Irreversibly select how this voucher will expose its bearer WIF.
 *
 * Selecting the same method again is idempotent.
 * Selecting the opposite method is forbidden.
 */
export function selectVoucherDeliveryMethod(
  record: VoucherRecord,
  method: VoucherDeliveryMethod,
  selectedAt: string
): VoucherRecord {
  const timestamp = requireTimestamp(selectedAt, 'Voucher delivery selection');

  if (record.delivery) {
    if (record.delivery.method !== method) {
      throw new Error(
        `Voucher delivery method is already locked to ${record.delivery.method} and cannot be changed to ${method}.`
      );
    }

    /**
     * Same-method repeated calls are harmless.
     */
    return record;
  }

  return {
    ...record,

    delivery: {
      method,

      status: 'selected',

      selectedAt: timestamp,
    },
  };
}

/**
 * Persist the finality boundary immediately before the WIF can leave the app's
 * protected internal state.
 *
 * DIGITAL:
 * Call this BEFORE rendering the real WIF QR.
 *
 * PRINTED:
 * Call this BEFORE passing the real WIF receipt to the native printer bridge.
 */
export function beginVoucherDelivery(
  record: VoucherRecord,
  method: VoucherDeliveryMethod,
  startedAt: string
): VoucherRecord {
  const delivery = requireMatchingDelivery(record, method);

  const timestamp = requireTimestamp(startedAt, 'Voucher delivery start');

  if (delivery.status === 'delivered') {
    throw new Error('Voucher delivery has already completed.');
  }

  if (delivery.status === 'uncertain') {
    throw new Error(
      'Voucher delivery outcome is uncertain and cannot be started again automatically.'
    );
  }

  /**
   * Re-entering the same already-started delivery is idempotent.
   *
   * Later B5.8 recovery rules will decide how an interrupted delivery is
   * resumed without ever changing its method.
   */
  if (delivery.status === 'delivery_started') {
    return record;
  }

  return {
    ...record,

    delivery: {
      ...delivery,

      status: 'delivery_started',

      startedAt: timestamp,

      uncertaintyReason: undefined,
    },
  };
}

/**
 * Mark the chosen delivery route complete.
 */
export function completeVoucherDelivery(
  record: VoucherRecord,
  method: VoucherDeliveryMethod,
  deliveredAt: string
): VoucherRecord {
  const delivery = requireMatchingDelivery(record, method);

  const timestamp = requireTimestamp(
    deliveredAt,
    'Voucher delivery completion'
  );

  if (delivery.status === 'delivered') {
    return record;
  }

  if (delivery.status === 'uncertain') {
    throw new Error(
      'Uncertain voucher delivery cannot be automatically marked delivered.'
    );
  }

  if (delivery.status !== 'delivery_started') {
    throw new Error('Voucher delivery must begin before it can be completed.');
  }

  return {
    ...record,

    delivery: {
      ...delivery,

      status: 'delivered',

      deliveredAt: timestamp,

      uncertaintyReason: undefined,
    },
  };
}

/**
 * Fail closed when a delivery side effect may have happened but cannot be
 * safely proven.
 *
 * Most importantly, an uncertain printed voucher must NOT automatically be
 * printed again and must never be converted into digital delivery.
 */
export function markVoucherDeliveryUncertain(
  record: VoucherRecord,
  method: VoucherDeliveryMethod,
  uncertaintyReason: string
): VoucherRecord {
  const delivery = requireMatchingDelivery(record, method);

  if (delivery.status === 'delivered') {
    throw new Error(
      'Delivered voucher cannot be changed to an uncertain delivery state.'
    );
  }

  if (
    delivery.status !== 'delivery_started' &&
    delivery.status !== 'uncertain'
  ) {
    throw new Error(
      'Voucher delivery has not started, so its outcome cannot be uncertain.'
    );
  }

  const reason = uncertaintyReason.trim();

  if (!reason) {
    throw new Error('Voucher delivery uncertainty reason is required.');
  }

  return {
    ...record,

    delivery: {
      ...delivery,

      status: 'uncertain',

      uncertaintyReason: reason,
    },
  };
}

/**
 * Return a delivery to its safely retryable selected state ONLY when an
 * external delivery mechanism has positively proved that no bearer-secret
 * delivery occurred.
 *
 * Primary B5.8 use:
 *
 * printed delivery_started
 *   → native printer proves transmission never began
 *   → selected
 *   → same Printed voucher may be attempted again
 *
 * This transition is forbidden from uncertain or delivered because either
 * state means a physical bearer voucher may already exist.
 */
export function resetVoucherDeliveryAfterDefiniteFailure(
  record: VoucherRecord,
  method: VoucherDeliveryMethod
): VoucherRecord {
  const delivery = requireMatchingDelivery(record, method);

  if (delivery.status === 'selected') {
    return record;
  }

  if (delivery.status === 'delivered') {
    throw new Error(
      'Delivered voucher cannot be reset for another delivery attempt.'
    );
  }

  if (delivery.status === 'uncertain') {
    throw new Error(
      'Uncertain voucher delivery cannot be reset for another delivery attempt.'
    );
  }

  if (delivery.status !== 'delivery_started') {
    throw new Error('Voucher delivery is not in a retryable started state.');
  }

  return {
    ...record,

    delivery: {
      method: delivery.method,

      status: 'selected',

      selectedAt: delivery.selectedAt,
    },
  };
}
