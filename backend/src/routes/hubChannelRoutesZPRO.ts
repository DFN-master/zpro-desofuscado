import express, { Router } from 'express';
import * as ChannelController from '../controllers/ChannelHubControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';

const hubChannelRoutes: Router = Router();

// Rota para armazenar canal
hubChannelRoutes.post('/hub-channel/', isAuthZPRO, ChannelController.store);

// Rota para obter canal
hubChannelRoutes.get('/hub-channel/', isAuthZPRO, ChannelController.index);

// Rota para reconfigurar hub
hubChannelRoutes.post('/hub-channel-setagain/', isAuthZPRO, ChannelController.setHubAgain);

export default hubChannelRoutes; 