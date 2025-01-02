import { Request, Response } from 'express';
import AppError from '../errors/AppErrorZPRO';
import CreateCampaignContactsService from '../services/CampaignContacts/CreateCampaignContactsServiceZPRO';
import ListCampaignContactsService from '../services/CampaignContacts/ListCampaignContactsServiceZPRO';
import DeleteCampaignContactsService from '../services/CampaignContacts/DeleteCampaignContactsServiceZPRO';
import DeleteAllCampaignContactsService from '../services/CampaignContacts/DeleteAllCampaignContactsServiceZPRO';

interface StoreRequest extends Request {
  files: Express.Multer.File[];
  body: {
    campaignId: number;
  };
  user: {
    tenantId: number | string;
    profile: string;
  };
}

interface IndexRequest extends Request {
  params: {
    campaignId: number;
  };
  user: {
    tenantId: number | string;
  };
}

interface RemoveRequest extends Request {
  params: {
    campaignId: number;
    contactId: number;
  };
  user: {
    tenantId: number | string;
    profile: string;
  };
}

export const store = async (req: StoreRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const files = [...req.files];
  const { campaignId } = req.body;

  const campaignContacts = await CreateCampaignContactsService({
    campaignContacts: files,
    campaignId
  });

  return res.status(200).json(campaignContacts);
};

export const index = async (req: IndexRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { campaignId } = req.params;

  const contacts = await ListCampaignContactsService({
    campaignId,
    tenantId
  });

  return res.status(200).json(contacts);
};

export const remove = async (req: RemoveRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { campaignId, contactId } = req.params;

  await DeleteCampaignContactsService({
    campaignId,
    contactId,
    tenantId
  });

  return res.status(200).json({ message: 'Campagin Contact deleted' });
};

export const removeAll = async (req: RemoveRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { campaignId } = req.params;

  await DeleteAllCampaignContactsService({
    campaignId,
    tenantId
  });

  return res.status(200).json({ message: 'Campagin contacts deleted' });
}; 