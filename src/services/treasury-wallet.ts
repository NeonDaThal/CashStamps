import { generateBip39Mnemonic } from '@bitauth/libauth';
import { del, get, set } from 'idb-keyval';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import { getCashOutRecords } from 'src/services/cash-out-store';
import type {
  TreasuryRestoreCheckResult,
  TreasuryRestoreImportResult,
  TreasuryUtxo,
  TreasuryWalletBackupInfo,
  TreasuryWalletBalance,
  TreasuryWalletPublicInfo,
  TreasuryWalletRecord,
  TreasuryCashOutReceivingAddress,
} from 'src/types/treasury';
import { WalletHD } from 'src/utils/wallet-hd';

const TREASURY_WALLET_KEY = 'bch-voucher-treasury-wallet';

const NEXT_TREASURY_CASH_OUT_DERIVATION_INDEX_KEY =
  'bch-voucher-treasury-next-cash-out-derivation-index';

/**
 * This placeholder Electrum service is only used for address derivation.
 * It is not started and should not be used for monitoring or broadcasting.
 */
const DERIVATION_ONLY_ELECTRUM = new ElectrumService([]);

function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().replace(/\s+/g, ' ');
}

async function deriveTreasuryWalletAtIndex(
  mnemonic: string,
  derivationIndex: number
) {
  const normalizedMnemonic = normalizeMnemonic(mnemonic);

  const walletHd = await WalletHD.fromMnemonic(
    normalizedMnemonic,
    DERIVATION_ONLY_ELECTRUM
  );

  const [wallet] = walletHd.deriveWallets(1, derivationIndex);

  if (!wallet) {
    throw new Error('Could not derive treasury wallet address.');
  }

  return wallet;
}

async function deriveTreasuryAddressFromMnemonic(
  mnemonic: string
): Promise<string> {
  const wallet = await deriveTreasuryWalletAtIndex(mnemonic, 0);

  return wallet.getAddress();
}

async function deriveTreasuryWalletAtIndexWithElectrum(
  mnemonic: string,
  derivationIndex: number,
  electrum: ElectrumService
) {
  const normalizedMnemonic = normalizeMnemonic(mnemonic);
  const walletHd = await WalletHD.fromMnemonic(normalizedMnemonic, electrum);
  const [wallet] = walletHd.deriveWallets(1, derivationIndex);

  if (!wallet) {
    throw new Error('Could not derive treasury wallet.');
  }

  return wallet;
}

function mapTreasuryUtxos(
  unspentOutputs: unknown[],
  address: string,
  derivationIndex: number
): TreasuryUtxo[] {
  return unspentOutputs.map((utxo) => {
    const utxoLike =
      typeof utxo === 'object' && utxo !== null
        ? (utxo as Record<string, unknown>)
        : {};

    const transactionHash =
      utxoLike.outpointTransactionHash ??
      utxoLike.tx_hash ??
      utxoLike.txHash ??
      '';

    const outpointIndex =
      utxoLike.outpointIndex ?? utxoLike.tx_pos ?? utxoLike.vout ?? 0;

    const valueSats =
      utxoLike.valueSatoshis ?? utxoLike.value ?? utxoLike.satoshis ?? 0;

    return {
      outpointTransactionHash:
        typeof transactionHash === 'string' ? transactionHash : '',

      outpointIndex: Number(outpointIndex),

      valueSats: Number(valueSats),

      address,

      derivationIndex,
    };
  });
}

async function getNextTreasuryCashOutDerivationIndex(): Promise<number> {
  const existingIndex = await get<number>(
    NEXT_TREASURY_CASH_OUT_DERIVATION_INDEX_KEY
  );

  if (typeof existingIndex === 'number' && existingIndex >= 1) {
    return existingIndex;
  }

  return 1;
}

async function incrementNextTreasuryCashOutDerivationIndex(
  currentIndex: number
): Promise<void> {
  await set(NEXT_TREASURY_CASH_OUT_DERIVATION_INDEX_KEY, currentIndex + 1);
}

