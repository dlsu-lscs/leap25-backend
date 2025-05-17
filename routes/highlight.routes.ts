import { Router } from 'express';
import * as highlightController from '../controllers/highlight.controller';

const router = Router();

// contentful routes
router.post(
  '/contentful',
  highlightController.handleHighlightContentfulWebhook
);
router.post(
  '/contentful/delete',
  highlightController.deleteHighlightContentful
);

// get routes with suffixes (ft. subtheme)
router.get('/contentful/:id', highlightController.getHighlightByContentfulId);

// generic id routes
router.get('/:id', highlightController.getHighlightById);
router.put('/:id', highlightController.updateHighlight);
router.delete(
  '/:contentful_id',
  highlightController.deleteHighlightByContentfulId
);

// catch all routes
router.post('/', highlightController.createHighlight);
router.get('/', highlightController.getAllHighlights);
