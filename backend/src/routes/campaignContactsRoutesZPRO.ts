import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as CampaignContactsController from '../controllers/CampaignContactsControllerZPRO';

const campaignContactsRoutes = Router();

// Rotas para gerenciamento de contatos de campanha
campaignContactsRoutes.post(
  '/campaigns/:campaignId/contacts/',
  isAuthZPRO,
  CampaignContactsController.create
);

campaignContactsRoutes.get(
  '/campaigns/:campaignId/contacts/',
  isAuthZPRO,
  CampaignContactsController.index
);

campaignContactsRoutes.delete(
  '/campaigns/:campaignId/contacts/:contactId',
  isAuthZPRO,
  CampaignContactsController.remove
);

campaignContactsRoutes.delete(
  '/campaigns/deleteall/:campaignId/contacts/',
  isAuthZPRO,
  CampaignContactsController.removeAll
);

export default campaignContactsRoutes; 