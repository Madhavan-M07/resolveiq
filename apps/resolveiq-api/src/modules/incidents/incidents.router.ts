import { Router } from 'express';
import { IncidentController } from './incidents.controller';

const router = Router();
const controller = new IncidentController();

// ----------------------------------------------------------------------------
// Incident REST Routes
// ----------------------------------------------------------------------------
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.patch('/:id/status', controller.updateStatus);

// ----------------------------------------------------------------------------
// Human-in-the-Loop Remediation Routes
// ----------------------------------------------------------------------------
router.post('/:id/remediation/approve', controller.approveRemediation);
router.post('/:id/remediation/execute', controller.executeRemediation);

export default router;
