import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as BanListController from '../controllers/BanListControllerZPRO';

const banListRoutes: Router = Router();

// Rotas para gerenciamento de listas de banimento
banListRoutes.get('/banList', isAuthZPRO, BanListController.index);

banListRoutes.get('/banList/:banListId', isAuthZPRO, BanListController.show);

banListRoutes.post('/banList', isAuthZPRO, BanListController.store);

banListRoutes.put('/banList/:banListId', isAuthZPRO, BanListController.update);

banListRoutes.delete('/banList/:banListId', isAuthZPRO, BanListController.remove);

banListRoutes.delete('/banListAll', isAuthZPRO, BanListController.removeAll);

export default banListRoutes; 