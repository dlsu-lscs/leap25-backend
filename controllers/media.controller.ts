import { getEventMedia } from '../services/media.service';
import type { Request, Response } from 'express';

export const getEventMediaController = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const media = await getEventMedia();

    if (!media) {
      res.status(404).json({ error: 'Media not found.' });
      return;
    }

    console.log('media: ' + media);
    res.status(200).json(media);
    return;
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    return;
  }
};
