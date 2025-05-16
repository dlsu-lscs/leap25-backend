import { Router } from 'express';
import {
  handleEventMediaContentfulWebhook,
  deleteEventMediaContentfulController,
} from '../controllers/media.controller';

const router = Router();

router.post('/event', handleEventMediaContentfulWebhook);
router.post('/event/delete', deleteEventMediaContentfulController);

export default router;
