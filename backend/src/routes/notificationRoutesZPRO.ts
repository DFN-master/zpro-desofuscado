import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as NotificationController from '../controllers/NotificationControllerZPRO';

const notificationRoutes: Router = Router();

// Rotas para notificações
notificationRoutes.get('/notifications', isAuthZPRO, NotificationController.index);

notificationRoutes.get('/notifications/:id', isAuthZPRO, NotificationController.show);

notificationRoutes.post('/notifications', NotificationController.store);

notificationRoutes.post('/notifications', isAuthZPRO, NotificationController.storeN);

notificationRoutes.put('/notifications/:id', isAuthZPRO, NotificationController.update);

notificationRoutes.delete('/notifications/:id', isAuthZPRO, NotificationController.remove);

notificationRoutes.delete('/notifications', isAuthZPRO, NotificationController.removeAll);

export default notificationRoutes; 