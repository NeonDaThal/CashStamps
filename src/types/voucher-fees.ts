export interface VoucherFeeOutputPlan {
  platformFeeAddress?: string;
  platformFeeSats: number;
  platformFeeBasisPoints: number;

  merchantRetainedSats: number;
  merchantRetainedBasisPoints: number;

  bufferReserveAddress?: string;
  bufferReserveSats: number;
  bufferReserveBasisPoints: number;

  totalServiceFeeSats: number;
  totalServiceFeeBasisPoints: number;
}
