import { Request, Response } from 'express';
import GetTokenAndLinkedPageZPRO from '../services/Facebook/GetTokenAndLinkedPageZPRO';
import SetLogoutLinkedPageZPRO from '../services/Facebook/SetLogoutLinkedPageZPRO';

interface StoreRequestBody {
  whatsapp: string;
  accountId: string;
  userToken: string;
}

interface RequestWithUser extends Request {
  user?: {
    tenantId: string;
  };
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsapp, accountId, userToken } = req.body as StoreRequestBody;
  
  const data = {
    whatsapp,
    accountId,
    userToken,
    tenantId: (req as RequestWithUser).user?.tenantId
  };

  await GetTokenAndLinkedPageZPRO(data);
  return res.status(200).json();
};

export const facebookLogout = async (req: Request, res: Response): Promise<Response> => {
  const whatsapp = req.body;
  
  const data = {
    whatsapp,
    tenantId: (req as RequestWithUser).user?.tenantId
  };

  await SetLogoutLinkedPageZPRO(data);
  return res.status(200).json();
}; 