import { authController } from '../controllers/auth.controller';
import { Router } from 'express';

const router = Router();

router.post('/google', authController);

export default router;
