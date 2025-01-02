import express, { Router } from 'express';
import * as TenantController from '../controllers/TenantControllerZPRO';
import * as UserController from '../controllers/UserControllerZPRO';

const publicRoutes: Router = Router();

// Rotas públicas do sistema
publicRoutes.get(
  '/publicSystemColors/',
  TenantController.showPublicSystemColors
);

publicRoutes.post(
  '/password-reset',
  UserController.requestPasswordReset
);

publicRoutes.post(
  '/reset-password',
  UserController.resetPassword
);

export default publicRoutes; 