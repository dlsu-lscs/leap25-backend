import type { Request, Response, NextFunction } from 'express';
import * as SubthemeService from '../services/subtheme.service';
import 'dotenv/config';

export async function getAllSubthemes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log(req.body);
    const subthemes = await SubthemeService.getAllSubthemes();
    res.status(200).json(subthemes);
  } catch (error) {
    next(error);
  }
}

export async function getSubthemeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subtheme = await SubthemeService.getSubthemeById(
      Number(req.params.id)
    );
    if (subtheme) res.status(200).json(subtheme);
    else res.status(404).json({ message: 'Subtheme not found' });
  } catch (error) {
    next(error);
  }
}

export async function handleSubthemeContentfulWebhook(
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
      payload?.sys?.contentType?.sys?.id === 'subtheme';

    if (!isValid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const subtheme = await SubthemeService.handleContentfulWebhook(payload);

    if (!subtheme) {
      res.status(500).json({ error: 'Error when updating/creating subtheme.' });
    }

    res.status(subtheme.is_created ? 201 : 200).json(subtheme.subtheme);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createSubtheme(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const newSubtheme = await SubthemeService.createSubtheme(req.body);
    res.status(201).json(newSubtheme);
  } catch (error) {
    next(error);
  }
}

export async function updateSubtheme(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updatedSubtheme = await SubthemeService.updateSubtheme(
      Number(req.params.id),
      req.body
    );
    res.status(200).json(updatedSubtheme);
  } catch (error) {
    next(error);
  }
}

export async function deleteSubtheme(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await SubthemeService.deleteSubtheme(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function deleteSubthemeContentful(
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
      payload?.sys?.contentType?.sys?.id === 'subtheme';

    if (!is_valid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const subtheme = await SubthemeService.deleteSubthemeContentful(payload);

    if (subtheme) {
      res
        .status(500)
        .json({ error: 'Failure to delete subtheme through contentful' });
      return;
    }

    res.status(200).json({ message: 'Subtheme deleted.' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
}
