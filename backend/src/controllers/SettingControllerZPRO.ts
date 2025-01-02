import { Request, Response } from 'express';
import { getIO } from '../libs/socket';
import AppError from '../errors/AppErrorZPRO';
import UpdateSettingService from '../services/UpdateSettingServiceZPRO';
import ShowSettingService from '../services/ShowSettingServiceZPRO';
import ListSettingsService from '../services/ListSettingsServiceZPRO';
import UpdateDefaultAllChatGptStatus from '../services/UpdateDefaultAllChatGptStatusZPRO';
import UpdateDefaultAllTypebotStatus from '../services/UpdateDefaultAllTypebotStatusZPRO';
import UpdateDefaultAllDialogFlowStatus from '../services/UpdateDefaultAllDialogFlowStatusZPRO';
import UpdateDefaultAllN8NStatus from '../services/UpdateDefaultAllN8NStatusZPRO';
import UpdateDefaultAllDifyStatus from '../services/UpdateDefaultAllDifyStatusZPRO';

interface SettingData {
  key: string;
  value: string;
  tenantId: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const settings = await ListSettingsService(tenantId);
  return res.status(200).json(settings);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { settingKey } = req.params;

  const setting = await ShowSettingService({
    key: settingKey,
    tenantId
  });

  return res.status(200).json(setting);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (
    req.user.profile !== 'admin' &&
    req.user.profile !== 'superadmin' &&
    req.user.profile !== 'supervisor'
  ) {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const { value, key } = req.body;

  const settingData: SettingData = {
    key,
    value,
    tenantId
  };

  const setting = await UpdateSettingService(settingData);

  // Atualizar status do ChatGPT
  if (key === 'chatgptAllTickets') {
    const newStatus = value === 'enabled';
    if (value === 'enabled' || value === 'disabled') {
      await UpdateDefaultAllChatGptStatus({
        tenantId,
        newDefaultValue: newStatus
      });
    }
  }

  // Atualizar status do Typebot
  if (key === 'typebotAllTickets') {
    const newStatus = value === 'enabled';
    if (value === 'enabled' || value === 'disabled') {
      await UpdateDefaultAllTypebotStatus({
        tenantId,
        newDefaultValue: newStatus
      });
    }
  }

  // Atualizar status do DialogFlow
  if (key === 'dialogflowAllTickets') {
    const newStatus = value === 'enabled';
    if (value === 'enabled' || value === 'disabled') {
      await UpdateDefaultAllDialogFlowStatus({
        tenantId,
        newDefaultValue: newStatus
      });
    }
  }

  // Atualizar status do N8N
  if (key === 'n8nAllTickets') {
    const newStatus = value === 'enabled';
    if (value === 'enabled' || value === 'disabled') {
      await UpdateDefaultAllN8NStatus({
        tenantId,
        newDefaultValue: newStatus
      });
    }
  }

  // Atualizar status do Dify
  if (key === 'difyAllTickets') {
    const newStatus = value === 'enabled';
    if (value === 'enabled' || value === 'disabled') {
      await UpdateDefaultAllDifyStatus({
        tenantId,
        newDefaultValue: newStatus
      });
    }
  }

  const io = getIO();
  io.emit(`${tenantId}:settings`, {
    action: 'update',
    setting
  });

  return res.status(200).json(setting);
}; 