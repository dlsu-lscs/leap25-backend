import {
  googleAuth,
  googleAuthCallback,
} from '../controllers/auth.controller.ts';
import { Router } from 'express';

const router = Router();

router.get('/login/google', googleAuth());
router.get('/redirect/google', googleAuthCallback());

export default router;
