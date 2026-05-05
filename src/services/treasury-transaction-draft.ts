import {
  binToHex,
  encodeTransaction,
  generateTransaction,
  getMinimumFee,
} from '@bitauth/libauth';

import { ELECTRUM_SERVERS } from 'src/config';
import { ElectrumService } from 'src/services/electrum';
import { getTreasuryWalletRecord } from 'src/services/treasury-wallet';
import type { TreasuryTransactionDraft } from 'src/types/treasury-transaction-draft';
import type {
  TreasuryTransactionPlan,
  TreasuryTransactionPlanOutput,
} from 'src/types/treasury-transaction';
import { Address } from 'src/utils/address';
import { WalletHD } from 'src/utils/wallet-hd';

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

function getSelectedOutpointKey(
  outpointTransactionHash: string,
  outpointIndex: number
): string {
  return `${outpointTransactionHash}:${outpointIndex}`;
}

function getDirectiveOutpointKey(inputDirective: {
  outpointTransactionHash: Uint8Array;
  outpointIndex: number;
}): string {
  return `${binToHex(inputDirective.outpointTransactionHash)}:${
    inputDirective.outpointIndex
  }`;
}

async function getSelectedTreasuryInputDirectives(
  plan: TreasuryTransactionPlan
) {
  const treasuryWallet = await getTreasuryWalletRecord();

  if (!treasuryWallet) {
    throw new Error('Treasury wallet is not set up.');
  }

  const electrum = new ElectrumService(ELECTRUM_SERVERS);
  await electrum.start();

  const walletHd = await WalletHD.fromMnemonic(
    treasuryWallet.mnemonic,
    electrum
  );

  const [treasuryWalletP2pkh] = walletHd.deriveWallets(1, 0);

  if (!treasuryWalletP2pkh) {
    throw new Error('Could not derive treasury wallet for transaction draft.');
  }

  const allInputDirectives = await treasuryWalletP2pkh.getUnspentDirectives();

  const selectedOutpoints = new Set(
    plan.selectedUtxos.map((utxo) =>
      getSelectedOutpointKey(utxo.outpointTransactionHash, utxo.outpointIndex)
    )
  );

  const selectedInputDirectives = allInputDirectives.filter((inputDirective) =>
    selectedOutpoints.has(getDirectiveOutpointKey(inputDirective))
  );

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
 * This creates a local transaction draft only. It does not broadcast.
 *
 * The generated draft may be signed because CashStamps/libauth input
 * directives include private-key signing data. Treat rawTransactionHex as
 * sensitive until the real broadcast flow is deliberately enabled.
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

    for (let i = 0; i < 2; i++) {
      actualFeeSats = Number(
        getMinimumFee(BigInt(encodedTransaction.length), 1000n)
      );

      actualChangeSats =
        selectedInputSats - nonChangeOutputSats - actualFeeSats;

      if (actualChangeSats < 0) {
        return createInvalidDraft(
          plan,
          'Selected treasury UTXOs do not cover outputs and actual estimated fee.'
        );
      }

      const outputs = [
        ...nonChangeOutputs.map(outputToLockingBytecode),
        ...(actualChangeSats > 0
          ? [
              {
                lockingBytecode: Address.fromCashAddrOrLegacy(
                  plan.treasuryAddress
                ).toLockscriptBytes(),
                valueSatoshis: BigInt(actualChangeSats),
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

      encodedTransaction = encodeTransaction(generatedTransaction.transaction);
    }

    return {
      status: 'created',
      plan,
      rawTransactionHex: binToHex(encodedTransaction),
      rawTransactionBytesLength: encodedTransaction.length,
      actualFeeSats,
      actualChangeSats,
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
 * This remains useful because Vue computed values should not perform async
 * wallet/UTXO work. The real async draft builder is
 * createTreasuryTransactionDraftFromPlan().
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
