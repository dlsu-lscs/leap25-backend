import mysql from 'mysql2/promise';
import { getImageUrlById } from './contentful.service';
import type {
  EventMediaPayload,
  EventMedia,
  UpdateEventMedia,
} from '../models/EventMedia';
import db from '../config/connectdb';

export async function createEventMedia(data: EventMedia): Promise<EventMedia> {
  const { pub_url, pub_type, event_id, contentful_id } = data;

  const [new_event_media] = (await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO event_pubs (pub_url, pub_type, event_id, contentful_id) VALUES (?, ?, ?, ?)',
    [pub_url, pub_type, event_id, contentful_id]
  )) as any[];

  if (new_event_media.length === 0) {
    throw new Error('Error when making a new event pub.');
  }

  return new_event_media[0] as EventMedia;
}

export async function createEventMediaContentful(
  payload: EventMediaPayload
): Promise<EventMedia | null> {
  try {
    const fields = payload.fields;
    const pub_asset = fields.pubOneFile?.['en-US']?.sys.id;

    if (!pub_asset) {
      throw new Error('Error in getting payload asset.');
    }

    const pub_type = fields.pubType['en-US'];
    const eventRef = fields.eventRef['en-US'].sys.id;
    const pub_url = await getImageUrlById(pub_asset);
    const contentful_id = payload.sys.id;

    const [events] = await db.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM events WHERE contentful_id = ?',
      [eventRef]
    );

    if (events.length === 0)
      throw new Error(`Event not found with contentful_id = ${eventRef}`);

    const event_id = events[0]?.id;

    if (!pub_url || !event_id) {
      throw new Error('Error in getting publication asset.');
    }

    const event_media = {
      pub_url,
      pub_type,
      event_id,
      contentful_id,
    };

    const new_event_media = await createEventMedia(event_media);

    return new_event_media;
  } catch (error) {
    console.error('Error creating event media: ', (error as Error).message);
    return null;
  }
}

export async function updateEventMedia(
  payload: UpdateEventMedia,
  contentful_id: string
): Promise<UpdateEventMedia> {
  const { pub_url, pub_type } = payload;

  const [result] = (await db.execute<mysql.ResultSetHeader>(
    'UPDATE event_pubs SET pub_url = ?, pub_type = ? WHERE contentful_id = ?',
    [pub_url ?? null, pub_type, contentful_id]
  )) as any[];

  if (result.affectedRows === 0) {
    throw new Error('Error in updating event_pubs');
  }

  return result[0] as EventMedia;
}

export async function updateEventMediaContentful(
  payload: any
): Promise<UpdateEventMedia | null> {
  try {
    const fields = payload.fields;

    const pub_asset = fields.pubOneFile?.['en-US']?.sys.id;
    if (!pub_asset) throw new Error('Missing publication asset ID.');

    const pub_type = fields.pubType['en-US'];
    const pub_url = await getImageUrlById(pub_asset);
    const contentful_id = payload.sys.id;

    if (!pub_url) {
      throw new Error('No pub_url given.');
    }

    const event_pub = {
      pub_url,
      pub_type,
    };

    const updated_event_pub = await updateEventMedia(event_pub, contentful_id);

    return updated_event_pub;
  } catch (error) {
    console.error('Error updating event media: ', (error as Error).message);
    return null;
  }
}

export async function handleContentfulWebhook(payload: any): Promise<{
  eventMedia: EventMedia | UpdateEventMedia | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;

  const [rows] = await db.execute(
    'SELECT contentful_id FROM event_pubs WHERE contentful_id = ?',
    [contentful_id]
  );

  const is_exists: boolean = (rows as any[]).length > 0;

  const eventMedia = is_exists
    ? await updateEventMediaContentful(payload)
    : await createEventMediaContentful(payload);

  return { eventMedia, is_created: !is_exists };
}

export async function deleteEventMedia(
  contentful_id: string
): Promise<boolean> {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    'DELETE FROM event_pubs WHERE contentful_id = ?',
    [contentful_id]
  );

  return result.affectedRows > 0;
}

export async function deleteEventMediaContentful(
  contentful_id: string
): Promise<boolean> {
  try {
    return await deleteEventMedia(contentful_id);
  } catch (error) {
    console.error('Error deleting event media:', (error as Error).message);
    return false;
  }
}
