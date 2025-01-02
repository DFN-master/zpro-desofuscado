import { Request, Response } from 'express';
import { getIO } from '../libs/socketZPRO';
import AdminListChatFlowService from '../services/AdminServices/AdminListChatFlowServiceZPRO';
import AdminListSettingsService from '../services/AdminServices/AdminListSettingsServiceZPRO';
import AdminListTenantsService from '../services/AdminServices/AdminListTenantsServiceZPRO';
import AdminListUsersService from '../services/AdminServices/AdminListUsersServiceZPRO';
import AdminListChannelsService from '../services/AdminServices/AdminListChannelsServiceZPRO';
import AdminUpdateUserService from '../services/AdminServices/AdminUpdateUserServiceZPRO';
import UpdateSettingService from '../services/SettingService/UpdateSettingServiceZPRO';
import CreateWhatsAppService from '../services/Whatsapp/Service/CreateWhatsAppServiceZPRO';

interface IndexUsersQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface UpdateUserData {
  userId: number;
  userData: any;
}

interface ChannelData {
  name: string;
  status: string;
  tenantId: number;
  tokenTelegram?: string;
  instagramUser?: string;
  instagramKey?: string;
  type: string;
  wabaBSP?: string;
  tokenAPI?: string;
}

export const indexUsers = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexUsersQuery;
  
  const { users, count, hasMore } = await AdminListUsersService({
    searchParam,
    pageNumber
  });

  return res.status(200).json({ users, count, hasMore });
};

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const userData = req.body;
  const { userId } = req.params;

  const user = await AdminUpdateUserService({ 
    userData,
    userId: Number(userId)
  });

  const io = getIO();
  
  if (user) {
    io.emit(`${user.tenantId}:user`, {
      action: "update",
      user
    });
  }

  return res.status(200).json(user);
};

export const indexTenants = async (req: Request, res: Response): Promise<Response> => {
  const tenants = await AdminListTenantsService();
  return res.status(200).json(tenants);
};

export const indexChatFlow = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.params;
  const chatFlow = await AdminListChatFlowService({ tenantId: Number(tenantId) });
  return res.status(200).json(chatFlow);
};

export const indexSettings = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.params;
  const settings = await AdminListSettingsService(Number(tenantId));
  return res.status(200).json(settings);
};

export const updateSettings = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.params;
  const { value, key } = req.body;

  const setting = await UpdateSettingService({
    key,
    value,
    tenantId: Number(tenantId)
  });

  const io = getIO();
  io.emit(`${tenantId}:settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};

export const indexChannels = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.query;
  const channels = await AdminListChannelsService({ tenantId: Number(tenantId) });
  return res.status(200).json(channels);
};

export const storeChannel = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    tenantId,
    tokenTelegram,
    instagramUser,
    instagramKey,
    type,
    wabaBSP,
    tokenAPI
  } = req.body;

  const channelData: ChannelData = {
    name,
    status: "DISCONNECTED",
    tenantId,
    tokenTelegram,
    instagramUser,
    instagramKey,
    type,
    wabaBSP,
    tokenAPI
  };

  const channel = await CreateWhatsAppService(channelData);
  return res.status(200).json(channel);
}; 