import mysql from 'mysql2/promise';
import { db } from '../config/db';
import type { User, CreateUser, UpdateUser } from '../models/user';

export async function createUser(data: CreateUser): Promise<User> {
  const { email, display_picture, name } = data;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO users (email, display_picture, name) VALUES (?, ?, ?)',
    [email, display_picture ?? null, name]
  );

  const insertId = result.insertId;
  return { id: insertId, email, display_picture, name };
}

export async function getAllUsers(): Promise<User[]> {
  const [rows] = await db.query('SELECT * FROM users');
  return rows as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
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
  } = data;

  await db.execute(
    'UPDATE users SET email = ?, display_picture = ?, name = ? WHERE id = ?',
    [email, display_picture ?? null, name, id]
  );

  return getUserById(id);
}

export async function deleteUser(id: number): Promise<void> {
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
}
