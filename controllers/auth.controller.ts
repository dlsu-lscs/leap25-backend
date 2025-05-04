import passport from 'passport';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { googleAuth2 } from '../services/auth.services';

/**
 * Handles Google OAuth2.0 login.
 *
 * @return {Function} passport.js middleware
 */
export const googleAuth = function (): RequestHandler {
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
  });
};

/**
 * Handles Google OAuth2.0 callback.
 *
 * @return {Function} passport.js middleware
 */
export const googleAuthCallback = function (): RequestHandler {
  return passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true,
    successRedirect: '/',
    session: true,
  });
};

export const authController = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<undefined> {
  const { token: accessToken } = req.body;

  try {
    const result = await googleAuth2(accessToken);

    if (!result) {
      res.status(400).json({ error: 'Invalid JWT.' });
      return;
    }

    const { jwt_token, user } = result;

    (req.session as any).jwt = jwt_token;
    (req.session as any).user = user;

    res.status(200).json(jwt_token);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    next(error);
  }
};
