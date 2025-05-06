import { createEventMedia } from '../services/media.service';
import type { Request, Response } from 'express';

export const createEventMediaController = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = req.body;
    const new_event_pub = await createEventMedia(data);

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
