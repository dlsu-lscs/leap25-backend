import type { Request, Response, NextFunction } from 'express';
import * as OrgService from '../services/org.service';

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

export async function createOrgContentful(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = req.body;

    if (
      payload.sys.type === 'Entry' &&
      payload.sys.environment.sys.id === 'master' &&
      payload.sys.contentType.sys.id === 'org'
    ) {
      const fields = payload.fields;

      const org = {
        name: fields.name?.['en-US'],
        org_logo: fields.org_logo?.['en-US'],
      };

      if (!org.name || !org.org_logo) {
        res
          .status(400)
          .json({ error: 'Missing required organization fields.' });
        return;
      }

      const newOrg = await OrgService.createOrg(org);
      res.status(201).json(newOrg);
    } else {
      res.status(400).json({ error: 'Invalid payload or content type.' });
    }
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
