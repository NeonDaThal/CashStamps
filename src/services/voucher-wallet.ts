import { generateBip39Mnemonic } from '@bitauth/libauth';
import { get, set } from 'idb-keyval';

import { ElectrumService } from 'src/services/electrum';
import { WalletHD } from 'src/utils/wallet-hd';

const VOUCHER_MNEMONIC_KEY = 'bch-voucher-mnemonic';
const NEXT_VOUCHER_DERIVATION_INDEX_KEY = 'bch-voucher-next-derivation-index';

/**
 * This placeholder Electrum service is only used for address derivation.
 * It is not started and should not be used for monitoring or broadcasting.
 *
 * WalletHD/WalletP2PKH require an ElectrumService in their constructors,
 * but deriving a cashaddr via wallet.getAddress() does not make Electrum calls.
 */
const DERIVATION_ONLY_ELECTRUM = new ElectrumService([]);

export interface DerivedVoucherAddress {
  derivationIndex: number;
  address: string;
}

async function getOrCreateVoucherMnemonic(): Promise<string> {
  const existingMnemonic = await get<string>(VOUCHER_MNEMONIC_KEY);

  if (existingMnemonic) {
    return existingMnemonic;
  }

  const mnemonic = generateBip39Mnemonic();

  await set(VOUCHER_MNEMONIC_KEY, mnemonic);

  return mnemonic;
}

async function getNextDerivationIndex(): Promise<number> {
  const existingIndex = await get<number>(NEXT_VOUCHER_DERIVATION_INDEX_KEY);

  if (typeof existingIndex === 'number' && existingIndex >= 0) {
    return existingIndex;
  }

  return 0;
}

async function incrementNextDerivationIndex(
  currentIndex: number
): Promise<void> {
  await set(NEXT_VOUCHER_DERIVATION_INDEX_KEY, currentIndex + 1);
}

export async function deriveNextVoucherAddress(): Promise<DerivedVoucherAddress> {
  const mnemonic = await getOrCreateVoucherMnemonic();
  const derivationIndex = await getNextDerivationIndex();

  const walletHd = await WalletHD.fromMnemonic(
    mnemonic,
    DERIVATION_ONLY_ELECTRUM
  );

  const [wallet] = walletHd.deriveWallets(1, derivationIndex);

  if (!wallet) {
    throw new Error('Could not derive voucher wallet.');
  }

  const address = wallet.getAddress();

  await incrementNextDerivationIndex(derivationIndex);

  return {
    derivationIndex,
    address,
  };
}
