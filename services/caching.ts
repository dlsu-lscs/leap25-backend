import { redisEventOps, isRedisReady } from '../config/redis';
import { getAllEvents } from './event.service';

/**
 * Initialize event cache in Redis
 */
export const initializeEventCache = async (): Promise<void> => {
  if (!isRedisReady()) {
    console.log('Redis not available, skipping event cache initialization');
    return;
  }

  try {
    console.log('Initializing Redis event cache...');
    const events = await getAllEvents();

    // process in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await redisEventOps.initializeEventSlots(batch);

      // small delay between batches to avoid Redis overload
      if (i + batchSize < events.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    console.log(`Redis cache initialized with ${events.length} events`);
  } catch (error) {
    console.error('Failed to initialize Redis event cache:', error);
  }
};

/**
 * Start periodic consistency check for events
 */
export const startConsistencyChecks = (): NodeJS.Timeout => {
  console.log('Starting periodic consistency checks for event slots');

  // run every 5 minutes
  return setInterval(
    async () => {
      if (!isRedisReady()) {
        return;
      }

      try {
        const events = await getAllEvents();
        let fixed = 0;

        // process in batches
        const batchSize = 50;
        for (let i = 0; i < events.length; i += batchSize) {
          const batch = events.slice(i, i + batchSize);

          for (const event of batch) {
            const isConsistent =
              await redisEventOps.verifyEventSlotsConsistency(event.id, event);
            if (!isConsistent) fixed++;
          }

          // small delay between batches
          if (i + batchSize < events.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        if (fixed > 0) {
          console.log(
            `Fixed ${fixed} inconsistent event slot records in Redis`
          );
        }
      } catch (error) {
        console.error('Error during event slots consistency check:', error);
      }
    },
    5 * 60 * 1000
  ); // 5 minutes
};

export default { initializeEventCache, startConsistencyChecks };
