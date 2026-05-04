import {
  BUFFER_RESERVE_ADDRESS,
  PLATFORM_FEE_ADDRESS,
  isBufferReserveAddressConfigured,
  isPlatformFeeAddressConfigured,
} from 'src/services/platform-fee-config';
import type { FeeAddressConfigStatus } from 'src/types/fee-address-config';

export function getFeeAddressConfigStatus(): FeeAddressConfigStatus {
  return {
    platformFeeAddress: PLATFORM_FEE_ADDRESS,
    platformFeeAddressConfigured: isPlatformFeeAddressConfigured(),

    bufferReserveAddress: BUFFER_RESERVE_ADDRESS,
    bufferReserveAddressConfigured: isBufferReserveAddressConfigured(),

    checkedAt: new Date().toISOString(),
  };
}
