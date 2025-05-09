import { vi } from 'vitest';

// Mock environment
export const getContentfulEnv = vi.fn().mockResolvedValue({
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
});

export const client = {
  getSpace: vi.fn().mockResolvedValue({
    getEnvironment: vi.fn().mockReturnValue(getContentfulEnv()),
  }),
};
