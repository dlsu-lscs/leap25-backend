import { Router } from 'express';
import * as subthemeController from '../controllers/subtheme.controller';

const router = Router();

router.post('/', subthemeController.createSubtheme);
router.post('/contentful', subthemeController.handleSubthemeContentfulWebhook);
router.post('/contentful/delete', subthemeController.deleteSubthemeContentful);
router.get('/', subthemeController.getAllSubthemes);
router.get('/:id', subthemeController.getSubthemeById);
router.put('/:id', subthemeController.updateSubtheme);
router.delete('/:id', subthemeController.deleteSubtheme);

export default router;
