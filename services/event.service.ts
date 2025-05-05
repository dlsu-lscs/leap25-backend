import mysql from 'mysql2/promise';
import { getDB } from '../config/database';
import type { Event, CreateEvent, UpdateEvent } from '../models/Event';
import {
  getRedisClient,
  redisEventOps,
  isRedisReady,
  REDIS_KEYS,
} from '../config/redis';

export async function createEvent(data: CreateEvent): Promise<Event> {
  const db = await getDB();

  const {
    org_id,
    title,
    description,
    subtheme_id,
    venue,
    schedule,
    fee,
    code,
    registered_slots = 0,
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
  const createdEvent = {
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

  // initialize Redis cache for this new event
  try {
    await redisEventOps.syncEventSlots(insertId, createdEvent);
  } catch (error) {
    console.error(`Failed to cache new event ${insertId} in Redis:`, error);
  }

  return createdEvent;
}

export async function getAllEvents(): Promise<Event[]> {
  const db = await getDB();

  const [rows] = await db.query('SELECT * FROM events');
  return rows as Event[];
}

export async function getEventById(id: number): Promise<Event | null> {
  const db = await getDB();

  const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
  const events = rows as Event[];
  return events[0] || null;
}

export async function updateEvent(
  id: number,
  data: UpdateEvent
): Promise<Event | null> {
  const db = await getDB();

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

  const updatedEvent = await getEventById(id);

  // if max_slots or registered_slots changed, update Redis
  if (
    updatedEvent &&
    (data.max_slots !== undefined || data.registered_slots !== undefined)
  ) {
    try {
      await redisEventOps.syncEventSlots(id, updatedEvent);
    } catch (error) {
      console.error(
        `Failed to update event ${id} in Redis after DB update:`,
        error
      );
      // invalidate cache to force refresh from DB
      await redisEventOps.invalidateEventSlots(id);
    }
  }

  return updatedEvent;
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDB();

  await db.execute('DELETE FROM events WHERE id = ?', [id]);
}

export async function getEventAvailableSlots(
  eventId: number
): Promise<{ available: number; total: number } | null> {
  try {
    const cachedSlots = await redisEventOps.getEventSlots(eventId);

    // Get event values from db for checking
    const event = await getEventById(eventId);
    if (!event) return null;

    // Try to get from Redis first for better performance (cache hit)
    if (cachedSlots) {
      const dbAvailable = event.max_slots - event.registered_slots;

      // If there's an inconsistency, update Redis with correct DB values
      if (
        cachedSlots.available !== dbAvailable ||
        cachedSlots.total !== event.max_slots
      ) {
        const result = {
          available: dbAvailable,
          total: event.max_slots,
        };

        await redisEventOps.setEventSlots(eventId, result, 300);
        return result;
      }

      return cachedSlots;
    }

    // If not in Redis, get from database (cache miss)
    const result = {
      available: event.max_slots - event.registered_slots,
      total: event.max_slots,
    };

    // Cache the result in Redis for 5 minutes
    await redisEventOps.setEventSlots(eventId, result, 300);

    return result;
  } catch (error) {
    console.error(`Error getting available slots for event ${eventId}:`, error);
    // Fallback to database if redis fails
    try {
      const event = await getEventById(eventId);
      if (!event) return null;

      return {
        available: event.max_slots - event.registered_slots,
        total: event.max_slots,
      };
    } catch (dbError) {
      console.error(`Database fallback failed for event ${eventId}:`, dbError);
      throw dbError;
    }
  }
}

// Additional functions
export async function initializeRedisEventCache(): Promise<void> {
  try {
    if (!isRedisReady()) {
      console.log('Redis not connected, skipping event cache initialization');
      return;
    }
    console.log('Initializing Redis event cache...');
    const events = await getAllEvents();
    await redisEventOps.initializeEventSlots(events);
  } catch (error) {
    console.error('Failed to initialize Redis event cache:', error);
  }
}

export async function verifyAllEventSlotsConsistency(): Promise<void> {
  if (!isRedisReady()) {
    return;
  }

  try {
    const events = await getAllEvents();
    let fixed = 0;

    for (const event of events) {
      const isConsistent = await redisEventOps.verifyEventSlotsConsistency(
        event.id,
        event
      );
      if (!isConsistent) fixed++;
    }

    if (fixed > 0) {
      console.log(`Fixed ${fixed} inconsistent event slot records in Redis`);
    }
  } catch (error) {
    console.error('Error during event slots consistency check:', error);
  }
}
