import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import type { Event } from '../models/Event';

// Redis client singleton
let redisClient: RedisClientType | null = null;

// Redis connection status
let redisIsReady = false;

/**
 * Initialize Redis client
 */
export const initRedis = async (): Promise<boolean> => {
  if (redisClient && redisIsReady) {
    return true; // already initialized so return true
  }

  if (!process.env.REDIS_CONNECTION_URL) {
    console.warn('REDIS_CONNECTION_URL not configured, running without Redis');
    return false;
  }

  try {
    console.log('Initializing Redis connection...');

    redisClient = createClient({
      url: process.env.REDIS_CONNECTION_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // exponential backoff with max delay of 30 seconds
          return Math.min(Math.pow(2, retries) * 100, 30000);
        },
        connectTimeout: 10000, // 10 seconds timeout
      },
    });

    redisClient.on('error', (err) => {
      console.error(`Redis connection error: ${err.message}`, err);
      redisIsReady = false;
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis successfully');
    });

    redisClient.on('ready', () => {
      console.log('Redis client is ready');
      redisIsReady = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
      redisIsReady = false;
    });

    await redisClient.connect();
    redisIsReady = true;
    console.log('Redis client connected');
    return true;
  } catch (error) {
    console.error(
      'Failed to connect to Redis, continuing without Redis cache:',
      error
    );
    redisIsReady = false;
    return false;
  }
};

/**
 * Get Redis client
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient && redisIsReady ? redisClient : null;
};

/**
 * Check if Redis is connected and ready
 */
export const isRedisReady = (): boolean => {
  return redisIsReady && redisClient !== null;
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisIsReady = false;
    console.log('Redis connection closed');
  }
};

// Redis keys for various data
export const REDIS_KEYS = {
  eventSlots: (eventId: number) => `event:${eventId}:slots`,
  eventData: (eventId: number) => `event:${eventId}:data`,
};

// Helper functions for event slots operations
export const redisEventOps = {
  // initialize all event slots in Redis
  // DEPRECATED in favor of synchronous processing of batch rather than async (see services/caching.ts)
  initializeEventSlots: async (events: Event[]): Promise<void> => {
    try {
      if (!isRedisReady()) {
        console.log('Redis not connected, skipping event cache initialization');
        return;
      }

      const client = getRedisClient()!;
      const pipeline = client.multi();

      for (const event of events) {
        const available = event.max_slots - event.registered_slots;
        const data = {
          available,
          total: event.max_slots,
        };

        pipeline.setEx(
          REDIS_KEYS.eventSlots(event.id),
          300, // 5 minutes TTL
          JSON.stringify(data)
        );
      }

      await pipeline.exec();
      console.log(`Initialized ${events.length} events in Redis cache`);
    } catch (error) {
      console.error('Failed to initialize event slots in Redis:', error);
    }
  },

  // sync specific event between DB and Redis for consistency
  syncEventSlots: async (eventId: number, event: Event): Promise<void> => {
    try {
      if (!isRedisReady()) return;

      const client = getRedisClient()!;
      const available = event.max_slots - event.registered_slots;
      const data = {
        available,
        total: event.max_slots,
      };

      await client.setEx(
        REDIS_KEYS.eventSlots(eventId),
        300, // 5 minutes TTL
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(`Failed to sync event ${eventId} in Redis:`, error);
    }
  },

  // reconcile
  verifyEventSlotsConsistency: async (
    eventId: number,
    event: Event
  ): Promise<boolean> => {
    try {
      if (!isRedisReady()) return false;

      const client = getRedisClient()!;
      const cachedData = await client.get(REDIS_KEYS.eventSlots(eventId));
      if (!cachedData) return false;

      const redisSlots = JSON.parse(cachedData);
      const dbAvailable = event.max_slots - event.registered_slots;

      // sync with DB values
      if (
        redisSlots.available !== dbAvailable ||
        redisSlots.total !== event.max_slots
      ) {
        console.log(
          `Fixing inconsistency for event ${eventId}: Redis (${redisSlots.available}/${redisSlots.total}) vs DB (${dbAvailable}/${event.max_slots})`
        );

        await redisEventOps.syncEventSlots(eventId, event);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error verifying consistency for event ${eventId}:`, error);
      return false;
    }
  },

  // get available slots with fallback to database
  getEventSlots: async (
    eventId: number
  ): Promise<{ available: number; total: number } | null> => {
    try {
      if (!isRedisReady()) return null;

      const client = getRedisClient()!;
      const cachedData = await client.get(REDIS_KEYS.eventSlots(eventId));
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error(`Redis getEventSlots error for event ${eventId}:`, error);
      return null;
    }
  },

  // set available slots with TTL
  setEventSlots: async (
    eventId: number,
    data: { available: number; total: number },
    ttlSeconds = 300
  ): Promise<void> => {
    try {
      if (!isRedisReady()) return;

      const client = getRedisClient()!;
      await client.setEx(
        REDIS_KEYS.eventSlots(eventId),
        ttlSeconds,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(`Redis setEventSlots error for event ${eventId}:`, error);
    }
  },

  // update slots after registration (atomically decrement available slots)
  updateSlotsAfterRegistration: async (eventId: number): Promise<void> => {
    if (!isRedisReady()) return;

    const retries = 3;
    let attempt = 0;

    while (attempt < retries) {
      try {
        const client = getRedisClient()!;
        const cachedData = await client.get(REDIS_KEYS.eventSlots(eventId));

        if (cachedData) {
          const data = JSON.parse(cachedData);
          if (data.available > 0) {
            data.available -= 1;
            await client.setEx(
              REDIS_KEYS.eventSlots(eventId),
              300, // 5 minutes TTL
              JSON.stringify(data)
            );
          }
        }

        return; // success
      } catch (error) {
        attempt++;
        console.error(
          `Redis updateSlotsAfterRegistration error for event ${eventId}:`,
          error
        );

        // exponential backoff
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt))
          );
        }
      }
    }

    // if all retries fail, then invalidate cache to force refresh from DB
    try {
      const client = getRedisClient();
      if (client) {
        await client.del(REDIS_KEYS.eventSlots(eventId));
      }
    } catch (delError) {
      console.error(
        `Failed to invalidate Redis cache for event ${eventId}:`,
        delError
      );
    }
  },

  // invalidate event slots cache
  invalidateEventSlots: async (eventId: number): Promise<void> => {
    try {
      if (!isRedisReady()) return;

      const client = getRedisClient()!;
      await client.del(REDIS_KEYS.eventSlots(eventId));
    } catch (error) {
      console.error(
        `Redis invalidateEventSlots error for event ${eventId}:`,
        error
      );
    }
  },
};

export default {
  initRedis,
  getRedisClient,
  isRedisReady,
  closeRedis,
  redisEventOps,
  REDIS_KEYS,
};
