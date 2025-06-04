import type { Request, Response, NextFunction } from 'express';

/**
 * Verifies that the incoming request has an Authorization header
 * whose exact value matches process.env.API_SECRET.
 *
 * If the header is missing or does not match, responds with 401.
 */
export function verifyApiSecretMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader && !(authHeader === process.env.API_SECRET)) {
    res.status(401).json({ message: 'Unauthorized' });
  }

  next();
}
