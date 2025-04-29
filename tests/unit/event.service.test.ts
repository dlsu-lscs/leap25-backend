import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as EventService from '../../services/event.service';
import { db } from '../../config/db';

// Mock the database
vi.mock('../../config/db', () => ({
  db: {
    execute: vi.fn(),
    query: vi.fn(),
  },
}));

describe('EventService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new event', async () => {
    // Setup
    const now = new Date();
    const mockEvent = {
      org_id: 1,
      title: 'Test Event',
      description: 'Description',
      subtheme_id: 1,
      venue: 'Venue',
      schedule: now,
      fee: 100,
      code: 'CODE123',
      max_slots: 50,
    };

    const mockResult = [{ insertId: 1 }];
    (db.execute as any).mockResolvedValueOnce(mockResult);

    // Execute
    const result = await EventService.createEvent(mockEvent);

    // Assert
    expect(db.execute).toHaveBeenCalledWith(
      'INSERT INTO events (org_id, title, description, subtheme_id, venue, schedule, fee, code, registered_slots, max_slots) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        mockEvent.org_id,
        mockEvent.title,
        mockEvent.description,
        mockEvent.subtheme_id,
        mockEvent.venue,
        mockEvent.schedule,
        mockEvent.fee,
        mockEvent.code,
        undefined, // registered_slots is optional
        mockEvent.max_slots,
      ]
    );
    expect(result).toEqual({
      id: 1,
      ...mockEvent,
      registered_slots: 0,
    });
  });

  it('should get all events', async () => {
    // Setup
    const mockEvents = [
      { id: 1, title: 'Event 1', org_id: 1 },
      { id: 2, title: 'Event 2', org_id: 2 },
    ];
    (db.query as any).mockResolvedValueOnce([mockEvents]);

    // Execute
    const result = await EventService.getAllEvents();

    // Assert
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM events');
    expect(result).toEqual(mockEvents);
  });

  it('should get event by id', async () => {
    // Setup
    const mockEvent = { id: 1, title: 'Test Event', org_id: 1 };
    (db.query as any).mockResolvedValueOnce([[mockEvent]]);

    // Execute
    const result = await EventService.getEventById(1);

    // Assert
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM events WHERE id = ?', [
      1,
    ]);
    expect(result).toEqual(mockEvent);
  });

  it('should return null if event not found', async () => {
    // Setup
    (db.query as any).mockResolvedValueOnce([[]]);

    // Execute
    const result = await EventService.getEventById(999);

    // Assert
    expect(result).toBeNull();
  });

  it('should update an event', async () => {
    // Setup
    const eventId = 1;
    const now = new Date();
    const existingEvent = {
      id: eventId,
      org_id: 1,
      title: 'Old Title',
      description: 'Old Description',
      subtheme_id: 1,
      venue: 'Old Venue',
      schedule: now,
      fee: 0,
      code: 'OLD123',
      registered_slots: 0,
      max_slots: 100,
    };

    const updateData = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    const updatedEvent = { ...existingEvent, ...updateData };

    // Mock getEventById call in updateEvent
    (db.query as any).mockResolvedValueOnce([[existingEvent]]);
    // Mock the update execute call
    (db.execute as any).mockResolvedValueOnce([{}]);
    // Mock the second getEventById call
    (db.query as any).mockResolvedValueOnce([[updatedEvent]]);

    // Execute
    const result = await EventService.updateEvent(eventId, updateData);

    // Assert
    expect(result).toEqual(updatedEvent);
  });

  it('should delete an event', async () => {
    // Setup
    const eventId = 1;
    (db.execute as any).mockResolvedValueOnce([{}]);

    // Execute
    await EventService.deleteEvent(eventId);

    // Assert
    expect(db.execute).toHaveBeenCalledWith('DELETE FROM events WHERE id = ?', [
      eventId,
    ]);
  });
});
