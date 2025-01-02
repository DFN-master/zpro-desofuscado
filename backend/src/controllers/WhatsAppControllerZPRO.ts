import { Request, Response } from 'express';
import { getIO } from '../libs/socket';
import { removeWbot, getWbot } from '../libs/wbot';
import { getWbotBaileys } from '../libs/wbot-baileys';
import AppError from '../errors/AppErrorZPRO';
import { transcribeAudioJson } from 'voice-calls-baileys';

import DeleteWhatsAppService from '../services/WhatsappService/DeleteWhatsAppServiceZPRO';
import ListWhatsAppsService from '../services/WhatsappService/ListWhatsAppsServiceZPRO';
import ShowWhatsAppService from '../services/WhatsappService/ShowWhatsAppServiceZPRO';
import UpdateWhatsAppService from '../services/WhatsappService/UpdateWhatsAppServiceZPRO';
import CreateWhatsAppService from '../services/WhatsappService/CreateWhatsAppServiceZPRO';
import SetWhatsAppDefaultService from '../services/WhatsappService/SetWhatsAppDefaultZPRO';

import ListTenantWhatsAppsService from '../services/TenantService/ListTenantWhatsAppsServiceZPRO';
import ShowTenantWhatsAppService from '../services/TenantService/ShowTenantWhatsAppServiceZPRO';
import UpdateTenantWhatsAppService from '../services/TenantService/UpdateTenantWhatsAppServiceZPRO';
import CreateTenantWhatsAppService from '../services/TenantService/CreateTenantWhatsAppServiceZPRO';
import DeleteTenantWhatsAppService from '../services/TenantService/DeleteTenantWhatsAppServiceZPRO';

import CheckIsValidContactAllService from '../services/WbotServices/CheckIsValidContactAllZPRO';
import SendMessagesSystemWbot from '../services/WbotServices/SendMessagesSystemWbotZPRO';
import SendMessagesIndividualWbot from '../services/WbotServices/SendMessagesIndividualWbotZPRO';
import { SetChannelWebhook } from '../services/WbotServices/SetChannelWebhookZPRO';
import { FetchQRCodeMeow } from '../services/WbotMeowServices/FetchQRCodeMeowZPRO';

import Tenant from '../models/TenantZPRO';
import Whatsapp from '../models/WhatsappZPRO';
import Message from '../models/MessageZPRO';
import Contact from '../models/ContactZPRO';
import Ticket from '../models/TicketZPRO';

import { logger } from '../utils/loggerZPRO';
import moment from 'moment';

interface WhatsAppData {
  name: string;
  status?: string;
  isDefault?: boolean;
  whatsappId?: number;
  tenantId?: number;
  [key: string]: any;
}

const formatDate = (date: string): string => {
  const timestamp = moment(date, "DD/MM/YYYY HH:mm");
  
  if (!timestamp.isValid()) {
    throw new AppError("Invalid date format");
  }

  return timestamp.toISOString();
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const whatsapps = await ListWhatsAppsService(tenantId);
  return res.status(200).json(whatsapps);
};

export const indexTenant = async (req: Request, res: Response): Promise<Response> => {
  const whatsapps = await ListTenantWhatsAppsService();
  return res.status(200).json(whatsapps);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;
  
  const whatsapp = await ShowWhatsAppService({ 
    id: whatsappId,
    tenantId 
  });
  
  return res.status(200).json(whatsapp);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData: WhatsAppData = req.body;
  const { tenantId } = req.user;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const tenant = await Tenant.findByPk(tenantId);

  if (tenant?.maxConnections && whatsapps.length >= tenant.maxConnections) {
    throw new AppError("ERR_NO_PERMISSION_CONNECTIONS_LIMIT", 403);
  }

  if (whatsappData.importStartDateTime) {
    whatsappData.importStartDateTime = formatDate(whatsappData.importStartDateTime);
  }
  
  if (whatsappData.importEndDateTime) {
    whatsappData.importEndDateTime = formatDate(whatsappData.importEndDateTime);
  }

  if (whatsappData.transcribeAudioJson) {
    try {
      whatsappData.transcribeAudioJson = JSON.parse(whatsappData.transcribeAudioJson);
    } catch (error) {
      logger.warn("Error executing parse JSON for transcribeAudioJson");
    }
  }

  const { whatsapp } = await CreateWhatsAppService({
    ...whatsappData,
    whatsappId,
    tenantId
  });

  return res.status(200).json(whatsapp);
};

