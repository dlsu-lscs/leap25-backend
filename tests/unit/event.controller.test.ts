import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as EventController from '../../controllers/event.controller';
import * as EventService from '../../services/event.service';

vi.mock('../../services/event.service');
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

const mockResponse = (): any => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res;
};

const mockNext = vi.fn();

describe('Event Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get all events', async () => {
    const req = { query: {} } as any;
    const res = mockResponse();
    const fakeEvents = [{ id: 1, title: 'Test Event' }];

    (EventService.getAllEvents as any).mockResolvedValue(fakeEvents);
    await EventController.getAllEvents(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeEvents);
  });

  it('should create a new event', async () => {
    const req = {
      body: {
        title: 'Test Event',
        org_id: 1,
        schedule: new Date(),
        code: 'CCEVENT',
        registered_slots: 0,
        max_slots: 10,
      },
      query: {},
    } as any;
    const res = mockResponse();
    const createdEvent = { id: 1, ...req.body };

    (EventService.createEvent as any).mockResolvedValue(createdEvent);
    await EventController.createEvent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdEvent);
  });

  it('should get event by id', async () => {
    const req = { params: { id: '1' } } as any;
    const res = mockResponse();
    const event = { id: 1, title: 'Test Event' };

    (EventService.getEventById as any).mockResolvedValue(event);
    await EventController.getEventByID(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(event);
  });

  it('should return 404 if event not found', async () => {
    const req = { params: { id: '999' } } as any;
    const res = mockResponse();

    (EventService.getEventById as any).mockResolvedValue(null);
    await EventController.getEventByID(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Event not found' });
  });

  it('should update an event', async () => {
    const req = {
      params: { id: '1' },
      body: { title: 'Updated Event' },
    } as any;
    const res = mockResponse();
    const updatedEvent = { id: 1, title: 'Updated Event' };

    (EventService.updateEvent as any).mockResolvedValue(updatedEvent);
    await EventController.updateEvent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedEvent);
  });

  it('should delete an event', async () => {
    const req = { params: { id: '1' } } as any;
    const res = mockResponse();

    (EventService.deleteEvent as any).mockResolvedValue(undefined);
    await EventController.deleteEvent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
