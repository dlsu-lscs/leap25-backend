import { getDB, closeDB } from '../config/database';
import fs from 'fs';
import path from 'path';

/*
 * How this works:
 * - init migrations table
 * - we get all migrations applied in a [] (sorted)
 * - apply the not applied migration
 * - execute migration script statement-by-statement (transaction for atomic operations)
 * - then we record the now applied migration
 * */

async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...');
  const db = await getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [applied] = await conn.query('SELECT version FROM migrations');
    const appliedVersions = new Set(
      (applied as any[]).map((row) => row.version)
    );

    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const version = path.basename(file, '.sql');

      if (appliedVersions.has(version)) {
        console.log(`Migration ${version} already applied, skipping`);
        continue;
      }

      console.log(`Applying migration: ${version}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      const commands = sql
        .split(';')
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd.length > 0);

      for (const command of commands) {
        await conn.execute(`${command};`);
      }

      await conn.execute('INSERT INTO migrations (version) VALUES (?)', [
        version,
      ]);
      console.log(`Migration ${version} applied successfully`);
    }

    await conn.commit();
    console.log('All migrations completed successfully');
  } catch (error) {
    await conn.rollback();
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    conn.release();
    await closeDB();
  }
}

runMigrations().then(() => {
  console.log('Migration process completed');
});
