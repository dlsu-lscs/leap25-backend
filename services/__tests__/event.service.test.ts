import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import * as EventService from '../../services/event.service';
import { db } from '../../config/db';

let EID: number;

describe('Event Service', () => {
  const testEvent = {
    org_id: 1,
    title: 'Test Event',
    description: 'Test Event Description',
    subtheme_id: 1,
    venue: 'Test Venue',
    schedule: new Date(),
    fee: 0,
    code: 'CCPROG3',
    registered_slots: 0,
    max_slots: 100,
  };

  beforeAll(async () => {
    await db.execute('INSERT INTO orgs (id, name) VALUES (?, ?)', [
      1,
      'Test Org',
    ]);
    await db.execute('INSERT INTO subthemes (id, title) VALUES (?, ?)', [
      1,
      'Test Subtheme',
    ]);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM events WHERE id = ?', [1]);
    await db.execute('DELETE FROM events WHERE org_id = ?', [1]);
    await db.execute('DELETE FROM events WHERE subtheme_id = ?', [1]);
    await db.execute('DELETE FROM orgs WHERE id = ?', [1]);
    await db.execute('DELETE FROM subthemes WHERE id = ?', [1]);
    await db.end();
  });

  it('should create a new event', async () => {
    const newEvent = await EventService.createEvent(testEvent);
    expect(newEvent).toHaveProperty('id');
    EID = newEvent.id;
    expect(newEvent.title).toBe(testEvent.title);
  });

  it('should get all events', async () => {
    const events = await EventService.getAllEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it('should get event by id', async () => {
    const event = await EventService.getEventById(EID);
    expect(event).not.toBeNull();
    expect(event?.id).toBe(EID);
  });

  it('should update an event', async () => {
    const updatedEvent = await EventService.updateEvent(EID, {
      title: 'Updated Event Title',
    });
    expect(updatedEvent).not.toBeNull();
    expect(updatedEvent?.title).toBe('Updated Event Title');
  });

  it('should delete an event', async () => {
    await EventService.deleteEvent(EID);
    const deleted = await EventService.getEventById(EID);
    expect(deleted).toBeNull();
  });
});
