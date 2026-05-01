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

export interface TreasuryUtxo {
  outpointTransactionHash: string;
  outpointIndex: number;
  valueSats: number;
}

export interface TreasuryWalletBalance {
  address: string;
  balanceSats: number;
  utxoCount: number;
  utxos: TreasuryUtxo[];
  checkedAt: string;
}
