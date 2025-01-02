import express, { Router } from 'express';
import * as AsaasControllerZPRO from '../controllers/AsaasControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';

const asaasRoutes: Router = Router();

// Rotas para clientes
asaasRoutes.post(
  '/asaas/client', 
  AsaasControllerZPRO.createClient
);

// Rotas para assinaturas
asaasRoutes.post(
  '/asaas/subscription', 
  AsaasControllerZPRO.createSubscription
);

asaasRoutes.get(
  '/asaas/client/:clientId',
  isAuthZPRO,
  AsaasControllerZPRO.deleteClient
);

asaasRoutes.put(
  '/asaas/subscription',
  isAuthZPRO,
  AsaasControllerZPRO.listSubscriptions
);

asaasRoutes.delete(
  '/asaas/subscription/:subscriptionId',
  isAuthZPRO,
  AsaasControllerZPRO.deleteSubscription
);

export default asaasRoutes; 