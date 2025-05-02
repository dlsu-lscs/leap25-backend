import { getEventMedia } from '../services/media.service';
import type { Request, Response } from 'express';

export const getEventMediaController = async function (
  req: Request,
  res: Response
): Promise<void> {
  console.log(req.body);

  try {
    const media = await getEventMedia();

    if (!media) {
      res.status(404).json({ error: 'Media not found.' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    return;
  }
};
