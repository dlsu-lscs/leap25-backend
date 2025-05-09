import type { Request, Response, NextFunction } from 'express';
import * as OrgService from '../services/org.service';
import 'dotenv/config';

export async function getAllOrgs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log(req.body);
    const orgs = await OrgService.getAllOrgs();
    res.status(200).json(orgs);
  } catch (error) {
    next(error);
  }
}

export async function getOrgById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const org = await OrgService.getOrgById(Number(req.params.id));
    if (org) res.status(200).json(org);
    else res.status(404).json({ message: 'Org not found' });
  } catch (error) {
    next(error);
  }
}

export async function createOrg(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const newOrg = await OrgService.createOrg(req.body);
    res.status(201).json(newOrg);
  } catch (error) {
    next(error);
  }
}

export async function updateOrg(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updatedOrg = await OrgService.updateOrg(
      Number(req.params.id),
      req.body
    );
    res.status(200).json(updatedOrg);
  } catch (error) {
    next(error);
  }
}

export async function deleteOrg(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await OrgService.deleteOrg(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function handleOrgContentfulWebhook(
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
      payload?.sys?.contentType?.sys?.id === 'org';

    if (!isValid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const result = await OrgService.handleContentfulWebhook(payload);

    if (!result.org) {
      res.status(500).json({ error: 'Error when updating/creating org.' });
      return;
    }

    res.status(result.is_created ? 201 : 200).json(result.org);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteOrgContentful(
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
      payload?.sys?.contentType?.sys?.id === 'org';

    if (!is_valid) {
      res.status(400).json({ error: 'Invalid payload or content type.' });
      return;
    }

    const deletedOrg = await OrgService.deleteOrgContentful(payload);

    if (deletedOrg) {
      res
        .status(500)
        .json({ error: 'Failure to delete org through contentful' });
      return;
    }

    res.status(200).json({ message: 'Org deleted.' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
}
