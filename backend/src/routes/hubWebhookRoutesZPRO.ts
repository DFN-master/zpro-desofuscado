import express, { Router } from 'express';
import uploadConfig from '../config/uploadZPRO';
import * as WebhookController from '../controllers/WebhookHubControllerZPRO';
import multer from 'multer';

const hubWebhookRoutes: Router = express.Router();

// Configuração do multer para upload de arquivos
const upload = multer(uploadConfig);

// Rota para webhook
hubWebhookRoutes.post(
  '/hub-webhook/:wabaId',
  upload.array('medias'),
  WebhookController.listen
);

export default hubWebhookRoutes; 