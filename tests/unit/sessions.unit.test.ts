import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sessionMiddleware, redisClient } from '../../config/sessions';
import RedisStore from 'connect-redis';
import type { SessionOptions } from 'express-session';

describe('Session Middleware', () => {
  const options = sessionMiddleware as unknown as SessionOptions;

  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it('should use redis as storage for sessions', () => {
    expect(sessionMiddleware).toHaveProperty('store');
    expect(options.store).toBeInstanceOf(RedisStore);
  });

  it('should have correct security settings', () => {
    expect(options.cookie?.httpOnly).toBe(true);
    expect(options.cookie?.secure).toBe(process.env.NODE_ENV === 'production');
    expect(options.cookie?.sameSite).toBe('lax');
  });

  it('should have proper session duration', () => {
    expect(options.cookie?.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
