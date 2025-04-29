import passport from 'passport';
import type { RequestHandler } from 'express';

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
