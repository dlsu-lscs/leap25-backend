import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

export const redisClient = createClient({ url: 'redis://localhost:6379' });
await redisClient.connect();

const redisStore = RedisStore(session);

const store = new redisStore({
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
