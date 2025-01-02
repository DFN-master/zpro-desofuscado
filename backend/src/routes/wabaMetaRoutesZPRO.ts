import express, { Router } from 'express';
import uploadConfig from '../config/uploadZPRO';
import multer from 'multer';
import isAuth from '../middleware/isAuthZPRO';
import * as WABAMetaController from '../controllers/WABAMetaControllerZPRO';

const wabaMetaRoutes: Router = express.Router();
const upload = multer(uploadConfig);

// Rotas para mensagens e templates
wabaMetaRoutes.get(
  '/wabametaTemplate/:tokenApi',
  isAuth,
  WABAMetaController.verifyPhone
);

wabaMetaRoutes.post(
  '/wabametaText/',
  isAuth,
  WABAMetaController.sendTemplateMessage
);

wabaMetaRoutes.post(
  '/wabametaList/',
  isAuth,
  WABAMetaController.sendTemplateMessageComponents
);

wabaMetaRoutes.post(
  '/wabametaTemplateComponents/',
  isAuth,
  WABAMetaController.showTemplateMessageComponent
);

wabaMetaRoutes.post(
  '/wabametaText/schedule',
  isAuth,
  WABAMetaController.sendTemplateMessageSchedule
);

// Rotas para botões e interações
wabaMetaRoutes.post(
  '/wabametaButton/',
  isAuth,
  WABAMetaController.sendButton
);

wabaMetaRoutes.post(
  '/wabametaList',
  isAuth,
  WABAMetaController.sendList
);

wabaMetaRoutes.post(
  '/wabametaReaction/',
  isAuth,
  WABAMetaController.sendReaction
);

// Rotas para envio de arquivos
wabaMetaRoutes.post(
  '/wabametaBulkTemplate/',
  isAuth,
  WABAMetaController.sendBulkTemplate
);

wabaMetaRoutes.post(
  '/wabametaFileUrl/',
  isAuth,
  WABAMetaController.sendFileUrl
);

wabaMetaRoutes.post(
  '/wabametaFile/',
  isAuth,
  upload.array('medias'),
  WABAMetaController.sendFile
);

wabaMetaRoutes.post(
  '/wabametaSticker/',
  isAuth,
  upload.array('medias'),
  WABAMetaController.sendSticker
);

wabaMetaRoutes.post(
  '/wabametaFile/',
  isAuth,
  WABAMetaController.sendFileUrl
);

export default wabaMetaRoutes; 