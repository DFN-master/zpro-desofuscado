import express, { Router } from 'express';
import uploadConfig from '../config/uploadZPRO';
import * as MessageController from '../controllers/MessageHubControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';
import multer from 'multer';

const hubMessageRoutes: Router = Router();
const upload = multer(uploadConfig);

// Rota para mensagens do hub com autenticação e upload de mídia
hubMessageRoutes.post(
  '/hub-message/:ticketId',
  isAuthZPRO,
  upload.array('medias'),
  MessageController.send
);

export default hubMessageRoutes; 