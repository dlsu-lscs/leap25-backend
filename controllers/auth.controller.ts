import passport from 'passport';
import type { RequestHandler } from 'express';

/**
 * Handles Google OAuth2.0 login.
 * NOTE: SESSIONS TEMPORARILY FALSE
 *
 * @return {Function} passport.js middleware
 */
export const googleAuth = function (): RequestHandler {
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  });
};

/**
 * Handles Google OAuth2.0 callback.
 * NOTE: SESSIONS TEMPORARILY FALSE
 *
 * @return {Function} passport.js middleware
 */
export const googleAuthCallback = function (): RequestHandler {
  return passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true,
    successRedirect: '/',
    session: false,
  });
};
