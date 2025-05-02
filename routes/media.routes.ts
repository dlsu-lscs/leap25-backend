import { Router } from 'express';
import { getEventMediaController } from 'controllers/media.controller';

const router = Router();

router.get('/event/media', getEventMediaController);

export const mediaRouter = router;
