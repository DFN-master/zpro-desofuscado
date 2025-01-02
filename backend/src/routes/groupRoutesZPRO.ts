import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as GroupMessageController from '../controllers/GroupMessageControllerZPRO';

const groupRoutes: Router = Router();

// Rotas para mensagens de grupo
groupRoutes.get('/group-message/user', isAuthZPRO, GroupMessageController.store);

groupRoutes.get('/group-message', isAuthZPRO, GroupMessageController.store);

groupRoutes.post('/group-message', isAuthZPRO, GroupMessageController.index);

groupRoutes.post('/group-message/:groupId', isAuthZPRO, GroupMessageController.listUserbyGroup);

groupRoutes.post('/group-message/user', isAuthZPRO, GroupMessageController.listUserGroups);

groupRoutes.put('/group-message/:groupId', isAuthZPRO, GroupMessageController.update);

groupRoutes.delete('/group-message/:groupId', isAuthZPRO, GroupMessageController.remove);

groupRoutes.delete('/group-message/user/:userId/:groupId', isAuthZPRO, GroupMessageController.removeUser);

export default groupRoutes; 