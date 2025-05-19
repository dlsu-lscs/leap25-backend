import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as HighlightService from '../../services/highlight.service';
import { getDB } from '../../config/database';

vi.mock('../../config/database', () => ({
  getDB: vi.fn().mockResolvedValue({
    execute: vi.fn(),
    query: vi.fn(),
  }),
}));

vi.mock('../../config/contentful', () => ({
  getContentfulEnv: vi.fn().mockResolvedValue({
    getEntry: vi.fn().mockImplementation(async (id) => ({
      sys: { id },
      fields: {
        titleFallback: { 'en-US': 'Mock Title' },
        shortDesc: { 'en-US': 'Mock short description' },
        color: { 'en-US': 'mock-color' },
        titleCard: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-title-card-id',
            },
          },
        },
        bgImg: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-bg-img-id',
            },
          },
        },
      },
    })),
    getAsset: vi.fn().mockImplementation(async (id) => ({
      fields: {
        file: {
          'en-US': {
            url: `http://mock-img.com/${id}.jpg`,
          },
        },
      },
    })),
  }),
}));

vi.mock('../../services/event.service', () => ({
  getEventByContentfulId: vi.fn().mockResolvedValue({ id: 123 }),
}));

vi.mock('../../services/media.service', () => ({
  getImageUrlById: vi.fn().mockResolvedValue({ url: 'http://mock-img.com' }),
}));

