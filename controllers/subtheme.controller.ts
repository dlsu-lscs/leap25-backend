import type { Request, Response, NextFunction } from 'express';
import * as SubthemeService from '../services/subtheme.service';

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
