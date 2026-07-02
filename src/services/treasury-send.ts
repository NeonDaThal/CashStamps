import { hexToBin } from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import { broadcastTreasuryTransactionDraft } from 'src/services/treasury-broadcast';
import { createTreasuryTransactionDraftFromPlan } from 'src/services/treasury-transaction-draft';
import {
  getTreasuryWalletBalance,
  getTreasuryWalletPublicInfo,
} from 'src/services/treasury-wallet';
import type { TreasuryBroadcastResult } from 'src/types/treasury-broadcast';
import type { TreasurySendDraftResult } from 'src/types/treasury-send';
import type { TreasuryFundingPreviewSelectedUtxo } from 'src/types/treasury-funding';
import type {
  TreasuryTransactionPlan,
  TreasuryTransactionPlanOutput,
} from 'src/types/treasury-transaction';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import { Address } from 'src/utils/address';

/**
 * TEMPORARY TEST SWITCH.
 *
 * Keep this true only while testing a tiny real Treasury Send transaction.
 * Set it back to false immediately after the test checkpoint.
 *
 * This bypass is used only by broadcastTreasurySendDraft() in the Send dialog.
 * The normal treasury broadcast service and its global funding safety gate are
 * left intact for the rest of the app.
 */
export const TEMPORARY_REAL_TREASURY_SEND_BROADCAST_ENABLED = false;

const MINIMUM_SEND_SATS = 546;
const SATS_PER_BCH = 100_000_000n;
const MINIMUM_FEE_SATS = 250;
const MAX_SEND_FEE_SAFETY_SATS = 100;

export interface ParsedTreasurySendTarget {
  address: string;
  amountSats?: number;
}

function validateBchAddress(address: string): void {
  Address.fromCashAddrOrLegacy(address).toLockscriptBytes();
}

export function parseBchAmountToSats(value: string): number | null {
  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(/^(\d+)(?:\.(\d{0,8}))?$/);

  if (!match) {
    return null;
  }

  const wholeBch = BigInt(match[1] ?? '0');
  const fractionalSats = BigInt((match[2] ?? '').padEnd(8, '0'));
  const sats = wholeBch * SATS_PER_BCH + fractionalSats;

  if (sats > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(sats);
}

export function formatSatsAsBchInput(sats: number): string {
  const wholeBch = Math.floor(sats / Number(SATS_PER_BCH));
  const fractionalSats = Math.abs(sats % Number(SATS_PER_BCH));
  const fractionalText = fractionalSats.toString().padStart(8, '0');
  const trimmedFractionalText = fractionalText.replace(/0+$/, '');

  if (!trimmedFractionalText) {
    return String(wholeBch);
  }

  return `${wholeBch}.${trimmedFractionalText}`;
}

export function parseTreasurySendTarget(
  input: string
): ParsedTreasurySendTarget {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error('Enter a BCH address or payment URI.');
  }

  const [rawAddress = '', rawQuery = ''] = trimmedInput.split('?');
  const address = rawAddress.trim();

  if (!address) {
    throw new Error('Enter a BCH address.');
  }

  validateBchAddress(address);

  const params = new URLSearchParams(rawQuery);
  const amountParam = params.get('amount');
  const amountSats = amountParam ? parseBchAmountToSats(amountParam) : null;

  if (amountParam && amountSats === null) {
    throw new Error('The payment URI amount is invalid.');
  }

  return {
    address,
    ...(amountSats !== null ? { amountSats } : {}),
  };
}

function estimateTransactionFeeSats(
  inputCount: number,
  outputCount: number
): number {
  const estimatedBytes = 10 + inputCount * 148 + outputCount * 34;
  return Math.max(MINIMUM_FEE_SATS, estimatedBytes);
}

function selectTreasuryUtxos(
  utxos: TreasuryFundingPreviewSelectedUtxo[],
  amountSats: number
): {
  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;
  estimatedFeeSats: number;
  estimatedChangeSats: number;
} | null {
  const sortedUtxos = [...utxos].sort((a, b) => b.valueSats - a.valueSats);
  const selectedUtxos: TreasuryFundingPreviewSelectedUtxo[] = [];
  let selectedInputSats = 0;

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(utxo);
    selectedInputSats += utxo.valueSats;

    const estimatedFeeSats = estimateTransactionFeeSats(
      selectedUtxos.length,
      2
    );
    const estimatedChangeSats =
      selectedInputSats - amountSats - estimatedFeeSats;

    if (estimatedChangeSats >= 0) {
      return {
        selectedUtxos,
        selectedInputSats,
        estimatedFeeSats,
        estimatedChangeSats,
      };
    }
  }

  return null;
}

