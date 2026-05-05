import {
  BUFFER_RESERVE_ADDRESS,
  BUFFER_RESERVE_OUTPUT_ENABLED,
  PLATFORM_FEE_ADDRESS,
  isBufferReserveAddressConfigured,
  isPlatformFeeAddressConfigured,
} from 'src/services/platform-fee-config';
import type {
  FeeAddressConfigStatus,
  FeeAddressValidationResult,
} from 'src/types/fee-address-config';
import { Address } from 'src/utils/address';

function validateBchAddress(address: string): FeeAddressValidationResult {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return {
      address: '',
      configured: false,
      valid: false,
      errorMessage: 'Address is not configured.',
    };
  }

  try {
    Address.fromCashAddrOrLegacy(trimmedAddress);

    return {
      address: trimmedAddress,
      configured: true,
      valid: true,
      errorMessage: '',
    };
  } catch (error) {
    return {
      address: trimmedAddress,
      configured: true,
      valid: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Address is not a valid BCH address.',
    };
  }
}

function validateOptionalBufferAddress(): FeeAddressValidationResult {
  if (!BUFFER_RESERVE_OUTPUT_ENABLED) {
    return {
      address: BUFFER_RESERVE_ADDRESS.trim(),
      configured: isBufferReserveAddressConfigured(),
      valid: true,
      errorMessage: '',
    };
  }

  return validateBchAddress(BUFFER_RESERVE_ADDRESS);
}

export function getFeeAddressConfigStatus(): FeeAddressConfigStatus {
  const platformFeeAddress = validateBchAddress(PLATFORM_FEE_ADDRESS);
  const bufferReserveAddress = validateOptionalBufferAddress();

  return {
    platformFeeAddress: platformFeeAddress.address,
    platformFeeAddressConfigured: platformFeeAddress.configured,
    platformFeeAddressValid: platformFeeAddress.valid,
    platformFeeAddressError: platformFeeAddress.errorMessage,

    bufferReserveAddress: bufferReserveAddress.address,
    bufferReserveAddressConfigured: bufferReserveAddress.configured,
    bufferReserveAddressValid: bufferReserveAddress.valid,
    bufferReserveAddressError: bufferReserveAddress.errorMessage,

    checkedAt: new Date().toISOString(),
  };
}
