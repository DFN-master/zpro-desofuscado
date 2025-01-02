import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as APIConfigController from '../controllers/APIConfigControllerZPRO';

const apiConfigRoutes: Router = Router();

// Rotas para configuração da API
apiConfigRoutes.get(
  '/api-config',
  isAuthZPRO,
  APIConfigController.index
);

apiConfigRoutes.post(
  '/api-config',
  isAuthZPRO,
  APIConfigController.store
);

apiConfigRoutes.put(
  '/api-config/:apiId',
  isAuthZPRO,
  APIConfigController.update
);

apiConfigRoutes.delete(
  '/api-config/:apiId',
  isAuthZPRO,
  APIConfigController.remove
);

apiConfigRoutes.put(
  '/api-config/renew-token/:apiId',
  isAuthZPRO,
  APIConfigController.renewToken
);

export default apiConfigRoutes; 