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

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = await getDB();
  });

  it('should create a new highlight event', async () => {});
});
