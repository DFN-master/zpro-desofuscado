import express, { Router } from 'express';
import * as BullQueueController from '../controllers/BullQueueControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';

const bullQueueRouter: Router = express.Router();

// Rota para obter estatísticas da fila
bullQueueRouter.get(
  '/bullqueues',
  isAuthZPRO,
  BullQueueController.getQueueStats
);

// Rota para reprocessar jobs
bullQueueRouter.post(
  '/bullqueues/:queueName/reprocess',
  isAuthZPRO,
  BullQueueController.reprocessFailedJobs
);

// Rota para reiniciar processo
bullQueueRouter.post(
  '/bullqueues/restart-process',
  isAuthZPRO,
  BullQueueController.restartProcessJobs
);

export default bullQueueRouter; 