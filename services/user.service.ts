import mysql from 'mysql2/promise';
import { getDB } from '../config/database';
import type { User, CreateUser, UpdateUser } from '../models/User';

export async function createUser(data: CreateUser): Promise<User> {
  const db = await getDB();
  const { email, display_picture, name, google_id } = data;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO users (email, display_picture, name, google_id) VALUES (?, ?, ?, ?)',
    [email, display_picture ?? null, name, google_id ?? null]
  );

  const insertId = result.insertId;
  return { id: insertId, email, display_picture, name, google_id };
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM users');
  return rows as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  const users = rows as User[];
  return users[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

  if ((rows as any[]).length === 0) {
    const localPart = email.split('@')[0];

    if (!localPart) return null;

    const name = localPart
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

    await db.execute<mysql.ResultSetHeader>(
      'INSERT INTO users (email, display_picture, name, google_id) VALUES (?, ?, ?, ?)',
      [email, null, name, null]
    );

    return await getUserByEmail(email);
  }

  const users = rows as User[];
  return users[0] || null;
}

export async function updateUser(
  id: number,
  data: UpdateUser
): Promise<User | null> {
  const existingUser = await getUserById(id);
  if (!existingUser) return null;

  const {
    email = existingUser.email,
    display_picture = existingUser.display_picture ?? null,
    name = existingUser.name,
    google_id = existingUser.google_id,
  } = data;
  const db = await getDB();
  await db.execute(
    'UPDATE users SET email = ?, display_picture = ?, name = ?, google_id = ? WHERE id = ?',
    [email, display_picture ?? null, name, google_id ?? null, id]
  );

  return getUserById(id);
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDB();
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
}
