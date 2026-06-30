import { get, set } from 'idb-keyval';

import type {
  CashOnHandManualAdjustmentInput,
  CashOnHandMovement,
  CashOnHandMovementType,
  CashOnHandRelatedMovementInput,
  CashOnHandRelatedRecordType,
  CashOnHandSetupInput,
  CashOnHandState,
} from 'src/types/cash-on-hand';

const CASH_ON_HAND_STATE_KEY = 'bch-voucher-cash-on-hand-state';
const DEFAULT_CASH_ON_HAND_CURRENCY = 'GBP';

function createEmptyCashOnHandState(): CashOnHandState {
  return {
    isSetUp: false,
    currency: DEFAULT_CASH_ON_HAND_CURRENCY,
    balanceMinor: 0,
    movements: [],
  };
}

function normalizeCurrency(currency?: string): string {
  const normalizedCurrency = currency?.trim().toUpperCase();

  return normalizedCurrency || DEFAULT_CASH_ON_HAND_CURRENCY;
}

function generateMovementId(): string {
  return `cash_movement_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function assertNonNegativeAmountMinor(amountMinor: number): void {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error(
      'Cash on Hand amount must be a non-negative minor-unit integer.'
    );
  }
}

function assertPositiveAmountMinor(amountMinor: number): void {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error(
      'Cash on Hand adjustment amount must be a positive minor-unit integer.'
    );
  }
}

function assertCashOnHandIsSetUp(state: CashOnHandState): void {
  if (!state.isSetUp) {
    throw new Error('Cash on Hand has not been set up yet.');
  }
}

function assertCurrencyMatches(
  state: CashOnHandState,
  currency?: string
): string {
  const normalizedCurrency = normalizeCurrency(currency ?? state.currency);

  if (normalizedCurrency !== state.currency) {
    throw new Error(
      `Cash on Hand is set up for ${state.currency}, but this movement used ${normalizedCurrency}.`
    );
  }

  return normalizedCurrency;
}

function normalizeStoredState(
  storedState: CashOnHandState | undefined
): CashOnHandState {
  if (!storedState || typeof storedState !== 'object') {
    return createEmptyCashOnHandState();
  }

  const isSetUp = storedState.isSetUp === true;
  const balanceMinor = Number.isInteger(storedState.balanceMinor)
    ? storedState.balanceMinor
    : 0;

  return {
    isSetUp,
    currency: normalizeCurrency(storedState.currency),
    balanceMinor: isSetUp ? balanceMinor : 0,
    createdAt: storedState.createdAt,
    updatedAt: storedState.updatedAt,
    movements: Array.isArray(storedState.movements)
      ? storedState.movements
      : [],
  };
}

function createMovement(params: {
  type: CashOnHandMovementType;
  amountMinor: number;
  balanceAfterMinor: number;
  currency: string;
  relatedRecordId?: string;
  relatedRecordType?: CashOnHandRelatedRecordType;
  note?: string;
  createdAt?: string;
}): CashOnHandMovement {
  return {
    id: generateMovementId(),
    type: params.type,
    amountMinor: params.amountMinor,
    balanceAfterMinor: params.balanceAfterMinor,
    currency: params.currency,
    relatedRecordId: params.relatedRecordId,
    relatedRecordType: params.relatedRecordType,
    note: params.note,
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}

function hasMovementForRelatedRecordInState(
  state: CashOnHandState,
  type: CashOnHandMovementType,
  relatedRecordId: string
): boolean {
  return state.movements.some(
    (movement) =>
      movement.type === type && movement.relatedRecordId === relatedRecordId
  );
}

async function applyIncomingMovement(params: {
  state: CashOnHandState;
  type: CashOnHandMovementType;
  amountMinor: number;
  currency?: string;
  relatedRecordId?: string;
  relatedRecordType?: CashOnHandRelatedRecordType;
  note?: string;
  createdAt?: string;
}): Promise<CashOnHandState> {
  assertCashOnHandIsSetUp(params.state);
  assertPositiveAmountMinor(params.amountMinor);

  const currency = assertCurrencyMatches(params.state, params.currency);
  const now = params.createdAt ?? new Date().toISOString();
  const nextBalanceMinor = params.state.balanceMinor + params.amountMinor;

  const movement = createMovement({
    type: params.type,
    amountMinor: params.amountMinor,
    balanceAfterMinor: nextBalanceMinor,
    currency,
    relatedRecordId: params.relatedRecordId,
    relatedRecordType: params.relatedRecordType,
    note: params.note,
    createdAt: now,
  });

  const updatedState: CashOnHandState = {
    ...params.state,
    balanceMinor: nextBalanceMinor,
    updatedAt: now,
    movements: [movement, ...params.state.movements],
  };

  await saveCashOnHandState(updatedState);

  return updatedState;
}

async function applyOutgoingMovement(params: {
  state: CashOnHandState;
  type: CashOnHandMovementType;
  amountMinor: number;
  currency?: string;
  relatedRecordId?: string;
  relatedRecordType?: CashOnHandRelatedRecordType;
  note?: string;
  createdAt?: string;
  allowNegativeBalance?: boolean;
}): Promise<CashOnHandState> {
  assertCashOnHandIsSetUp(params.state);
  assertPositiveAmountMinor(params.amountMinor);

  if (
    !params.allowNegativeBalance &&
    params.amountMinor > params.state.balanceMinor
  ) {
    throw new Error('Cash on Hand cannot be withdrawn below zero.');
  }

  const currency = assertCurrencyMatches(params.state, params.currency);
  const now = params.createdAt ?? new Date().toISOString();
  const nextBalanceMinor = params.state.balanceMinor - params.amountMinor;

  const movement = createMovement({
    type: params.type,
    amountMinor: params.amountMinor,
    balanceAfterMinor: nextBalanceMinor,
    currency,
    relatedRecordId: params.relatedRecordId,
    relatedRecordType: params.relatedRecordType,
    note: params.note,
    createdAt: now,
  });

  const updatedState: CashOnHandState = {
    ...params.state,
    balanceMinor: nextBalanceMinor,
    updatedAt: now,
    movements: [movement, ...params.state.movements],
  };

  await saveCashOnHandState(updatedState);

  return updatedState;
}

export async function getCashOnHandState(): Promise<CashOnHandState> {
  const storedState = await get<CashOnHandState>(CASH_ON_HAND_STATE_KEY);

  return normalizeStoredState(storedState);
}

export async function saveCashOnHandState(
  state: CashOnHandState
): Promise<void> {
  await set(CASH_ON_HAND_STATE_KEY, normalizeStoredState(state));
}

export async function setUpCashOnHand(
  input: CashOnHandSetupInput
): Promise<CashOnHandState> {
  assertNonNegativeAmountMinor(input.amountMinor);

  const existingState = await getCashOnHandState();
  const currency = normalizeCurrency(input.currency);
  const now = input.createdAt ?? new Date().toISOString();

  const movement = createMovement({
    type: 'setup',
    amountMinor: input.amountMinor,
    balanceAfterMinor: input.amountMinor,
    currency,
    note: input.note,
    createdAt: now,
  });

  const updatedState: CashOnHandState = {
    isSetUp: true,
    currency,
    balanceMinor: input.amountMinor,
    createdAt: now,
    updatedAt: now,
    movements: [movement, ...existingState.movements],
  };

  await saveCashOnHandState(updatedState);

  return updatedState;
}

export async function addToCashOnHand(
  input: CashOnHandManualAdjustmentInput
): Promise<CashOnHandState> {
  const state = await getCashOnHandState();

  return applyIncomingMovement({
    state,
    type: 'manual_add',
    amountMinor: input.amountMinor,
    currency: input.currency,
    note: input.note,
    createdAt: input.createdAt,
  });
}

export async function withdrawFromCashOnHand(
  input: CashOnHandManualAdjustmentInput
): Promise<CashOnHandState> {
  const state = await getCashOnHandState();

  return applyOutgoingMovement({
    state,
    type: 'manual_withdraw',
    amountMinor: input.amountMinor,
    currency: input.currency,
    note: input.note,
    createdAt: input.createdAt,
  });
}

export async function clearCashOnHand(note?: string): Promise<CashOnHandState> {
  const state = await getCashOnHandState();

  if (!state.isSetUp) {
    return state;
  }

  const now = new Date().toISOString();

  const movement = createMovement({
    type: 'clear',
    amountMinor: Math.abs(state.balanceMinor),
    balanceAfterMinor: 0,
    currency: state.currency,
    note,
    createdAt: now,
  });

  const updatedState: CashOnHandState = {
    isSetUp: false,
    currency: state.currency,
    balanceMinor: 0,
    updatedAt: now,
    movements: [movement, ...state.movements],
  };

  await saveCashOnHandState(updatedState);

  return updatedState;
}

export async function hasCashOnHandMovementForRelatedRecord(
  type: CashOnHandMovementType,
  relatedRecordId: string
): Promise<boolean> {
  const state = await getCashOnHandState();

  return hasMovementForRelatedRecordInState(state, type, relatedRecordId);
}

/**
 * Optional automatic Topup hook.
 *
 * This does nothing when Cash on Hand has not been set up, so Topups remain
 * usable even if the merchant has not enabled the cash tracker.
 */
export async function recordTopupSaleCashReceived(
  input: CashOnHandRelatedMovementInput
): Promise<CashOnHandState | undefined> {
  const state = await getCashOnHandState();

  if (!state.isSetUp) {
    return undefined;
  }

  if (
    hasMovementForRelatedRecordInState(
      state,
      'topup_sale',
      input.relatedRecordId
    )
  ) {
    return state;
  }

  return applyIncomingMovement({
    state,
    type: 'topup_sale',
    amountMinor: input.amountMinor,
    currency: input.currency,
    relatedRecordId: input.relatedRecordId,
    relatedRecordType: 'voucher',
    note: input.note,
    createdAt: input.createdAt,
  });
}

/**
 * Optional automatic Cash-out hook.
 *
 * This does nothing when Cash on Hand has not been set up, so Cash-outs remain
 * usable even if the merchant has not enabled the cash tracker.
 */
export async function recordCashOutPaid(
  input: CashOnHandRelatedMovementInput
): Promise<CashOnHandState | undefined> {
  const state = await getCashOnHandState();

  if (!state.isSetUp) {
    return undefined;
  }

  if (
    hasMovementForRelatedRecordInState(
      state,
      'cash_out_paid',
      input.relatedRecordId
    )
  ) {
    return state;
  }

  return applyOutgoingMovement({
    state,
    type: 'cash_out_paid',
    amountMinor: input.amountMinor,
    currency: input.currency,
    relatedRecordId: input.relatedRecordId,
    relatedRecordType: 'cash_out',
    note: input.note,
    createdAt: input.createdAt,
    allowNegativeBalance: true,
  });
}
