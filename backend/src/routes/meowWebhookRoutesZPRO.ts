import express, { Router } from 'express';
import uploadConfig from '../config/uploadZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as WebhookController from '../controllers/WebhookMeowControllerZPRO';
import multer from 'multer';
import isAuthLocal from '../middleware/isAuthLocal';

const meowWebhookRoutes: Router = Router();
const upload = multer(uploadConfig);

// Rotas para webhooks Meow
meowWebhookRoutes.post(
  '/meow-webhook/:wabaId',
  isAuthLocal,
  upload.any(),
  WebhookController.listen
);

meowWebhookRoutes.get(
  '/meow-qrcode/:wabaId',
  isAuthZPRO,
  WebhookController.fetchQrCode
);

export default meowWebhookRoutes; 