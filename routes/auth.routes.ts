import {
  googleAuth,
  googleAuthCallback,
  authController,
} from '../controllers/auth.controller';
import { Router } from 'express';

const router = Router();

router.get('/login/google', googleAuth());
router.get('/redirect/google', googleAuthCallback());
router.post('/google', authController);

export default router;
