export interface FeeAddressValidationResult {
  address: string;
  configured: boolean;
  valid: boolean;
  errorMessage: string;
}

export interface FeeAddressConfigStatus {
  platformFeeAddress: string;
  platformFeeAddressConfigured: boolean;
  platformFeeAddressValid: boolean;
  platformFeeAddressError: string;

  bufferReserveAddress: string;
  bufferReserveAddressConfigured: boolean;
  bufferReserveAddressValid: boolean;
  bufferReserveAddressError: string;

  checkedAt: string;
}
