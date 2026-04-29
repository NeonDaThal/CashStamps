import { generateBip39Mnemonic } from '@bitauth/libauth';
import { del, get, set } from 'idb-keyval';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import type {
  TreasuryWalletBalance,
  TreasuryWalletPublicInfo,
  TreasuryWalletRecord,
} from 'src/types/treasury';
import { WalletHD } from 'src/utils/wallet-hd';

const TREASURY_WALLET_KEY = 'bch-voucher-treasury-wallet';

/**
 * This placeholder Electrum service is only used for address derivation.
 * It is not started and should not be used for monitoring or broadcasting.
 */
const DERIVATION_ONLY_ELECTRUM = new ElectrumService([]);

async function deriveTreasuryAddressFromMnemonic(
  mnemonic: string
): Promise<string> {
  const walletHd = await WalletHD.fromMnemonic(
    mnemonic,
    DERIVATION_ONLY_ELECTRUM
  );

  const [wallet] = walletHd.deriveWallets(1, 0);

  if (!wallet) {
    throw new Error('Could not derive treasury wallet address.');
  }

  return wallet.getAddress();
}

async function deriveTreasuryWalletWithElectrum(
  mnemonic: string,
  electrum: ElectrumService
) {
  const walletHd = await WalletHD.fromMnemonic(mnemonic, electrum);
  const [wallet] = walletHd.deriveWallets(1, 0);

  if (!wallet) {
    throw new Error('Could not derive treasury wallet.');
  }

  return wallet;
}

export async function getTreasuryWalletRecord(): Promise<
  TreasuryWalletRecord | undefined
> {
  return get<TreasuryWalletRecord>(TREASURY_WALLET_KEY);
}

export async function getTreasuryWalletPublicInfo(): Promise<TreasuryWalletPublicInfo> {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    return {
      address: '',
      createdAt: '',
      updatedAt: '',
      isSetup: false,
    };
  }

  return {
    address: treasuryWallet.address,
    createdAt: treasuryWallet.createdAt,
    updatedAt: treasuryWallet.updatedAt,
    isSetup: true,
  };
}

export async function createTreasuryWallet(): Promise<TreasuryWalletPublicInfo> {
  const existingWallet = await getTreasuryWalletRecord();

  if (existingWallet) {
    return getTreasuryWalletPublicInfo();
  }

  const now = new Date().toISOString();
  const mnemonic = generateBip39Mnemonic();
  const address = await deriveTreasuryAddressFromMnemonic(mnemonic);

  const treasuryWallet: TreasuryWalletRecord = {
    mnemonic,
    address,
    createdAt: now,
    updatedAt: now,
  };

  await set(TREASURY_WALLET_KEY, treasuryWallet);

  return {
    address,
    createdAt: now,
    updatedAt: now,
    isSetup: true,
  };
}

export async function getTreasuryWalletBalance(): Promise<TreasuryWalletBalance> {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    throw new Error('Treasury wallet is not set up.');
  }

  const electrum = new ElectrumService(ELECTRUM_SERVERS);
  await electrum.start();

  const wallet = await deriveTreasuryWalletWithElectrum(
    treasuryWallet.mnemonic,
    electrum
  );

  const unspentOutputs = await wallet.getUnspentOutputs();

  return {
    address: wallet.getAddress(),
    balanceSats: wallet.balance.value,
    utxoCount: unspentOutputs.length,
    checkedAt: new Date().toISOString(),
  };
}

export async function clearTreasuryWallet(): Promise<void> {
  await del(TREASURY_WALLET_KEY);
}
