import mysql from 'mysql2/promise';
import 'dotenv/config';
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
  console.log(data);
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

  console.log(highlights);

  return {
    id: highlights.insertId,
    event_id,
    title_card,
    title_fallback,
    bg_img,
    short_desc,
    color,
    contentful_id,
  };
}

export async function createHighlightPayload(
  payload: any
): Promise<CreateHighlight | null> {
  const highlight = await getPayloadFields(payload);

  if (!highlight) return null;

  const new_highlight: CreateHighlight | null = await createHighlight(
    highlight as CreateHighlight
  );

  return new_highlight;
}

export async function updateHighlight(
  data: UpdateHighlight,
  contentful_id: string
): Promise<Highlight | null> {
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
    return null;
  }

  const highlight = await getHighlightByContentfulId(contentful_id);

  return highlight;
}

export async function updateHighlightPayload(
  payload: any
): Promise<UpdateHighlight | null> {
  const highlight = await getPayloadFields(payload);

  if (!highlight || !highlight.contentful_id) return null;

  const updated_highlight = await updateHighlight(
    highlight,
    highlight.contentful_id
  );

  return updated_highlight;
}

export async function handleContentfulWebhook(payload: any): Promise<{
  highlight: CreateHighlight | UpdateHighlight | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;

  const existing_highlight = await getHighlightByContentfulId(contentful_id);

  const is_exists: boolean = !!existing_highlight;

  const highlight = is_exists
    ? await updateHighlightPayload(payload)
    : await createHighlightPayload(payload);

  return { highlight, is_created: !is_exists };
}

export async function getHighlights(): Promise<Highlight[]> {
  const db = await getDB();

  const [highlights] = await db.query('SELECT * FROM highlights');
  return highlights as Highlight[];
}

export async function getHighlightById(id: number): Promise<Highlight | null> {
  const db = await getDB();

  const [highlights] = await db.query('SELECT * FROM highlights WHERE id = ?', [
    id,
  ]);

  if ((highlights as Highlight[]).length === 0) {
    return null;
  }

  return (highlights as any[])[0];
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

export async function deleteHighlightByContentfulId(
  contentful_id: string
): Promise<boolean> {
  const db = await getDB();
  const [highlights] = await db.execute<mysql.ResultSetHeader>(
    'DELETE FROM highlights WHERE contentful_id = ?',
    [contentful_id]
  );

  return highlights.affectedRows > 0;
}

export async function getPayloadFields(
  payload: any
): Promise<CreateHighlight | UpdateHighlight | null> {
  const fields = payload.fields;
  const contentful_id = payload.sys.id;
  const event = await getEventByContentfulId(
    fields.eventRef?.['en-US']?.sys?.id
  );

  if (!event) return null;

  let title_card: string | null = null;
  let bg_img: string | null = null;

  if (fields.titleCard?.['en-US']?.sys?.id) {
    title_card = await getImageUrlById(fields.titleCard['en-US'].sys.id);
  }

  if (fields.bgImg?.['en-US']?.sys?.id) {
    bg_img = await getImageUrlById(fields.bgImg['en-US'].sys.id);
  }

  return {
    event_id: event.id,
    title_card: title_card ?? '',
    title_fallback: fields.titleFallback?.['en-US'],
    bg_img: bg_img ?? '',
    color: fields.color?.['en-US'] ?? null,
    short_desc: fields.shortDesc?.['en-US'] ?? null,
    contentful_id,
  };
}

export async function deleteHighlightContentful(
  payload: any
): Promise<boolean> {
  const contentful_id = payload.sys.id;

  const is_deleted = await deleteHighlightByContentfulId(contentful_id);

  return is_deleted;
}

export function validatePayload({
  payload,
  secret,
}: {
  payload: any;
  secret: string;
}): boolean {
  if (secret !== process.env.CONTENTFUL_WEBHOOK_SECRET) {
    return false;
  }

  const is_valid =
    (payload?.sys?.type === 'Entry' || payload?.sys?.type === 'DeletedEntry') &&
    payload?.sys?.environment?.sys?.id === 'master' &&
    payload?.sys?.contentType?.sys?.id === 'highlightEvents';

  if (!is_valid) {
    return false;
  }

  return true;
}
