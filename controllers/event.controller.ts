import type { Request, Response, NextFunction } from 'express';
import * as EventService from '../services/event.service';

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
