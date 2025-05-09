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
    // Enhanced pool configuration
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    multipleStatements: true, // Required for migrations
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

  // Run migrations
  await runMigrations(pool);

  return pool;
};

/**
 * Run database migrations
 */
const runMigrations = async (db: mysql.Pool): Promise<void> => {
  try {
    console.log('Running database migrations...');
    const migrationPath = path.join(process.cwd(), 'migrations', 'init.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found at:', migrationPath);
      return;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Create migrations table if not exists
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if migration was already executed
      const [rows] = await connection.query(
        'SELECT * FROM migrations WHERE name = ?',
        ['init.sql']
      );

      if ((rows as any[]).length === 0) {
        // Execute the SQL commands (split by semicolon)
        const commands = sql
          .split(';')
          .map((command) => command.trim())
          .filter((command) => command.length > 0);

        for (const command of commands) {
          await connection.execute(`${command};`);
        }

        // Record that migration was executed
        await connection.execute('INSERT INTO migrations (name) VALUES (?)', [
          'init.sql',
        ]);
        console.log('Database migrations completed successfully');
      } else {
        console.log('Migrations already applied, skipping');
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
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
