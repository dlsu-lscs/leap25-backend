import {
  googleAuth,
  googleAuthCallback,
  authController,
} from '../controllers/auth.controller.ts';
import { Router } from 'express';

const router = Router();

router.get('/login/google', googleAuth());
router.get('/redirect/google', googleAuthCallback());
router.get('/google', authController);

export default router;
