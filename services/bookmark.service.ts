import type { Bookmark, CreateBookmark } from '../models/Bookmark';
import mysql from 'mysql2/promise';
import { getDB } from '../config/database';

export async function createBookmark(
  user_id: number,
  event_id: number
): Promise<CreateBookmark | null> {
  const db = await getDB();

  const [bookmark] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO bookmarks (event_id, user_id) VALUES (?, ?)',
    [event_id, user_id]
  );

  if (bookmark.affectedRows === 0) {
    // console.error('Error creating a new bookmark');
    return null;
  }

  const new_bookmark = { event_id, user_id };

  return new_bookmark;
}

export async function getAllUserBookmarks(
  user_id: number
): Promise<Bookmark[] | null> {
  const db = await getDB();

  const [bookmark_rows] = await db.query(
    'SELECT * FROM bookmarks WHERE user_id = ?',
    [user_id]
  );

  const bookmarks = bookmark_rows as Bookmark[];

  if (bookmarks.length === 0) {
    return null;
  }

  return bookmarks;
}

export async function deleteBookmark(
  user_id: number,
  event_id: number
): Promise<boolean> {
  const db = await getDB();

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?',
    [user_id, event_id]
  );

  return result.affectedRows > 0;
}
