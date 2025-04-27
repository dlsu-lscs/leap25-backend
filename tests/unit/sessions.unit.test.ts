/*import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sessionMiddleware, redisClient } from '../../config/sessions.ts';
import * as RedisStore from 'connect-redis';
import request from 'supertest';
import express from 'express';
import { RequestHandler } from 'express';

interface SessionMiddleware extends RequestHandler {
  store: any;
}

const typedSessionMiddleware = sessionMiddleware as SessionMiddleware;

describe('Session Middleware', () => {
  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it('should take redis as storage for sessions', () => {
    expect(sessionMiddleware).toHaveProperty('store');
  });


});*/
