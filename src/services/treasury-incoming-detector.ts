import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService, type AddressCallback } from 'src/services/electrum';
import type {
  AddressGetBalance,
  AddressGetHistory,
  AddressGetMempool,
} from 'src/services/electrum-types';

export interface TreasuryIncomingPaymentDetection {
  treasuryAddress: string;
  requiredSats: number;
  baselineBalanceSats: number;
  currentBalanceSats: number;
  receivedSats: number;
  txid?: string;
  detectedAt: string;
  message: string;
}

export interface TreasuryIncomingPaymentWatcher {
  baselineBalanceSats: number;
  stop: () => Promise<void>;
}

export interface WatchTreasuryIncomingPaymentOptions {
  treasuryAddress: string;
  requiredSats: number;
  pollIntervalMs?: number;
  onDetected: (
    detection: TreasuryIncomingPaymentDetection
  ) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export interface CheckTreasuryIncomingPaymentOptions {
  treasuryAddress: string;
  requiredSats: number;

  /**
   * Use the watcher baseline when reconciling after the Android app resumes.
   *
   * This matters because if we simply restart the watcher after the customer
   * has already paid, the new baseline can include the incoming payment and the
   * app can miss the completed cash-out.
   */
  baselineBalanceSats?: number;
}

interface TreasuryBalanceSnapshot {
  confirmedSats: number;
  unconfirmedSats: number;
  totalBalanceSats: number;
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

function isDisconnectedElectrumError(error: Error): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('disconnected server') ||
    message.includes('not connected') ||
    message.includes('websocket') ||
    message.includes('connection')
  );
}

async function createStartedElectrum(): Promise<ElectrumService> {
  const electrum = new ElectrumService(ELECTRUM_SERVERS);
  await electrum.start();
  return electrum;
}

async function getTreasuryBalanceSnapshot(
  electrum: ElectrumService,
  treasuryAddress: string
): Promise<TreasuryBalanceSnapshot> {
  const balance = await electrum.request<AddressGetBalance>(
    'blockchain.address.get_balance',
    treasuryAddress
  );

  return {
    confirmedSats: balance.confirmed,
    unconfirmedSats: balance.unconfirmed,
    totalBalanceSats: balance.confirmed + balance.unconfirmed,
  };
}

async function getCandidateIncomingTxid(
  electrum: ElectrumService,
  treasuryAddress: string
): Promise<string | undefined> {
  try {
    const mempool = await electrum.request<AddressGetMempool>(
      'blockchain.address.get_mempool',
      treasuryAddress
    );

    const mempoolTx = mempool.find((item) => Boolean(item.tx_hash));

    if (mempoolTx?.tx_hash) {
      return mempoolTx.tx_hash;
    }
  } catch (error) {
    console.warn(error);
  }

  try {
    const history = await electrum.request<AddressGetHistory>(
      'blockchain.address.get_history',
      treasuryAddress,
      0,
      -1
    );

    const latestHistoryItem = [...history]
      .reverse()
      .find((item) => Boolean(item.tx_hash));

    return latestHistoryItem?.tx_hash;
  } catch (error) {
    console.warn(error);
    return undefined;
  }
}

async function disconnectElectrum(electrum: ElectrumService): Promise<void> {
  const electrumClient = electrum.electrumClient as unknown as
    | {
        disconnect?: () => Promise<void> | void;
        close?: () => Promise<void> | void;
      }
    | undefined;

  if (!electrumClient) {
    return;
  }

  try {
    if (typeof electrumClient.disconnect === 'function') {
      await electrumClient.disconnect();
      return;
    }

    if (typeof electrumClient.close === 'function') {
      await electrumClient.close();
    }
  } catch (error) {
    console.warn(error);
  }
}

