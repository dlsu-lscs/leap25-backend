import { Router } from 'express';
import { handleEventMediaContentfulWebhook } from 'controllers/media.controller';

const router = Router();

router.post('/event', handleEventMediaContentfulWebhook);

export default router;
