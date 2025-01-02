import { Router } from 'express';
import { restartPM2 } from '../controllers/Pm2ControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';

const router = Router();

router.get('/restart-pm2', isAuthZPRO, restartPM2);

export default router; 