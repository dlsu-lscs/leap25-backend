import { Router } from 'express';
import * as RegistrationController from '../controllers/registration.controller';

const router = Router();

router.post('/', RegistrationController.createRegistration);

export default router;
