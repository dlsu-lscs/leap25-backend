import { getDB } from '../config/database';
import 'dotenv/config';

/**
 * Seeds the database with initial data
 */
async function seedDatabase(): Promise<void> {
  console.log('Starting database seeding...');
  const db = await getDB();

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if any orgs exist, if not create a default one
    const [orgs] = await connection.query('SELECT COUNT(*) as count FROM orgs');
    if ((orgs as any[])[0].count === 0) {
      console.log('Creating default organization...');
      await connection.execute(
        'INSERT INTO orgs (name, org_logo) VALUES (?, ?)',
        ['Default Organization', 'https://via.placeholder.com/150']
      );
    }

    // Check if any test users exist, if not create some
    const [users] = await connection.query(
      'SELECT COUNT(*) as count FROM users'
    );
    if ((users as any[])[0].count === 0) {
      console.log('Creating test users...');
      await connection.execute(
        'INSERT INTO users (email, name, display_picture) VALUES (?, ?, ?)',
        ['user1@example.com', 'Test User 1', 'https://via.placeholder.com/150']
      );
      await connection.execute(
        'INSERT INTO users (email, name, display_picture) VALUES (?, ?, ?)',
        ['user2@example.com', 'Test User 2', 'https://via.placeholder.com/150']
      );
      await connection.execute(
        'INSERT INTO users (email, name, display_picture) VALUES (?, ?, ?)',
        ['user3@example.com', 'Test User 3', 'https://via.placeholder.com/150']
      );
    }

    // Check if any subthemes exist, if not create a default one
    const [subthemes] = await connection.query(
      'SELECT COUNT(*) as count FROM subthemes'
    );
    if ((subthemes as any[])[0].count === 0) {
      console.log('Creating default subtheme...');
      await connection.execute(
        'INSERT INTO subthemes (title, logo_pub_url, background_pub_url) VALUES (?, ?, ?)',
        [
          'Default Subtheme',
          'https://via.placeholder.com/150',
          'https://via.placeholder.com/1200x400',
        ]
      );
    }

    await connection.commit();
    console.log('Database seeding completed');
  } catch (error) {
    await connection.rollback();
    console.error('Error seeding database:', error);
  } finally {
    connection.release();
    await db.end();
  }
}

// Run seeding
seedDatabase().then(() => {
  console.log('Seeding process completed');
});
