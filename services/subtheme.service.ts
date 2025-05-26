import mysql from 'mysql2/promise';
import { getImageUrlById } from './contentful.service';
import { getDB } from '../config/database';
import type {
  Subtheme,
  CreateSubtheme,
  UpdateSubtheme,
} from '../models/Subtheme';

export async function createSubtheme(data: CreateSubtheme): Promise<Subtheme> {
  const { title, logo_pub_url, background_pub_url, contentful_id, short_desc } =
    data;
  const db = await getDB();

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO subthemes (title, logo_pub_url, background_pub_url, contentful_id, short_desc) VALUES (?, ?, ?, ?, ?)',
    [title, logo_pub_url, background_pub_url, contentful_id, short_desc ?? null]
  );

  const insertId = result.insertId;

  return {
    id: insertId,
    title,
    logo_pub_url,
    background_pub_url,
    contentful_id,
  };
}

export async function createSubthemePayload(
  payload: any
): Promise<CreateSubtheme | null> {
  const fields = payload.fields;

  const logo_pub_url = (await getImageUrlById(
    fields.logoPub['en-US'].sys.id
  )) as string;

  const background_pub_url = (await getImageUrlById(
    fields.backgroundPub['en-US'].sys.id
  )) as string;

  const contentful_id = payload.sys.id;
  const short_desc = fields.shortDesc?.['en-US'] as string | undefined;

  const subtheme = {
    title: fields.title['en-US'] as string,
    logo_pub_url,
    background_pub_url,
    contentful_id,
    short_desc,
  };

  if (!subtheme.title || !logo_pub_url || !background_pub_url) {
    return null;
  }

  return await createSubtheme(subtheme);
}

export async function getAllSubthemes(): Promise<Subtheme[]> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM subthemes');
  return rows as Subtheme[];
}

export async function getSubthemeById(id: number): Promise<Subtheme | null> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM subthemes WHERE id = ?', [id]);
  const subthemes = rows as Subtheme[];
  return subthemes[0] || null;
}

export async function getSubthemeByContentfulId(
  id: string
): Promise<Subtheme | null> {
  const db = await getDB();
  const [subthemes] = (await db.query(
    'SELECT * FROM subthemes WHERE contentful_id = ?',
    [id]
  )) as any;
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
    short_desc = existing.short_desc ?? null,
  } = data;
  const db = await getDB();
  await db.execute(
    'UPDATE subthemes SET title = ?, logo_pub_url = ?, background_pub_url = ?, short_desc = ? WHERE id = ?',
    [title, logo_pub_url, background_pub_url, short_desc ?? null, id]
  );

  return getSubthemeById(id);
}

export async function updateSubthemePayload(
  payload: any
): Promise<UpdateSubtheme | null> {
  const fields = payload.fields;

  const logo_pub_url_id = fields.logoPub?.['en-US']?.sys?.id;
  const logo_pub_url = logo_pub_url_id
    ? await getImageUrlById(logo_pub_url_id)
    : null;

  const background_pub_url_id = fields.backgroundPub?.['en-US']?.sys?.id;
  const background_pub_url = background_pub_url_id
    ? await getImageUrlById(background_pub_url_id)
    : null;

  const title = fields.title?.['en-US'];
  const contentful_id = payload.sys.id;

  if (!contentful_id) throw new Error('Lacking contentful id in payload');

  const subtheme = await getSubthemeByContentfulId(contentful_id);

  if (!subtheme) throw new Error('No subtheme found with given contentful id');

  const short_desc = fields.shortDesc?.['en-US'] || subtheme.short_desc;

  const updated_subtheme: UpdateSubtheme = {
    title: title || subtheme.title,
    logo_pub_url: logo_pub_url || subtheme.logo_pub_url,
    background_pub_url: background_pub_url || subtheme.background_pub_url,
    contentful_id,
    short_desc,
  };

  return await updateSubtheme(subtheme.id, updated_subtheme);
}

export async function deleteSubtheme(id: number): Promise<void> {
  const db = await getDB();
  await db.execute('DELETE FROM subthemes WHERE id = ?', [id]);
}

export async function handleContentfulWebhook(payload: any): Promise<{
  subtheme: Subtheme | UpdateSubtheme | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;

  const existing_subtheme = getSubthemeByContentfulId(contentful_id);

  const is_exists: boolean = !!existing_subtheme;

  const subtheme = is_exists
    ? await updateSubthemePayload(payload)
    : await createSubthemePayload(payload);

  return { subtheme, is_created: is_exists };
}

export async function deleteSubthemeContentful(
  payload: any
): Promise<Subtheme | null> {
  const contentful_id = payload.sys.id;

  const subtheme = await getSubthemeByContentfulId(contentful_id);

  if (!subtheme) {
    throw new Error('Subtheme not found in database using contentful id.');
  }

  await deleteSubtheme(subtheme.id);

  const deleted_subtheme = getSubthemeById(subtheme.id);

  return deleted_subtheme;
}

export async function getSubthemeByName(
  name: string
): Promise<Subtheme | null> {
  const db = await getDB();

  const [subthemes] = await db.query(
    'SELECT * FROM subthemes WHERE title = ?',
    [name]
  );

  if ((subthemes as any[]).length === 0) {
    throw new Error('Subtheme not found by name.');
  }

  return (subthemes as any[])[0] as Subtheme;
}
