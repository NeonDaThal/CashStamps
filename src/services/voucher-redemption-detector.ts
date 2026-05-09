import { getVoucherWalletBalanceAtIndex } from 'src/services/voucher-wallet';
import type {
  VoucherRecord,
  VoucherRedemptionDetection,
} from 'src/types/voucher';

function voucherWasExpectedToBeFunded(voucher: VoucherRecord): boolean {
  return (
    voucher.fundingBroadcast?.status === 'broadcasted' ||
    voucher.manualRedemption?.status === 'swept'
  );
}

export async function detectVoucherRedemptionStatus(
  voucher: VoucherRecord
): Promise<VoucherRedemptionDetection> {
  if (voucher.derivationIndex < 0) {
    return {
      status: 'unknown',
      address: voucher.address,
      derivationIndex: voucher.derivationIndex,
      balanceSats: 0,
      utxoCount: 0,
      checkedAt: new Date().toISOString(),
      message: 'Voucher does not have a valid derivation index.',
    };
  }

  const balance = await getVoucherWalletBalanceAtIndex(voucher.derivationIndex);

  if (voucher.address && balance.address !== voucher.address) {
    return {
      status: 'unknown',
      address: balance.address,
      derivationIndex: voucher.derivationIndex,
      balanceSats: balance.balanceSats,
      utxoCount: balance.utxoCount,
      checkedAt: balance.checkedAt,
      message:
        'Derived voucher address does not match the saved voucher address.',
    };
  }

  if (balance.balanceSats > 0 || balance.utxoCount > 0) {
    return {
      status: 'funded',
      address: balance.address,
      derivationIndex: voucher.derivationIndex,
      balanceSats: balance.balanceSats,
      utxoCount: balance.utxoCount,
      checkedAt: balance.checkedAt,
      message: 'Voucher address currently has spendable BCH.',
    };
  }

  if (voucherWasExpectedToBeFunded(voucher)) {
    return {
      status: 'swept',
      address: balance.address,
      derivationIndex: voucher.derivationIndex,
      balanceSats: balance.balanceSats,
      utxoCount: balance.utxoCount,
      checkedAt: balance.checkedAt,
      message:
        'Voucher address has no spendable BCH and was expected to have been funded. It appears swept/redeemed.',
    };
  }

  return {
    status: 'unfunded',
    address: balance.address,
    derivationIndex: voucher.derivationIndex,
    balanceSats: balance.balanceSats,
    utxoCount: balance.utxoCount,
    checkedAt: balance.checkedAt,
    message:
      'Voucher address has no spendable BCH. No confirmed on-chain funding is known for this local record.',
  };
}
