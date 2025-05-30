import type { Request, Response, NextFunction } from 'express';
import * as RegistrationService from '../services/registration.service';

export async function createRegistration(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
      res.status(400).json({ message: 'User ID and Event ID are required' });
      return;
    }

    const registration = await RegistrationService.registerUserForEvent({
      user_id: user_id.map(Number),
      event_id: Number(event_id),
    });

    res.status(201).json(registration);
  } catch (error: any) {
    if (error.message === 'No available slots for this event') {
      res.status(400).json({ message: error.message });
      return;
    }

    if (error.message === 'User already registered for this event') {
      res.status(409).json({ message: error.message });
      return;
    }

    console.error(error);
    next(error);
  }
}

export async function getUserRegistrations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Number(req.params.userId);
    const registrations =
      await RegistrationService.getUserRegistrations(userId);

    res.status(200).json(registrations);
  } catch (error) {
    console.error(error);
    next(error);
  }
}
