import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { db } from '../../config/db';

let UID: number;

describe('User API Itegration', () => {
  const testUser = {
    email: 'integrationtest@example.com',
    name: 'Integration Test User',
    display_picture: '',
  };

  afterAll(async () => {
    if (UID) {
      await db.execute('DELETE FROM users WHERE id = ?', [UID]);
    }
    await db.end();
  });

  it('should create a new user', async () => {
    const res = await request(app).post('/users').send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.name).toBe(testUser.name);

    UID = res.body.id;
  });

  it('should get all users', async () => {
    const res = await request(app).get('/users');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get userr by id', async () => {
    const res = await request(app).get(`/users/${UID}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', UID);
    expect(res.body.email).toBe(testUser.email);
  });

  it('should update a user', async () => {
    const updatedData = { name: 'Updated Integration User' };
    const res = await request(app).put(`/users/${UID}`).send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', UID);
    expect(res.body.name).toBe(updatedData.name);
  });

  it('should delete a user', async () => {
    const res = await request(app).delete(`/users/${UID}`);

    expect(res.statusCode).toBe(204);
  });
});
