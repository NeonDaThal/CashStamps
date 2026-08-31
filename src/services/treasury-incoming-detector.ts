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
   * app can miss the completed Cash-out.
   */
  baselineBalanceSats?: number;
}

interface TreasuryBalanceSnapshot {
  confirmedSats: number;
  unconfirmedSats: number;
  totalBalanceSats: number;
}

interface NormalizedPaymentCheck {
  treasuryAddress: string;
  requiredSats: number;
  baselineBalanceSats: number;
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

export function isTransientTreasuryDetectorConnectionError(
  error: Error
): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('disconnected server') ||
    message.includes('not connected') ||
    message.includes('websocket') ||
    message.includes('connection') ||
    message.includes('failed to connect') ||
    message.includes('could not connect') ||
    message.includes('connect to electrum') ||
    message.includes('reconnect')
  );
}

function normaliseRequiredSats(requiredSats: number): number {
  if (!Number.isSafeInteger(requiredSats) || requiredSats <= 0) {
    throw new Error(
      'Required payment amount must be a positive integer number of satoshis.'
    );
  }

  return requiredSats;
}

function normaliseBaselineBalanceSats(
  baselineBalanceSats: number | undefined
): number {
  const value = baselineBalanceSats ?? 0;

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      'Treasury payment baseline must be a non-negative integer number of satoshis.'
    );
  }

  return value;
}

function normalisePaymentCheck(
  options: CheckTreasuryIncomingPaymentOptions
): NormalizedPaymentCheck {
  const treasuryAddress = options.treasuryAddress.trim();

  if (!treasuryAddress) {
    throw new Error('Treasury address is required for payment detection.');
  }

  return {
    treasuryAddress,

    requiredSats: normaliseRequiredSats(options.requiredSats),

    baselineBalanceSats: normaliseBaselineBalanceSats(
      options.baselineBalanceSats
    ),
  };
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

async function detectIncomingPaymentUsingElectrum(
  electrum: ElectrumService,
  check: NormalizedPaymentCheck
): Promise<TreasuryIncomingPaymentDetection | null> {
  const currentSnapshot = await getTreasuryBalanceSnapshot(
    electrum,
    check.treasuryAddress
  );

  const receivedSats =
    currentSnapshot.totalBalanceSats - check.baselineBalanceSats;

  if (receivedSats < check.requiredSats) {
    return null;
  }

  const txid = await getCandidateIncomingTxid(electrum, check.treasuryAddress);

  return {
    treasuryAddress: check.treasuryAddress,

    requiredSats: check.requiredSats,

    baselineBalanceSats: check.baselineBalanceSats,

    currentBalanceSats: currentSnapshot.totalBalanceSats,

    receivedSats,

    txid,

    detectedAt: new Date().toISOString(),

    message: 'Incoming BCH payment detected in merchant treasury wallet.',
  };
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
  const check = normalisePaymentCheck(options);

  const electrum = await createStartedElectrum();

  try {
    return await detectIncomingPaymentUsingElectrum(electrum, check);
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

  const requiredSats = normaliseRequiredSats(options.requiredSats);

  const pollIntervalMs = options.pollIntervalMs ?? 3_000;

  if (!treasuryAddress) {
    throw new Error('Treasury address is required for payment detection.');
  }

  let electrum = await createStartedElectrum();

  const baselineSnapshot = await getTreasuryBalanceSnapshot(
    electrum,
    treasuryAddress
  );

  const check: NormalizedPaymentCheck = {
    treasuryAddress,

    requiredSats,

    baselineBalanceSats: baselineSnapshot.totalBalanceSats,
  };

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

  async function handleDetection(
    detection: TreasuryIncomingPaymentDetection | null
  ): Promise<boolean> {
    if (!detection) {
      return false;
    }

    await stopWatcher();

    await options.onDetected(detection);

    return true;
  }

  async function checkForPayment(): Promise<void> {
    if (isStopped || isChecking || isReconnecting) {
      return;
    }

    isChecking = true;

    try {
      try {
        const detection = await detectIncomingPaymentUsingElectrum(
          electrum,
          check
        );

        await handleDetection(detection);

        return;
      } catch (error) {
        const normalizedError = normalizeError(
          error,
          'Could not check treasury incoming payment.'
        );

        if (!isTransientTreasuryDetectorConnectionError(normalizedError)) {
          options.onError?.(normalizedError);

          return;
        }
      }

      /**
       * The active watcher connection failed.
       *
       * Reconnect the SAME watcher and immediately retry the payment check.
       * Do not open an unrelated second Electrum connection for each poll.
       */
      try {
        await reconnectElectrum();

        if (isStopped) {
          return;
        }

        const retryDetection = await detectIncomingPaymentUsingElectrum(
          electrum,
          check
        );

        await handleDetection(retryDetection);
      } catch (reconnectError) {
        options.onError?.(
          normalizeError(
            reconnectError,
            'Could not reconnect treasury payment detector.'
          )
        );
      }
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
