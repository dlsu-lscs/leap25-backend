import mysql from 'mysql2/promise';
import { getDB } from '../config/database';
import type {
  Highlight,
  CreateHighlight,
  UpdateHighlight,
} from '../models/Highlight';
import { getEventByContentfulId } from './event.service';
import { getImageUrlById } from './contentful.service';

export async function createHighlight(
  data: CreateHighlight
): Promise<Highlight | null> {
  const db = await getDB();
  const {
    event_id,
    title_card,
    title_fallback,
    bg_img,
    short_desc,
    color,
    contentful_id,
  } = data;

  const [highlights] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO highlights (event_id, title_card, title_fallback, bg_img, short_desc, color, contentful_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      event_id,
      title_card,
      title_fallback,
      bg_img,
      short_desc,
      color,
      contentful_id,
    ]
  );

  if (highlights.affectedRows === 0) {
    throw new Error(
      `Highlight event creation error with contentful_id: ${contentful_id}`
    );
  }

  return getHighlightByContentfulId(contentful_id);
}

export async function updateHighlight(
  data: UpdateHighlight,
  contentful_id: string
): Promise<Highlight> {
  const db = await getDB();
  const { event_id, title_card, title_fallback, bg_img, short_desc, color } =
    data;

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'UPDATE highlights SET event_id = ?, title_card = ?, title_fallback = ?, bg_img = ?, short_desc = ?, color = ? WHERE contentful_id = ?',
    [
      event_id,
      title_card,
      title_fallback,
      bg_img,
      short_desc,
      color,
      contentful_id,
    ]
  );

  if (result.affectedRows === 0) {
    throw new Error(
      `Highlight with contentful_id ${contentful_id} not found or no changes made.`
    );
  }

  const updatedHighlight = await getHighlightByContentfulId(contentful_id);

  if (!updatedHighlight) {
    throw new Error('Updated highlight could not be retrieved.');
  }

  return updatedHighlight;
}

export async function getHighlightByContentfulId(
  contentful_id: string
): Promise<Highlight | null> {
  const db = await getDB();
  const [highlights] = await db.query(
    'SELECT * FROM highlights WHERE contentful_id = ?',
    [contentful_id]
  );

  if ((highlights as any[]).length === 0) return null;

  return (highlights as Highlight[])[0] as Highlight;
}
