import mysql from 'mysql2/promise';
import { getDB } from '../config/database';
import type { Event, CreateEvent, UpdateEvent } from '../models/Event';
import type { EventMedia } from '../models/EventMedia';
import { getOrg } from './contentful.service';
import { redisEventOps, isRedisReady } from '../config/redis';

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
    contentful_id,
    slug,
    gforms_url,
  } = data;

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO events (org_id, title, description, subtheme_id, venue, schedule, fee, code, registered_slots, max_slots, contentful_id, slug, gforms_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
      slug,
      gforms_url,
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
    contentful_id,
    slug,
    gforms_url,
  };

  // initialize Redis cache for this new event
  try {
    await redisEventOps.syncEventSlots(insertId, createdEvent);
  } catch (error) {
    console.error(`Failed to cache new event ${insertId} in Redis:`, error);
  }

  return createdEvent;
}

export async function createEventPayload(
  payload: any
): Promise<CreateEvent | null> {
  const fields = payload.fields;
  const org_id = fields.orgId['en-US'].sys.id;
  const db = await getDB();

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
    slug: fields.slug?.['en-US'],
    gforms_url: fields.gforms_url?.['en-US'],
  };

  return await createEvent(event);
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

export async function getEventByContentfulId(
  contentful_id: string
): Promise<Event | null> {
  const db = await getDB();
  const [events] = await db.query(
    'SELECT * FROM events WHERE contentful_id = ?',
    [contentful_id]
  );
  return (events as Event[])[0] || null;
}

export async function getEventBySubtheme(
  subtheme: string
): Promise<Event[] | null> {
  const db = await getDB();

  const [rows] = await db.query(
    'SELECT e.* FROM events e INNER JOIN subthemes s ON e.subtheme_id = s.id WHERE s.title = ?',
    [subtheme]
  );

  const events = rows as Event[];
  return events.length > 0 ? events : null;
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
    slug = existingEvent.slug,
    gforms_url = existingEvent.gforms_url,
  } = data;

  await db.execute(
    'UPDATE events SET org_id = ?, title = ?, description = ?, subtheme_id = ?, venue = ?, schedule = ?, fee = ?, code = ?, registered_slots = ?, max_slots = ?, slug = ?, gforms_url = ? WHERE id = ?',
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
      slug,
      gforms_url,
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

export async function updateEventPayload(payload: any): Promise<Event | null> {
  const fields = payload.fields;
  const org_id = fields.orgId['en-US'].sys.id;
  const db = await getDB();

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
    slug: fields.slug?.['en-US'],
    gforms_url: fields.gforms_url?.['en-US'],
  };

  const [events] = (await db.query(
    'SELECT id FROM events WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  if (events.length === 0) return null;

  return await updateEvent(events[0].id, updatedData);
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDB();

  await db.execute('DELETE FROM events WHERE id = ?', [id]);
}

export async function getEventMedia(id: number): Promise<EventMedia | null> {
  const db = await getDB();
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
  const db = await getDB();

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

export async function deleteEventContentful(
  payload: any
): Promise<Event | null> {
  const contentful_id = payload.sys.id;

  const event = await getEventByContentfulId(contentful_id);

  if (!event) {
    throw new Error('Event not found in database using contentful id.');
  }

  await deleteEvent(event.id);

  const deleted_event = await getEventById(event.id);
  return deleted_event;
}

export async function getEventAvailableSlots(
  eventId: number
): Promise<{ available: number; total: number } | null> {
  try {
    const cachedSlots = await redisEventOps.getEventSlots(eventId);
    if (cachedSlots) {
      return cachedSlots;
    }

    // Get event values from db for checking
    const event = await getEventById(eventId);
    if (!event) return null;

    // TODO: make reconciliation be in background jobs rather than real-time sync to prevent database hit on every request
    // Try to get from Redis first for better performance (cache hit)
    // if (cachedSlots) {
    //   const dbAvailable = event.max_slots - event.registered_slots;
    //
    //   // If there's an inconsistency, update Redis with correct DB values
    //   if (
    //     cachedSlots.available !== dbAvailable ||
    //     cachedSlots.total !== event.max_slots
    //   ) {
    //     const result = {
    //       available: dbAvailable,
    //       total: event.max_slots,
    //     };
    //
    //     await redisEventOps.setEventSlots(eventId, result, 300);
    //     return result;
    //   }
    //
    //   return cachedSlots;
    // }

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
// export async function initializeRedisEventCache(): Promise<void> {
//   try {
//     if (!isRedisReady()) {
//       console.log('Redis not connected, skipping event cache initialization');
//       return;
//     }
//     console.log('Initializing Redis event cache...');
//     const events = await getAllEvents();
//     await redisEventOps.initializeEventSlots(events);
//   } catch (error) {
//     console.error('Failed to initialize Redis event cache:', error);
//   }
// }
//
// export async function verifyAllEventSlotsConsistency(): Promise<void> {
//   if (!isRedisReady()) {
//     return;
//   }
//
//   try {
//     const events = await getAllEvents();
//     let fixed = 0;
//
//     for (const event of events) {
//       const isConsistent = await redisEventOps.verifyEventSlotsConsistency(
//         event.id,
//         event
//       );
//       if (!isConsistent) fixed++;
//     }
//
//     if (fixed > 0) {
//       console.log(`Fixed ${fixed} inconsistent event slot records in Redis`);
//     }
//   } catch (error) {
//     console.error('Error during event slots consistency check:', error);
//   }
// }

export async function getEventByCode(code: string): Promise<Event | null> {
  const db = await getDB();
  const events = await db.query('SELECT * FROM events WHERE code = ?', [code]);

  if ((events as any[]).length === 0) {
    return null;
  }

  return (events as any[])[0] as Event;
}

export async function getEventsByDay(day: number): Promise<Event[] | null> {
  const db = await getDB();

  // padded_day ensures that the day starts with a '0'
  const padded_day = String(day).padStart(2, '0');

  // non dynamic time (we will input the month later on then the day will be based on querty)
  const day_start = `2025-06-${padded_day} 00:00:00`;
  const day_end = `2025-06-${padded_day} 23:59:59`;

  const [events] = await db.query(
    'SELECT * FROM events WHERE schedule >= ? AND schedule <= ?',
    [day_start, day_end]
  );

  if ((events as any[]).length === 0) {
    return null;
  }

  return events as Event[];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const db = await getDB();

  const events = await db.query('SELECT * FROM events WHERE slug = ?', [slug]);

  if ((events as any[]).length === 0) {
    return null;
  }

  return (events as any[])[0] as Event;
}
