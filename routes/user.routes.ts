import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import * as RegistrationController from '../controllers/registration.controller';

const router = Router();

router.post('/', UserController.createUser);
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

router.get(
  '/:userId/registrations',
  RegistrationController.getUserRegistrations
);

export default router;
