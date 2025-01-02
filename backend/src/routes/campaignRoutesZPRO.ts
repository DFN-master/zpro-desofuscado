import { Router } from 'express';
import multer from 'multer';
import isAuthZPRO from '../middleware/isAuthZPRO';
import uploadConfig from '../config/uploadZPRO';
import * as CampaignController from '../controllers/CampaignControllerZPRO';

const campaignsRoutes = Router();
const upload = multer(uploadConfig);

// Rotas para gerenciamento de campanhas
campaignsRoutes.post(
  '/campaigns',
  isAuthZPRO,
  upload.array('medias'),
  CampaignController.store
);

campaignsRoutes.get(
  '/campaigns',
  isAuthZPRO,
  CampaignController.index
);

campaignsRoutes.put(
  '/campaigns/:campaignId',
  isAuthZPRO,
  upload.array('medias'),
  CampaignController.update
);

campaignsRoutes.delete(
  '/campaigns/:campaignId',
  isAuthZPRO,
  CampaignController.remove
);

campaignsRoutes.post(
  '/campaigns/start/:campaignId',
  isAuthZPRO,
  CampaignController.startCampaign
);

campaignsRoutes.post(
  '/campaigns/cancel/:campaignId',
  isAuthZPRO,
  CampaignController.cancelCampaign
);

export default campaignsRoutes; 