function createInvalidTreasurySendDraftResult(
  errorMessage: string
): TreasurySendDraftResult {
  return {
    status: 'invalid',
    errorMessage,
    createdAt: new Date().toISOString(),
  };
}

function createTreasurySendPlan(options: {
  treasuryAddress: string;
  destinationAddress: string;
  amountSats: number;
  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;
  estimatedFeeSats: number;
  estimatedChangeSats: number;
}): TreasuryTransactionPlan {
  const nonChangeOutputs: TreasuryTransactionPlanOutput[] = [
    {
      address: options.destinationAddress,
      valueSats: options.amountSats,
      purpose: 'voucher',
    },
  ];

  const outputs: TreasuryTransactionPlanOutput[] = [
    ...nonChangeOutputs,
    ...(options.estimatedChangeSats > 0
      ? [
          {
            address: options.treasuryAddress,
            valueSats: options.estimatedChangeSats,
            purpose: 'change' as const,
          },
        ]
      : []),
  ];

  return {
    status: 'valid',
    treasuryAddress: options.treasuryAddress,
    voucherAddress: options.destinationAddress,
    selectedUtxos: options.selectedUtxos,
    selectedInputSats: options.selectedInputSats,
    outputs,
    voucherOutputSats: options.amountSats,
    platformFeeOutputSats: 0,
    bufferReserveOutputSats: 0,
    estimatedFeeSats: options.estimatedFeeSats,
    estimatedChangeSats: options.estimatedChangeSats,
    createdAt: new Date().toISOString(),
  };
}

async function createDraftForSelection(options: {
  treasuryAddress: string;
  destinationAddress: string;
  amountSats: number;
  selectedUtxos: TreasuryFundingPreviewSelectedUtxo[];
  selectedInputSats: number;
  estimatedFeeSats: number;
  estimatedChangeSats: number;
}): Promise<TreasurySendDraftResult> {
  const plan = createTreasurySendPlan(options);
  const draft = await createTreasuryTransactionDraftFromPlan(plan);

  if (draft.status !== 'created') {
    return createInvalidTreasurySendDraftResult(
      draft.errorMessage ?? 'Could not create treasury send transaction draft.'
    );
  }

  return {
    status: 'ready',
    destinationAddress: options.destinationAddress,
    amountSats: options.amountSats,
    estimatedFeeSats: options.estimatedFeeSats,
    actualFeeSats: draft.actualFeeSats ?? options.estimatedFeeSats,
    isMaxSend: options.estimatedChangeSats === 0,
    draft,
    createdAt: new Date().toISOString(),
  };
}

async function createMaxTreasurySendDraft(options: {
  treasuryAddress: string;
  destinationAddress: string;
  utxos: TreasuryFundingPreviewSelectedUtxo[];
}): Promise<TreasurySendDraftResult> {
  const selectedUtxos = [...options.utxos].sort(
    (a, b) => b.valueSats - a.valueSats
  );
  const selectedInputSats = selectedUtxos.reduce(
    (total, utxo) => total + utxo.valueSats,
    0
  );

  if (selectedInputSats <= 0) {
    return createInvalidTreasurySendDraftResult(
      'Treasury wallet has no spendable balance.'
    );
  }

  let estimatedFeeSats = estimateTransactionFeeSats(selectedUtxos.length, 1);
  let amountSats =
    selectedInputSats - estimatedFeeSats - MAX_SEND_FEE_SAFETY_SATS;

  if (amountSats < MINIMUM_SEND_SATS) {
    return createInvalidTreasurySendDraftResult(
      'Treasury wallet balance does not cover a max send and the estimated network fee.'
    );
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await createDraftForSelection({
      treasuryAddress: options.treasuryAddress,
      destinationAddress: options.destinationAddress,
      amountSats,
      selectedUtxos,
      selectedInputSats,
      estimatedFeeSats,
      estimatedChangeSats: 0,
    });

    if (result.status === 'ready' && result.draft) {
      const changeSats = result.draft.actualChangeSats ?? 0;

      if (changeSats <= 0) {
        return {
          ...result,
          isMaxSend: true,
        };
      }

      amountSats += changeSats;
      estimatedFeeSats = result.draft.actualFeeSats ?? estimatedFeeSats;
      continue;
    }

    amountSats -= 200;
  }

  return createInvalidTreasurySendDraftResult(
    'Could not prepare a max treasury send. Try sending a slightly smaller amount.'
  );
}

