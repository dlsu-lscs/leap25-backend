import mysql from 'mysql2/promise';
import { db } from '../config/db';
import type { Event, CreateEvent, UpdateEvent } from '../models/Event';

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
  } = data;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO events (org_id, title, description, subtheme_id, venue, schedule, fee, code, registered_slots, max_slots) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
  };
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

export async function deleteEvent(id: number): Promise<void> {
  await db.execute('DELETE FROM events WHERE id = ?', [id]);
}
