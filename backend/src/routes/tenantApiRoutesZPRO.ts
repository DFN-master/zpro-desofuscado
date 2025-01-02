import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import isAPITenantAuthZPRO from '../middleware/isAPITenantAuthZPRO';
import * as TenantApiController from '../controllers/TenantApiControllerZPRO';

const tenantApiRoutes: Router = express.Router();

// Rotas básicas de API do tenant
tenantApiRoutes.get('/tenantApi', isAuthZPRO, TenantApiController.index);
tenantApiRoutes.get('/tenantApi/:tenantApiId', isAuthZPRO, TenantApiController.show);
tenantApiRoutes.post('/tenantApi', isAuthZPRO, TenantApiController.store);
tenantApiRoutes.put('/tenantApi/:tenantApiId', isAuthZPRO, TenantApiController.update);
tenantApiRoutes.delete('/tenantApi/:tenantApiId', isAuthZPRO, TenantApiController.remove);
tenantApiRoutes.delete('/tenantApi/removeAll', isAuthZPRO, TenantApiController.removeAll);

// Rotas específicas para operações de tenant
tenantApiRoutes.post('/tenantApi/storeTenant', isAPITenantAuthZPRO, TenantApiController.storeTenant);
tenantApiRoutes.post('/tenantApi/UpdateTenant', isAPITenantAuthZPRO, TenantApiController.updateTenant);
tenantApiRoutes.post('/tenantCreateApi', isAPITenantAuthZPRO, TenantApiController.storeApi);

export default tenantApiRoutes; 