import express, { Router } from 'express';
import * as AdminController from '../controllers/AdminController';
import isAuthAdminZPRO from '../middleware/isAuthAdminZPRO';

const adminRoutes: Router = express.Router();

// Rotas de usuários
adminRoutes.get('/admin/users', isAuthAdminZPRO, AdminController.indexUsers);
adminRoutes.put('/admin/users/:userId', isAuthAdminZPRO, AdminController.updateUser);

// Rotas de tenants
adminRoutes.get('/admin/tenants', isAuthAdminZPRO, AdminController.indexTenants);

// Rotas de chatflow
adminRoutes.get('/admin/chatflow/:tenantId', isAuthAdminZPRO, AdminController.indexChatFlow);
adminRoutes.put('/admin/settings/:tenantId', isAuthAdminZPRO, AdminController.updateSettings);

// Rotas de canais
adminRoutes.get('/admin/channels', isAuthAdminZPRO, AdminController.indexChannels);
adminRoutes.post('/admin/channels', isAuthAdminZPRO, AdminController.storeChannel);

export default adminRoutes; 