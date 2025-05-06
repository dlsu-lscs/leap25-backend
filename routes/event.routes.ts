import { Router } from 'express';
import * as eventController from '../controllers/event.controller';

const router = Router();

router.post('/', eventController.createEvent);
router.post('/contentful', eventController.createEventContentful);
router.get('/', eventController.getAllEvents);
router.get('/:id/media', eventController.getEventMedia);
router.get('/:id', eventController.getEventByID);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

export default router;