export async function checkTreasuryIncomingPaymentOnce(
  options: CheckTreasuryIncomingPaymentOptions
): Promise<TreasuryIncomingPaymentDetection | null> {
  const treasuryAddress = options.treasuryAddress.trim();
  const requiredSats = Math.round(options.requiredSats);
  const baselineBalanceSats = Math.max(
    0,
    Math.round(options.baselineBalanceSats ?? 0)
  );

  if (!treasuryAddress) {
    throw new Error('Treasury address is required for payment detection.');
  }

  if (!Number.isFinite(requiredSats) || requiredSats <= 0) {
    throw new Error('Required payment amount must be greater than zero.');
  }

  const electrum = await createStartedElectrum();

  try {
    const currentSnapshot = await getTreasuryBalanceSnapshot(
      electrum,
      treasuryAddress
    );

    const receivedSats = currentSnapshot.totalBalanceSats - baselineBalanceSats;

    if (receivedSats < requiredSats) {
      return null;
    }

    const txid = await getCandidateIncomingTxid(electrum, treasuryAddress);

    return {
      treasuryAddress,
      requiredSats,
      baselineBalanceSats,
      currentBalanceSats: currentSnapshot.totalBalanceSats,
      receivedSats,
      txid,
      detectedAt: new Date().toISOString(),
      message: 'Incoming BCH payment detected in merchant treasury wallet.',
    };
  } catch (error) {
    throw normalizeError(error, 'Could not check treasury incoming payment.');
  } finally {
    await disconnectElectrum(electrum);
  }
}

export async function watchTreasuryIncomingPayment(
  options: WatchTreasuryIncomingPaymentOptions
): Promise<TreasuryIncomingPaymentWatcher> {
  const treasuryAddress = options.treasuryAddress.trim();
  const requiredSats = Math.round(options.requiredSats);
  const pollIntervalMs = options.pollIntervalMs ?? 3_000;

  if (!treasuryAddress) {
    throw new Error('Treasury address is required for payment detection.');
  }

  if (!Number.isFinite(requiredSats) || requiredSats <= 0) {
    throw new Error('Required payment amount must be greater than zero.');
  }

  let electrum = await createStartedElectrum();

  const baselineSnapshot = await getTreasuryBalanceSnapshot(
    electrum,
    treasuryAddress
  );

  let isStopped = false;
  let isChecking = false;
  let isReconnecting = false;
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  const onAddressNotification: AddressCallback = () => {
    void checkForPayment();
  };

  async function safelyUnsubscribeCurrentElectrum(): Promise<void> {
    try {
      await electrum.unsubscribeAddress(treasuryAddress, onAddressNotification);
    } catch (error) {
      console.warn(error);
    }
  }

  async function reconnectElectrum(): Promise<void> {
    if (isStopped || isReconnecting) {
      return;
    }

    isReconnecting = true;

    try {
      await safelyUnsubscribeCurrentElectrum();
      await disconnectElectrum(electrum);

      electrum = await createStartedElectrum();

      await electrum.subscribeAddress(treasuryAddress, onAddressNotification);
    } finally {
      isReconnecting = false;
    }
  }

  async function stopWatcher(): Promise<void> {
    if (isStopped) {
      return;
    }

    isStopped = true;

    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }

    await safelyUnsubscribeCurrentElectrum();
    await disconnectElectrum(electrum);
  }

  async function checkForPayment(): Promise<void> {
    if (isStopped || isChecking || isReconnecting) {
      return;
    }

    isChecking = true;

    try {
      const detection = await checkTreasuryIncomingPaymentOnce({
        treasuryAddress,
        requiredSats,
        baselineBalanceSats: baselineSnapshot.totalBalanceSats,
      });

      if (!detection) {
        return;
      }

      await stopWatcher();
      await options.onDetected(detection);
    } catch (error) {
      const normalizedError = normalizeError(
        error,
        'Could not check treasury incoming payment.'
      );

      if (isDisconnectedElectrumError(normalizedError)) {
        try {
          await reconnectElectrum();
          return;
        } catch (reconnectError) {
          const normalizedReconnectError = normalizeError(
            reconnectError,
            'Could not reconnect treasury payment detector.'
          );

          options.onError?.(normalizedReconnectError);
          return;
        }
      }

      options.onError?.(normalizedError);
    } finally {
      isChecking = false;
    }
  }

  const watcher: TreasuryIncomingPaymentWatcher = {
    baselineBalanceSats: baselineSnapshot.totalBalanceSats,
    stop: stopWatcher,
  };

  try {
    await electrum.subscribeAddress(treasuryAddress, onAddressNotification);
  } catch (error) {
    await stopWatcher();
    throw normalizeError(error, 'Could not subscribe to treasury address.');
  }

  pollTimer = setInterval(() => {
    void checkForPayment();
  }, pollIntervalMs);

  void checkForPayment();

  return watcher;
}
