import {
  createEventMediaContentful,
  updateEventMediaContentful,
} from '../services/media.service';
import type { Request, Response } from 'express';

export const createEventMediaController = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const payload = req.body;
    const new_event_pub = await createEventMediaContentful(payload);

    if (!new_event_pub) {
      throw new Error('Error in creating a new event publication.');
    }

    res.status(201).json(new_event_pub);
    return;
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    return;
  }
};

export const updateEventMediaController = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const payload = req.body;

    const updatedMedia = await updateEventMediaContentful(payload);

    if (!updatedMedia) {
      res
        .status(404)
        .json({ error: 'Event media not found or update failed.' });
      return;
    }

    res.status(200).json(updatedMedia);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    return;
  }
};
