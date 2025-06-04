import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import * as RegistrationController from '../controllers/registration.controller';
import * as BookmarkController from '../controllers/bookmark.controller';

const router = Router();

router.post('/', UserController.createUser);
router.get('/', UserController.getAllUsers);
router.post('/email/:email', UserController.getUserByEmail);
router.get(
  '/:userId/registrations',
  RegistrationController.getUserRegistrations
);
router.get('/:userId/bookmarks', BookmarkController.getUserBookmarks);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

export default router;
