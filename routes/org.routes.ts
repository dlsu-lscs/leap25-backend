import { Router } from 'express';
import * as orgController from '../controllers/org.controller';

const router = Router();

router.post('/', orgController.createOrg);
router.post('/contentful', orgController.createOrgContentful);
router.put('/contentful', orgController.updateOrgContentful);
router.get('/', orgController.getAllOrgs);
router.get('/:id', orgController.getOrgById);
router.put('/:id', orgController.updateOrg);
router.delete('/:id', orgController.deleteOrg);

export default router;
