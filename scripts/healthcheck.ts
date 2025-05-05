// for dockerfile healthchecks
import http from 'http';

const PORT = process.env.PORT || 3000;

const healthCheck = () => {
  return new Promise<boolean>((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'GET',
        timeout: 2000,
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

healthCheck().then((isHealthy) => {
  process.exit(isHealthy ? 0 : 1);
});
