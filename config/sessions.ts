import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

export const redisClient = createClient({
  url: process.env.REDIS_CONNECTION_URL,
  socket: {
    reconnectStrategy: (retries) => {
      return Math.min(retries * 100, 10000); // 10 sec retry delay
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't exit the process, let the app continue without Redis
  }
};

connectRedis();

const store = new RedisStore({
  client: redisClient,
  prefix: 'leap_app:',
});

export const sessionMiddleware = session({
  store: store,
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
});
