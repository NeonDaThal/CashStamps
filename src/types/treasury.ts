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

export interface TreasuryCashOutReceivingAddress {
  treasuryMasterAddress: string;
  address: string;
  derivationIndex: number;
}

export interface TreasuryWalletBackupInfo {
  mnemonic: string;
  address: string;
  exportedAt: string;
}

export interface TreasuryRestoreCheckResult {
  mnemonic: string;
  derivedAddress: string;
  currentAddress: string;
  matchesCurrentWallet: boolean;
  checkedAt: string;
}

export interface TreasuryRestoreImportResult {
  address: string;
  importedAt: string;
  replacedExistingWallet: boolean;
}

export interface TreasuryUtxo {
  outpointTransactionHash: string;
  outpointIndex: number;
  valueSats: number;
  address?: string;
  derivationIndex?: number;
}

export interface TreasuryWalletBalance {
  address: string;
  balanceSats: number;
  utxoCount: number;
  utxos: TreasuryUtxo[];
  checkedAt: string;

  /**
   * Number of treasury-derived addresses included in this balance check.
   *
   * This includes the main treasury address and any unique cash-out receiving
   * addresses known from cash-out records.
   */
  checkedAddressCount?: number;
}
