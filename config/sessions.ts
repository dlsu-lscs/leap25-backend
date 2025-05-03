import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

export const redisClient = createClient({
  url: process.env.REDIS_CONNECTION_URL,
});

await redisClient.connect();

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
