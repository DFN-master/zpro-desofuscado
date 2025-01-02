import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import multer from 'multer';
import uploadConfig from '../config/uploadZPRO';
import * as FastReplyController from '../controllers/FastReplyControllerZPRO';

interface MulterConfig {
  limits: {
    fileSize: number;
    files: number;
  };
}

// Configuração do multer para upload de arquivos
const multerConfig: MulterConfig = {
  limits: {
    files: 1,
    fileSize: 1024 * 1024 * 10 // 10MB
  }
};

const upload = multer({
  ...uploadConfig,
  ...multerConfig
});

const fastReplyRoutes: Router = Router();

// Rotas para respostas rápidas
fastReplyRoutes.post(
  '/fastreply',
  isAuthZPRO,
  upload.single('medias'),
  FastReplyController.store
);

fastReplyRoutes.get(
  '/fastreply',
  isAuthZPRO,
  FastReplyController.index
);

fastReplyRoutes.put(
  '/fastreply/:fastReplyId',
  isAuthZPRO,
  upload.single('medias'),
  FastReplyController.update
);

fastReplyRoutes.delete(
  '/fastreply/:fastReplyId',
  isAuthZPRO,
  FastReplyController.remove
);

export default fastReplyRoutes; 