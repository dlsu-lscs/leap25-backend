import * as BookmarkController from '../controllers/bookmark.controller';
import Router from 'express';

const router = Router();

router.post('/', BookmarkController.createBookmark);
router.delete('/', BookmarkController.deleteBookmark);

export default router;
