import mysql from 'mysql2/promise';
import db from '../config/connectdb';
import type { Event, CreateEvent, UpdateEvent } from '../models/Event';
import type { EventMedia } from '../models/EventMedia';
import { getOrg } from './contentful.service';

export async function createEvent(data: CreateEvent): Promise<Event> {
  const {
    org_id,
    title,
    description,
    subtheme_id,
    venue,
    schedule,
    fee,
    code,
    registered_slots,
    max_slots,
    contentful_id,
  } = data;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO events (org_id, title, description, subtheme_id, venue, schedule, fee, code, registered_slots, max_slots, contentful_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      org_id,
      title,
      description,
      subtheme_id,
      venue,
      schedule,
      fee,
      code,
      registered_slots,
      max_slots,
      contentful_id,
    ]
  );

  const insertId = result.insertId;
  return {
    id: insertId,
    org_id,
    title,
    description,
    subtheme_id,
    venue,
    schedule,
    fee,
    code,
    registered_slots: registered_slots ?? 0,
    max_slots,
    contentful_id,
  };
}

export async function createEventPayload(
  payload: any
): Promise<CreateEvent | null> {
  const fields = payload.fields;
  const org_id = fields.orgId['en-US'].sys.id;

  const org = await getOrg(org_id);

  if (!org) {
    return null;
  }
  const contentful_id = org.contentful_id;
  const [orgs] = (await db.query(
    'SELECT id FROM orgs WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  if (orgs.length === 0) {
    return null;
  }

  const subtheme_id = fields.subthemeId['en-US'].sys.id;

  const [subthemes] = (await db.query(
    'SELECT id FROM subthemes WHERE contentful_id = ?',
    [subtheme_id]
  )) as any[];

  if (subthemes.length === 0) {
    return null;
  }

  const available_slots = fields.availableSlots?.['en-US'];
  const max_slots = fields.maxSlots?.['en-US'];

  const event = {
    org_id: orgs[0].id,
    title: fields.title?.['en-US'],
    description: fields.description?.['en-US'],
    subtheme_id: subthemes[0].id,
    venue: fields.venue?.['en-US'],
    schedule: new Date(fields.schedule?.['en-US']),
    fee: fields.fee?.['en-US'],
    code: fields.code?.['en-US'],
    registered_slots: max_slots - available_slots,
    max_slots: max_slots,
    contentful_id: payload.sys.id,
  };

  return await createEvent(event);
}

export async function getAllEvents(): Promise<Event[]> {
  const [rows] = await db.query('SELECT * FROM events');
  return rows as Event[];
}

export async function getEventById(id: number): Promise<Event | null> {
  const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
  const events = rows as Event[];
  return events[0] || null;
}

export async function updateEvent(
  id: number,
  data: UpdateEvent
): Promise<Event | null> {
  const existingEvent = await getEventById(id);
  if (!existingEvent) return null;

  const {
    org_id = existingEvent.org_id,
    title = existingEvent.title,
    description = existingEvent.description,
    subtheme_id = existingEvent.subtheme_id,
    venue = existingEvent.venue,
    schedule = existingEvent.schedule,
    fee = existingEvent.fee,
    code = existingEvent.code,
    registered_slots = existingEvent.registered_slots,
    max_slots = existingEvent.max_slots,
  } = data;

  await db.execute(
    'UPDATE events SET org_id = ?, title = ?, description = ?, subtheme_id = ?, venue = ?, schedule = ?, fee = ?, code = ?, registered_slots = ?, max_slots = ? WHERE id = ?',
    [
      org_id,
      title,
      description,
      subtheme_id,
      venue,
      schedule,
      fee,
      code,
      registered_slots,
      max_slots,
      id,
    ]
  );

  return getEventById(id);
}

export async function updateEventPayload(payload: any): Promise<Event | null> {
  const fields = payload.fields;
  const org_id = fields.orgId['en-US'].sys.id;

  const org = await getOrg(org_id);
  if (!org) {
    throw new Error('Org not found in Contentful.');
  }

  const contentful_id = payload.sys.id;

  const [orgs] = (await db.query(
    'SELECT id FROM orgs WHERE contentful_id = ?',
    [org.contentful_id]
  )) as any[];

  if (orgs.length === 0) return null;

  const subtheme_id = fields.subthemeId['en-US'].sys.id;

  const [subthemes] = (await db.query(
    'SELECT id FROM subthemes WHERE contentful_id = ?',
    [subtheme_id]
  )) as any[];

  if (subthemes.length === 0) return null;

  const available_slots = fields.availableSlots?.['en-US'];
  const max_slots = fields.maxSlots?.['en-US'];

  const updatedData: UpdateEvent = {
    org_id: orgs[0].id,
    title: fields.title?.['en-US'],
    description: fields.description?.['en-US'],
    subtheme_id: subthemes[0].id,
    venue: fields.venue?.['en-US'],
    schedule: new Date(fields.schedule?.['en-US']),
    fee: fields.fee?.['en-US'],
    code: fields.code?.['en-US'],
    registered_slots: max_slots - available_slots,
    max_slots: max_slots,
  };

  const [events] = (await db.query(
    'SELECT id FROM events WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  if (events.length === 0) return null;

  return await updateEvent(events[0].id, updatedData);
}

export async function deleteEvent(id: number): Promise<void> {
  await db.execute('DELETE FROM events WHERE id = ?', [id]);
}

export async function getEventMedia(id: number): Promise<EventMedia | null> {
  const [result] = await db.query(
    'SELECT * FROM event_pubs WHERE event_id = ?',
    [id]
  );
  const media = result as EventMedia[];

  return media[0] || null;
}

export async function handleContentfulWebhook(payload: any): Promise<{
  event: Event | UpdateEvent | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;

  const [events] = (await db.execute(
    'SELECT contentful_id FROM events WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  const is_exists: boolean = events.length > 0;

  const event = is_exists
    ? await updateEventPayload(payload)
    : await createEventPayload(payload);

  return { event, is_created: !is_exists };
}
