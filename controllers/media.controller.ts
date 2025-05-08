import { handleContentfulWebhook } from '../services/media.service';
import type { Request, Response } from 'express';

export async function handleEventMediaContentfulWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const secret = req.headers['contentful-webhook-secret'];

    if (secret !== process.env.CONTENTFUL_WEBHOOK_SECRET) {
      res.status(401).json({ message: 'Unauthorized access of webhook URL.' });
      return;
    }

    const payload = req.body;

    const isValid =
      payload?.sys?.type === 'Entry' &&
      payload?.sys?.environment?.sys?.id === 'master' &&
      payload?.sys?.contentType?.sys?.id === 'eventPub';

    if (!isValid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const result = await handleContentfulWebhook(payload);

    if (!result.eventMedia) {
      res
        .status(500)
        .json({ error: 'Error when updating/creating event media.' });
      return;
    }

    res.status(result.is_created ? 200 : 201).json(result.eventMedia);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
