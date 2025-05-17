import { Router } from 'express';
import * as eventController from '../controllers/event.controller';

const router = Router();

// contentful routes
router.post('/contentful', eventController.handleEventContentfulWebhook);

router.post('/contentful/delete', eventController.deleteEventContentful);

// slug based routes
router.get('/slug/:id', eventController.getEventBySlug);

// get routes with suffixes (ft. subtheme)
router.post('/subtheme', eventController.getEventBySubtheme);
router.get('/:id/media', eventController.getEventMedia);
router.get('/:eventId/slots', eventController.getEventSlots);

// generic id routes
router.get('/:id', eventController.getEventByID);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// catch all routes
router.post('/', eventController.createEvent);
router.get('/', eventController.getAllEvents);

export default router;
