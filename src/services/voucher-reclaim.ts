import type { VoucherReclaimIntent, VoucherRecord } from 'src/types/voucher';

import type { VoucherAddressUtxo } from 'src/types/voucher-redemption-detection';

function isValidTransactionId(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value.trim());
}

function isValidRawTransactionHex(value: string): boolean {
  return /^(?:[0-9a-f]{2})+$/i.test(value.trim());
}

function isVoucherRedeemed(voucher: VoucherRecord): boolean {
  return (
    voucher.status === 'redeemed' ||
    voucher.status === 'reclaimed' ||
    Boolean(voucher.manualRedemption) ||
    voucher.redemptionDetection?.status === 'swept'
  );
}

export function isReplacementFundingVerifiedForReclaim(
  replacement: VoucherRecord
): boolean {
  if (
    replacement.status === 'funded' ||
    replacement.status === 'printed' ||
    replacement.status === 'redeemed'
  ) {
    return true;
  }

  return (
    replacement.fundingReconciliation?.status === 'mempool' ||
    replacement.fundingReconciliation?.status === 'confirmed'
  );
}

/**
 * Reclaim is deliberately unavailable until the replacement Topup is already
 * positively funded.
 *
 * This ensures the customer is not left without their replacement BCH while
 * the merchant reclaims the failed original.
 */
export function canPrepareVoucherReclaim(
  original: VoucherRecord,
  replacement: VoucherRecord
): boolean {
  const recovery = original.printedRecovery;

  if (
    original.delivery?.method !== 'printed' ||
    original.status !== 'funded' ||
    isVoucherRedeemed(original)
  ) {
    return false;
  }

  if (
    !recovery ||
    recovery.resolution !== 'replacement_required' ||
    recovery.reclaimStatus !== 'required' ||
    recovery.reclaimIntent
  ) {
    return false;
  }

  if (
    !recovery.replacementVoucherId ||
    recovery.replacementVoucherId !== replacement.id
  ) {
    return false;
  }

  if (replacement.replacement?.originalVoucherId !== original.id) {
    return false;
  }

  return isReplacementFundingVerifiedForReclaim(replacement);
}

/**
 * Return the one deterministic funding transaction ID which created the
 * original customer voucher output.
 *
 * Multiple persisted sources may contain the same txid.
 * Contradictory txids fail closed.
 */
export function getExpectedVoucherFundingTxid(voucher: VoucherRecord): string {
  const candidates = [
    voucher.fundingTxid,
    voucher.fundingIntent?.txid,
    voucher.fundingBroadcast?.txid,
    voucher.fundingReconciliation?.txid,
  ];

  const normalisedTxids: string[] = [];

  for (const candidate of candidates) {
    if (candidate === undefined) {
      continue;
    }

    const normalised = candidate.trim().toLowerCase();

    if (!isValidTransactionId(normalised)) {
      throw new Error(
        'Original Topup contains an invalid funding transaction ID.'
      );
    }

    normalisedTxids.push(normalised);
  }

  const uniqueTxids = [...new Set(normalisedTxids)];

  if (uniqueTxids.length === 0) {
    throw new Error(
      'Original Topup does not contain a deterministic funding transaction ID.'
    );
  }

  if (uniqueTxids.length !== 1) {
    throw new Error(
      'Original Topup contains contradictory funding transaction IDs.'
    );
  }

  const fundingTxid = uniqueTxids[0];

  if (!fundingTxid) {
    throw new Error(
      'Original Topup funding transaction ID could not be determined.'
    );
  }

  return fundingTxid;
}

/**
 * Select ONLY the unspent output created by the original Topup funding
 * transaction.
 *
 * Any unrelated BCH which happens to have been sent to this voucher address is
 * ignored.
 */
