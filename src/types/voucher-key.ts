export interface VoucherKeyExport {
  derivationIndex: number;
  address: string;

  /**
   * WIF/private key controls the voucher funds.
   *
   * This must only be printed/exported as part of the final voucher redemption
   * flow, and must not be exposed casually in merchant UI.
   */
  wif: string;

  createdAt: string;
}

export interface VoucherKeyPublicInfo {
  derivationIndex: number;
  address: string;
  hasWif: boolean;
  createdAt: string;
}