export const storeTenant = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData: WhatsAppData = req.body;

  const { whatsapp } = await CreateTenantWhatsAppService({
    ...whatsappData,
    whatsappId
  });

  return res.status(200).json(whatsapp);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData: WhatsAppData = req.body;
  const { tenantId } = req.user;

  if (whatsappData.transcribeAudioJson) {
    try {
      whatsappData.transcribeAudioJson = JSON.parse(whatsappData.transcribeAudioJson);
    } catch (error) {
      logger.warn("Error executing parse JSON for transcribeAudioJson");
    }
  }

  if (whatsappData.importStartDateTime) {
    whatsappData.importStartDateTime = whatsappData.importStartDateTime;
  }

  if (whatsappData.importEndDateTime) {
    whatsappData.importEndDateTime = whatsappData.importEndDateTime;
  }

  const { whatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    tenantId
  });

  if (whatsappData.type?.includes("wavoip")) {
    SetChannelWebhook(whatsapp, whatsapp.id.toString());
  }

  if (whatsappData.type === "baileys" && whatsappData.wavoipToken && whatsappData.status === "CONNECTED") {
    const io = getIO();
    const wbot = await getWbotBaileys(parseInt(whatsappId, 10));
    const contacts = whatsappData.wavoipToken.split(",");

    contacts.forEach(async (contact: string) => {
      logger.info("Validating Wavoip Token: " + contact);
      transcribeAudioJson(contact, wbot, "whatsapp", false);
      const whatsappUpdated = await Whatsapp.findByPk(whatsapp.id);
      io.emit(tenantId + ":whatsapp", {
        action: "update",
        whatsapp: whatsappUpdated
      });
      await FetchQRCodeMeow(3000);
    });
  }

  return res.status(200).json(whatsapp);
};

export const updateTenant = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData: WhatsAppData = req.body;

  const { whatsapp } = await UpdateTenantWhatsAppService({
    whatsappData,
    whatsappId
  });

  return res.status(200).json(whatsapp);
};

export const updateIsDefault = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.body;
  const { tenantId } = req.user;

  try {
    const whatsapp = await SetWhatsAppDefaultService({
      whatsappId: parseInt(whatsappId, 10),
      tenantId
    });

    const io = getIO();
    io.emit(tenantId + ":whatsapp", {
      action: "update",
      whatsapp
    });

    return res.status(200).json(whatsapp);
  } catch (err) {
    throw new AppError("Error updating isDefault: " + err.message);
  }
};

export const checkContacts = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  await CheckIsValidContactAllService(tenantId);
  return res.status(200).json({ message: "Z-PRO ::: Validating Contacts" });
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;

  await DeleteWhatsAppService(whatsappId, tenantId);
  removeWbot(+whatsappId);

  const io = getIO();
  io.emit(tenantId + ":whatsapp", {
    action: "delete",
    whatsappId: +whatsappId
  });

  return res.status(200).json({ message: "Whatsapp deleted." });
};

export const removeTenant = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;

  await DeleteTenantWhatsAppService(whatsappId);
  removeWbot(+whatsappId);

  const io = getIO();
  io.emit("whatsapp", {
    action: "delete",
    whatsappId: +whatsappId
  });

  return res.status(200).json({ message: "Whatsapp deleted." });
};

export const forceMessage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  try {
    const whatsapps = await Whatsapp.findAll({
      where: { status: "CONNECTED" }
    });

    for (const whatsapp of whatsapps) {
      if (whatsapp.type === "baileys") {
        const wbot = await getWbotBaileys(whatsapp.id);
        await SendMessagesSystemWbot(wbot, tenantId);
      } else if (whatsapp.type === "whatsapp") {
        const wbot = getWbot(whatsapp.id);
        await SendMessagesIndividualWbot(wbot, tenantId);
      }
    }
  } catch (err) {
    logger.error(`Error executing pending messages: ${JSON.stringify(err)}`);
  }

  return res.status(200).json("Tentando enviar mensagens pendentes.");
};

interface MessageInclude {
  model: typeof Contact | typeof Ticket | typeof Message | typeof Whatsapp;
  as: string;
  include?: MessageInclude[];
}

export const forceIndividualMessage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const message = req.body;

  try {
    const includes: MessageInclude[] = [
      {
        model: Contact,
        as: "contact"
      },
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: Contact,
            as: "contact"
          },
          {
            model: Whatsapp,
            as: "whatsapp"
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: [
          {
            model: Contact,
            as: "contact"
          }
        ]
      }
    ];

    const messageData = await Message.findByPk(message.id, {
      include: includes,
      order: [["createdAt", "ASC"]]
    });

    if (messageData?.ticket?.whatsapp?.type === "baileys") {
      const wbot = await getWbotBaileys(messageData.ticket.whatsappId);
      await SendMessagesIndividualWbot(wbot, tenantId, messageData);
    }

    return res.status(200).json("Tentando enviar mensagens pendentes.");
  } catch (err) {
    logger.error(`Error executing pending messages: ${JSON.stringify(err)}`);
    throw new AppError(JSON.stringify(err));
  }
};

export const showTenant = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  
  const whatsapp = await ShowTenantWhatsAppService({
    id: whatsappId
  });

  return res.status(200).json(whatsapp);
};

// Interfaces adicionais para melhor tipagem
interface WhatsAppServiceParams {
  whatsappId: string | number;
  tenantId?: number;
  whatsappData?: WhatsAppData;
}

interface WhatsAppResponse {
  whatsapp: WhatsAppData;
}

interface IOEmitData {
  action: string;
  whatsapp?: WhatsAppData;
  whatsappId?: number;
}

interface MessageData extends Message {
  ticket?: {
    whatsapp?: {
      type?: string;
    };
    whatsappId?: number;
  };
}

// Tipos para o socket.io
interface SocketIO {
  emit: (event: string, data: IOEmitData) => void;
}

// Tipos para o usuário na requisição
declare global {
  namespace Express {
    interface User {
      tenantId: number;
    }
  }
} 