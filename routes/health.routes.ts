import { getDB } from '../config/database';
import { getRedisClient, isRedisReady } from '../config/redis';
import { Router } from 'express';
import { initializeEventCacheWithProgress } from '../services/caching';

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

// add Redis inspection endpoint
router.get('/redis', async (_, res) => {
  try {
    const redis = getRedisClient();

    if (!isRedisReady() || !redis) {
      res.status(503).json({ error: 'Redis not available' });
      return;
    }

    // List all event-related keys
    const eventKeys = await redis.keys('event:*');

    if (eventKeys.length === 0) {
      res.json({ keys: [], message: 'No event keys found in Redis' });
      return;
    }

    // Get values for all found keys
    const pipeline = redis.multi();
    eventKeys.forEach((key) => pipeline.get(key));

    const values = await pipeline.exec();

    // Combine keys with their values
    const result = eventKeys.map((key, index) => {
      // Try to parse JSON if possible
      try {
        return { key, value: JSON.parse(values[index] as string) };
      } catch (e) {
        return { key, value: values[index] };
      }
    });

    res.json({
      count: eventKeys.length,
      keys: result,
    });
  } catch (error) {
    console.error('Error accessing Redis:', error);
    res.status(500).json({
      error: 'Error accessing Redis',
      message: (error as Error).message,
    });
  }
});

// Get specific key (separate route)
router.get('/redis/key/:key', async (req, res) => {
  try {
    const redis = getRedisClient();

    if (!isRedisReady() || !redis) {
      res.status(503).json({ error: 'Redis not available' });
      return;
    }

    const key = req.params.key;
    const value = await redis.get(key);

    if (value === null) {
      res.status(404).json({ error: `Key "${key}" not found` });
      return;
    }

    // Try to parse JSON if possible
    try {
      const parsed = JSON.parse(value);
      res.json({ key, value: parsed });
    } catch (e) {
      // If not valid JSON, return as string
      res.json({ key, value });
    }
  } catch (error) {
    console.error('Error accessing Redis key:', error);
    res.status(500).json({
      error: 'Error accessing Redis',
      message: (error as Error).message,
    });
  }
});

// Redis stats endpoint remains the same
router.get('/redis-stats', async (_, res) => {
  try {
    const redis = getRedisClient();

    if (!isRedisReady() || !redis) {
      res.status(503).json({ error: 'Redis not available' });
      return;
    }

    // Get Redis info
    const info = await redis.info();
    // Parse the info string into an object
    const infoObject: Record<string, string> = {};
    info.split('\r\n').forEach((line) => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          infoObject[key] = value;
        }
      }
    });

    // Return selected stats that are useful
    res.json({
      uptime_in_seconds: infoObject.uptime_in_seconds,
      connected_clients: infoObject.connected_clients,
      used_memory_human: infoObject.used_memory_human,
      total_connections_received: infoObject.total_connections_received,
      total_commands_processed: infoObject.total_commands_processed,
      keyspace_hits: infoObject.keyspace_hits,
      keyspace_misses: infoObject.keyspace_misses,
      raw: infoObject,
    });
  } catch (error) {
    console.error('Error getting Redis stats:', error);
    res.status(500).json({
      error: 'Error getting Redis stats',
      message: (error as Error).message,
    });
  }
});

// Admin endpoints for cache management
router.post('/cache/reinitialize', async (req, res) => {
  try {
    // const authHeader = req.headers.authorization;
    // if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    //   res.status(401).json({ error: 'Unauthorized' });
    //   return;
    // }

    let inProgress = true;

    res.status(202).json({
      message: 'Cache reinitialization started',
      checkStatusAt: '/health/cache/status',
    });

    const client = getRedisClient();
    if (client) {
      await client.set(
        'cache:reinitialization:status',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          progress: 'starting',
          completedEvents: 0,
        })
      );

      await client.set('cache:manual_reinitialization', '1', { EX: 3600 });
    }

    await initializeEventCacheWithProgress();
  } catch (error) {
    console.error('Error triggering cache reinitialization:', error);
    res.status(500).json({
      error: 'Failed to start cache reinitialization',
      message: (error as Error).message,
    });
  }
});

// Status endpoint
router.get('/cache/status', async (req, res) => {
  try {
    const client = getRedisClient();
    if (!client) {
      res.status(503).json({ error: 'Redis not available' });
      return;
    }

    const status = await client.get('cache:reinitialization:status');
    if (!status) {
      res.status(404).json({
        message: 'No cache reinitialization in progress or recently completed',
      });
      return;
    }

    res.status(200).json(JSON.parse(status));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache status' });
  }
});

router.get('/cache/consistency/status', async (_, res) => {
  try {
    const redis = getRedisClient();

    if (!isRedisReady() || !redis) {
      res.status(503).json({ error: 'Redis not available' });
      return;
    }

    const status = await redis.get('cache:consistency:status');

    if (!status) {
      res.status(200).json({
        message: 'No recent consistency check information available',
        lastCheck: null,
      });
      return;
    }

    const statusData = JSON.parse(status);
    res.status(200).json(statusData);
  } catch (error) {
    console.error('Error getting consistency check status:', error);
    res.status(500).json({
      error: 'Failed to get consistency check status',
      message: (error as Error).message,
    });
  }
});

export default router;
