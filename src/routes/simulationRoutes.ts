import { Router } from 'express';
import { SimulationController } from '../controllers/simulationController';

const router = Router();

// Public routes - no authentication required
router.post('/', SimulationController.calculateROI);
router.post('/compare', SimulationController.compareScenarios);

export default router;
