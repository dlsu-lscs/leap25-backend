import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/unit-setup.ts'],
    environmentOptions: {
      env: {
        CONTENTFUL_ACCESS_TOKEN: 'mock-token',
        CONTENTFUL_SPACE_ID: 'mock-space',
        CONTENTFUL_ENVIRONMENT: 'master',
        JWT_SECRET: 'test-secret',
        SESSION_SECRET: 'test-session-secret',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
