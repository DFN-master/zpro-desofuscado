import express, { Router } from 'express';
import uploadConfig from '../config/uploadZPRO';
import * as MessageController from '../controllers/MessageControllerZPRO';
import isAuth from '../middleware/isAuthZPRO';
import multer from 'multer';

const meowMessageRoutes: Router = express.Router();
const upload = multer(uploadConfig);

// Rotas para mensagens
meowMessageRoutes.post(
  '/meow-message/:ticketId',
  isAuth,
  upload.array('medias'),
  MessageController.send
);

meowMessageRoutes.post(
  '/meow-reaction/:ticketId',
  isAuth,
  MessageController.reaction
);

meowMessageRoutes.post(
  '/meow-edit/:ticketId',
  isAuth,
  MessageController.edition
);

export default meowMessageRoutes; 