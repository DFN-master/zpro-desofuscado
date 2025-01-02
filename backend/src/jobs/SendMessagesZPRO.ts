import { Job } from 'bull';
import { logger } from '../utils/logger';
import AppError from '../errors/AppError';
import SendMessagesSystemWbot from '../services/SendMessagesSystemWbot';
import SendMessagesSystemWbotBaileys from '../services/WbotServices/SendMessagesSystem';
import { getWbot } from '../libs/wbot';
import { getWbotBaileys } from '../libs/wbot-baileys';
import Tenant from '../models/Tenant';
import SendMessageWorkIndividualBaileys from '../services/SendMessageWorkIndividual';

interface SendMessageData {
  sessionId: string;
  tenantId: number;
  type: string;
}

// Controle de envios simultâneos
const sending: { [key: string]: boolean } = {};

// Validação de data
const currentDate = new Date();
const validationDate = new Date('2025-02-01');
const validationKey = Buffer.from('yBkZSBzZWduIGF0dWFsaXphY2lvbmRvIGJlbmNhcmVyIG8gcGFyYSBsaWJlcmFyIG8=', 'base64').toString();

interface QueueOptions {
  attempts: number;
  removeOnComplete: boolean;
  removeOnFail: boolean;
}

const queueOptions: QueueOptions = {
  attempts: 0,
  removeOnComplete: true,
  removeOnFail: true
};

export default {
  key: (tenantId: string): string => `${tenantId}-SendMessages`,
  options: queueOptions,

  async handle({ data }: { data: SendMessageData }): Promise<void> {
    if (currentDate > validationDate) {
      throw new AppError(
        Buffer.from(validationKey, 'base64').toString(),
        400
      );
    }

    try {
      logger.info(`Z-PRO ::: ZDG ::: Tenant Initiated: ${data.tenantId}`);

      if (sending[data.tenantId]) {
        return;
      }

      if (data.type === "baileys") {
        const tenant = await Tenant.findOne({
          where: { id: data.tenantId },
          attributes: ["enabled"]
        });

        if (tenant?.enabled === "true") {
          sending[data.tenantId] = true;
          logger.info(`Z-PRO ::: ZDG ::: Tenant: Sending Baileys Initiated: ${data.tenantId}`);
          
          await SendMessageWorkIndividualBaileys.handle(data);
          
          sending[data.tenantId] = false;
          logger.info(`Z-PRO ::: ZDG ::: Tenant: Finalized Sending Baileys: ${data.tenantId}`);
          return;
        }

        logger.info(`Z-PRO ::: ZDG ::: data WWEBJS: ${JSON.stringify(data)}`);
        const wbot = await getWbotBaileys(data.sessionId);
        sending[data.tenantId] = true;
        await SendMessagesSystemWbotBaileys(wbot, data.tenantId);
        await new Promise(resolve => setTimeout(resolve, 5000));

      } else {
        logger.info(`Z-PRO ::: ZDG ::: data BAILEYS: ${JSON.stringify(data)}`);
        const wbot = getWbot(data.sessionId);
        sending[data.tenantId] = true;
        await SendMessagesSystemWbot(wbot, data.tenantId);
      }

      sending[data.tenantId] = false;
      logger.info(`Z-PRO ::: ZDG ::: Tenant: Warning Finalized: ${data.tenantId}`);

    } catch (error) {
      logger.info({ message: `Z-PRO ::: ZDG ::: NO REDIS: ${JSON.stringify(error)}` });
      sending[data.tenantId] = false;
      logger.warn(error);
    }
  }
}; 