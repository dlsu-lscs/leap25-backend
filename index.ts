import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { urlencoded, json } from 'express';
import 'dotenv/config';

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

import {
  initializeEventCache,
  startConsistencyChecks,
} from './services/caching';

// import SmeeClient from 'smee-client';
//
// const smee = new SmeeClient({
//   source: 'https://smee.io/hwM6of7BTKdhC7HY/',
//   target: 'http://localhost:3000',
//   logger: console,
// });

const events = smee.start();

validateEnvironment();

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

    app.use(urlencoded({ extended: true }));
    app.use(json());
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      })
    );

    // configure session
    await configureSession(app);
    console.log('Session configured');

    // init event cache in Redis
    await initializeEventCache();

    // start periodic consistency checks
    const consistencyTimer = startConsistencyChecks();

    app.use('/auth', authRouter);
    app.use('/users', userRouter);
    app.use('/events', eventRouter);
    app.use('/orgs', orgRouter);
    app.use('/subthemes', subthemeRouter);
    app.use('/registrations', registrationRouter);
    app.use('/media', mediaRouter);
    app.use('/health', healthRouter);

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
