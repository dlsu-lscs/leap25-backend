// vitest: sequence
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { db } from '../../config/db';

let EID: number;

describe('Event API Integration', () => {
  const testEvent = {
    org_id: 1,
    title: 'Integration Test Event',
    description: 'Test Event Description',
    subtheme_id: 1,
    venue: 'Test Venue',
    schedule: new Date().toISOString().slice(0, 19).replace('T', ' '), // mysql compatibility
    fee: 0,
    code: 'CCPROG3',
    registered_slots: 0,
    max_slots: 100,
  };

  beforeAll(async () => {
    await db.execute('INSERT IGNORE INTO orgs (id, name) VALUES (?, ?)', [
      1,
      'Test Org',
    ]);
    await db.execute('INSERT IGNORE INTO subthemes (id, title) VALUES (?, ?)', [
      1,
      'Test Subtheme',
    ]);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM events WHERE id = ?', [1]);
    await db.execute('DELETE FROM orgs WHERE id = ?', [1]);
    await db.execute('DELETE FROM subthemes WHERE id = ?', [1]);
    await db.end();
  });

  it('should create a new event', async () => {
    const res = await request(app).post('/events').send(testEvent);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    EID = res.body.id;
  });

  it('should get all events', async () => {
    const res = await request(app).get('/events');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get event by id', async () => {
    const res = await request(app).get(`/events/${EID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', EID);
  });

  it('should update an event', async () => {
    const res = await request(app)
      .put(`/events/${EID}`)
      .send({ title: 'Updated Event Title' });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Event Title');
  });

  it('should delete an event', async () => {
    const res = await request(app).delete(`/events/${EID}`);
    expect(res.statusCode).toBe(204);
  });
});
