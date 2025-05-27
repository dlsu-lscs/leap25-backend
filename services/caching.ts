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

export const initializeEventCacheWithLeaderElection =
  async (): Promise<void> => {
    if (!isRedisReady()) {
      console.log('Redis not available, skipping event cache initialization');
      return;
    }

    const client = getRedisClient()!;
    const instanceId =
      process.env.INSTANCE_ID ||
      `instance-${Math.random().toString(36).substring(2, 10)}`;
    const lockKey = 'cache:initialization:lock';
    const lockTTL = 300; // 5 minutes

    try {
      // acquire the lock with NX (only set if doesn't exist)
      const lockAcquired = await client.set(lockKey, instanceId, {
        NX: true,
        EX: lockTTL,
      });

      if (!lockAcquired) {
        // shortcircuit if another instance is initializing the cache
        console.log(
          'Cache initialization already in progress by another instance'
        );
        return;
      }

      console.log(
        `Instance ${instanceId} acquired lock and is initializing cache`
      );

      // perform initialization if leader
      await initializeEventCache();

      console.log(`Cache initialization completed by instance ${instanceId}`);

      // release lock only if we are still the owner
      const lockValue = await client.get(lockKey);
      if (lockValue === instanceId) {
        await client.del(lockKey);
      }
    } catch (error) {
      console.error(
        'Error during leader election for cache initialization:',
        error
      );

      // release lock in case of failure
      try {
        const lockValue = await client.get(lockKey);
        if (lockValue === instanceId) {
          await client.del(lockKey);
        }
      } catch (releaseError) {
        console.error('Failed to release lock:', releaseError);
      }
    }
  };

export const initializeEventCacheWithProgress = async (): Promise<void> => {
  if (!isRedisReady()) {
    console.log('Redis not available, skipping event cache initialization');
    return;
  }

  try {
    const client = getRedisClient()!;
    const events = await getAllEvents();
    const totalEvents = events.length;

    await client.set(
      'cache:reinitialization:status',
      JSON.stringify({
        startedAt: new Date().toISOString(),
        progress: 'running',
        totalEvents,
        completedEvents: 0,
      })
    );

    const batchSize = 200;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const pipeline = client.multi();

      for (const event of batch) {
        const available = event.max_slots - event.registered_slots;
        const key = REDIS_KEYS.eventSlots(event.id);
        const data = JSON.stringify({ available, total: event.max_slots });
        pipeline.setEx(key, 300, data);
      }

      await pipeline.exec();

      await client.set(
        'cache:reinitialization:status',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          progress: 'running',
          totalEvents,
          completedEvents: Math.min(i + batchSize, totalEvents),
          percentComplete: Math.min(
            100,
            Math.round(((i + batchSize) / totalEvents) * 100)
          ),
        })
      );

      // slow down to reduce database load during imports
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await client.set(
      'cache:reinitialization:status',
      JSON.stringify({
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        progress: 'completed',
        totalEvents,
        completedEvents: totalEvents,
        percentComplete: 100,
      }),
      { EX: 3600 }
    ); // keep the status for 1 hour

    // remove manual reinitialization flag
    await client.del('cache:manual_reinitialization');

    console.log(
      `Redis cache initialized with ${events.length} events (with progress tracking)`
    );
  } catch (error) {
    console.error(
      'Failed to initialize Redis event cache with progress:',
      error
    );

    const client = getRedisClient();
    if (client) {
      await client.set(
        'cache:reinitialization:status',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          progress: 'failed',
          error: (error as Error).message,
        }),
        { EX: 3600 }
      );

      await client.del('cache:manual_reinitialization');
    }
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

export const startConsistencyChecksWithLeaderElection = (): NodeJS.Timeout => {
  console.log('Setting up periodic consistency checks for event slots');

  // shorter interval for leader election (every minute)
  return setInterval(
    async () => {
      if (!isRedisReady()) return;

      const client = getRedisClient()!;
      const instanceId =
        process.env.INSTANCE_ID ||
        `instance-${Math.random().toString(36).substring(2, 10)}`;
      const lockKey = 'cache:consistency:lock';

      try {
        const lockAcquired = await client.set(lockKey, instanceId, {
          NX: true,
          EX: 60, // 1 minute lock
        });

        if (!lockAcquired) {
          return;
        }

        console.log(`Instance ${instanceId} performing consistency checks`);

        await runConsistencyChecks();

        // release the lock
        const lockValue = await client.get(lockKey);
        if (lockValue === instanceId) {
          await client.del(lockKey);
        }
      } catch (error) {
        console.error(
          'Error during leader election for consistency checks:',
          error
        );
        try {
          const lockValue = await client.get(lockKey);
          if (lockValue === instanceId) {
            await client.del(lockKey);
          }
        } catch (releaseError) {
          console.error('Failed to release lock:', releaseError);
        }
      }
    },
    60 * 1000 // check for leadership every minute
  );
};

/**
 * Run consistency checks between database and Redis cache
 * This function contains the core logic extracted from startConsistencyChecks
 */
async function runConsistencyChecks(): Promise<void> {
  if (!isRedisReady()) {
    console.log('Redis not ready, skipping consistency check');
    return;
  }

  const client = getRedisClient()!;

  // check if manual reinitialization is in progress
  const manualReinitFlag = await client.get('cache:manual_reinitialization');
  if (manualReinitFlag) {
    console.log(
      'Skipping consistency checks due to manual cache reinitialization in progress'
    );
    return;
  }

  try {
    // update status to running
    await client.set(
      'cache:consistency:status',
      JSON.stringify({
        startedAt: new Date().toISOString(),
        progress: 'running',
      }),
      { EX: 600 }
    );

    // transaction get all events for consistency
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

      // update status to error
      await client.set(
        'cache:consistency:status',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          progress: 'failed',
          error: (dbError as Error).message,
        }),
        { EX: 600 }
      );

      return;
    } finally {
      connection.release();
    }

    let fixed = 0;
    let consistent = 0;
    let errors = 0;
    let unavailable = 0;
    const totalEvents = events.length;

    // do batching
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((event) =>
          redisEventOps.verifyEventSlotsConsistency(event.id, event)
        )
      );

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

      // update progress status to running
      await client.set(
        'cache:consistency:status',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          progress: 'running',
          processedEvents: Math.min(i + batchSize, totalEvents),
          totalEvents,
          percentComplete: Math.round(
            Math.min(100, ((i + batchSize) / totalEvents) * 100)
          ),
          consistent,
          fixed,
          errors,
          unavailable,
        }),
        { EX: 600 }
      );

      // small delay between batches to avoid overwhelming Redis
      if (i + batchSize < events.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Event slots consistency check completed:
      - Total events: ${events.length}
      - Consistent: ${consistent}
      - Fixed: ${fixed}
      - Errors: ${errors}
      - Unavailable: ${unavailable}
    `);

    await client.set(
      'cache:consistency:status',
      JSON.stringify({
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        progress: 'completed',
        totalEvents,
        consistent,
        fixed,
        errors,
        unavailable,
      }),
      { EX: 3600 }
    ); // keep status for 1 hour
  } catch (error) {
    console.error('Error during event slots consistency check:', error);

    try {
      await client.set(
        'cache:consistency:status',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          progress: 'failed',
          error: (error as Error).message,
        }),
        { EX: 600 }
      );
    } catch (statusError) {
      console.error('Failed to update consistency check status:', statusError);
    }
  }
}

export default {
  initializeEventCache,
  initializeEventCacheWithProgress,
  startConsistencyChecks,
  startConsistencyChecksWithLeaderElection,
  runConsistencyChecks,
};
