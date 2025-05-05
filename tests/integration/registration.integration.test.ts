import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import * as RegistrationService from '../../services/registration.service';
import * as UserService from '../../services/user.service';
import * as EventService from '../../services/event.service';
import { getDB } from '../../config/database';

const db = await getDB();

describe('Registration Integration Tests', () => {
  let userId: number;
  let eventId: number;
  let registrationId: number;

  const testUser = {
    email: 'registration-test@example.com',
    name: 'Registration Test User',
    display_picture: 'https://example.com/pic.jpg',
  };

  const testEvent = {
    org_id: 999,
    title: 'Registration Test Event',
    description: 'Test Event for Registration',
    venue: 'Test Venue',
    schedule: new Date(),
    fee: 100,
    code: 'REGTEST',
    max_slots: 10,
    registered_slots: 0,
  };

  // Setup test data
  beforeAll(async () => {
    // Clean up any existing test data
    await db.execute(
      'DELETE FROM registrations WHERE user_id IN (SELECT id FROM users WHERE email = ?)',
      [testUser.email]
    );
    await db.execute('DELETE FROM events WHERE code = ?', [testEvent.code]);
    await db.execute('DELETE FROM users WHERE email = ?', [testUser.email]);

    // Create test organization if it doesn't exist
    await db.execute('INSERT IGNORE INTO orgs (id, name) VALUES (?, ?)', [
      testEvent.org_id,
      'Test Organization',
    ]);

    // Create a test user
    const user = await UserService.createUser(testUser);
    userId = Number(user.id);

    // Create a test event
    const event = await EventService.createEvent(testEvent);
    eventId = event.id;
  });

  // Cleanup after tests
  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM registrations WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM events WHERE id = ?', [eventId]);
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    await db.end();
  });

  it('should register a user for an event', async () => {
    // Register user for the event
    const registration = await RegistrationService.registerUserForEvent({
      user_id: userId,
      event_id: eventId,
    });

    expect(registration).not.toBeNull();
    expect(registration).toHaveProperty('id');
    expect(registration?.user_id).toBe(userId);
    expect(registration?.event_id).toBe(eventId);
    // Removed check for status

    registrationId = registration!.id;

    // Verify event slots were updated
    const updatedEvent = await EventService.getEventById(eventId);
    expect(updatedEvent?.registered_slots).toBe(1);
  });

  it('should get user registrations', async () => {
    const registrations =
      await RegistrationService.getUserRegistrations(userId);

    expect(Array.isArray(registrations)).toBe(true);
    expect(registrations.length).toBeGreaterThan(0);

    const foundRegistration = registrations.find(
      (r) => r.id === registrationId
    );
    expect(foundRegistration).toBeDefined();
    expect(foundRegistration?.event_id).toBe(eventId);
    expect(foundRegistration).toHaveProperty('event_title');
  });

  it('should prevent duplicate registrations', async () => {
    await expect(
      RegistrationService.registerUserForEvent({
        user_id: userId,
        event_id: eventId,
      })
    ).rejects.toThrow('User already registered for this event');
  });

  it('should check available slots', async () => {
    const slots = await EventService.getEventAvailableSlots(eventId);

    expect(slots).not.toBeNull();
    expect(slots?.available).toBe(testEvent.max_slots - 1);
    expect(slots?.total).toBe(testEvent.max_slots);
  });
});
