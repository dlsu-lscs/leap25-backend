import mysql from 'mysql2/promise';
import { getImageUrlById } from './contentful.service';
import { getEventByContentfulId } from './event.service';
import type {
  EventMediaPayload,
  EventMedia,
  UpdateEventMedia,
} from '../models/EventMedia';
import { getDB } from '../config/database';

// creates a new event media record
export async function createEventMedia(data: EventMedia): Promise<EventMedia> {
  const { pub_url, event_id, contentful_id } = data;
  const db = await getDB();

  // inserts into the db
  const [new_event_media] = (await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO event_pubs (pub_url,  event_id, contentful_id) VALUES (?, ?, ?)',
    [pub_url, event_id, contentful_id]
  )) as any[];

  if (new_event_media.affectedRows === 0) {
    throw new Error('Error when making a new event pub.');
  }

  // check if event is successfully created
  const [event_media] = (await db.query(
    'SELECT * FROM event_pubs WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  return event_media[0] as EventMedia;
}

// creates an event media based on contentful's payload
export async function createEventMediaContentful(
  payload: EventMediaPayload
): Promise<EventMedia | null> {
  try {
    const fields = payload.fields;
    const pub_asset = fields.pubOneFile?.['en-US']?.sys.id;

    if (!pub_asset) {
      throw new Error('Error in getting payload asset.');
    }

    // storing payload contents into db model variables
    const event_ref = fields.eventRef['en-US'].sys.id;
    const pub_url = await getImageUrlById(pub_asset);
    const contentful_id = payload.sys.id;

    const event = await getEventByContentfulId(event_ref);

    if (!event)
      throw new Error(`Event not found with contentful_id = ${event_ref}`);

    if (!pub_url || !event.id) {
      throw new Error('Error in getting publication asset.');
    }

    const event_media = {
      pub_url,
      event_id: event.id,
      contentful_id,
    };

    // creates new event
    const new_event_media = await createEventMedia(event_media);

    return new_event_media;
  } catch (error) {
    console.error('Error creating event media: ', (error as Error).message);
    return null;
  }
}

// updates the event media record in db
export async function updateEventMedia(
  payload: UpdateEventMedia,
  contentful_id: string
): Promise<UpdateEventMedia> {
  const { pub_url } = payload;
  const db = await getDB();

  const [result] = (await db.execute<mysql.ResultSetHeader>(
    'UPDATE event_pubs SET pub_url = ? WHERE contentful_id = ?',
    [pub_url ?? null, contentful_id]
  )) as any[];

  if (result.affectedRows === 0) {
    throw new Error('Error in updating event_pubs');
  }

  return result[0] as EventMedia;
}

// updates event media based on contentful payload
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

// a handler function that checks if the webhook is updating or creating a new record
export async function handleContentfulWebhook(payload: any): Promise<{
  eventMedia: EventMedia | UpdateEventMedia | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;
  const db = await getDB();

  // search for the event media record in db
  const [rows] = (await db.execute(
    'SELECT contentful_id FROM event_pubs WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  const is_exists: boolean = rows.length > 0;

  // if event media exists, then update, otherwise create
  const eventMedia = is_exists
    ? await updateEventMediaContentful(payload)
    : await createEventMediaContentful(payload);

  return { eventMedia, is_created: !is_exists };
}

// deletes an event media from db
export async function deleteEventMedia(
  contentful_id: string
): Promise<boolean> {
  const db = await getDB();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    'DELETE FROM event_pubs WHERE contentful_id = ?',
    [contentful_id]
  );

  return result.affectedRows > 0;
}
