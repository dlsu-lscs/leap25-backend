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
    // for transaction consistency
    await conn.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    await conn.beginTransaction();

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // applied migrations for comparison
    const [applied] = await conn.query('SELECT version FROM migrations');
    const appliedVersions = new Set(
      (applied as any[]).map((row) => row.version)
    );

    // migration files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(
      `Found ${migrationFiles.length} migration files, ${appliedVersions.size} already applied`
    );

    // warn if have migration gaps
    const migrationNumbers = migrationFiles.map((file) => {
      const match = file.match(/^(\d+)_/);
      return match ? parseInt(match[1] as string, 10) : 0;
    });

    const uniqueSortedNumbers = [...new Set(migrationNumbers)].sort(
      (a, b) => a - b
    );
    for (let i = 1; i < uniqueSortedNumbers.length; i++) {
      if (uniqueSortedNumbers[i] !== uniqueSortedNumbers[i - 1]! + 1) {
        console.warn(
          `Warning: Migration sequence has gaps between ${uniqueSortedNumbers[i - 1]} and ${uniqueSortedNumbers[i]}`
        );
      }
    }

    // apply migrations that are not yet applied
    for (const file of migrationFiles) {
      const version = path.basename(file, '.sql');

      if (appliedVersions.has(version)) {
        console.log(`Migration ${version} already applied, skipping`);
        continue;
      }

      console.log(`Applying migration: ${version}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      if (!sql.trim()) {
        console.warn(`Warning: Migration file ${file} appears to be empty`);
        continue;
      }

      const dangerousPatterns = [/DROP\s+DATABASE/i, /DROP\s+USER/i];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(sql)) {
          console.warn(
            `⚠️ Warning: Migration ${file} contains potentially dangerous pattern: ${pattern}`
          );
        }
      }

      const commands = sql
        .split(';')
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd.length > 0);

      for (const command of commands) {
        try {
          await conn.execute(`${command};`);
        } catch (error) {
          console.error(`Error executing SQL: ${command}`);
          console.error(error);
          throw new Error(
            `Migration failed in file ${file}: ${(error as Error).message}`
          );
        }
      }

      await conn.execute('INSERT INTO migrations (version) VALUES (?)', [
        version,
      ]);
      console.log(`✓ Migration ${version} applied successfully`);
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
