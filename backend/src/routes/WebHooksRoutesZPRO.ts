import express, { Router } from 'express';
import * as HooksController from '../controllers/WebHooksControllerZPRO';

const webHooksRoutes: Router = express.Router();

// Rota para webhooks do WhatsApp
webHooksRoutes.post('/wabahooks/:token', HooksController.ReceivedRequestMessenger);

// Rotas para webhooks do Facebook Messenger
webHooksRoutes.get('/fb-messenger-hooks/:token', HooksController.CheckServiceMessenger);
webHooksRoutes.post('/fb-messenger-hooks/:token', HooksController.ReceivedRequest360);

export default webHooksRoutes; 