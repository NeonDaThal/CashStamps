import type { VoucherRecord } from 'src/types/voucher';

import { selectVoucherDeliveryMethod } from 'src/services/voucher-delivery';

import { applyPrintedReplacementMetadata } from 'src/services/voucher-replacement';

/**
 * Pure final assembly of a prepared Printed replacement.
 *
 * The draft already contains:
 *
 * - fresh address / derivation index
 * - fresh funding intent
 * - fresh Treasury preview
 * - zero-second-fee output plan
 *
 * This helper permanently locks the replacement to Printed and then overlays
 * the original customer-sale metadata.
 *
 * No wallet, network, IndexedDB, signing or broadcast operation occurs here.
 */
export function buildPreparedPrintedReplacementRecord(
  originalVoucher: VoucherRecord,
  draftVoucher: VoucherRecord,
  selectedAt: string
): VoucherRecord {
  /**
   * applyPrintedReplacementMetadata() verifies that the replacement funds the
   * exact original BCH entitlement.
   *
   * createDraftVoucherRecord() has no new pricing calculation for a recovery
   * replacement, so establish that entitlement explicitly first.
   */
  const entitlementDraft: VoucherRecord = {
    ...draftVoucher,

    finalBchSats: originalVoucher.finalBchSats,
  };

  const printedDraft = selectVoucherDeliveryMethod(
    entitlementDraft,
    'printed',
    selectedAt
  );

  return applyPrintedReplacementMetadata(
    printedDraft,
    originalVoucher,
    selectedAt
  );
}
