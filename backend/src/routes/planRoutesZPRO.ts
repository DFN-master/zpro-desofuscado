import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as PlanController from '../controllers/PlanControllerZPRO';

const planRoutes: Router = Router();

// Rotas públicas
planRoutes.get('/plan', PlanController.index);
planRoutes.get('/plan/:planId', PlanController.show);

// Rotas protegidas que requerem autenticação
planRoutes.post('/plan', isAuthZPRO, PlanController.store);
planRoutes.put('/plan/:planId', isAuthZPRO, PlanController.update);
planRoutes.delete('/plan/:planId', isAuthZPRO, PlanController.remove);
planRoutes.delete('/planAll', isAuthZPRO, PlanController.removeAll);

export default planRoutes; 