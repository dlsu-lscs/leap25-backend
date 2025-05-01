import mysql from 'mysql2/promise';
import db from '../config/connectdb';
import type {
  Subtheme,
  CreateSubtheme,
  UpdateSubtheme,
} from '../models/Subtheme';

export async function createSubtheme(data: CreateSubtheme): Promise<Subtheme> {
  const { title, logo_pub_url, background_pub_url } = data;

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO subthemes (title, logo_pub_url, background_pub_url) VALUES (?, ?, ?)',
    [title, logo_pub_url, background_pub_url]
  );

  const insertId = result.insertId;

  return {
    id: insertId,
    title,
    logo_pub_url,
    background_pub_url,
  };
}

export async function getAllSubthemes(): Promise<Subtheme[]> {
  const [rows] = await db.query('SELECT * FROM subthemes');
  return rows as Subtheme[];
}

export async function getSubthemeById(id: number): Promise<Subtheme | null> {
  const [rows] = await db.query('SELECT * FROM subthemes WHERE id = ?', [id]);
  const subthemes = rows as Subtheme[];
  return subthemes[0] || null;
}

export async function updateSubtheme(
  id: number,
  data: UpdateSubtheme
): Promise<Subtheme | null> {
  const existing = await getSubthemeById(id);
  if (!existing) return null;

  const {
    title = existing.title,
    logo_pub_url = existing.logo_pub_url,
    background_pub_url = existing.background_pub_url,
  } = data;

  await db.execute(
    'UPDATE subthemes SET title = ?, logo_pub_url = ?, background_pub_url = ? WHERE id = ?',
    [title, logo_pub_url, background_pub_url, id]
  );

  return getSubthemeById(id);
}

export async function deleteSubtheme(id: number): Promise<void> {
  await db.execute('DELETE FROM subthemes WHERE id = ?', [id]);
}
