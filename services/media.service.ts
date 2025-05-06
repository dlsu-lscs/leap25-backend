import mysql from 'mysql2/promise';
import { getImageUrlById } from './contentful.service';
import type { EventMediaPayload, EventMedia } from '../models/EventMedia';
import db from '../config/connectdb';

export async function createEventMedia(
  data: EventMediaPayload
): Promise<(EventMedia & { id: number }) | null> {
  try {
    const pub_asset = data.fields.pubOneFile?.['en-US']?.sys.id;

    if (!pub_asset) {
      throw new Error('Error in getting payload asset.');
    }

    const pub_type = data.fields.pubType['en-US'];
    const eventRef = data.fields.eventRef['en-US'].sys.id;
    const pub_url = await getImageUrlById(pub_asset);

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

    const [result] = await db.execute<mysql.ResultSetHeader>(
      'INSERT INTO event_pubs (pub_url, pub_type, event_id) VALUES (?, ?, ?)',
      [pub_url ?? null, pub_type, event_id]
    );

    const id = result.insertId;

    return { id, pub_url, pub_type, event_id };
  } catch (error) {
    console.error('Error creating event media: ', (error as Error).message);
    return null;
  }
}
