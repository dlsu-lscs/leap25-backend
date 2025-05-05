import fs from 'fs';
import path from 'path';
import db from '../config/connectdb';
import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * Runs database initialization script
 */
async function runMigrations(): Promise<void> {
  console.log('Starting database initialization...');

  try {
    // Read the init.sql file
    const initSqlPath = path.join(__dirname, 'init.sql');

    if (!fs.existsSync(initSqlPath)) {
      console.error('init.sql file not found in migrations directory');
      process.exit(1);
    }

    const sql = fs.readFileSync(initSqlPath, 'utf8');
    console.log('Executing database initialization...');

    // Begin transaction
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Execute the SQL commands (split by semicolon to handle multiple statements)
      const commands = sql
        .split(';')
        .map((command) => command.trim())
        .filter((command) => command.length > 0);

      for (const command of commands) {
        await connection.execute(`${command};`);
      }

      await connection.commit();
      console.log('Database initialization completed successfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Insert a record in migrations table to mark init.sql as executed
    await db.execute('INSERT IGNORE INTO migrations (name) VALUES (?)', [
      'init.sql',
    ]);
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('Migration process completed');
});
