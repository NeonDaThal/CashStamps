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
} from './cash-out-store';
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
