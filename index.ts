import express from 'express';
import cors from 'cors';
import { urlencoded, json } from 'express';
import 'dotenv/config';
import type { Request, Response, NextFunction } from 'express';

import { validateEnvironment } from './config/env';
import { initDB, closeDB } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import { configureSession } from './config/session';

import userRouter from './routes/user.routes';
import eventRouter from './routes/event.routes';
import authRouter from './routes/auth.routes';
import orgRouter from './routes/org.routes';
import subthemeRouter from './routes/subtheme.routes';
import mediaRouter from './routes/media.routes';
import registrationRouter from './routes/registration.routes';
import healthRouter from './routes/health.routes';
import highlightRouter from './routes/highlight.routes';
import bookmarkRouter from './routes/bookmark.routes';

import {
  initializeEventCacheWithLeaderElection,
  startConsistencyChecksWithLeaderElection,
} from './services/caching';

import { verifyApiSecretMiddleware } from './middleware/api-secret';

// import SmeeClient from 'smee-client';
//
// const smee = new SmeeClient({
//   source: 'https://smee.io/hwM6of7BTKdhC7HY/',
//   target: 'http://localhost:3000',
//   logger: console,
// });

// const events = smee.start();

const app = express();
const port = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    // init database first
    await initDB();
    console.log('Database initialized');

    // then initialize Redis
    await initRedis();
    console.log('Redis initialized');

    app.use(json());
    app.use(urlencoded({ extended: true }));
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);

          // for multiple cors origins (separated by comma)
          const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
            : ['*'];

          if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(
              new Error(
                'nice try, your ip has been reported, logged, and flagged. reflect on your atrocious actions little one.'
              )
            );
          }
        },
        credentials: true,
      })
    );
    // // skip caching for dynamic routes or authenticated requests
    // app.use((req, res, next) => {
    //   const skipCache = req.method !== 'GET' || req.path.includes('/auth/');
    //   if (skipCache) {
    //     res.setHeader('Cache-Control', 'no-store');
    //   } else {
    //     // 5 min cache for static data
    //     res.setHeader('Cache-Control', 'public, max-age=300');
    //   }
    //   next();
    // });

    // configure session
    await configureSession(app);
    console.log('Session configured');

    // init event cache in Redis
    await initializeEventCacheWithLeaderElection();

    // start periodic consistency checks
    const consistencyTimer = startConsistencyChecksWithLeaderElection();

    // app.use(verifyApiSecretMiddleware);
    app.use('/auth', authRouter);
    app.use('/users', userRouter);
    app.use('/events', eventRouter);
    app.use('/orgs', orgRouter);
    app.use('/highlights', highlightRouter);
    app.use('/subthemes', subthemeRouter);
    app.use('/registrations', registrationRouter);
    app.use('/media', mediaRouter);
    app.use('/health', healthRouter);
    app.use('/bookmarks', bookmarkRouter);

    app.get('/', (_, res) => {
      res.status(200).json({
        status: 'ok',
        message:
          'Leap25 API is running, use /health/ready and /health/live endpoints for proper healthchecks.',
      });
    });

    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });

    setupGracefulShutdown(consistencyTimer);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const setupGracefulShutdown = (timer: NodeJS.Timeout): void => {
  const shutdown = async () => {
    console.log('Shutting down gracefully...');

    clearInterval(timer);
    await closeRedis();
    await closeDB();
    // events.close();

    console.log('All connections closed. Exiting process.');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  console.error('Fatal error during server initialization:', err);
  process.exit(1);
});

export default app;
