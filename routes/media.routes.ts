import { Router } from 'express';
import { createEventMediaController } from 'controllers/media.controller';

const router = Router();

router.post('/event', createEventMediaController);

export default router;
