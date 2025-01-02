import express, { Router } from 'express';
import multer from 'multer';
import isAPIAuthZPRO from '../middleware/isAPIAuthZPRO';
import isAPIAuthParamsZPRO from '../middleware/isAPIAuthParamsZPRO';
import { uploadConfig } from '../config/upload';
import * as APIExternalController from '../controllers/APIExternalControllerZPRO';

const apiExternalRoute = Router();

// Configuração do Multer
const multerConfig = {
  ...uploadConfig,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
};

const upload = multer(multerConfig);

// Rotas de Media
apiExternalRoute.post('/v2/api/external/:apiId/create', isAPIAuthZPRO, upload.single('media'), APIExternalController.sendMediaUrlAPI);
apiExternalRoute.post('/v2/api/external/:apiId/url', isAPIAuthZPRO, upload.single('media'), APIExternalController.createContact);
apiExternalRoute.post('/v2/api/external/:apiId/disconnect/queue', isAPIAuthZPRO, APIExternalController.createSession);

// Rotas de Parâmetros
apiExternalRoute.get('/v2/api/external/:apiId/params', isAPIAuthParamsZPRO, APIExternalController.sendMediaBase64API);

// Rotas de Sessão
apiExternalRoute.post('/v2/api/external/:apiId/base64', isAPIAuthZPRO, upload.single('media'), APIExternalController.updateQueue);
apiExternalRoute.post('/v2/api/external/:apiId/voice', isAPIAuthZPRO, upload.single('media'), APIExternalController.sendAudioAPI);
apiExternalRoute.post('/v2/api/external/:apiId/qrCode', isAPIAuthZPRO, APIExternalController.qrCodeSession);

// Rotas de Ticket
apiExternalRoute.post('/v2/api/external/:apiId/updateTag', isAPIAuthZPRO, APIExternalController.updateTag);
apiExternalRoute.post('/v2/api/external/:apiId/updateTicket', isAPIAuthZPRO, APIExternalController.updateTicketInfo);
apiExternalRoute.post('/v2/api/external/:apiId/updateContact', isAPIAuthZPRO, APIExternalController.updateContact);

// Rotas de Mensagens
apiExternalRoute.post('/v2/api/external/:apiId/showAllMessages', isAPIAuthZPRO, APIExternalController.showAllMessages);
apiExternalRoute.post('/v2/api/external/:apiId/showAllTicket', isAPIAuthZPRO, APIExternalController.showAllTicket);
apiExternalRoute.post('/v2/api/external/:apiId/showChannel', isAPIAuthZPRO, APIExternalController.showChannel);

// Rotas de Chatbot
apiExternalRoute.post('/v2/api/external/:apiId/ticketchatbot', isAPIAuthZPRO, upload.single('media'), APIExternalController.createTicket);
apiExternalRoute.post('/v2/api/external/:apiId/Notes', isAPIAuthZPRO, APIExternalController.createNoteSession);
apiExternalRoute.post('/v2/api/external/:apiId/Contact', isAPIAuthZPRO, APIExternalController.updateTicketContact);

// Rotas de Grupo
apiExternalRoute.post('/v2/api/external/:apiId/groupMessages', isAPIAuthZPRO, APIExternalController.showTicket);
apiExternalRoute.post('/v2/api/external/:apiId/group', isAPIAuthZPRO, APIExternalController.sendGroupMessage);

// Rotas de Sessão
apiExternalRoute.post('/v2/api/external/:apiId/startSession', isAPIAuthZPRO, APIExternalController.startSession);
apiExternalRoute.post('/v2/api/external/:apiId/deleteSession', isAPIAuthZPRO, APIExternalController.deleteSession);
apiExternalRoute.post('/v2/api/external/:apiId/showticket', isAPIAuthZPRO, APIExternalController.disconnectSession);

export default apiExternalRoute; 