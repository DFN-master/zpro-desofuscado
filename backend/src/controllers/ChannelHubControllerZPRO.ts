import { Request, Response } from 'express';
import CreateChannelsService from '../services/CreateChannelsServiceZPRO';
import { getIO } from '../libs/socketZPRO';
import ListChannels from '../services/ListChannelsZPRO';
import { setChannelWebhook } from '../services/SetChannelWebhookZPRO';
import Tenant from '../models/TenantZPRO';
import ListWhatsAppsService from '../services/Whatsapps/ListWhatsAppsServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface StoreChannelData {
  channels: Channel[];
}

interface Channel {
  id: number;
  name: string;
  status: string;
  number: string;
  tenantId: number;
  wabaId?: string;
  profilePic?: string;
  isDefault: boolean;
  [key: string]: any;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { channels = [] } = req.body as StoreChannelData;
  const tenantId = Number(req.user.tenantId);

  const whatsapps = await ListWhatsAppsService(tenantId);
  const tenant = await Tenant.findByPk(tenantId);

  if (
    tenant?.maxConnections &&
    whatsapps.length >= tenant.maxConnections
  ) {
    throw new AppError('ERR_NO_PERMISSION_CONNECTIONS_LIMIT', 403);
  }

  const { whatsapps: createdWhatsapps } = await CreateChannelsService({
    tenantId,
    channels
  });

  createdWhatsapps.forEach(whatsapp => {
    setTimeout(() => {
      const channelData = {
        name: whatsapp.name,
        status: whatsapp.status,
        number: whatsapp.number,
        tenantId: whatsapp.tenantId,
        wabaId: whatsapp.wabaId,
        type: whatsapp.type,
        profilePic: whatsapp.profilePic,
        isDefault: whatsapp.isDefault,
        session: whatsapp.wabaId
      };

      setChannelWebhook(channelData, whatsapp.id.toString());
    }, 3000);
  });

  const io = getIO();

  createdWhatsapps.forEach(whatsapp => {
    io.emit(`${tenantId}:whatsappSession`, {
      action: 'readySession',
      session: whatsapp
    });
  });

  return res.status(200).json(createdWhatsapps);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  try {
    const channels = await ListChannels(tenantId.toString());
    return res.status(200).json(channels);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const setHubAgain = async (req: Request, res: Response): Promise<Response> => {
  const channel = req.body;
  const tenantId = Number(req.user.tenantId);

  setChannelWebhook(channel, channel.id.toString());

  const io = getIO();
  io.emit(`${tenantId}:whatsappSession`, {
    action: 'readySession',
    whatsapp: channel
  });

  return res.status(200).json(channel);
}; 