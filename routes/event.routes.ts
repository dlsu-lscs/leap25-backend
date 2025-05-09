import { Router } from 'express';
import * as eventController from '../controllers/event.controller';

const router = Router();

router.post('/', eventController.createEvent);
router.post('/contentful', eventController.handleEventContentfulWebhook);
router.delete('/contentful', eventController.deleteEventContentful);
router.get('/', eventController.getAllEvents);
router.get('/:id/media', eventController.getEventMedia);
router.get('/:id', eventController.getEventByID);
router.post('/subtheme', eventController.getEventBySubtheme);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

router.get('/:eventId/slots', eventController.getEventSlots);

export default router;
