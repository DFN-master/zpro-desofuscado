import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as QueueController from '../controllers/QueueController';

const queueRoutes: Router = Router();

// Rotas para gerenciamento de filas
queueRoutes.get('/queue', isAuthZPRO, QueueController.index);
queueRoutes.post('/queue', isAuthZPRO, QueueController.store);
queueRoutes.put('/queue/:queueId', isAuthZPRO, QueueController.update);
queueRoutes.delete('/queue/:queueId', isAuthZPRO, QueueController.remove);

export default queueRoutes; 