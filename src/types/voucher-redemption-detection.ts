export interface VoucherAddressUtxo {
  outpointTransactionHash: string;
  outpointIndex: number;
  valueSats: number;
}

export interface VoucherAddressBalance {
  derivationIndex: number;
  address: string;
  balanceSats: number;
  utxoCount: number;
  utxos: VoucherAddressUtxo[];
  checkedAt: string;
}
