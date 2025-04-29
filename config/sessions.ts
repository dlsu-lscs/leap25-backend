import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
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
