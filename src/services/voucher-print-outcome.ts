export const VOUCHER_PRINT_DEFINITELY_NOT_PRINTED_CODE =
  'VOUCHER_PRINT_DEFINITELY_NOT_PRINTED';

export const VOUCHER_PRINT_OUTCOME_UNCERTAIN_CODE =
  'VOUCHER_PRINT_OUTCOME_UNCERTAIN';

export type VoucherPrintFailureStatus = 'definitely_not_printed' | 'uncertain';

export interface VoucherPrintFailure {
  status: VoucherPrintFailureStatus;
  message: string;
}

interface PrinterErrorLike {
  code?: unknown;
  message?: unknown;
}

/**
 * Typed error used by the JavaScript printer boundary.
 *
 * Existing callers which only inspect error.message continue to work.
 */
export class VoucherPrintDeliveryError extends Error {
  readonly voucherPrintStatus: VoucherPrintFailureStatus;

  constructor(status: VoucherPrintFailureStatus, message: string) {
    super(message);

    this.name = 'VoucherPrintDeliveryError';
    this.voucherPrintStatus = status;
  }
}

function getErrorLike(error: unknown): PrinterErrorLike | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  return error as PrinterErrorLike;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const errorLike = getErrorLike(error);

  if (typeof errorLike?.message === 'string' && errorLike.message.trim()) {
    return errorLike.message;
  }

  return 'Voucher printer outcome could not be determined.';
}

/**
 * Convert native/bridge failures into the B5.8 physical-delivery safety model.
 *
 * Unknown errors fail CLOSED as uncertain. We must never assume a bearer
 * voucher was not printed merely because the JavaScript bridge cannot prove
 * what happened.
 */
export function classifyVoucherPrintFailure(
  error: unknown
): VoucherPrintFailure {
  if (error instanceof VoucherPrintDeliveryError) {
    return {
      status: error.voucherPrintStatus,
      message: error.message,
    };
  }

  const errorLike = getErrorLike(error);

  if (errorLike?.code === VOUCHER_PRINT_DEFINITELY_NOT_PRINTED_CODE) {
    return {
      status: 'definitely_not_printed',
      message: getErrorMessage(error),
    };
  }

  if (errorLike?.code === VOUCHER_PRINT_OUTCOME_UNCERTAIN_CODE) {
    return {
      status: 'uncertain',
      message: getErrorMessage(error),
    };
  }

  /**
   * Unknown native/Capacitor failures are deliberately uncertain.
   */
  return {
    status: 'uncertain',
    message: getErrorMessage(error),
  };
}
