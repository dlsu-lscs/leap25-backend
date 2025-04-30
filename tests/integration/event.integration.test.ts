import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import * as EventService from '../../services/event.service';
import db from '../../config/connectdb';

describe('EventService Integration Tests', () => {
  let createdEventId: number;
  const orgId = 999;
  const subthemeId = 999;

  const testEvent = {
    org_id: orgId,
    title: 'Integration Test Event',
    description: 'Test Event Description',
    subtheme_id: subthemeId,
    venue: 'Test Venue',
    schedule: new Date(),
    fee: 100,
    code: 'INTTEST',
    max_slots: 200,
    registered_slots: 0,
  };

  beforeAll(async () => {
    await db.execute('INSERT IGNORE INTO orgs (id, name) VALUES (?, ?)', [
      orgId,
      'Test Organization',
    ]);
    await db.execute('INSERT IGNORE INTO subthemes (id, title) VALUES (?, ?)', [
      subthemeId,
      'Test Subtheme',
    ]);

    await db.execute('DELETE FROM events WHERE code = ?', [testEvent.code]);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM events WHERE code = ?', [testEvent.code]);
    // await db.execute('DELETE FROM orgs WHERE id = ?', [orgId]);
    // await db.execute('DELETE FROM subthemes WHERE id = ?', [subthemeId]);
    await db.end();
  });

  it('should create a new event', async () => {
    const event = await EventService.createEvent(testEvent);

    expect(event).toHaveProperty('id');
    expect(event.title).toBe(testEvent.title);
    expect(event.org_id).toBe(testEvent.org_id);
    expect(event.description).toBe(testEvent.description);
    expect(event.code).toBe(testEvent.code);

    createdEventId = event.id;
  });

  it('should get all events', async () => {
    const events = await EventService.getAllEvents();

    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    // Find our test event
    const foundEvent = events.find((e) => e.id === createdEventId);
    expect(foundEvent).toBeDefined();
    expect(foundEvent?.title).toBe(testEvent.title);
  });

  it('should get event by id', async () => {
    const event = await EventService.getEventById(createdEventId);

    expect(event).not.toBeNull();
    expect(event?.id).toBe(createdEventId);
    expect(event?.title).toBe(testEvent.title);
    expect(event?.org_id).toBe(testEvent.org_id);
  });

  it('should return null when getting non-existent event', async () => {
    const event = await EventService.getEventById(99999);
    expect(event).toBeNull();
  });

  it('should update an event', async () => {
    const updatedData = {
      title: 'Updated Integration Event',
      description: 'Updated Description',
      venue: 'Updated Venue',
    };

    const updatedEvent = await EventService.updateEvent(
      createdEventId,
      updatedData
    );

    expect(updatedEvent).not.toBeNull();
    expect(updatedEvent?.id).toBe(createdEventId);
    expect(updatedEvent?.title).toBe(updatedData.title);
    expect(updatedEvent?.description).toBe(updatedData.description);
    expect(updatedEvent?.venue).toBe(updatedData.venue);
    // Other fields should remain unchanged
    expect(updatedEvent?.org_id).toBe(testEvent.org_id);
    expect(updatedEvent?.code).toBe(testEvent.code);
  });

  it('should delete an event', async () => {
    await EventService.deleteEvent(createdEventId);
    const deletedEvent = await EventService.getEventById(createdEventId);

    expect(deletedEvent).toBeNull();
  });
});
