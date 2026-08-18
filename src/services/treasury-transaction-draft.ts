import {
  binToHex,
  encodeTransaction,
  generateTransaction,
  getMinimumFee,
} from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import {
  createTreasuryChangeAllocation,
  isAtOrAboveStandardP2pkhDustLimit,
  STANDARD_P2PKH_DUST_LIMIT_SATS,
} from 'src/services/treasury-output-safety';
import { getTreasuryWalletRecord } from 'src/services/treasury-wallet';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type {
  TreasuryTransactionPlan,
  TreasuryTransactionPlanOutput,
} from 'src/types/treasury-transaction';
import {
  doesTreasuryInputDirectiveMatchSelectedUtxo,
  getSelectedTreasuryDerivationIndexes,
} from 'src/services/treasury-utxo-matching';
import { Address } from 'src/utils/address';
import { WalletHD } from 'src/utils/wallet-hd';

const MAX_FEE_STABILISATION_PASSES = 5;

function createInvalidDraft(
  plan: TreasuryTransactionPlan,
  errorMessage: string
): TreasuryTransactionDraft {
  return {
    status: 'invalid',
    plan,
    broadcastEnabled: false,
    errorMessage,
    createdAt: new Date().toISOString(),
  };
}

function createNotCreatedDraft(
  plan: TreasuryTransactionPlan,
  errorMessage: string
): TreasuryTransactionDraft {
  return {
    status: 'not_created',
    plan,
    broadcastEnabled: false,
    errorMessage,
    createdAt: new Date().toISOString(),
  };
}

function outputToLockingBytecode(output: TreasuryTransactionPlanOutput) {
  return {
    lockingBytecode: Address.fromCashAddrOrLegacy(
      output.address
    ).toLockscriptBytes(),
    valueSatoshis: BigInt(output.valueSats),
  };
}

function getNonChangeOutputs(
  outputs: TreasuryTransactionPlanOutput[]
): TreasuryTransactionPlanOutput[] {
  return outputs.filter((output) => output.purpose !== 'change');
}

async function getSelectedTreasuryInputDirectives(
  plan: TreasuryTransactionPlan
) {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    throw new Error('Treasury wallet is not set up.');
  }

  /**
   * Every selected UTXO must retain the treasury child-wallet index that owns
   * it.
   *
   * This allows Topups to spend BCH held not only at treasury index 0, but
   * also at known Cash-out receiving addresses at indexes 1+.
   */
  const requiredDerivationIndexes = getSelectedTreasuryDerivationIndexes(
    plan.selectedUtxos
  );

  const electrum = new ElectrumService(ELECTRUM_SERVERS);

  await electrum.start();

  const walletHd = await WalletHD.fromMnemonic(
    treasuryWallet.mnemonic,
    electrum
  );

  /**
   * Derive only the treasury child wallets that actually own one or more of
   * the selected transaction inputs.
   */
  const requiredTreasuryWallets = requiredDerivationIndexes.map(
    (derivationIndex) => {
      const [wallet] = walletHd.deriveWallets(1, derivationIndex);

      if (!wallet) {
        throw new Error(
          `Could not derive treasury wallet at index ${derivationIndex}.`
        );
      }

      return {
        derivationIndex,
        wallet,
      };
    }
  );

  /**
   * Ask every required owning wallet for its current signable UTXOs.
   */
  const directiveGroups = await Promise.all(
    requiredTreasuryWallets.map(async ({ wallet }) =>
      wallet.getUnspentDirectives()
    )
  );

  const allInputDirectives = directiveGroups.flat();

  /**
   * Select only directives corresponding to the exact UTXOs selected by the
   * funding plan.
   */
  const selectedInputDirectives = allInputDirectives.filter((inputDirective) =>
    plan.selectedUtxos.some((selectedUtxo) =>
      doesTreasuryInputDirectiveMatchSelectedUtxo(selectedUtxo, inputDirective)
    )
  );

  /**
   * Fail closed unless every selected UTXO has exactly one signable
   * directive available.
   */
  if (selectedInputDirectives.length !== plan.selectedUtxos.length) {
    throw new Error(
      'Could not match all selected treasury UTXOs to signing directives.'
    );
  }

  return selectedInputDirectives;
}

/**
 * Build an encoded transaction draft from a valid transaction plan.
 *
 * This creates a local signed transaction draft only. It does not broadcast.
 *
 * Any positive final treasury change below the standard P2PKH dust floor is
 * deliberately absorbed into the miner fee instead of creating a dust output.
 */
