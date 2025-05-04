import * as esbuild from 'esbuild';

try {
  await esbuild.build({
    entryPoints: ['./index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: 'dist',
    format: 'esm',
    sourcemap: true,
    external: [
      'express',
      'dotenv',
      'passport',
      'util',
      'passport-google-oauth20',
      'mysql2',
      'express-session',
      'connect-redis',
      'redis',
      'contentful-management',
      'google-auth-library',
      'child_process',
      'fs',
      'path',
      'os',
      'jsonwebtoken',
    ],
  });
  console.log('Build complete');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
