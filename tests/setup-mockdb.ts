import { db } from '../config/db';
import { vi } from 'vitest';

// Mock the database for integration tests
vi.mock('../config/db', () => {
  return {
    db: {
      execute: vi.fn(),
      query: vi.fn(),
      end: vi.fn(),
      getConnection: vi.fn().mockResolvedValue({
        release: vi.fn(),
      }),
    },
  };
});

export { db };
