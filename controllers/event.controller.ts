import type { Request, Response, NextFunction } from 'express';
import db from '../config/connectdb';
import * as EventService from '../services/event.service';
import { getOrgId } from '../services/contentful.service';

export async function getAllEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log(req.body);
    const events = await EventService.getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export async function getEventByID(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await EventService.getEventById(Number(req.params.id));
    if (event) res.status(200).json(event);
    else res.status(404).json({ message: 'Event not found' });
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const newEvent = await EventService.createEvent(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export async function createEventContentful(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const payload = req.body;

    if (
      payload.sys.type === 'Entry' &&
      payload.sys.environment.sys.id === 'master' &&
      payload.sys.contentType.sys.id === 'event'
    ) {
      const fields = payload.fields;

      const name = await getOrgId(fields.name?.['en-US']);
      const [orgs] = await db.query('SELECT id FROM events WHERE name = ?', [
        name,
      ]);

      if ((orgs as any[]).length === 0) {
        res.status(404).json({ error: 'Organization not found (name).' });
        return;
      }

      const [subthemes] = await db.query(
        'SELECT id FROM subthemes WHERE contentful_id = ?',
        [fields.subthemes['en-US'].id]
      );

      if ((subthemes as any[]).length === 0) {
        res.status(404).json({ error: 'Subtheme not found (name).' });
        return;
      }

      const event = {
        org_id: (orgs as any[])[0].id,
        title: fields.title?.['en-US'],
        description: fields.description?.['en-US'],
        subtheme_id: (subthemes as any[])[0].id,
        venue: fields.venue?.['en-US'],
        schedule: new Date(fields.schedule?.['en-US']),
        fee: parseFloat(fields.fee?.['en-US']),
        code: fields.code?.['en-US'],
        registered_slots: 0,
        max_slots: parseInt(fields.max_slots?.['en-US'], 10),
      };

      const new_event = await EventService.createEvent(event);

      res.status(201).json(new_event);
    }
  } catch (error) {
    console.error(
      'Error getting event form contentful: ',
      (error as Error).message
    );
    return;
  }
}

export async function updateEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updatedEvent = await EventService.updateEvent(
      Number(req.params.id),
      req.body
    );
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await EventService.deleteEvent(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export const getEventMedia = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const media = await EventService.getEventMedia(id);

    if (!media) {
      res.status(404).json({ message: 'Error: media not found.' });
      return;
    }

    res.status(200).json(media);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    return;
  }
};
