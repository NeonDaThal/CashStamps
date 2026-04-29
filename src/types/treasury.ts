export interface TreasuryWalletRecord {
  mnemonic: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreasuryWalletPublicInfo {
  address: string;
  createdAt: string;
  updatedAt: string;
  isSetup: boolean;
}