describe('HighlightService unit tests', () => {
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = await getDB();
  });

  it('should create a new highlight event', async () => {
    const mock_highlight = {
      event_id: 2,
      title_card: 'http://card.com',
      title_fallback: 'Mock Fallback',
      bg_img: 'http://bg_img.com',
      short_desc: 'mock short description',
      color: 'red',
      contentful_id: '123',
    };

    const mock_result = { insertId: 1, affectedRows: 1 };
    mockDb.execute.mockResolvedValueOnce([mock_result]);

    const result = await HighlightService.createHighlight(mock_highlight);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO highlights (event_id, title_card, title_fallback, bg_img, short_desc, color, contentful_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        mock_highlight.event_id,
        mock_highlight.title_card,
        mock_highlight.title_fallback,
        mock_highlight.bg_img,
        mock_highlight.short_desc,
        mock_highlight.color,
        mock_highlight.contentful_id,
      ]
    );

    expect(result).toEqual({ id: 1, ...mock_highlight });
  });

  it('should get all highlights', async () => {
    const mock_highlights = [
      { id: 1, title_fallback: 'Mock highlight 1' },
      { id: 2, title_fallback: 'Mock highlight 2' },
    ];
    mockDb.query.mockResolvedValueOnce([mock_highlights]);

    const result = await HighlightService.getHighlights();

    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM highlights');
    expect(result).toEqual(mock_highlights);
  });

  it('should get a highlight by id', async () => {
    const mock_highlight = {
      id: 1,
      title_fallback: 'Mock highlight',
      contentful_id: 'mock-contentful-id',
    };
    mockDb.query.mockResolvedValueOnce([[mock_highlight]]);

    const result = await HighlightService.getHighlightById(mock_highlight.id);

    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM highlights WHERE id = ?',
      [mock_highlight.id]
    );

    expect(result).toEqual(mock_highlight);
  });

  it('should get a highlight by contentful_id', async () => {
    const mock_highlight = {
      id: 1,
      title_fallback: 'Mock highlight',
      contentful_id: 'mock-contentful-id',
    };

    const contentful_id = 'mock-contentful-id';
    mockDb.query.mockResolvedValueOnce([[mock_highlight]]);

    const result =
      await HighlightService.getHighlightByContentfulId(contentful_id);

    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM highlights WHERE contentful_id = ?',
      [contentful_id]
    );

    expect(result).toEqual(mock_highlight);
  });

  it('should update a highlight by contentful_id', async () => {
    const mock_highlight = {
      id: 1,
      event_id: 2,
      title_card: 'http://card.com',
      title_fallback: 'Mock Fallback',
      bg_img: 'http://bg_img.com',
      short_desc: 'mock short description',
      color: 'red',
      contentful_id: '123',
    };

    const updated_data = {
      event_id: 1,
      title_card: 'http://new-card.com',
      title_fallback: 'New Mock Fallback',
      bg_img: 'http://bg_img.com',
      short_desc: 'mock short description',
      color: 'red',
      contentful_id: '123',
    };

    const contentful_id = '123';
    mockDb.execute.mockResolvedValueOnce([
      {
        affectedRows: 1,
        insertId: 0,
      },
    ]);
    mockDb.query.mockResolvedValueOnce([
      [
        {
          ...mock_highlight,
          ...updated_data,
        },
      ],
    ]);

    const result = await HighlightService.updateHighlight(
      updated_data,
      contentful_id
    );

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE highlights SET event_id = ?, title_card = ?, title_fallback = ?, bg_img = ?, short_desc = ?, color = ? WHERE contentful_id = ?',
      [
        updated_data.event_id,
        updated_data.title_card,
        updated_data.title_fallback,
        updated_data.bg_img,
        updated_data.short_desc,
        updated_data.color,
        updated_data.contentful_id,
      ]
    );
    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM highlights WHERE contentful_id = ?',
      [contentful_id]
    );

    expect(result).toEqual({ ...mock_highlight, ...updated_data });
  });

  it('should delete a highlight', async () => {
    const contentful_id = '123';
    mockDb.execute.mockResolvedValueOnce([{}]);

    await HighlightService.deleteHighlightByContentfulId(contentful_id);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM highlights WHERE contentful_id = ?',
      [contentful_id]
    );
  });

  it('should get the fields from the payload', async () => {
    const payload = {
      sys: {
        id: '12345',
      },
      fields: {
        eventRef: {
          'en-US': {
            sys: {
              id: '123',
            },
          },
        },
        titleFallback: { 'en-US': 'Mock Title' },
        shortDesc: { 'en-US': 'Mock short description' },
        color: { 'en-US': 'mock-color' },
        titleCard: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-title-card-id',
            },
          },
        },
        bgImg: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-bg-img-id',
            },
          },
        },
      },
    };
    const event = { id: 123 };
    const result = await HighlightService.getPayloadFields(payload);

    expect(result).toEqual({
      event_id: event.id,
      title_card: 'http://mock-img.com/mock-title-card-id.jpg',
      title_fallback: 'Mock Title',
      bg_img: 'http://mock-img.com/mock-bg-img-id.jpg',
      color: 'mock-color',
      short_desc: 'Mock short description',
      contentful_id: '12345',
    });
  });

  it('should create a new highlight from payload', async () => {
    const payload = {
      sys: {
        id: '12345',
      },
      fields: {
        eventRef: {
          'en-US': {
            sys: {
              id: '123',
            },
          },
        },
        titleFallback: { 'en-US': 'Mock Title' },
        shortDesc: { 'en-US': 'Mock short description' },
        color: { 'en-US': 'mock-color' },
        titleCard: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-title-card-id',
            },
          },
        },
        bgImg: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-bg-img-id',
            },
          },
        },
      },
    };
    const mock_result = { insertId: 1, affectedRows: 1 };
    mockDb.execute.mockResolvedValueOnce([mock_result]);
    const result = await HighlightService.createHighlightPayload(payload);

    expect(result).toEqual({
      id: 1,
      event_id: 123,
      title_card: 'http://mock-img.com/mock-title-card-id.jpg',
      title_fallback: 'Mock Title',
      bg_img: 'http://mock-img.com/mock-bg-img-id.jpg',
      color: 'mock-color',
      short_desc: 'Mock short description',
      contentful_id: '12345',
    });
  });

  it('should update a highlight from payload', async () => {
    const payload = {
      sys: {
        id: '12345',
      },
      fields: {
        eventRef: {
          'en-US': {
            sys: {
              id: '123',
            },
          },
        },
        titleFallback: { 'en-US': 'Mock Title' },
        shortDesc: { 'en-US': 'Mock short description' },
        color: { 'en-US': 'mock-color' },
        titleCard: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-title-card-id',
            },
          },
        },
        bgImg: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-bg-img-id',
            },
          },
        },
      },
    };

    const highlight = {
      event_id: 123,
      title_card: 'http://mock-img.com/mock-title-card-id.jpg',
      title_fallback: 'Mock Title',
      bg_img: 'http://mock-img.com/mock-bg-img-id.jpg',
      color: 'mock-color',
      short_desc: 'Mock short description',
      contentful_id: '12345',
    };

    const mock_updated = {
      id: 1,
      ...highlight,
    };

    const mock_result = { insertId: 1, affectedRows: 1 };
    mockDb.execute.mockResolvedValueOnce([mock_result]);
    mockDb.query.mockResolvedValueOnce([
      {
        ...highlight,
      },
    ]);

    vi.spyOn(HighlightService, 'getPayloadFields').mockImplementation(
      async () => highlight
    );

    vi.spyOn(HighlightService, 'updateHighlightPayload').mockImplementation(
      async () => mock_updated
    );

    const result = await HighlightService.updateHighlightPayload(payload);

    expect(result).toEqual(mock_updated);
  });

  it('should handle contentful webhook between create and update', async () => {
    const payload = {
      sys: {
        id: '12345',
      },
      fields: {
        eventRef: {
          'en-US': {
            sys: {
              id: '123',
            },
          },
        },
        titleFallback: { 'en-US': 'Mock Title' },
        shortDesc: { 'en-US': 'Mock short description' },
        color: { 'en-US': 'mock-color' },
        titleCard: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-title-card-id',
            },
          },
        },
        bgImg: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'mock-bg-img-id',
            },
          },
        },
      },
    };

    const highlight = {
      id: 1,
      event_id: 123,
      title_card: 'http://mock-img.com/mock-title-card-id.jpg',
      title_fallback: 'Mock Title',
      bg_img: 'http://mock-img.com/mock-bg-img-id.jpg',
      color: 'mock-color',
      short_desc: 'Mock short description',
      contentful_id: '12345',
    };

    vi.spyOn(HighlightService, 'getHighlightByContentfulId')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(highlight);

    vi.spyOn(HighlightService, 'getPayloadFields').mockResolvedValue(highlight);
    vi.spyOn(HighlightService, 'createHighlight').mockResolvedValue(highlight);
    vi.spyOn(HighlightService, 'updateHighlight').mockResolvedValue(highlight);

    const result = await HighlightService.handleContentfulWebhook(payload);

    expect(result).toEqual({
      highlight: { ...highlight, id: 1 },
      is_created: true,
    });
  });

  it('should validate payload correctly', () => {
    const payload = {
      sys: {
        type: 'DeletedEntry',
        environment: { sys: { id: 'master' } },
        contentType: { sys: { id: 'highlightEvents' } },
      },
    };

    const secret = 'correct_secret';
    process.env.CONTENTFUL_WEBHOOK_SECRET = 'correct_secret';

    const result = HighlightService.validatePayload({ payload, secret });
    expect(result).toBe(true);
  });
});
