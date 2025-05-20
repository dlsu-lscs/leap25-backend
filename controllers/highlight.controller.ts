import type { Request, Response, NextFunction } from 'express';
import * as HighlightService from '../services/highlight.service';
import 'dotenv/config';
import type { UpdateHighlight } from '../models/Highlight';

export async function createHighlight(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const new_highlight = await HighlightService.createHighlight(req.body);

    if (!new_highlight) {
      res.status(500).json({ error: 'Error when creating a new highlight' });
      return;
    }

    res.status(201).json(new_highlight);
  } catch (error) {
    next(error);
  }
}

export async function updateHighlight(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const highlight = req.body;

    const updated_highlight: UpdateHighlight | null =
      await HighlightService.updateHighlight(
        highlight,
        highlight.contentful_id
      );

    if (!updated_highlight) {
      res.status(500).json({
        error: `Error when updating highlight with contentful_id: ${highlight.contentful_id}`,
      });
      return;
    }

    res.status(200).json(updated_highlight);
  } catch (error) {
    next(error);
  }
}

export async function getAllHighlights(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const highlights = await HighlightService.getHighlights();
    res.status(200).json(highlights);
  } catch (error) {
    next(error);
  }
}

export async function getHighlightById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const highlight = await HighlightService.getHighlightById(
      Number(req.params.id)
    );

    if (!highlight) {
      res
        .status(404)
        .json({ message: `Highlight not found with id: ${req.params.id}` });
      return;
    }

    res.status(200).json(highlight);
  } catch (error) {
    next(error);
  }
}

export async function getHighlightByContentfulId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const highlight = await HighlightService.getHighlightByContentfulId(
      req.params.contentful_id as string
    );

    if (!highlight) {
      res.status(404).json({
        message: `Highlight not found with contentful id: ${req.params.contentful_id}`,
      });
      return;
    }

    res.status(200).json(highlight);
  } catch (error) {
    next(error);
  }
}

export async function handleHighlightContentfulWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = req.body;
    const is_valid = HighlightService.validatePayload({
      payload,
      secret: req.headers['x-webhook-secret'] as string,
    });

    if (!is_valid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const result = await HighlightService.handleContentfulWebhook(payload);

    if (!result.highlight) {
      res.status(500).json({
        error: `Error when updating/creating highlight with contentful_id: ${payload.sys.id}.`,
      });
      return;
    }

    res.status(result.is_created ? 201 : 200).json(result.highlight);
  } catch (error) {
    next(error);
  }
}

export async function deleteHighlightContentful(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = req.body;
    const is_valid = HighlightService.validatePayload({
      payload,
      secret: req.headers['x-webhook-secret'] as string,
    });

    if (!is_valid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const deleted_highlight =
      await HighlightService.deleteHighlightContentful(payload);

    if (deleted_highlight) {
      res.status(500).json({
        error: `Failed to delete highlight with contentful id: ${payload.sys.id}`,
      });
      return;
    }

    res.status(200).json({
      message: `Highlight deleted with contentful_id: ${payload.sys.id}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteHighlightByContentfulId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const contentful_id = req.params.contentful_id as string;

    const is_deleted =
      await HighlightService.deleteHighlightByContentfulId(contentful_id);

    if (!is_deleted) {
      res.status(500).json({
        message: `Error deleting highlight with contentful_id: ${contentful_id}`,
      });
      return;
    }

    res.status(200).json({
      message: `Deleted highlight with contentful_id: ${contentful_id}`,
    });
  } catch (error) {
    next(error);
  }
}
