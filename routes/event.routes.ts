import { Router } from 'express';
import * as eventController from '../controllers/event.controller';

const router = Router();

router.post('/', eventController.createEvent);
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventByID);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

router.get('/:eventId/slots', eventController.getEventSlots);

export default router;
