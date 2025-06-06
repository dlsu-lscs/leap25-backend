import type { Request, Response, NextFunction } from 'express';

export function googleOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'] || '';

  const allowedGoogleUserAgents = [
    'Google-Apps-Script',
    'Googlebot',
    'AdsBot-Google',
    'APIs-Google',
  ];

  const isAllowed = allowedGoogleUserAgents.some((keyword) =>
    userAgent.includes(keyword)
  );

  if (!isAllowed) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  next();
}
