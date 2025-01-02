import express, { Router } from 'express';
import isAuth from '../middleware/isAuthZPRO';
import rateLimit from 'express-rate-limit';
import AppError from '../errors/AppErrorZPRO';
import * as TenantController from '../controllers/TenantController';

const tenantRoutes: Router = Router();

// Configuração do rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  handler: (_req, _res, next) => {
    next(new AppError('ERR_LIMIT_REACHED', 429));
  }
});

// Rotas GET
tenantRoutes.get('/tenants', isAuth, TenantController.index);
tenantRoutes.get('/tenants/:tenantId', isAuth, TenantController.show);
tenantRoutes.get('/tenants/business-hours/:tenantId', isAuth, TenantController.showBusinessHours);
tenantRoutes.get('/tenantsShowChatbot/:tenantId', isAuth, TenantController.showChatbot);
tenantRoutes.get('/tenantsNoRetries/:tenantId', isAuth, TenantController.showNoRetries);
tenantRoutes.get('/tenantsMessage/:tenantId', isAuth, TenantController.showMessage);
tenantRoutes.get('/tenantsNoRetries/list/:tenantId', isAuth, TenantController.indexNoRetries);
tenantRoutes.get('/ratings', isAuth, TenantController.indexRating);

// Rotas POST
tenantRoutes.post('/tenants/message-business-hours', isAuth, TenantController.store);
tenantRoutes.post('/tenants/message-business-hours/update', isAuth, TenantController.updateBusinessHours);
tenantRoutes.post('/tenantsMaxConnections/update', isAuth, TenantController.updateMaxConnections);
tenantRoutes.post('/tenants/message-business-hours/:tenantId', isAuth, TenantController.indexBusinessHoursAndMessage);
tenantRoutes.post('/tenants/login', isAuth, loginLimiter, TenantController.updateEmail);
tenantRoutes.post('/tenantsUpdateNames/:tenantId', isAuth, TenantController.updateNames);
tenantRoutes.post('/tenantsUpdateAsaas/:tenantId', isAuth, TenantController.updateAsaasToken);
tenantRoutes.post('/tenantsHubToken/:tenantId', isAuth, TenantController.updateHubToken);
tenantRoutes.post('/tenantsWuzapiHost/:tenantId', isAuth, TenantController.updateWuzapiHost);
tenantRoutes.post('/tenantsAcceptTerms/:tenantId', isAuth, TenantController.updateAcceptTerms);
tenantRoutes.post('/tenantsMetaUpdate/:tenantId', isAuth, TenantController.updateMetaUpdate);
tenantRoutes.post('/tenantsForceAdmin/:tenantId', isAuth, TenantController.updateForceAdmin);
tenantRoutes.post('/tenantsFixConnections/:tenantId', isAuth, TenantController.updateFixConnections);
tenantRoutes.post('/tenantsGroupTickets/:tenantId', isAuth, TenantController.updateGroupTickets);
tenantRoutes.post('/tenantsSMSToken/:tenantId', isAuth, TenantController.updateSMSToken);
tenantRoutes.post('/tenantsSystemColors/:tenantId', isAuth, TenantController.updateSystemColors);
tenantRoutes.post('/tenantsTicketLimit/:tenantId', isAuth, TenantController.updateTicketLimit);
tenantRoutes.post('/tenantsValidLicense/:tenantId', isAuth, TenantController.updateValidLicense);

// Rotas PUT
tenantRoutes.put('/tenantsMessage/:tenantId', isAuth, TenantController.update);
tenantRoutes.put('/tenants/message-business-hours/:tenantId', isAuth, TenantController.indexValidBusinessHours);
tenantRoutes.put('/tenantsEmail/:tenantId', isAuth, TenantController.indexEnv);
tenantRoutes.put('/tenantsAsaas/:tenantId', isAuth, TenantController.indexAsaas);
tenantRoutes.put('/tenants/message-business-hours/:tenantId', isAuth, TenantController.indexAllAsaas);
tenantRoutes.put('/tenantsServiceTransfer/:tenantId', isAuth, TenantController.updateServiceTransfer);
tenantRoutes.put('/tenantsEmail/:tenantId', isAuth, TenantController.updateEmailing);
tenantRoutes.put('/tenantsAsaas/:tenantId', isAuth, TenantController.updateAsaas);

// Rotas DELETE
tenantRoutes.delete('/tenantsMessage/:tenantId', isAuth, TenantController.remove);

export default tenantRoutes; 