async function getKnownTreasuryBalanceDerivationIndexes(): Promise<number[]> {
  const [cashOutRecords, nextCashOutDerivationIndex] = await Promise.all([
    getCashOutRecords(),
    getNextTreasuryCashOutDerivationIndex(),
  ]);

  const recordedCashOutIndexes = cashOutRecords
    .map((record) => record.treasuryReceivingDerivationIndex)
    .filter((derivationIndex): derivationIndex is number => {
      return (
        typeof derivationIndex === 'number' &&
        Number.isInteger(derivationIndex) &&
        derivationIndex >= 1
      );
    });

  /**
   * Every index below the durable "next index" value has already been
   * allocated by this installation.
   *
   * Scan those addresses even if a Cash-out record was interrupted or lost
   * after address allocation.
   */
  const allocatedCashOutIndexes = Array.from(
    {
      length: Math.max(0, nextCashOutDerivationIndex - 1),
    },
    (_, offset) => offset + 1
  );

  return [
    ...new Set([0, ...allocatedCashOutIndexes, ...recordedCashOutIndexes]),
  ].sort((a, b) => a - b);
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

export async function getTreasuryWalletBackupInfo(): Promise<TreasuryWalletBackupInfo> {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    throw new Error('Treasury wallet is not set up.');
  }

  return {
    mnemonic: treasuryWallet.mnemonic,
    address: treasuryWallet.address,
    exportedAt: new Date().toISOString(),
  };
}

export async function checkTreasuryRestoreMnemonic(
  mnemonic: string
): Promise<TreasuryRestoreCheckResult> {
  const normalizedMnemonic = normalizeMnemonic(mnemonic);

  if (!normalizedMnemonic) {
    throw new Error('Enter a treasury seed phrase to check.');
  }

  const currentTreasuryWallet = await getTreasuryWalletRecord();
  const derivedAddress = await deriveTreasuryAddressFromMnemonic(
    normalizedMnemonic
  );

  return {
    mnemonic: normalizedMnemonic,
    derivedAddress,
    currentAddress: currentTreasuryWallet?.address ?? '',
    matchesCurrentWallet:
      Boolean(currentTreasuryWallet?.address) &&
      currentTreasuryWallet?.address === derivedAddress,
    checkedAt: new Date().toISOString(),
  };
}

export async function importTreasuryWalletFromMnemonic(
  mnemonic: string
): Promise<TreasuryRestoreImportResult> {
  const normalizedMnemonic = normalizeMnemonic(mnemonic);

  if (!normalizedMnemonic) {
    throw new Error('Enter a treasury seed phrase to import.');
  }

  const existingWallet = await getTreasuryWalletRecord();
  const now = new Date().toISOString();
  const address = await deriveTreasuryAddressFromMnemonic(normalizedMnemonic);

  const treasuryWallet: TreasuryWalletRecord = {
    mnemonic: normalizedMnemonic,
    address,
    createdAt: existingWallet?.createdAt ?? now,
    updatedAt: now,
  };

  await set(TREASURY_WALLET_KEY, treasuryWallet);

  return {
    address,
    importedAt: now,
    replacedExistingWallet: Boolean(existingWallet),
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

export async function deriveNextTreasuryCashOutReceivingAddress(): Promise<TreasuryCashOutReceivingAddress> {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    throw new Error('Treasury wallet is not set up.');
  }

  const derivationIndex = await getNextTreasuryCashOutDerivationIndex();
  const wallet = await deriveTreasuryWalletAtIndex(
    treasuryWallet.mnemonic,
    derivationIndex
  );

  await incrementNextTreasuryCashOutDerivationIndex(derivationIndex);

  return {
    treasuryMasterAddress: treasuryWallet.address,
    address: wallet.getAddress(),
    derivationIndex,
  };
}

export async function getTreasuryWalletBalance(): Promise<TreasuryWalletBalance> {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    throw new Error('Treasury wallet is not set up.');
  }

  const electrum = new ElectrumService(ELECTRUM_SERVERS);
  await electrum.start();

  const derivationIndexes = await getKnownTreasuryBalanceDerivationIndexes();

  const balances = await Promise.all(
    derivationIndexes.map(async (derivationIndex) => {
      const wallet = await deriveTreasuryWalletAtIndexWithElectrum(
        treasuryWallet.mnemonic,
        derivationIndex,
        electrum
      );

      const address = wallet.getAddress();
      const unspentOutputs = await wallet.getUnspentOutputs();
      const utxos = mapTreasuryUtxos(unspentOutputs, address, derivationIndex);

      return {
        address,
        derivationIndex,
        balanceSats: wallet.balance.value,
        utxos,
      };
    })
  );

  const allUtxos = balances.flatMap((balance) => balance.utxos);
  const totalBalanceSats = balances.reduce(
    (total, balance) => total + balance.balanceSats,
    0
  );

  return {
    address: treasuryWallet.address,
    balanceSats: totalBalanceSats,
    utxoCount: allUtxos.length,
    utxos: allUtxos,
    checkedAt: new Date().toISOString(),
    checkedAddressCount: derivationIndexes.length,
  };
}

export async function clearTreasuryWallet(): Promise<void> {
  await del(TREASURY_WALLET_KEY);
}
