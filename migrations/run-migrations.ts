import { initDB, closeDB } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Runs database initialization script
 */
async function runMigrations(): Promise<void> {
  console.log('Starting database initialization...');

  try {
    // Initialize the database
    const db = await initDB();

    // Run migrations - this should already happen in the initDB function
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('Migration process completed');
});
