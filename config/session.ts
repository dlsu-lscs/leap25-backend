import session from 'express-session';
import { RedisStore } from 'connect-redis';
import type { Express } from 'express';
import { getRedisClient, isRedisReady } from './redis';

/**
 * Configure session middleware
 */
export const configureSession = async (app: Express): Promise<void> => {
  let store;

  // Try to use Redis as session store if available
  if (isRedisReady()) {
    const redisClient = getRedisClient()!;
    store = new RedisStore({
      client: redisClient,
      prefix: 'session:',
      ttl: 86400 * 30, // 30 days in seconds
    });
    console.log('Using Redis for session storage');
  } else {
    console.warn(
      'Redis not available, using in-memory session store (not recommended for production)'
    );
  }

  // Create and apply session middleware
  const sessionMiddleware = session({
    store,
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  });

  app.use(sessionMiddleware);
};

export default { configureSession };