export async function createTreasurySendDraft(request: {
  destinationAddress: string;
  amountSats?: number;
  sendMax?: boolean;
}): Promise<TreasurySendDraftResult> {
  const destinationAddress = request.destinationAddress.trim();
  const amountSats = Math.round(request.amountSats ?? 0);

  try {
    validateBchAddress(destinationAddress);
  } catch (error) {
    console.error(error);
    return createInvalidTreasurySendDraftResult(
      'Enter a valid BCH receiving address.'
    );
  }

  const treasuryWallet = await getTreasuryWalletPublicInfo();

  if (!treasuryWallet.isSetup || !treasuryWallet.address) {
    return createInvalidTreasurySendDraftResult(
      'Treasury wallet is not set up.'
    );
  }

  const treasuryBalance = await getTreasuryWalletBalance();

  if (request.sendMax) {
    return createMaxTreasurySendDraft({
      treasuryAddress: treasuryWallet.address,
      destinationAddress,
      utxos: treasuryBalance.utxos,
    });
  }

  if (!Number.isFinite(amountSats) || amountSats < MINIMUM_SEND_SATS) {
    return createInvalidTreasurySendDraftResult(
      'Enter a BCH amount greater than the minimum network output size.'
    );
  }

  const selected = selectTreasuryUtxos(treasuryBalance.utxos, amountSats);

  if (!selected) {
    return createInvalidTreasurySendDraftResult(
      'Treasury wallet balance does not cover this amount and the estimated network fee.'
    );
  }

  return createDraftForSelection({
    treasuryAddress: treasuryWallet.address,
    destinationAddress,
    amountSats,
    selectedUtxos: selected.selectedUtxos,
    selectedInputSats: selected.selectedInputSats,
    estimatedFeeSats: selected.estimatedFeeSats,
    estimatedChangeSats: selected.estimatedChangeSats,
  });
}

function createBlockedBroadcastResult(
  errorMessage: string
): TreasuryBroadcastResult {
  return {
    status: 'blocked',
    errorMessage,
    broadcastEnabled: false,
    attemptedAt: new Date().toISOString(),
  };
}

function createFailedBroadcastResult(
  errorMessage: string
): TreasuryBroadcastResult {
  return {
    status: 'failed',
    errorMessage,
    broadcastEnabled: true,
    attemptedAt: new Date().toISOString(),
  };
}

function createBroadcastedResult(txid: string): TreasuryBroadcastResult {
  return {
    status: 'broadcasted',
    txid,
    broadcastEnabled: true,
    attemptedAt: new Date().toISOString(),
  };
}

/**
 * Broadcast a Treasury Send draft.
 *
 * When TEMPORARY_REAL_TREASURY_SEND_BROADCAST_ENABLED is false, this delegates
 * to the normal globally-guarded treasury broadcast function.
 *
 * When true, this bypasses that global guard only for the Send dialog test.
 */
export async function broadcastTreasurySendDraft(
  draft: TreasuryTransactionDraft
): Promise<TreasuryBroadcastResult> {
  if (!TEMPORARY_REAL_TREASURY_SEND_BROADCAST_ENABLED) {
    return broadcastTreasuryTransactionDraft(draft);
  }

  if (draft.status !== 'created') {
    return createBlockedBroadcastResult(
      'Transaction draft has not been created.'
    );
  }

  if (!draft.rawTransactionHex) {
    return createBlockedBroadcastResult(
      'Raw transaction hex is missing from the transaction draft.'
    );
  }

  try {
    const electrum = new ElectrumService(ELECTRUM_SERVERS);
    await electrum.start();

    const rawTransaction = hexToBin(draft.rawTransactionHex);

    const electrumLike = electrum as unknown as {
      request?: (method: string, ...params: unknown[]) => Promise<unknown>;
      client?: {
        request?: (method: string, ...params: unknown[]) => Promise<unknown>;
      };
      broadcastTransaction?: (transaction: Uint8Array) => Promise<string>;
      sendRawTransaction?: (transactionHex: string) => Promise<string>;
    };

    if (typeof electrumLike.broadcastTransaction === 'function') {
      const txid = await electrumLike.broadcastTransaction(rawTransaction);
      return createBroadcastedResult(txid);
    }

    if (typeof electrumLike.sendRawTransaction === 'function') {
      const txid = await electrumLike.sendRawTransaction(
        draft.rawTransactionHex
      );
      return createBroadcastedResult(txid);
    }

    if (typeof electrumLike.request === 'function') {
      const txid = await electrumLike.request(
        'blockchain.transaction.broadcast',
        draft.rawTransactionHex
      );

      return createBroadcastedResult(String(txid));
    }

    if (typeof electrumLike.client?.request === 'function') {
      const txid = await electrumLike.client.request(
        'blockchain.transaction.broadcast',
        draft.rawTransactionHex
      );

      return createBroadcastedResult(String(txid));
    }

    return createFailedBroadcastResult(
      'No compatible Electrum broadcast method was found.'
    );
  } catch (error) {
    return createFailedBroadcastResult(
      error instanceof Error ? error.message : 'Treasury send broadcast failed.'
    );
  }
}
