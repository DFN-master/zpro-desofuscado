import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as GroupLinkListController from '../controllers/GroupLinkListControllerZPRO';

const groupLinkListRoutes: Router = Router();

// Rotas para gerenciamento de links de grupos
groupLinkListRoutes.get('/groupLinkList', isAuthZPRO, GroupLinkListController.index);

groupLinkListRoutes.get('/groupLinkList', GroupLinkListController.show);

groupLinkListRoutes.get('/groupLinkList/:groupId', isAuthZPRO, GroupLinkListController.ListAll);

groupLinkListRoutes.post('/groupLinkList', isAuthZPRO, GroupLinkListController.store);

groupLinkListRoutes.put('/groupLinkList/:groupId', isAuthZPRO, GroupLinkListController.update);

groupLinkListRoutes.delete('/groupLinkList/:groupId', isAuthZPRO, GroupLinkListController.remove);

groupLinkListRoutes.delete('/groupLinkList', isAuthZPRO, GroupLinkListController.removeAll);

export default groupLinkListRoutes; 