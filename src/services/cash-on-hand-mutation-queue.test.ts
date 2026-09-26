import { createCashOnHandMutationQueue } from 'src/services/cash-on-hand-store';

function assertEqual(
  actual: unknown,
  expected: unknown,
  message?: string
): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(actual)} to equal ${String(expected)}.`
    );
  }
}

async function runD5F1Tests(): Promise<void> {
  /**
   * Prove overlapping operations execute one at a time in submission order.
   */
  {
    const enqueue = createCashOnHandMutationQueue();

    const events: string[] = [];

    let activeOperations = 0;

    let maximumActiveOperations = 0;

    let releaseFirst: (() => void) | undefined;

    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = enqueue(async () => {
      activeOperations += 1;

      maximumActiveOperations = Math.max(
        maximumActiveOperations,
        activeOperations
      );

      events.push('first-start');

      await firstGate;

      events.push('first-end');

      activeOperations -= 1;

      return 'first';
    });

    const second = enqueue(async () => {
      activeOperations += 1;

      maximumActiveOperations = Math.max(
        maximumActiveOperations,
        activeOperations
      );

      events.push('second-start');

      events.push('second-end');

      activeOperations -= 1;

      return 'second';
    });

    /**
     * Allow the first operation to start.
     */
    await Promise.resolve();
    await Promise.resolve();

    assertEqual(events.join(','), 'first-start');

    assertEqual(maximumActiveOperations, 1);

    if (!releaseFirst) {
      throw new Error('First mutation gate was not created.');
    }

    releaseFirst();

    const results = await Promise.all([first, second]);

    assertEqual(results.join(','), 'first,second');

    assertEqual(
      events.join(','),
      'first-start,first-end,second-start,second-end'
    );

    assertEqual(
      maximumActiveOperations,
      1,
      'Cash-on-Hand mutations overlapped instead of serializing.'
    );

    console.log(
      'PASS: overlapping Cash-on-Hand mutations execute serially in submission order'
    );
  }

  /**
   * A failed mutation must not permanently poison the queue.
   */
  {
    const enqueue = createCashOnHandMutationQueue();

    let failureObserved = false;

    try {
      await enqueue(async () => {
        throw new Error('expected mutation failure');
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      assertEqual(message, 'expected mutation failure');

      failureObserved = true;
    }

    assertEqual(failureObserved, true);

    const result = await enqueue(async () => 'queue-recovered');

    assertEqual(result, 'queue-recovered');

    console.log(
      'PASS: failed mutation does not block later Cash-on-Hand operations'
    );
  }

  /**
   * A third operation queued while another is already waiting must still
   * preserve FIFO execution.
   */
  {
    const enqueue = createCashOnHandMutationQueue();

    const order: number[] = [];

    await Promise.all([
      enqueue(async () => {
        order.push(1);
      }),

      enqueue(async () => {
        order.push(2);
      }),

      enqueue(async () => {
        order.push(3);
      }),
    ]);

    assertEqual(order.join(','), '1,2,3');

    console.log('PASS: Cash-on-Hand mutation queue preserves FIFO ordering');
  }

  console.log('');

  console.log(
    'Cash-out Settlement D5F.1 Cash-on-Hand mutation queue tests passed.'
  );
}

runD5F1Tests().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
