import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as EventService from '../../services/event.service';
import { getDB } from '../../config/database';
import { redisEventOps } from '../../config/redis';

// Mock the database with getConnection function
vi.mock('../../config/database', () => ({
  getDB: vi.fn().mockResolvedValue({
    execute: vi.fn(),
    query: vi.fn(),
    getConnection: vi.fn().mockResolvedValue({
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
      query: vi.fn(),
      execute: vi.fn(),
    }),
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

vi.mock('../../config/contentful', () => {
  return {
    getContentfulEnv: vi.fn().mockResolvedValue({
      getAsset: vi.fn().mockResolvedValue({
        fields: {
          file: {
            'en-US': {
              url: 'https://example.com/mock-image.jpg',
            },
          },
        },
      }),
      getEntry: vi.fn().mockResolvedValue({
        sys: {
          id: 'mock-contentful-id',
        },
        fields: {
          org_name: {
            'en-US': 'Mock Organization',
          },
          org_logo: {
            'en-US': 'https://example.com/mock-logo.jpg',
          },
          id: {
            'en-US': '123',
          },
        },
      }),
    }),
    client: {
      getSpace: vi.fn().mockResolvedValue({
        getEnvironment: vi.fn(),
      }),
    },
  };
});

vi.mock('../../services/contentful.service', () => {
  return {
    getImageUrlById: vi
      .fn()
      .mockResolvedValue('https://example.com/mock-image.jpg'),
    getOrg: vi.fn().mockResolvedValue({
      name: 'Mock Organization',
      org_logo: 'https://example.com/mock-logo.jpg',
      contentful_id: 'mock-contentful-id',
    }),
    getSubthemeId: vi.fn().mockResolvedValue('123'),
  };
});

describe('EventService Unit Tests', () => {
  let mockDb: any;
  let mockConnection: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = await getDB();
    mockConnection = await mockDb.getConnection();
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
      slug: 'test-event',
      gforms_url: 'http://test-gforms.com',
      schedule_end: now,
      is_bundle: false,
    };

    const mockResult = [{ insertId: 1 }];
    mockDb.execute.mockResolvedValueOnce(mockResult);

    // Execute
    const result = await EventService.createEvent(mockEvent);

    // Assert
    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO events (org_id, title, description, subtheme_id, venue, schedule, fee, code, registered_slots, max_slots, contentful_id, slug, gforms_url, schedule_end, is_bundle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        mockEvent.slug ?? null,
        mockEvent.gforms_url ?? null,
        mockEvent.schedule_end ?? null,
        mockEvent.is_bundle ?? null,
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

  it('should get event by slug', async () => {
    const mockEvent = { slug: 'test-event', title: 'test Event' };
    mockDb.query.mockResolvedValueOnce([[mockEvent]]);

    const result = await EventService.getEventBySlug('test-event');

    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE slug = ?',
      ['test-event']
    );

    expect(result).toEqual(mockEvent);
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
      slug: 'test-event',
      gforms_url: 'http://test-gforms.com',
      schedule_end: now,
      is_bundle: false,
    };

    const updateData = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    const updatedEvent = { ...existingEvent, ...updateData };

    // Mock the connection query for getting existing event
    mockConnection.query.mockResolvedValueOnce([[existingEvent]]);
    // Mock the connection execute for update
    mockConnection.execute.mockResolvedValueOnce([{}]);
    // Mock the second connection query for getting updated event
    mockConnection.query.mockResolvedValueOnce([[updatedEvent]]);

    // Execute
    const result = await EventService.updateEvent(eventId, updateData);

    // Assert
    expect(mockConnection.execute).toHaveBeenCalledWith(
      'UPDATE events SET org_id = ?, title = ?, description = ?, subtheme_id = ?, venue = ?, schedule = ?, fee = ?, code = ?, registered_slots = ?, max_slots = ?, slug = ?, gforms_url = ?, schedule_end = ?, is_bundle = ? WHERE id = ?',
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
        existingEvent.slug,
        existingEvent.gforms_url,
        existingEvent.schedule_end,
        existingEvent.is_bundle,
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

    // Mock connection query for getting existing event
    mockConnection.query.mockResolvedValueOnce([[existingEvent]]);
    // Mock connection execute for update
    mockConnection.execute.mockResolvedValueOnce([{}]);
    // Mock the second connection query for getting updated event
    mockConnection.query.mockResolvedValueOnce([[updatedEvent]]);

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

  it('should search for an event', async () => {
    const search = 'mock';
    const mock_events = [
      { id: 1, title: 'mock event', org_id: 1 },
      { id: 2, title: 'event, mock', org_id: 2 },
    ];

    // Make sure we're returning exactly what's expected in the assertion
    mockDb.query.mockResolvedValueOnce([mock_events]);

    const result = await EventService.getEventBySearch(search);

    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM events WHERE title LIKE ?',
      [`%${search}%`]
    );
    expect(result).toEqual(mock_events);
  });
});
