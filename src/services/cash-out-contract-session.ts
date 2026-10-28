import { binToHex, hexToBin } from '@bitauth/libauth';
import {
  Contract,
  ElectrumNetworkProvider,
  Network,
  type Artifact,
  type NetworkProvider,
} from 'cashscript';
import contractArtifact from 'src/contracts/artifacts/CashOutSettlement.json';
import {
  buildCashOutSettlementContractPlan,
  CASH_OUT_SETTLEMENT_FEE_RATE_SATS_PER_BYTE,
} from './cash-out-settlement-contract-plan';
import { buildCashOutSettlementPlanFromRecord } from './cash-out-settlement-plan';
import { resolveCashOutSettlementDestinations } from './cash-out-settlement-destinations';
import {
  calculateCashOutPricingFromLockedQuote,
  isCashOutAmountAllowed,
} from './cash-out-pricing';
import {
  CASH_OUT_QUOTE_TTL_MILLISECONDS,
  isCashOutQuoteExpired,
} from './cash-out-quote-policy';
import { createCashOutPaymentUri } from './cash-out-payment-uri';
import {
  getCashOutRecordById,
  storeCashOutContractSession,
  mutateCashOutRecordAtomically,
} from './cash-out-store';
import { createCashOutContractNetwork } from './cash-out-contract-network';
import type { PrepareCashOutSettlementInput } from './cash-out-settlement-prepare';
import type { CashOutSettlementNetworkLifecycleResult } from './cash-out-settlement-network-lifecycle';
import type { CashOutPaymentObservation } from './cash-out-contract-network';
import type { CashOutRecord } from 'src/types/cash-out';
import type { PricingService } from './pricing-service';

export interface CreateCashOutContractSessionInput {
  /** Stable caller identity also makes a repeated creation call idempotent. */
  id: string;
  serial: string;
  fiatAmountMinor: number;
  provider: NetworkProvider;
}

export interface CashOutContractSessionCreationDependencies {
  getCashOutRecordById: typeof getCashOutRecordById;
  getLockedQuote: PricingService['getLockedQuote'];
  getTreasuryAddress: () => Promise<string>;
  storeSession: typeof storeCashOutContractSession;
  now: () => string;
}

/** Only immutable creation fields; replay must not undo later lifecycle work. */
export function cashOutContractSessionIdentity(record: CashOutRecord): string {
  return JSON.stringify({
    id: record.id,
    serial: record.serial,
    createdAt: record.createdAt,
    fiatCurrency: record.fiatCurrency,
    fiatAmountMinor: record.fiatAmountMinor,
    customerSendsFiatEquivalentMinor: record.customerSendsFiatEquivalentMinor,
    marketBchSats: record.marketBchSats,
    bchSatsRequired: record.bchSatsRequired,
    quote: record.quote,
    fee: record.fee,
    treasuryMasterAddress: record.treasuryMasterAddress,
    treasuryReceivingAddress: record.treasuryReceivingAddress,
    treasuryReceivingDerivationIndex: record.treasuryReceivingDerivationIndex,
    paymentUri: record.paymentUri,
    settlementContractPlan: record.settlementContractPlan,
  });
}