export async function createTreasuryTransactionDraftFromPlan(
  plan: TreasuryTransactionPlan
): Promise<TreasuryTransactionDraft> {
  if (plan.status !== 'valid') {
    return createInvalidDraft(
      plan,
      plan.invalidMessage ??
        'Transaction plan is invalid, so no transaction draft was created.'
    );
  }

  if (plan.selectedUtxos.length === 0) {
    return createInvalidDraft(
      plan,
      'No treasury UTXOs are selected for this transaction.'
    );
  }

  const nonChangeOutputs = getNonChangeOutputs(plan.outputs);

  if (nonChangeOutputs.length === 0) {
    return createInvalidDraft(
      plan,
      'No non-change outputs are available for this transaction.'
    );
  }

  const unsafeOutput = nonChangeOutputs.find(
    (output) => !isAtOrAboveStandardP2pkhDustLimit(output.valueSats)
  );

  if (unsafeOutput) {
    return createInvalidDraft(
      plan,
      `${unsafeOutput.purpose} output is below the ${STANDARD_P2PKH_DUST_LIMIT_SATS}-satoshi standard dust floor.`
    );
  }

  try {
    const selectedInputDirectives = await getSelectedTreasuryInputDirectives(
      plan
    );

    const selectedInputSats = plan.selectedUtxos.reduce(
      (total, utxo) => total + utxo.valueSats,
      0
    );

    const nonChangeOutputSats = nonChangeOutputs.reduce(
      (total, output) => total + output.valueSats,
      0
    );

    let encodedTransaction: Uint8Array<ArrayBufferLike> = new Uint8Array();

    let actualFeeSats = 0;
    let actualChangeSats = 0;
    let dustChangeAbsorbedSats = 0;
    let transactionStabilised = false;

    for (let pass = 0; pass < MAX_FEE_STABILISATION_PASSES; pass += 1) {
      const minimumFeeSats = Number(
        getMinimumFee(BigInt(encodedTransaction.length), 1000n)
      );

      const changeAllocation = createTreasuryChangeAllocation({
        selectedInputSats,
        nonChangeOutputSats,
        minimumFeeSats,
      });

      if (!changeAllocation.isAffordable) {
        return createInvalidDraft(
          plan,
          'Selected treasury UTXOs do not cover outputs and the required network fee.'
        );
      }

      const outputs = [
        ...nonChangeOutputs.map(outputToLockingBytecode),

        ...(changeAllocation.changeSats > 0
          ? [
              {
                lockingBytecode: Address.fromCashAddrOrLegacy(
                  plan.treasuryAddress
                ).toLockscriptBytes(),

                valueSatoshis: BigInt(changeAllocation.changeSats),
              },
            ]
          : []),
      ];

      const generatedTransaction = generateTransaction({
        version: 2,
        locktime: 0,
        inputs: selectedInputDirectives,
        outputs,
      });

      if (!generatedTransaction.success) {
        return createInvalidDraft(
          plan,
          `Failed to generate transaction draft: ${generatedTransaction.errors.join(
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
        selectedInputSats - nonChangeOutputSats - changeAllocation.changeSats;

      encodedTransaction = nextEncodedTransaction;

      actualFeeSats = candidateActualFeeSats;
      actualChangeSats = changeAllocation.changeSats;

      dustChangeAbsorbedSats = changeAllocation.dustChangeAbsorbedSats;

      if (candidateActualFeeSats >= finalMinimumFeeSats) {
        transactionStabilised = true;
        break;
      }
    }

    if (!transactionStabilised) {
      return createInvalidDraft(
        plan,
        'Could not stabilise transaction size and minimum network fee safely.'
      );
    }

    return {
      status: 'created',
      plan,

      rawTransactionHex: binToHex(encodedTransaction),
      rawTransactionBytesLength: encodedTransaction.length,

      actualFeeSats,
      actualChangeSats,
      dustChangeAbsorbedSats,

      inputCount: selectedInputDirectives.length,

      outputCount: nonChangeOutputs.length + (actualChangeSats > 0 ? 1 : 0),

      broadcastEnabled: false,

      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    return createNotCreatedDraft(
      plan,
      error instanceof Error
        ? error.message
        : 'Could not create treasury transaction draft.'
    );
  }
}

/**
 * Synchronous dry-run placeholder used by current UI computed state.
 *
 * Vue computed values must not perform async wallet/UTXO work. The real async
 * draft builder is createTreasuryTransactionDraftFromPlan().
 */
export function createTreasuryTransactionDraftStatusFromPlan(
  plan: TreasuryTransactionPlan
): TreasuryTransactionDraft {
  if (plan.status !== 'valid') {
    return createInvalidDraft(
      plan,
      plan.invalidMessage ??
        'Transaction plan is invalid, so no transaction draft was created.'
    );
  }

  return createNotCreatedDraft(
    plan,
    'Real transaction draft generation is available but has not been run from the UI yet.'
  );
}
