import mysql from 'mysql2/promise';
import db from '../config/connectdb';
import { redisClient, redisEventOps } from '../config/sessions';
import type { Registration, CreateRegistration } from '../models/Registration';

// Create a new registration
export async function registerUserForEvent(
  data: CreateRegistration
): Promise<Registration | null> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // check if the event exists and has available slots
    const [eventRows] = await connection.query(
      'SELECT id, registered_slots, max_slots FROM events WHERE id = ? FOR UPDATE',
      [data.event_id]
    );

    const events = eventRows as any[];
    if (events.length === 0) {
      await connection.rollback();
      return null;
    }

    const event = events[0];
    if (event.registered_slots >= event.max_slots) {
      await connection.rollback();
      throw new Error('No available slots for this event');
    }

    // check if user already registered for this event
    const [existingRegistration] = await connection.query(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?',
      [data.user_id, data.event_id]
    );

    if ((existingRegistration as any[]).length > 0) {
      await connection.rollback();
      throw new Error('User already registered for this event');
    }

    // create registration to db
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      'INSERT INTO registrations (user_id, event_id, registration_date) VALUES (?, ?, NOW())',
      [data.user_id, data.event_id]
    );

    // update event registered_slots
    await connection.execute(
      'UPDATE events SET registered_slots = registered_slots + 1 WHERE id = ?',
      [data.event_id]
    );

    await connection.commit();

    // invalidate Redis cache for this event's slots so we can update it
    await redisEventOps.updateSlotsAfterRegistration(data.event_id);

    const registration: Registration = {
      id: result.insertId,
      user_id: data.user_id,
      event_id: data.event_id,
      registration_date: new Date(),
    };

    return registration;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating registration:', error);

    // invalidate the cache on errors
    try {
      await redisEventOps.invalidateEventSlots(data.event_id);
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError);
    }

    throw error;
  } finally {
    connection.release();
  }
}

// Get all registrations for a user
export async function getUserRegistrations(
  userId: number
): Promise<Array<Registration & { event_title: string }>> {
  try {
    const [rows] = await db.query(
      `SELECT r.*, e.title as event_title
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ?
       ORDER BY r.registration_date DESC`,
      [userId]
    );

    return rows as Array<Registration & { event_title: string }>;
  } catch (error) {
    console.error('Error getting user registrations:', error);
    throw error;
  }
}
