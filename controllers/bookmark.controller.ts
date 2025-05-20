import * as BookmarkService from '../services/bookmark.service';
import type { Request, Response, NextFunction } from 'express';

export async function createBookmark(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id, event_id } = req.body;

    const new_bookmark = await BookmarkService.createBookmark(
      user_id,
      event_id
    );

    if (new_bookmark === null) {
      res.status(500).json({
        error: `Error when creating a new bookmark for user: ${user_id}`,
      });
      return;
    }

    res.status(201).json(new_bookmark);
  } catch (error) {
    console.error(error);
    next(error);
  }
}

export async function getUserBookmarks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user_id = Number(req.params.userId);

    const bookmarks = await BookmarkService.getAllUserBookmarks(user_id);

    if (!bookmarks) {
      res.status(404).json({ message: `User ${user_id} has no bookmarks` });
      return;
    }

    res.status(200).json(bookmarks);
  } catch (error) {
    console.error(error);
    next(error);
  }
}

export async function deleteBookmark(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id, event_id } = req.body;

    const delete_bookmark = await BookmarkService.deleteBookmark(
      user_id,
      event_id
    );

    if (delete_bookmark) {
      res.status(500).json({
        error: `Failed to delete event ${event_id} bookmark of user ${user_id}`,
      });
      return;
    }

    res.status(200).json({
      message: `Event bookmark ${event_id} for user: ${user_id} deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}
