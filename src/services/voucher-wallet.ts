import { generateBip39Mnemonic } from '@bitauth/libauth';
import { get, set } from 'idb-keyval';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import type {
  VoucherAddressBalance,
  VoucherAddressUtxo,
} from 'src/types/voucher-redemption-detection';
import type {
  VoucherKeyExport,
  VoucherKeyPublicInfo,
} from 'src/types/voucher-key';
import { WalletHD } from 'src/utils/wallet-hd';

const VOUCHER_MNEMONIC_KEY = 'bch-voucher-mnemonic';
const NEXT_VOUCHER_DERIVATION_INDEX_KEY = 'bch-voucher-next-derivation-index';

/**
 * This placeholder Electrum service is only used for address/key derivation.
 * It is not started and should not be used for monitoring or broadcasting.
 *
 * WalletHD/WalletP2PKH require an ElectrumService in their constructors,
 * but deriving keys/addresses does not make Electrum calls.
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

async function deriveVoucherWalletAtIndex(derivationIndex: number) {
  const mnemonic = await getOrCreateVoucherMnemonic();

  const walletHd = await WalletHD.fromMnemonic(
    mnemonic,
    DERIVATION_ONLY_ELECTRUM
  );

  const [wallet] = walletHd.deriveWallets(1, derivationIndex);

  if (!wallet) {
    throw new Error('Could not derive voucher wallet.');
  }

  return wallet;
}

async function deriveVoucherWalletAtIndexWithElectrum(
  derivationIndex: number,
  electrum: ElectrumService
) {
  const mnemonic = await getOrCreateVoucherMnemonic();

  const walletHd = await WalletHD.fromMnemonic(mnemonic, electrum);

  const [wallet] = walletHd.deriveWallets(1, derivationIndex);

  if (!wallet) {
    throw new Error('Could not derive voucher wallet.');
  }

  return wallet;
}

function mapVoucherUtxos(unspentOutputs: unknown[]): VoucherAddressUtxo[] {
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
    };
  });
}

function tryGetWalletWif(wallet: unknown): string {
  /**
   * CashStamps wallet internals may expose the private key/WIF through a method
   * or property depending on the implementation. We keep this intentionally
   * defensive until we confirm the exact wallet API from this fork.
   */
  const walletLike = wallet as {
    getWif?: () => string;
    getWIF?: () => string;
    toWif?: () => string;
    toWIF?: () => string;
    wif?: string;
    privateKeyWif?: string;
  };

  if (typeof walletLike.getWif === 'function') {
    return walletLike.getWif();
  }

  if (typeof walletLike.getWIF === 'function') {
    return walletLike.getWIF();
  }

  if (typeof walletLike.toWif === 'function') {
    return walletLike.toWif();
  }

  if (typeof walletLike.toWIF === 'function') {
    return walletLike.toWIF();
  }

  if (typeof walletLike.wif === 'string') {
    return walletLike.wif;
  }

  if (typeof walletLike.privateKeyWif === 'string') {
    return walletLike.privateKeyWif;
  }

  throw new Error(
    'Voucher WIF export is not wired yet for this wallet implementation.'
  );
}

export async function deriveNextVoucherAddress(): Promise<DerivedVoucherAddress> {
  const derivationIndex = await getNextDerivationIndex();
  const wallet = await deriveVoucherWalletAtIndex(derivationIndex);
  const address = wallet.getAddress();

  await incrementNextDerivationIndex(derivationIndex);

  return {
    derivationIndex,
    address,
  };
}

export async function getVoucherKeyPublicInfo(
  derivationIndex: number
): Promise<VoucherKeyPublicInfo> {
  const wallet = await deriveVoucherWalletAtIndex(derivationIndex);

  return {
    derivationIndex,
    address: wallet.getAddress(),
    hasWif: true,
    createdAt: new Date().toISOString(),
  };
}

export async function exportVoucherKeyAtIndex(
  derivationIndex: number
): Promise<VoucherKeyExport> {
  const wallet = await deriveVoucherWalletAtIndex(derivationIndex);
  const wif = tryGetWalletWif(wallet);

  return {
    derivationIndex,
    address: wallet.getAddress(),
    wif,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Internal signing data for the exceptional Printed-voucher reclaim path.
 *
 * This deliberately does NOT expose the voucher WIF.
 *
 * The returned input directives are already bound to the internally-derived
 * voucher private key and are used only to construct the exact reclaim
 * transaction.
 */
export async function getVoucherReclaimSigningDataAtIndex(
  derivationIndex: number
) {
  if (!Number.isSafeInteger(derivationIndex) || derivationIndex < 0) {
    throw new Error('Voucher reclaim derivation index is invalid.');
  }

  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  await electrum.start();

  try {
    const wallet = await deriveVoucherWalletAtIndexWithElectrum(
      derivationIndex,
      electrum
    );

    const inputDirectives = await wallet.getUnspentDirectives();

    /**
     * getUnspentDirectives() refreshes wallet.unspents from this same wallet
     * immediately before creating the directives, so these arrays describe the
     * same signable snapshot.
     */
    const utxos = mapVoucherUtxos(wallet.unspents.value);

    if (inputDirectives.length !== utxos.length) {
      throw new Error(
        'Voucher reclaim signing inputs do not match the current voucher UTXOs.'
      );
    }

    const entries = utxos.map((utxo, index) => {
      const inputDirective = inputDirectives[index];

      if (!inputDirective) {
        throw new Error('Voucher reclaim signing directive is missing.');
      }

      return {
        utxo,
        inputDirective,
      };
    });

    return {
      derivationIndex,

      address: wallet.getAddress(),

      entries,
    };
  } finally {
    await electrum.stop();
  }
}

export async function getVoucherWalletBalanceAtIndex(
  derivationIndex: number
): Promise<VoucherAddressBalance> {
  const electrum = new ElectrumService(ELECTRUM_SERVERS);
  await electrum.start();

  const wallet = await deriveVoucherWalletAtIndexWithElectrum(
    derivationIndex,
    electrum
  );

  const unspentOutputs = await wallet.getUnspentOutputs();
  const utxos = mapVoucherUtxos(unspentOutputs);

  return {
    derivationIndex,
    address: wallet.getAddress(),
    balanceSats: wallet.balance.value,
    utxoCount: utxos.length,
    utxos,
    checkedAt: new Date().toISOString(),
  };
}
