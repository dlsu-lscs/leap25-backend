import type { Request, Response, NextFunction } from 'express';
import * as EventService from '../services/event.service';
import 'dotenv/config';

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

export async function getEventBySubtheme(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { subtheme } = req.body;

    if (!subtheme) {
      res.status(400).json({ message: 'Subtheme title is required' });
      return;
    }

    const event = await EventService.getEventBySubtheme(String(subtheme));
    if (event) {
      res.status(200).json(event);
    } else {
      console.log('Event not found');
      res.status(404).json({ message: 'Event not found' });
    }
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
    const secret = req.headers['contentful-webhook-secret'];

    if (secret != process.env.CONTENTFUL_WEBHOOK_SECRET) {
      res.status(401).json({ message: 'Unauthorized access of webhook url.' });
      return;
    }

    const payload = req.body;

    if (
      payload.sys.type === 'Entry' &&
      payload.sys.environment.sys.id === 'master' &&
      payload.sys.contentType.sys.id === 'events'
    ) {
      const new_event = await EventService.createEventPayload(payload);

      res.status(201).json(new_event);
    } else {
      res.status(500).json({ error: 'Invalid payload or content type' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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

export async function updateEventContentful(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const secret = req.headers['contentful-webhook-secret'];

    if (secret !== process.env.CONTENTFUL_WEBHOOK_SECRET) {
      res.status(401).json({ message: 'Unauthorized access of webhook url.' });
      return;
    }

    const payload = req.body;

    if (
      payload.sys.type === 'Entry' &&
      payload.sys.environment.sys.id === 'master' &&
      payload.sys.contentType.sys.id === 'events'
    ) {
      const updatedEvent = await EventService.updateEventPayload(payload);

      if (!updatedEvent) {
        res
          .status(404)
          .json({ message: 'Event not found or invalid payload.' });
        return;
      }

      res.status(200).json(updatedEvent);
    } else {
      res.status(400).json({ error: 'Invalid payload or content type.' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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

export async function handleEventContentfulWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const secret = req.headers['contentful-webhook-secret'];

    if (secret !== process.env.CONTENTFUL_WEBHOOK_SECRET) {
      res.status(401).json({ message: 'Unauthorized access of webhook url.' });
      return;
    }

    const payload = req.body;

    const isValid =
      payload?.sys?.type === 'Entry' &&
      payload?.sys?.environment?.sys?.id === 'master' &&
      payload?.sys?.contentType?.sys?.id === 'events';

    if (!isValid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const result = await EventService.handleContentfulWebhook(payload);

    if (!result.event) {
      res.status(500).json({ error: 'Error when updating/creating event.' });
      return;
    }

    res.status(result.is_created ? 201 : 200).json(result.event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteEventContentful(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const secret = req.headers['contentful-webhook-secret'];

    if (secret !== process.env.CONTENTFUL_WEBHOOK_SECRET) {
      res.status(401).json({ message: 'Unauthorized access of webhook url.' });
      return;
    }

    const payload = req.body;

    const is_valid =
      payload?.sys?.type === 'DeletedEntry' &&
      payload?.sys?.environment?.sys?.id === 'master' &&
      payload?.sys?.contentType?.sys?.id === 'events';

    if (!is_valid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const deletedEvent = await EventService.deleteEventContentful(payload);

    if (deletedEvent) {
      res
        .status(500)
        .json({ error: 'Failure to delete event through Contentful' });
      return;
    }

    res.status(200).json({ message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getEventSlots(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventId = Number(req.params.eventId);
    const slots = await EventService.getEventAvailableSlots(eventId);

    if (slots === null) {
      res.status(404).json({ message: `No event found of id: ${eventId}` });
      return;
    }

    if (!slots) {
      res
        .status(400)
        .json({ message: `No slots found for the event ${eventId}.` });
      return;
    }

    res.status(200).json(slots);
  } catch (error) {
    console.error(error);
    next(error);
  }
}

export async function getEventByCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const code = req.query.code as string;
    const event = await EventService.getEventByCode(code);

    if (!event) {
      res.status(404).json({ message: `No event found of code: ${code}` });
      return;
    }

    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    next(error);
  }
}
