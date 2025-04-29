import { beforeAll, afterAll, afterEach } from 'vitest';
import app from '../index';
import supertest from 'supertest';

export const api = supertest(app);

beforeAll(async () => {
  // NOTE: setup test database or other test requirements here
});

afterEach(async () => {
  // NOTE: clean up after each test here
});

afterAll(async () => {
  // NOTE: cleanup after all tests here
});
