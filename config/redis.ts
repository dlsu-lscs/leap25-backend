import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisIsReady = false;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (redisClient && redisIsReady) {
    return redisClient;
  }

  if (!process.env.REDIS_CONNECTION_URL) {
    console.warn('REDIS_CONNECTION_URL not configured, running without Redis');
    return null;
  }

  try {
    if (!redisClient) {
      redisClient = createClient({
        url: process.env.REDIS_CONNECTION_URL,
        socket: {
          reconnectStrategy: (retries) => {
            // exponential backoff with max delay of 30 seconds
            return Math.min(Math.pow(2, retries) * 100, 30000);
          },
          connectTimeout: 10000, // 10 seconds
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

      redisClient.on('end', () => {
        console.log('Redis client connection closed');
        redisIsReady = false;
      });
    }

    if (!redisIsReady) {
      await redisClient.connect();
      redisIsReady = true;
    }

    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    redisIsReady = false;
    return null;
  }
};

// Helper to check if redis is available before operations
export const withRedis = async <T>(
  operation: (client: RedisClientType) => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> => {
  const client = await getRedisClient();
  if (client && redisIsReady) {
    try {
      return await operation(client);
    } catch (error) {
      console.error('Redis operation failed:', error);
      return await fallback();
    }
  }
  return await fallback();
};

// Gracefully shut down Redis
export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisIsReady) {
    await redisClient.quit();
    redisIsReady = false;
  }
};
