import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as UserController from '../controllers/UserControllerZPRO';

const userRoutes = Router();

// Rotas de usuários
userRoutes.get('/users', isAuthZPRO, UserController.index);
userRoutes.get('/users/:userId', isAuthZPRO, UserController.showTenant);
userRoutes.post('/users', isAuthZPRO, UserController.store);
userRoutes.post('/usersn', UserController.storeN);
userRoutes.post('/usersTenant', UserController.storeTenantN);

// Rotas de atualização
userRoutes.put('/users/:userId', isAuthZPRO, UserController.update);
userRoutes.put('/users/chat-privado/:userId', isAuthZPRO, UserController.updatePrivateChat);
userRoutes.put('/users/:userId/configs', isAuthZPRO, UserController.updateConfigs);

// Rotas de consulta
userRoutes.get('/users/:userId', isAuthZPRO, UserController.show);
userRoutes.delete('/users/:userId', isAuthZPRO, UserController.remove);
userRoutes.get('/users/grupo-privado/line/:userId', isAuthZPRO, UserController.showGroupsMessages);

// Rotas de tenant
userRoutes.get('/usersTenants', isAuthZPRO, UserController.indexTenant);
userRoutes.post('/usersTenants', isAuthZPRO, UserController.storeTenant);
userRoutes.put('/usersTenants/:userId', isAuthZPRO, UserController.updateTenant);
userRoutes.put('/usersTenants/:userId/configs', isAuthZPRO, UserController.updateTenantConfigs);
userRoutes.get('/usersTenants/:userId', isAuthZPRO, UserController.showTenant);
userRoutes.delete('/usersTenants/:userId', isAuthZPRO, UserController.removeTenant);

export default userRoutes; 