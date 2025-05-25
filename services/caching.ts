import {
  REDIS_KEYS,
  redisEventOps,
  isRedisReady,
  getRedisClient,
} from '../config/redis';
import { getAllEvents } from './event.service';
import { getDB } from '../config/database';
import type { Event } from '../models/Event';

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
    const client = getRedisClient()!;

    // PERF: process batches of 100 for better performance
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const pipeline = client.multi();

      // await redisEventOps.initializeEventSlots(batch);
      for (const event of batch) {
        const available = event.max_slots - event.registered_slots;
        const key = REDIS_KEYS.eventSlots(event.id);
        const data = JSON.stringify({ available, total: event.max_slots });
        pipeline.setEx(key, 300, data);
      }

      await pipeline.exec();
      console.log(`Initialized batch of ${batch.length} events in Redis cache`);

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
        console.log('Redis not ready, skipping consistency check');
        return;
      }

      try {
        // Get all events using a transaction for consistency
        const db = await getDB();
        const connection = await db.getConnection();
        let events: Event[] = [];

        try {
          await connection.beginTransaction();
          const [rows] = await connection.query(
            'SELECT id, max_slots, registered_slots FROM events'
          );
          await connection.commit();
          events = rows as Event[];
        } catch (dbError) {
          await connection.rollback();
          console.error('Error getting events for consistency check:', dbError);
          return;
        } finally {
          connection.release();
        }

        // Stats tracking
        let fixed = 0;
        let consistent = 0;
        let errors = 0;
        let unavailable = 0;

        // Process in batches to avoid overwhelming Redis
        const batchSize = 50;
        for (let i = 0; i < events.length; i += batchSize) {
          const batch = events.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map((event) =>
              redisEventOps.verifyEventSlotsConsistency(event.id, event)
            )
          );

          // Process results
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const checkResult = result.value;
              switch (checkResult.status) {
                case 'consistent':
                  consistent++;
                  break;
                case 'inconsistent':
                  if (checkResult.fixed) fixed++;
                  break;
                case 'unavailable':
                  unavailable++;
                  break;
                case 'error':
                  errors++;
                  console.error(
                    `Error for event ${batch[index]?.id}: ${checkResult.message}`
                  );
                  break;
              }
            } else {
              errors++;
              console.error(
                `Failed to check event ${batch[index]?.id}:`,
                result.reason
              );
            }
          });

          // Small delay between batches to avoid overwhelming Redis
          if (i + batchSize < events.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // Log summary
        console.log(`Event slots consistency check completed:
          - Total events: ${events.length}
          - Consistent: ${consistent}
          - Fixed: ${fixed}
          - Errors: ${errors}
          - Unavailable: ${unavailable}
        `);
      } catch (error) {
        console.error('Error during event slots consistency check:', error);
      }
    },
    5 * 60 * 1000
  ); // 5 minutes
};

export default { initializeEventCache, startConsistencyChecks };
