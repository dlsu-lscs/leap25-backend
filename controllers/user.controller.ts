import type { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.query.email as string;

    if (email) {
      const email = req.query.email as string;

      const user = await UserService.getUserByEmail(email);

      res.status(201).json(user);
      return;
    }

    const users = await UserService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

export async function getUserByEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.params.email as string;

    const user = await UserService.getUserByEmail(email);

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(user);
    return;
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await UserService.getUserById(Number(req.params.id));
    if (user) res.status(200).json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    next(error);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const newUser = await UserService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updatedUser = await UserService.updateUser(
      Number(req.params.id),
      req.body
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await UserService.deleteUser(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
