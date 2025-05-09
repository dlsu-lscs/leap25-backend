import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as EventService from '../../services/event.service';
import { getDB } from '../../config/database';
import { redisEventOps } from '../../config/redis';

// Mock the database
vi.mock('../../config/database', () => ({
  getDB: vi.fn().mockResolvedValue({
    execute: vi.fn(),
    query: vi.fn(),
  }),
}));

// Mock Redis
vi.mock('../../config/redis', () => ({
  redisEventOps: {
    syncEventSlots: vi.fn(),
    invalidateEventSlots: vi.fn(),
  },
  isRedisReady: vi.fn().mockReturnValue(true),
}));

describe('EventService Unit Tests', () => {
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = await getDB();
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
      registered_slots: 0,
      max_slots: 50,
      contentful_id: 'abc123',
    };

    const mockResult = [{ insertId: 1 }];
    mockDb.execute.mockResolvedValueOnce(mockResult);

    // Execute
    const result = await EventService.createEvent(mockEvent);

    // Assert
    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO events (org_id, title, description, subtheme_id, venue, schedule, fee, code, registered_slots, max_slots, contentful_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        mockEvent.org_id ?? null,
        mockEvent.title ?? null,
        mockEvent.description ?? null,
        mockEvent.subtheme_id ?? null,
        mockEvent.venue ?? null,
        mockEvent.schedule ?? null,
        mockEvent.fee ?? null,
        mockEvent.code ?? null,
        mockEvent.registered_slots ?? null,
        mockEvent.max_slots ?? null,
        mockEvent.contentful_id ?? null,
      ]
    );

    expect(result).toEqual({
      id: 1,
      ...mockEvent,
      registered_slots: 0,
    });

    expect(redisEventOps.syncEventSlots).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        id: 1,
        max_slots: mockEvent.max_slots,
      })
    );
  });

  it('should get all events', async () => {
    // Setup
    const mockEvents = [
      { id: 1, title: 'Event 1', org_id: 1 },
      { id: 2, title: 'Event 2', org_id: 2 },
    ];
    mockDb.query.mockResolvedValueOnce([mockEvents]);

    // Execute
    const result = await EventService.getAllEvents();

    // Assert
    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM events');
    expect(result).toEqual(mockEvents);
  });

  it('should get event by id', async () => {
    // Setup
    const mockEvent = { id: 1, title: 'Test Event', org_id: 1 };
    mockDb.query.mockResolvedValueOnce([[mockEvent]]);

    // Execute
    const result = await EventService.getEventById(1);

    // Assert
    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE id = ?',
      [1]
    );
    expect(result).toEqual(mockEvent);
  });

  it('should return null if event not found', async () => {
    // Setup
    mockDb.query.mockResolvedValueOnce([[]]);

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
    mockDb.query.mockResolvedValueOnce([[existingEvent]]);
    // Mock the update execute call
    mockDb.execute.mockResolvedValueOnce([{}]);
    // Mock the second getEventById call
    mockDb.query.mockResolvedValueOnce([[updatedEvent]]);

    // Execute
    const result = await EventService.updateEvent(eventId, updateData);

    // Assert
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE events SET org_id = ?, title = ?, description = ?, subtheme_id = ?, venue = ?, schedule = ?, fee = ?, code = ?, registered_slots = ?, max_slots = ? WHERE id = ?',
      [
        existingEvent.org_id,
        updateData.title,
        updateData.description,
        existingEvent.subtheme_id,
        existingEvent.venue,
        existingEvent.schedule,
        existingEvent.fee,
        existingEvent.code,
        existingEvent.registered_slots,
        existingEvent.max_slots,
        eventId,
      ]
    );
    expect(result).toEqual(updatedEvent);
  });

  it('should update Redis when max_slots changes', async () => {
    // Setup
    const eventId = 1;
    const existingEvent = {
      id: eventId,
      org_id: 1,
      title: 'Event',
      registered_slots: 5,
      max_slots: 100,
    };

    const updateData = {
      max_slots: 200,
    };

    const updatedEvent = { ...existingEvent, ...updateData };

    // Mock getEventById call in updateEvent
    mockDb.query.mockResolvedValueOnce([[existingEvent]]);
    // Mock the update execute call
    mockDb.execute.mockResolvedValueOnce([{}]);
    // Mock the second getEventById call
    mockDb.query.mockResolvedValueOnce([[updatedEvent]]);

    // Execute
    const result = await EventService.updateEvent(eventId, updateData);

    // Assert
    expect(redisEventOps.syncEventSlots).toHaveBeenCalledWith(
      eventId,
      updatedEvent
    );
  });

  it('should delete an event', async () => {
    // Setup
    const eventId = 1;
    mockDb.execute.mockResolvedValueOnce([{}]);

    // Execute
    await EventService.deleteEvent(eventId);

    // Assert
    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM events WHERE id = ?',
      [eventId]
    );
  });
});
