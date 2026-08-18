export type TopupQuoteIssueStatus = 'valid' | 'expired' | 'invalid';

export interface TopupQuoteTiming {
  quoteLockedAt?: string;
  quoteExpiresAt?: string;
}

export interface TopupQuoteIssueSafety {
  status: TopupQuoteIssueStatus;

  lockedAtMilliseconds?: number;
  expiresAtMilliseconds?: number;
  remainingMilliseconds: number;

  checkedAt: string;
}

function parseIsoMilliseconds(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const milliseconds = new Date(value).getTime();

  return Number.isFinite(milliseconds) ? milliseconds : null;
}

/**
 * Validate that a locked Topup quote is still safe to use at the point of
 * issuance.
 *
 * Missing, malformed, reversed or future-dated quote timing fails closed.
 */
export function getTopupQuoteIssueSafety(
  quote: TopupQuoteTiming,
  now: Date = new Date()
): TopupQuoteIssueSafety {
  const checkedAtMilliseconds = now.getTime();

  const lockedAtMilliseconds = parseIsoMilliseconds(quote.quoteLockedAt);
  const expiresAtMilliseconds = parseIsoMilliseconds(quote.quoteExpiresAt);

  const checkedAt = now.toISOString();

  if (
    lockedAtMilliseconds === null ||
    expiresAtMilliseconds === null ||
    lockedAtMilliseconds > checkedAtMilliseconds ||
    expiresAtMilliseconds <= lockedAtMilliseconds
  ) {
    return {
      status: 'invalid',
      remainingMilliseconds: 0,
      checkedAt,
    };
  }

  if (checkedAtMilliseconds >= expiresAtMilliseconds) {
    return {
      status: 'expired',
      lockedAtMilliseconds,
      expiresAtMilliseconds,
      remainingMilliseconds: 0,
      checkedAt,
    };
  }

  return {
    status: 'valid',
    lockedAtMilliseconds,
    expiresAtMilliseconds,
    remainingMilliseconds: expiresAtMilliseconds - checkedAtMilliseconds,
    checkedAt,
  };
}
