import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as GhostListController from '../controllers/GhostListControllerZPRO';

const ghostListRoutes = Router();

// Rotas para gerenciamento de listas fantasmas
ghostListRoutes.get('/ghostList', isAuthZPRO, GhostListController.index);

ghostListRoutes.get(
  '/ghostList/:ghostListId',
  isAuthZPRO,
  GhostListController.show
);

ghostListRoutes.post('/ghostList', isAuthZPRO, GhostListController.store);

ghostListRoutes.put(
  '/ghostList/:ghostListId',
  isAuthZPRO,
  GhostListController.update
);

ghostListRoutes.delete(
  '/ghostList/:ghostListId',
  isAuthZPRO,
  GhostListController.remove
);

ghostListRoutes.delete(
  '/ghostList/removeAll',
  isAuthZPRO,
  GhostListController.removeAll
);

export default ghostListRoutes; 