export function selectVoucherReclaimSourceUtxo(
  voucher: VoucherRecord,
  utxos: VoucherAddressUtxo[]
): VoucherAddressUtxo {
  const fundingTxid = getExpectedVoucherFundingTxid(voucher);

  const matchingUtxos = utxos.filter((utxo) => {
    return utxo.outpointTransactionHash.trim().toLowerCase() === fundingTxid;
  });

  if (matchingUtxos.length === 0) {
    throw new Error(
      'The original Topup funding output is no longer unspent. Reclaim cannot continue automatically.'
    );
  }

  if (matchingUtxos.length !== 1) {
    throw new Error(
      'More than one unspent output matches the original Topup funding transaction.'
    );
  }

  const sourceUtxo = matchingUtxos[0];

  if (!sourceUtxo) {
    throw new Error('Original Topup reclaim output could not be selected.');
  }

  if (
    !Number.isSafeInteger(sourceUtxo.outpointIndex) ||
    sourceUtxo.outpointIndex < 0
  ) {
    throw new Error('Original Topup reclaim output index is invalid.');
  }

  if (
    !Number.isSafeInteger(sourceUtxo.valueSats) ||
    sourceUtxo.valueSats !== voucher.finalBchSats
  ) {
    throw new Error(
      'Original Topup funding output does not match the expected customer BCH amount.'
    );
  }

  return sourceUtxo;
}

/**
 * Attach one exact prepared reclaim transaction to the original record.
 *
 * The same txid is idempotent.
 * A different second reclaim transaction is permanently prohibited.
 */
export function applyVoucherReclaimIntent(
  original: VoucherRecord,
  replacement: VoucherRecord,
  intent: VoucherReclaimIntent
): VoucherRecord {
  const recovery = original.printedRecovery;

  if (!recovery) {
    throw new Error('Original Topup does not contain Printed recovery state.');
  }

  if (recovery.reclaimIntent) {
    if (recovery.reclaimIntent.txid === intent.txid) {
      return original;
    }

    throw new Error(
      'A different reclaim transaction has already been prepared for this Topup.'
    );
  }

  if (!canPrepareVoucherReclaim(original, replacement)) {
    throw new Error('This Topup is not eligible for reclaim preparation.');
  }

  if (intent.status !== 'prepared') {
    throw new Error('Reclaim intent is not prepared.');
  }

  if (
    !isValidTransactionId(intent.txid) ||
    !isValidRawTransactionHex(intent.rawTransactionHex)
  ) {
    throw new Error(
      'Reclaim intent does not contain a valid signed transaction.'
    );
  }

  const expectedFundingTxid = getExpectedVoucherFundingTxid(original);

  if (intent.sourceFundingTxid !== expectedFundingTxid) {
    throw new Error(
      'Reclaim intent does not spend the original Topup funding transaction.'
    );
  }

  if (
    intent.voucherAddress !== original.address ||
    intent.voucherDerivationIndex !== original.derivationIndex
  ) {
    throw new Error(
      'Reclaim intent does not belong to the original voucher key.'
    );
  }

  if (intent.sourceValueSats !== original.finalBchSats) {
    throw new Error(
      'Reclaim source amount does not match the original Topup amount.'
    );
  }

  if (
    !Number.isSafeInteger(intent.actualFeeSats) ||
    intent.actualFeeSats <= 0 ||
    !Number.isSafeInteger(intent.treasuryOutputSats) ||
    intent.treasuryOutputSats <= 0
  ) {
    throw new Error('Reclaim transaction amounts are invalid.');
  }

  if (
    intent.treasuryOutputSats + intent.actualFeeSats !==
    intent.sourceValueSats
  ) {
    throw new Error('Reclaim transaction value does not balance.');
  }

  if (intent.inputCount !== 1 || intent.outputCount !== 1) {
    throw new Error(
      'Reclaim transaction must contain exactly one original-voucher input and one Treasury output.'
    );
  }

  return {
    ...original,

    printedRecovery: {
      ...recovery,

      reclaimStatus: 'in_progress',

      reclaimIntent: intent,
    },
  };
}
