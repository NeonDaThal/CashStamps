import { strict as assert } from 'assert';

import {
  classifyVoucherPrintFailure,
  VoucherPrintDeliveryError,
  VOUCHER_PRINT_DEFINITELY_NOT_PRINTED_CODE,
  VOUCHER_PRINT_OUTCOME_UNCERTAIN_CODE,
} from './voucher-print-outcome';

function runTests(): void {
  {
    const result = classifyVoucherPrintFailure({
      code: VOUCHER_PRINT_DEFINITELY_NOT_PRINTED_CODE,

      message: 'Bluetooth connection failed before receipt transmission.',
    });

    assert.equal(result.status, 'definitely_not_printed');

    console.log('✓ Native pre-transmission failure is definitely not printed');
  }

  {
    const result = classifyVoucherPrintFailure({
      code: VOUCHER_PRINT_OUTCOME_UNCERTAIN_CODE,

      message: 'Receipt transmission began before the Bluetooth error.',
    });

    assert.equal(result.status, 'uncertain');

    console.log('✓ Native post-write-start failure is uncertain');
  }

  {
    const result = classifyVoucherPrintFailure(
      new Error('Unknown Capacitor bridge failure')
    );

    assert.equal(result.status, 'uncertain');

    console.log('✓ Unknown bridge failure fails closed as uncertain');
  }

  {
    const error = new VoucherPrintDeliveryError(
      'definitely_not_printed',
      'Android printer bridge is unavailable.'
    );

    const result = classifyVoucherPrintFailure(error);

    assert.equal(result.status, 'definitely_not_printed');

    console.log(
      '✓ Known JavaScript pre-print failure remains definitely not printed'
    );
  }

  {
    const error = new VoucherPrintDeliveryError(
      'uncertain',
      'Physical print outcome is unknown.'
    );

    const result = classifyVoucherPrintFailure(error);

    assert.equal(result.status, 'uncertain');

    console.log('✓ Typed uncertain delivery failure remains uncertain');
  }

  console.log('\nAll 5 voucher print outcome tests passed successfully.');
}

runTests();