function requireEqual(actual: unknown, expected: unknown, field: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Frozen Cash-out ${field} does not match its contract session.`
    );
  }
}

/** First persistence only: validate frozen values, never fetch a new quote/plan. */
export function validateNewCashOutContractSession(record: CashOutRecord): void {
  const plan = record.settlementContractPlan;
  if (
    !plan ||
    plan.version !== 'cash_out_settlement_contract_v1' ||
    plan.contractType !== 'p2sh32' ||
    !/^[0-9a-f]{64}$/.test(plan.cashOutCommitmentHex) ||
    plan.cashOutCommitmentHex === '0'.repeat(64)
  )
    throw new Error(
      'Frozen Cash-out contract identity is missing or malformed.'
    );

  if (
    record.status !== 'awaiting_payment' ||
    record.fiatCurrency !== 'GBP' ||
    !record.id.trim() ||
    !record.serial.trim() ||
    !Number.isFinite(Date.parse(record.createdAt)) ||
    !Number.isFinite(Date.parse(record.updatedAt)) ||
    record.treasuryReceivingDerivationIndex !== undefined ||
    record.settlementIntent ||
    record.recoveryIntent ||
    record.paymentDetection ||
    record.receivedTxid ||
    record.bchSatsReceived !== undefined ||
    record.completedAt
  )
    throw new Error(
      'New contract Cash-out must be an awaiting-payment record without payment/lifecycle work.'
    );

  requireEqual(
    record.quote.fiatCurrency,
    record.fiatCurrency,
    'quote currency'
  );
  if (!Number.isFinite(Date.parse(record.quote.marketRateTimestamp))) {
    throw new Error('Frozen Cash-out quote timestamp is invalid.');
  }
  // Validate against the ORIGINAL locked quote, not a new market price. The
  // pricing/fee formulas remain owned by the existing production implementation.
  const pricing = calculateCashOutPricingFromLockedQuote(
    record.fiatAmountMinor,
    {
      ...record.quote,
      provider: 'coingecko',
      quoteLockedAt: record.quote.quoteLockedAt ?? '',
      quoteExpiresAt: record.quote.quoteExpiresAt ?? '',
    }
  );
  requireEqual(record.fee, pricing.fee, 'fee snapshot');
  requireEqual(record.marketBchSats, pricing.marketBchSats, 'market sats');
  requireEqual(
    record.bchSatsRequired,
    pricing.bchSatsRequired,
    'required sats'
  );
  requireEqual(
    record.customerSendsFiatEquivalentMinor,
    pricing.customerSendsFiatEquivalentMinor,
    'customer obligation'
  );

  // Decode the SNAPSHOT destinations, not today's platform configuration.
  const destinations = resolveCashOutSettlementDestinations({
    treasuryAddress: record.treasuryMasterAddress ?? '',
    platformAddress: plan.settlementPlan.platformDestination.address,
  });
  const economics = buildCashOutSettlementPlanFromRecord({
    cashOut: { ...record, status: 'quote_locked' },
    ...destinations,
    settlementFeeSats: plan.settlementPlan.settlementFeeSats,
  });
  requireEqual(
    plan.settlementPlan,
    economics,
    'settlement economics/destinations'
  );
  requireEqual(
    plan.constructor,
    {
      cashOutCommitmentHex: plan.cashOutCommitmentHex,
      ...economics.constructor,
    },
    'constructor'
  );
  requireEqual(
    record.treasuryReceivingAddress,
    plan.contractAddress,
    'receiving address'
  );

  // Identity verification only: no UTXO lookup, size probe, signing or network.
  const contract = new Contract(
    contractArtifact as unknown as Artifact,
    [
      hexToBin(plan.cashOutCommitmentHex),
      hexToBin(economics.constructor.treasuryPublicKeyHashHex),
      hexToBin(economics.constructor.platformPublicKeyHashHex),
      BigInt(economics.constructor.paymentSats),
      BigInt(economics.constructor.platformFeeSats),
      BigInt(economics.constructor.settlementFeeSats),
    ],
    {
      // The SDK requires an explicit provider; construction does not connect.
      provider: new ElectrumNetworkProvider(Network.MAINNET),
      contractType: plan.contractType,
    }
  );
  requireEqual(plan.contractAddress, contract.address, 'contract address');
  requireEqual(
    plan.contractLockingBytecodeHex,
    contract.lockingBytecode,
    'locking bytecode'
  );
  requireEqual(plan.contractBytecodeHex, contract.bytecode, 'redeem bytecode');
  requireEqual(plan.contractBytecodeSize, contract.bytesize, 'bytecode size');
  requireEqual(plan.contractOpcodeCount, contract.opcount, 'opcode count');
  requireEqual(
    plan.settlementFeeRateSatsPerByte,
    CASH_OUT_SETTLEMENT_FEE_RATE_SATS_PER_BYTE,
    'fee rate'
  );
  requireEqual(
    plan.settlementTransactionSizeBytes * plan.settlementFeeRateSatsPerByte,
    economics.settlementFeeSats,
    'fee/size'
  );
  if (
    !Number.isSafeInteger(plan.settlementTransactionSizeBytes) ||
    plan.settlementTransactionSizeBytes <= 0 ||
    !plan.feePlanningIterations?.length
  ) {
    throw new Error('Frozen Cash-out fee measurement is incomplete.');
  }
  requireEqual(
    record.paymentUri,
    createCashOutPaymentUri({
      address: plan.contractAddress,
      requiredSats: economics.paymentSats,
      label: 'BCH Cash-out',
      message: record.serial,
    }).uri,
    'payment URI'
  );
}

function createCommitment(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      'Secure randomness is unavailable for Cash-out contract creation.'
    );
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  if (bytes.every((value) => value === 0)) {
    throw new Error(
      'Secure randomness produced an invalid Cash-out commitment.'
    );
  }
  return binToHex(bytes);
}

/** E1 only: the FIRST payable result is the successfully persisted record. */
export async function createCashOutContractSessionWithDependencies(
  input: CreateCashOutContractSessionInput,
  dependencies: CashOutContractSessionCreationDependencies
): Promise<CashOutRecord> {
  // Own scalar inputs across awaits; the provider is a runtime capability only.
  const { id, serial, fiatAmountMinor, provider } = input;
  if (
    !id.trim() ||
    !serial.trim() ||
    !isCashOutAmountAllowed(fiatAmountMinor) ||
    provider.network !== Network.MAINNET
  ) {
    throw new Error(
      'Cash-out creation requires a stable ID/serial, at least £1.00 and a mainnet provider.'
    );
  }
  const existing = await dependencies.getCashOutRecordById(id);
  if (existing) {
    if (
      !existing.settlementContractPlan ||
      existing.id !== id ||
      existing.serial !== serial ||
      existing.fiatAmountMinor !== fiatAmountMinor ||
      existing.fiatCurrency !== 'GBP'
    ) {
      throw new Error(
        'Cash-out already exists with different creation terms or is a legacy record.'
      );
    }
    // Durable replay: no new quote, commitment, destination resolution or plan.
    return structuredClone(existing);
  }

  const quote = structuredClone(
    await dependencies.getLockedQuote('GBP', {
      ttlMilliseconds: CASH_OUT_QUOTE_TTL_MILLISECONDS,
    })
  );
  const now = dependencies.now();
  if (
    quote.fiatCurrency !== 'GBP' ||
    isCashOutQuoteExpired(quote, Date.parse(now))
  ) {
    throw new Error('Cash-out creation requires an active GBP locked quote.');
  }
  const pricing = calculateCashOutPricingFromLockedQuote(
    fiatAmountMinor,
    quote
  );
  const treasuryAddress = await dependencies.getTreasuryAddress();
  const cashOut: CashOutRecord = {
    id,
    serial,
    createdAt: now,
    updatedAt: now,
    fiatCurrency: pricing.fiatCurrency,
    fiatAmountMinor: pricing.fiatAmountMinor,
    customerSendsFiatEquivalentMinor: pricing.customerSendsFiatEquivalentMinor,
    marketBchSats: pricing.marketBchSats,
    bchSatsRequired: pricing.bchSatsRequired,
    quote: {
      source: pricing.quoteSource,
      fiatCurrency: pricing.fiatCurrency,
      marketRate: pricing.marketRate,
      marketRateTimestamp: pricing.quoteTimestamp,
      quoteLockedAt: pricing.quoteLockedAt,
      quoteExpiresAt: pricing.quoteExpiresAt,
      isFallbackQuote: pricing.isFallbackQuote,
    },
    fee: pricing.fee,
    treasuryMasterAddress: treasuryAddress,
    treasuryReceivingAddress: treasuryAddress,
    status: 'quote_locked',
  };
  const plan = buildCashOutSettlementContractPlan({
    cashOut,
    cashOutCommitmentHex: createCommitment(),
    treasuryAddress,
    provider,
  });
  const record: CashOutRecord = {
    ...cashOut,
    settlementContractPlan: plan,
    treasuryMasterAddress: plan.settlementPlan.treasuryDestination.address,
    treasuryReceivingAddress: plan.contractAddress,
    paymentUri: createCashOutPaymentUri({
      address: plan.contractAddress,
      requiredSats: plan.settlementPlan.paymentSats,
      label: 'BCH Cash-out',
      message: serial,
    }).uri,
    status: 'awaiting_payment',
  };
  if (isCashOutQuoteExpired(record.quote, Date.parse(dependencies.now()))) {
    throw new Error(
      'Cash-out quote expired before contract session persistence.'
    );
  }
  const stored = await dependencies.storeSession(record);
  requireEqual(
    cashOutContractSessionIdentity(stored),
    cashOutContractSessionIdentity(record),
    'stored identity'
  );
  return stored;
}

export async function createCashOutContractSession(
  input: CreateCashOutContractSessionInput
): Promise<CashOutRecord> {
  return createCashOutContractSessionWithDependencies(input, {
    getCashOutRecordById,
    async getLockedQuote(currency, options) {
      const { PricingService } = await import('./pricing-service');
      return new PricingService().getLockedQuote(currency, options);
    },
    async getTreasuryAddress() {
      const { getTreasuryWalletPublicInfo } = await import('./treasury-wallet');
      const treasury = await getTreasuryWalletPublicInfo();
      if (!treasury.isSetup) throw new Error('Treasury wallet is not set up.');
      return treasury.address;
    },
    storeSession: storeCashOutContractSession,
    now: () => new Date().toISOString(),
  });
}

export type CashOutContractDisplayState =
  | 'awaiting_payment'
  | 'payment_detected'
  | 'settling'
  | 'settlement_observed'
  | 'settlement_blocked'
  | 'payment_needs_resolution'
  | 'quote_expired'
  | 'unavailable'
  | 'error';

export interface CashOutContractSessionDisplay {
  record: CashOutRecord;
  state: CashOutContractDisplayState;
  /** E3 deliberately has no physical-cash authorization/completion capability. */
  cashHandoverAllowed: false;
  isChecking?: boolean;
  errorMessage?: string;
}

/** E3 presentation only: expiry hides the request; it never changes the quote. */
export function getCashOutContractPaymentPresentation(
  record: CashOutRecord,
  state: CashOutContractDisplayState,
  remainingMilliseconds: number
) {
  const unpaid =
    record.status === 'awaiting_payment' &&
    !record.receivedTxid &&
    !record.paymentDetection &&
    !record.bchSatsReceived &&
    !record.settlementIntent &&
    !record.recoveryIntent;
  const expired = remainingMilliseconds <= 0;
  const displayState =
    expired && (state === 'awaiting_payment' || state === 'unavailable')
      ? unpaid
        ? 'quote_expired'
        : 'payment_needs_resolution'
      : state;
  return {
    state: displayState,
    showPaymentInstructions:
      unpaid &&
      !expired &&
      (displayState === 'awaiting_payment' || displayState === 'unavailable'),
  };
}

export interface CashOutContractNotificationWatch {
  isConnected(): boolean;
  stop(): Promise<void>;
}

export interface CashOutPaymentSessionDependencies {
  getCashOutRecordById: typeof getCashOutRecordById;
  mutateCashOutRecordAtomically: typeof mutateCashOutRecordAtomically;
  observePayment(record: CashOutRecord): Promise<CashOutPaymentObservation>;
  prepareSettlement(
    input: PrepareCashOutSettlementInput
  ): Promise<CashOutRecord>;
  advanceSettlement(
    id: string
  ): Promise<CashOutSettlementNetworkLifecycleResult>;
  subscribe(
    record: CashOutRecord,
    notify: () => void,
    signal: AbortSignal
  ): Promise<CashOutContractNotificationWatch | undefined>;
  schedulePoll(notify: () => void, milliseconds: number): () => void;
  now(): number;
}

// One operation per Cash-out even while a stopped controller is finishing an
// awaited durable write and a replacement controller is being opened.
const paymentSessionOperations = new Map<string, Promise<void>>();

export function createCashOutContractPaymentSession(
  input: {
    cashOutId: string;
    provider: NetworkProvider;
    visible?: boolean;
    onUpdate(display: CashOutContractSessionDisplay): void;
    onError?(message: string): void;
  },
  overrides: Partial<CashOutPaymentSessionDependencies> = {}
) {
  const { cashOutId, provider, onUpdate, onError } = input;
  const network = createCashOutContractNetwork();
  const dependencies: CashOutPaymentSessionDependencies = {
    getCashOutRecordById,
    mutateCashOutRecordAtomically,
    observePayment: network.observePayment,
    async prepareSettlement(value) {
      const { prepareAndStoreCashOutSettlement } = await import(
        './cash-out-settlement-prepare'
      );
      return prepareAndStoreCashOutSettlement(value);
    },
    async advanceSettlement(id) {
      const [lifecycle, broadcast, store] = await Promise.all([
        import('./cash-out-settlement-network-lifecycle'),
        import('./cash-out-settlement-broadcast'),
        import('./cash-out-settlement-network-store'),
      ]);
      return lifecycle.advanceCashOutSettlementNetworkLifecycleWithDependencies(
        id,
        {
          getCashOutRecordById,
          storeBroadcast: store.storeCashOutSettlementBroadcast,
          storeReconciliation: store.storeCashOutSettlementReconciliation,
          broadcast: broadcast.broadcastCashOutSettlementIntent,
          reconcile: network.observeSettlement,
        }
      );
    },
    subscribe: network.subscribePaymentNotifications,
    schedulePoll(notify, milliseconds) {
      const timer = setInterval(notify, milliseconds);
      return () => clearInterval(timer);
    },
    now: () => Date.now(),
    ...overrides,
  };
  let active = false;
  let rerun = false;
  let running: Promise<void> | undefined;
  let stopPoll: (() => void) | undefined;
  let watch: CashOutContractNotificationWatch | undefined;
  let subscribing: Promise<void> | undefined;
  let visible = input.visible ?? true;
  let checking = false;
  let paymentObserved = false;
  let observationUnavailable = false;
  // Waiting-screen freshness only. This MUST NOT authorize E4 cash handover.
  let freshnessSince = dependencies.now();
  const abort = new AbortController();

  function publish(
    record: CashOutRecord,
    state: CashOutContractDisplayState,
    errorMessage?: string
  ) {
    if (active)
      onUpdate({
        record: structuredClone(record),
        state,
        cashHandoverAllowed: false,
        isChecking: checking,
        ...(errorMessage ? { errorMessage } : {}),
      });
  }
  function ensureSubscription(record: CashOutRecord) {
    if (!active || subscribing || watch?.isConnected()) return;
    const previous = watch;
    watch = undefined;
    subscribing = (async () => {
      await previous?.stop();
      if (!active) return;
      const opened = await dependencies.subscribe(
        record,
        () => {
          void requestAdvance();
        },
        abort.signal
      );
      if (!active) {
        await opened?.stop();
        return;
      }
      watch = opened;
      if (opened) void requestAdvance(); // Immediate fresh read after (re)connect.
    })()
      .catch(() => undefined)
      .finally(() => {
        subscribing = undefined;
      });
  }
  function recordedInTime(record: CashOutRecord) {
    return (
      record.status === 'received' &&
      record.receivedTxid &&
      record.detectedAt &&
      Date.parse(record.detectedAt) <=
        Date.parse(record.quote.quoteExpiresAt ?? '')
    );
  }

  function waitingState(record: CashOutRecord): CashOutContractDisplayState {
    if (paymentObserved || record.status === 'received')
      return 'payment_needs_resolution';
    if (isCashOutQuoteExpired(record.quote, dependencies.now()))
      return 'quote_expired';
    return visible &&
      observationUnavailable &&
      dependencies.now() - freshnessSince >= 20_000
      ? 'unavailable'
      : 'awaiting_payment';
  }

  function updatePolling() {
    stopPoll?.();
    stopPoll =
      active && visible
        ? dependencies.schedulePoll(() => {
            void requestAdvance();
          }, 10_000)
        : undefined;
  }

  async function advanceOnce() {
    let record: CashOutRecord | undefined;
    try {
      record = await dependencies.getCashOutRecordById(cashOutId);
      if (!active) return;
      if (!record?.settlementContractPlan)
        throw new Error(
          'The persisted Cash-out contract session could not be loaded.'
        );
      if (record.status === 'completed' || record.recoveryIntent) {
        publish(record, 'payment_needs_resolution');
        return;
      }
      paymentObserved ||= Boolean(
        record.receivedTxid || record.paymentDetection || record.bchSatsReceived
      );
      ensureSubscription(record);
      if (!record.settlementIntent) {
        if (
          record.status !== 'awaiting_payment' &&
          record.status !== 'received'
        ) {
          publish(record, 'payment_needs_resolution');
          return;
        }
        checking = true;
        publish(record, waitingState(record));
        const observation = await dependencies.observePayment(record);
        checking = false;
        if (!active) return;
        if (observation.status === 'unavailable') {
          // A timer delayed in a hidden tab is not evidence of network failure.
          if (visible) observationUnavailable = true;
          publish(record, waitingState(record));
          return;
        }
        freshnessSince = dependencies.now();
        observationUnavailable = false;
        const inspected = observation.observation;
        if (inspected.payment.classification === 'no_utxos') {
          publish(record, waitingState(record));
          return;
        }
        paymentObserved = true;
        if (
          isCashOutQuoteExpired(record.quote, dependencies.now()) &&
          !recordedInTime(record)
        ) {
          publish(record, 'payment_needs_resolution');
          return;
        }
        const candidate = inspected.normalSettlementCandidate;
        if (inspected.payment.classification !== 'exact' || !candidate) {
          publish(record, 'payment_needs_resolution');
          return;
        }
        publish(record, 'payment_detected');
        const identity = cashOutContractSessionIdentity(record);
        // Stage the exact observed payment for D3 inside the existing serialized
        // store boundary. This status is NOT physical-cash permission.
        const staged = await dependencies.mutateCashOutRecordAtomically(
          cashOutId,
          (current) => {
            if (!active) return current;
            if (cashOutContractSessionIdentity(current) !== identity)
              throw new Error(
                'Frozen Cash-out identity changed during observation.'
              );
            if (
              current.settlementIntent ||
              current.recoveryIntent ||
              current.status === 'completed'
            )
              return current;
            if (
              (current.status !== 'awaiting_payment' &&
                current.status !== 'received') ||
              (isCashOutQuoteExpired(current.quote, dependencies.now()) &&
                !recordedInTime(current))
            )
              return current;
            if (current.receivedTxid && current.receivedTxid !== candidate.txid)
              throw new Error(
                'Observed payment differs from the already recorded Cash-out payment.'
              );
            return {
              ...current,
              status: 'received',
              receivedTxid: candidate.txid,
              bchSatsReceived: candidate.satoshis,
              detectedAt: current.detectedAt ?? inspected.observedAt,
              updatedAt: new Date(dependencies.now()).toISOString(),
            };
          }
        );
        if (!active) return;
        if (!staged)
          throw new Error('Cash-out payment could not be durably recorded.');
        record = staged;
        if (record.recoveryIntent || record.status !== 'received') {
          publish(record, 'payment_needs_resolution');
          return;
        }
        if (!record.settlementIntent) {
          publish(record, 'settling');
          const contractPlan = record.settlementContractPlan;
          if (!contractPlan)
            throw new Error('The frozen contract plan is missing.');
          record = await dependencies.prepareSettlement({
            contractPlan,
            candidate,
            provider,
          });
          if (!active) return;
        }
      }
      checking = true;
      publish(record, 'settling');
      const advanced = await dependencies.advanceSettlement(cashOutId);
      checking = false;
      if (!active) return;
      if (advanced.reconciliation?.status === 'unavailable') {
        if (visible) observationUnavailable = true;
      } else if (advanced.reconciliation) {
        freshnessSince = dependencies.now();
        observationUnavailable = false;
      }
      const state =
        advanced.outcome === 'mempool' || advanced.outcome === 'confirmed'
          ? 'settlement_observed'
          : advanced.outcome === 'blocked'
          ? 'settlement_blocked'
          : advanced.record.settlementReconciliation?.status ===
              'unavailable' &&
            visible &&
            observationUnavailable &&
            dependencies.now() - freshnessSince >= 20_000
          ? 'unavailable'
          : 'settling';
      publish(advanced.record, state);
    } catch (error) {
      checking = false;
      if (record)
        publish(
          record,
          'error',
          error instanceof Error
            ? error.message
            : 'Cash-out payment progress could not be checked.'
        );
      else if (active)
        onError?.(
          error instanceof Error
            ? error.message
            : 'Cash-out payment progress could not be checked.'
        );
    }
  }

  function requestAdvance(): Promise<void> {
    if (!active) return Promise.resolve();
    rerun = true;
    if (running) return running;
    const previous =
      paymentSessionOperations.get(cashOutId) ?? Promise.resolve();
    const operation = previous
      .catch(() => undefined)
      .then(async () => {
        do {
          rerun = false;
          if (active) await advanceOnce();
        } while (active && rerun);
      });
    running = operation;
    paymentSessionOperations.set(cashOutId, operation);
    const finished = () => {
      running = undefined;
      if (paymentSessionOperations.get(cashOutId) === operation)
        paymentSessionOperations.delete(cashOutId);
    };
    void operation.then(finished, finished);
    return operation;
  }

  return {
    start() {
      if (!active && !abort.signal.aborted) {
        active = true;
        freshnessSince = dependencies.now();
        updatePolling();
      }
      return requestAdvance();
    },
    requestAdvance,
    setVisible(value: boolean) {
      if (visible !== value) {
        visible = value;
        // Give the resumed foreground check its own grace period. Hidden time
        // cannot turn an old successful read into an Electrum failure message.
        if (visible) {
          freshnessSince = dependencies.now();
          observationUnavailable = false;
        }
        updatePolling();
      }
      return visible ? requestAdvance() : Promise.resolve();
    },
    async stop() {
      active = false;
      rerun = false;
      stopPoll?.();
      stopPoll = undefined;
      abort.abort();
      await watch?.stop();
      watch = undefined;
    },
  };
}
