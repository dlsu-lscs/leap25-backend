import express, { urlencoded, json } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import 'dotenv/config';
import userRouter from './routes/user.routes';
import eventRouter from './routes/event.routes';
import authRouter from './routes/auth.routes';
import orgRouter from './routes/org.routes';
import subthemeRouter from './routes/subtheme.routes';
import db from './config/connectdb';
import passport from 'passport';
import { sessionMiddleware } from './config/sessions';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(urlencoded({ extended: true }));

app.use(json());
app.use(sessionMiddleware);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const connectDB = async (): Promise<void> => {
  try {
    const connection: PoolConnection = await db.getConnection();
    console.log(`Connected to database: ${process.env.DB_DATABASE}`);
    connection.release();
  } catch (err: any) {
    console.error('Error connecting to DB:', err?.message || err);
    process.exit(1);
  }
};

connectDB();

// General endpoints
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/events', eventRouter);
app.use('/orgs', orgRouter);
app.use('/subthemes', subthemeRouter);

// Temporary base tester route
app.use('/', function (req, res) {
  res.status(200).json('Hello World!');
});
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

export default app;
