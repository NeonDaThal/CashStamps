export interface TreasuryTopUpRequest {
  address: string;
  amountBch?: number;
  label?: string;
  message?: string;
}

export interface TreasuryTopUpUri {
  address: string;
  uri: string;
  createdAt: string;
}
