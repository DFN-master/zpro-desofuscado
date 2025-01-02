import { Request, Response } from 'express';
import { getWbot, removeWbot } from '../libs/wbot';
import { ShowWhatsAppService } from '../services/WhatsappService/ShowWhatsAppServiceZPRO';
import { StartWhatsAppSession } from '../services/WbotServices/StartWhatsAppSessionZPRO';
import { UpdateWhatsAppService } from '../services/WhatsappService/UpdateWhatsAppServiceZPRO';
import { setValue } from '../libs/redisClientZPRO';
import { logger } from '../utils/logger';
import { getTbot, removeTbot } from '../libs/tbotZPRO';
import { getInstaBot, removeInstaBot } from '../libs/InstaBotZPRO';
import AppError from '../errors/AppErrorZPRO';
import { getIO } from '../libs/socketZPRO';
import { getWbotBaileys } from '../libs/wbot-baileysZPRO';
import { DeleteBaileysService } from '../services/BaileysService/DeleteBaileysServiceZPRO';
import db from '../database/indexZPRO';
import { QueryTypes } from 'sequelize';
import axios from 'axios';
import { sleep } from '../services/WbotMeow/FetchQRCodeMeowZPRO';
import { showWuzapiHost } from '../services/ShowWuzapiHostZPRO';

interface WhatsAppData {
  whatsappId: number;
  tenantId: number;
  isInternal?: boolean;
}

interface WhatsAppUpdateData {
  whatsappId: number;
  tenantId: number;
  whatsappData: {
    session: string;
  };
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;

  const whatsappData: WhatsAppData = {
    id: whatsappId,
    tenantId,
    isInternal: true
  };

  const whatsapp = await ShowWhatsAppService(whatsappData);
  StartWhatsAppSession(whatsapp);

  return res.status(200).json({ message: "Starting session." });
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { isQrcode } = req.query;
  const { tenantId } = req.user;

  if (isQrcode) {
    await removeWbot(whatsappId);
  }

  const whatsappData: WhatsAppUpdateData = {
    whatsappId,
    whatsappData: { session: '' },
    tenantId
  };

  const { whatsapp } = await UpdateWhatsAppService(whatsappData);
  StartWhatsAppSession(whatsapp);

  return res.status(200).json({ message: "Starting session." });
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;

  const whatsappData: WhatsAppData = {
    id: whatsappId,
    tenantId
  };

  const whatsapp = await ShowWhatsAppService(whatsappData);
  const io = getIO();

  try {
    if (whatsapp.type === "whatsapp") {
      const wbot = getWbot(whatsapp.id);
      await setValue(`${whatsapp.id}-retryQrCode`, 0);
      
      await wbot.logout()
        .catch(err => logger.error(`Error on logout: ${err}`));
      
      removeWbot(whatsapp.id);
    }

    if (whatsapp.type === "baileys") {
      await DeleteBaileysService(whatsapp.id);
      await setValue(`${whatsapp.id}-retryQrCode`, 0);

      const wbotBaileys = await getWbotBaileys(whatsapp.id);
      wbotBaileys.logout();
      wbotBaileys.ws.close();
    }

    if (whatsapp.type === "meow") {
      const wuzapiHost = await showWuzapiHost(tenantId);

      try {
        const url = `${wuzapiHost}/session/close`;
        const options = {
          headers: ["application/json"],
          json: true
        };
        const data = {
          headers: {
            "Content-Type": "application/json",
            token: whatsapp.token
          }
        };

        await axios.post(url, options, data);
        await sleep(2000);

      } catch (error) {
        logger.error(`Error closing Meow session: ${error}`);
      }

      try {
        const query = `
          UPDATE users
          SET connected = 0
          WHERE token = ?
        `;
        await db.query(query, {
          type: QueryTypes.UPDATE,
          replacements: [whatsapp.token]
        });
      } catch (error) {
        logger.error(`Error updating user connection: ${error}`);
      }
    }

    if (whatsapp.type === "telegram") {
      const tbot = getTbot(whatsapp.id);
      await tbot.telegram.logOut()
        .catch(err => logger.error(`Error on logout: ${err}`));
      removeTbot(whatsapp.id);
    }

    if (whatsapp.type === "instagram") {
      const instaBot = getInstaBot(whatsapp.id);
      await instaBot.destroy();
      removeInstaBot(whatsapp);
    }

    await whatsapp.update({
      status: "DISCONNECTED",
      session: "",
      qrcode: null,
      retries: 0
    });

  } catch (err) {
    logger.error(err);
    await whatsapp.update({
      status: "DISCONNECTED",
      session: "",
      qrcode: null,
      retries: 0
    });

    io.emit(`${whatsapp.tenantId}:whatsappSession`, {
      action: "update",
      session: whatsapp
    });

    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  return res.status(200).json({ message: "Session disconnected." });
};

export default {
  store,
  remove,
  update
}; 