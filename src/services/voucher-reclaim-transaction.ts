import {
  binToHex,
  encodeTransaction,
  generateTransaction,
  getMinimumFee,
  hashTransaction,
} from '@bitauth/libauth';

import {
  isAtOrAboveStandardP2pkhDustLimit,
  STANDARD_P2PKH_DUST_LIMIT_SATS,
} from 'src/services/treasury-output-safety';

import { getVoucherReclaimSigningDataAtIndex } from 'src/services/voucher-wallet';

import {
  getExpectedVoucherFundingTxid,
  selectVoucherReclaimSourceUtxo,
} from 'src/services/voucher-reclaim';

import type { VoucherReclaimIntent, VoucherRecord } from 'src/types/voucher';

import { Address } from 'src/utils/address';

const MAX_FEE_STABILISATION_PASSES = 5;

/**
 * Build and sign the exact transaction which reclaims the original failed
 * Printed voucher output to Treasury.
 *
 * This function NEVER broadcasts.
 */
export async function createVoucherReclaimIntent(
  originalVoucher: VoucherRecord,
  treasuryAddress: string
): Promise<VoucherReclaimIntent> {
  if (!treasuryAddress.trim()) {
    throw new Error('Treasury address is required for voucher reclaim.');
  }

  if (treasuryAddress === originalVoucher.address) {
    throw new Error(
      'Voucher reclaim destination cannot be the voucher address itself.'
    );
  }

  const signingData = await getVoucherReclaimSigningDataAtIndex(
    originalVoucher.derivationIndex
  );

  if (signingData.address !== originalVoucher.address) {
    throw new Error(
      'Derived voucher reclaim key does not match the original voucher address.'
    );
  }

  const currentUtxos = signingData.entries.map((entry) => entry.utxo);

  const sourceUtxo = selectVoucherReclaimSourceUtxo(
    originalVoucher,
    currentUtxos
  );

  /**
   * Match the signing directive to that exact funding outpoint.
   *
   * Unrelated BCH at the same address is deliberately excluded.
   */
  const sourceEntry = signingData.entries.find(
    (entry) =>
      entry.utxo.outpointTransactionHash.trim().toLowerCase() ===
        sourceUtxo.outpointTransactionHash.trim().toLowerCase() &&
      entry.utxo.outpointIndex === sourceUtxo.outpointIndex
  );

  if (!sourceEntry) {
    throw new Error(
      'Could not match the original Topup funding output to its voucher signing directive.'
    );
  }

  const sourceValueSats = sourceUtxo.valueSats;

  let encodedTransaction: Uint8Array<ArrayBufferLike> = new Uint8Array();

  let actualFeeSats = 0;

  let treasuryOutputSats = 0;

  let transactionStabilised = false;

  for (let pass = 0; pass < MAX_FEE_STABILISATION_PASSES; pass += 1) {
    const minimumFeeSats = Number(
      getMinimumFee(BigInt(encodedTransaction.length), 1000n)
    );

    const candidateTreasuryOutputSats = sourceValueSats - minimumFeeSats;

    if (
      candidateTreasuryOutputSats <= 0 ||
      !isAtOrAboveStandardP2pkhDustLimit(candidateTreasuryOutputSats)
    ) {
      throw new Error(
        `Reclaim output would be below the ${STANDARD_P2PKH_DUST_LIMIT_SATS}-satoshi standard dust floor after the network fee.`
      );
    }

    const generatedTransaction = generateTransaction({
      version: 2,

      locktime: 0,

      inputs: [sourceEntry.inputDirective],

      outputs: [
        {
          lockingBytecode:
            Address.fromCashAddrOrLegacy(treasuryAddress).toLockscriptBytes(),

          valueSatoshis: BigInt(candidateTreasuryOutputSats),
        },
      ],
    });

    if (!generatedTransaction.success) {
      throw new Error(
        `Failed to generate voucher reclaim transaction: ${generatedTransaction.errors.join(
          '; '
        )}`
      );
    }

    const nextEncodedTransaction = encodeTransaction(
      generatedTransaction.transaction
    );

    const finalMinimumFeeSats = Number(
      getMinimumFee(BigInt(nextEncodedTransaction.length), 1000n)
    );

    const candidateActualFeeSats =
      sourceValueSats - candidateTreasuryOutputSats;

    encodedTransaction = nextEncodedTransaction;

    actualFeeSats = candidateActualFeeSats;

    treasuryOutputSats = candidateTreasuryOutputSats;

    if (candidateActualFeeSats >= finalMinimumFeeSats) {
      transactionStabilised = true;

      break;
    }
  }

  if (!transactionStabilised) {
    throw new Error(
      'Could not stabilise voucher reclaim transaction size and network fee safely.'
    );
  }

  if (actualFeeSats <= 0 || treasuryOutputSats <= 0) {
    throw new Error('Voucher reclaim transaction amounts are invalid.');
  }

  const txid = hashTransaction(encodedTransaction).trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(txid)) {
    throw new Error(
      'Could not calculate a valid deterministic reclaim transaction ID.'
    );
  }

  const fundingTxid = getExpectedVoucherFundingTxid(originalVoucher);

  return {
    status: 'prepared',

    rawTransactionHex: binToHex(encodedTransaction),

    txid,

    sourceFundingTxid: fundingTxid,

    sourceOutpointIndex: sourceUtxo.outpointIndex,

    sourceValueSats,

    voucherAddress: originalVoucher.address,

    voucherDerivationIndex: originalVoucher.derivationIndex,

    treasuryAddress,

    treasuryOutputSats,

    actualFeeSats,

    inputCount: 1,

    outputCount: 1,

    preparedAt: new Date().toISOString(),
  };
}
