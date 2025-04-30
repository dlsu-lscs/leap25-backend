import express, { urlencoded, json } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import './config/passport.ts';
import 'dotenv/config';
import authRouter from './routes/auth.routes';
import db from './config/connectdb.ts';
import passport from 'passport';
import { sessionMiddleware } from './config/sessions.ts';

const app = express();
const port = process.env.PORT || 3000;

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(sessionMiddleware);
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

// Get session value
app.get('/get-session', (req, res) => {
  console.log('Current session:', req.session);
  res.json(req.session);
});

// Temporary base tester route
app.use('/', function (req, res) {
  res.status(200).json('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

export default app;
