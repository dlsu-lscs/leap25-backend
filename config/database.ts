import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Database pool (singleton)
let pool: mysql.Pool | null = null;

// Helper function for retry logic
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Initialize database connection and run migrations
 */
export const initDB = async (): Promise<mysql.Pool> => {
  if (pool) {
    return pool; // return existing pool if already initialized
  }

  console.log('Initializing database connection...');

  // Create connection pool with optimized settings
  pool = mysql.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_DATABASE!,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    connectionLimit: 25,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 15000,
    waitForConnections: true,
    namedPlaceholders: true,
    multipleStatements: true,
  });

  // Test connection with retry logic
  let connected = false;
  let retries = 5;
  let lastError: Error | null = null;

  while (retries > 0 && !connected) {
    try {
      const connection = await pool.getConnection();
      console.log(`Connected to database: ${process.env.DB_DATABASE}`);
      connection.release();
      connected = true;
    } catch (error) {
      lastError = error as Error;
      retries--;

      if (retries > 0) {
        // Calculate delay with exponential backoff
        const delay = Math.pow(2, 5 - retries) * 1000;
        console.log(
          `Failed to connect to database. Retrying in ${delay / 1000}s... (${retries} attempts left)`
        );
        await sleep(delay);
      }
    }
  }

  if (!connected) {
    console.error(
      'Failed to connect to database after multiple attempts:',
      lastError
    );
    throw lastError;
  }

  return pool;
};

/**
 * Get database pool (creates if not exists)
 */
export const getDB = async (): Promise<mysql.Pool> => {
  if (!pool) {
    return initDB();
  }
  return pool;
};

/**
 * Close database connections gracefully
 */
export const closeDB = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connections closed');
  }
};

export default { initDB, getDB, closeDB };
