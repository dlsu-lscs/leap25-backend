import { getDB } from '../config/database';
import { getRedisClient, isRedisReady } from '../config/redis';
import { Router } from 'express';

const router = Router();

router.get('/ready', async (_, res) => {
  try {
    // check DB connection
    const pool = await getDB();
    pool.query('SELECT 1');

    // check Redis connection

    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
    } else {
      // if Redis is configured but client isn't available
      if (process.env.REDIS_CONNECTION_URL) {
        res.status(500).send('Redis client not available');
        return;
      }
      // if Redis isn't configured, skip it (app still healthy)
      console.warn('Redis not configured, skipping Redis health check');
    }

    res.status(200).send('Ready');
    return;
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).send(`Not ready: ${(error as Error).message}`);
    return;
  }
});

router.get('/live', (_, res) => {
  // simple check if app is running
  res.status(200).send('Alive');
});

export default router;
