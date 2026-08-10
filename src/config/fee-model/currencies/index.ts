import type { CurrencyFeeSchedule } from '../../../types/fee-model';
import { GBP_FEE_SCHEDULE } from './gbp';

const FEE_SCHEDULES: Record<string, CurrencyFeeSchedule> = {
  GBP: GBP_FEE_SCHEDULE,
};

export function getFeeSchedule(currency: string): CurrencyFeeSchedule {
  const normalisedCurrency = currency.trim().toUpperCase();

  const schedule = FEE_SCHEDULES[normalisedCurrency];

  if (!schedule) {
    throw new Error(
      `No Fee Model v1 schedule is configured for currency: ${currency}`
    );
  }

  return schedule;
}

export function isFeeScheduleConfigured(currency: string): boolean {
  const normalisedCurrency = currency.trim().toUpperCase();

  return Boolean(FEE_SCHEDULES[normalisedCurrency]);
}

export function getConfiguredFeeCurrencies(): string[] {
  return Object.keys(FEE_SCHEDULES);
}
