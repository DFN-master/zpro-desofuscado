import express, { Router } from 'express';
import multer from 'multer';
import isAuthZPRO from '../middleware/isAuthZPRO';
import uploadConfig from '../config/uploadZPRO';
import * as BulkServiceController from '../controllers/BulkServiceControllerZPRO';

interface MulterConfig {
  limits: {
    files: number;
    fileSize: number;
  };
}

const multerConfig: MulterConfig = {
  limits: {
    files: 1,
    fileSize: 1024 * 1024 * 100 // 100MB
  }
};

const upload = multer({
  ...uploadConfig.default,
  ...multerConfig
});

const bulkRoutes: Router = Router();

// Bulk message routes
bulkRoutes.post(
  '/bulk',
  isAuthZPRO,
  upload.single('medias'),
  BulkServiceController.bulkSendMessage
);

bulkRoutes.post(
  '/bulkVariable',
  isAuthZPRO,
  upload.single('medias'),
  BulkServiceController.bulkSendMessageWithVariable
);

bulkRoutes.post(
  '/noRedis',
  isAuthZPRO,
  upload.array('medias'),
  BulkServiceController.noRedis
);

bulkRoutes.post(
  '/sendButton',
  isAuthZPRO,
  upload.single('medias'),
  BulkServiceController.sendButton
);

bulkRoutes.post(
  '/individual',
  isAuthZPRO,
  upload.single('medias'),
  BulkServiceController.individual
);

bulkRoutes.post(
  '/bulkClosing',
  isAuthZPRO,
  upload.single('medias'),
  BulkServiceController.bulkFastMessage
);

export default bulkRoutes; 