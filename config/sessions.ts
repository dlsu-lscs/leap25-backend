import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import type { Event } from '../models/Event';

export const redisClient = createClient({
  url: process.env.REDIS_CONNECTION_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // exponential backoff with max delay of 30 seconds
      return Math.min(Math.pow(2, retries) * 100, 30000);
    },
  },
});

redisClient.on('error', (err) => {
  console.error(`Redis connection error: ${err.message}`, err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

connectRedis();

const store = new RedisStore({
  client: redisClient,
  prefix: 'session:',
  ttl: 86400 * 30, // 30 days in seconds
});

export const sessionMiddleware = session({
  store,
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});

// Redis keys and operations for event slots
export const REDIS_KEYS = {
  eventSlots: (eventId: number) => `event:${eventId}:slots`,
  eventData: (eventId: number) => `event:${eventId}:data`,
};

// Helper functions for event slots operations
export const redisEventOps = {
  // Initialize all event slots in Redis
  initializeEventSlots: async (events: Event[]): Promise<void> => {
    try {
      const pipeline = redisClient.multi();

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
      // Continue without Redis - application will fall back to DB
    }
  },

  // Sync a specific event between DB and Redis to ensure consistency
  syncEventSlots: async (eventId: number, event: Event): Promise<void> => {
    try {
      const available = event.max_slots - event.registered_slots;
      const data = {
        available,
        total: event.max_slots,
      };

      await redisClient.setEx(
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
      const cachedData = await redisClient.get(REDIS_KEYS.eventSlots(eventId));
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
      if (!redisClient.isReady) {
        return null; // skip Redis operations if client not ready
      }
      const cachedData = await redisClient.get(REDIS_KEYS.eventSlots(eventId));
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
      await redisClient.setEx(
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
    try {
      const cachedData = await redisClient.get(REDIS_KEYS.eventSlots(eventId));
      if (cachedData) {
        const data = JSON.parse(cachedData);
        if (data.available > 0) {
          data.available -= 1;
          await redisClient.setEx(
            REDIS_KEYS.eventSlots(eventId),
            300, // 5 minutes TTL
            JSON.stringify(data)
          );
        }
      }
    } catch (error) {
      console.error(
        `Redis updateSlotsAfterRegistration error for event ${eventId}:`,
        error
      );
      // invalidate cache to force refresh from DB on next read
      await redisClient.del(REDIS_KEYS.eventSlots(eventId));
    }
  },

  // invalidate event slots cache
  invalidateEventSlots: async (eventId: number): Promise<void> => {
    try {
      await redisClient.del(REDIS_KEYS.eventSlots(eventId));
    } catch (error) {
      console.error(
        `Redis invalidateEventSlots error for event ${eventId}:`,
        error
      );
    }
  },
};
