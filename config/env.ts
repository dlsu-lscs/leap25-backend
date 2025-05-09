export const validateEnvironment = (): void => {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASS',
    'DB_DATABASE',
    'SESSION_SECRET',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
    console.error('Please check your .env file');
    process.exit(1);
  }

  // Warn about optional but recommended variables
  const recommended = ['REDIS_CONNECTION_URL', 'CORS_ORIGIN'];
  const warnings = recommended.filter((key) => !process.env[key]);

  if (warnings.length > 0) {
    console.warn(
      `Missing recommended environment variables: ${warnings.join(', ')}`
    );
    if (!process.env.REDIS_CONNECTION_URL) {
      console.warn(
        'Running without Redis - sessions will use in-memory store (not suitable for production)'
      );
    }
  }
};

export default { validateEnvironment };
