import { beforeAll } from 'vitest';

// Set up mock environment variables for tests
beforeAll(() => {
  process.env.CONTENTFUL_ACCESS_TOKEN = 'mock-token';
  process.env.CONTENTFUL_SPACE_ID = 'mock-space';
  process.env.CONTENTFUL_ENVIRONMENT = 'master';
  process.env.JWT_SECRET = 'test-secret';
  process.env.SESSION_SECRET = 'test-session-secret';
});
