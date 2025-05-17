import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as HighlightService from '../../services/highlight.service';
import { getDB } from '../../config/database';
import { getEventByContentfulId } from 'services/event.service';

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
  const mock = {};

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
});
