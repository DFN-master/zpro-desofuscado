import { Message } from "../models/Message";
import { Whatsapp } from "../models/Whatsapp";
import HandleMessageZPRO from "../services/helpers/HandleMessageZPRO";
import { logger } from "../utils/loggerZPRO";
import { getWbotBaileys } from "../services/WbotBaileysService";

interface QueueData {
  msg: Message;
  wbot: Whatsapp;
  tenantId: number;
}

interface JobOptions {
  delay: number;
  attempts: number;
  removeOnComplete: boolean;
  removeOnFail: boolean;
  backoff: {
    type: string;
    delay: number;
  };
}

const sending: { [key: string]: boolean } = {};

const jobOptions: JobOptions = {
  delay: 6000,
  attempts: 50,
  removeOnComplete: true,
  removeOnFail: false,
  backoff: {
    type: "fixed",
    delay: 60000 * 3
  }
};

export default {
  key: (tenantId: number) => `${tenantId}-handleMessageZPRO`,
  options: jobOptions,
  
  async handle(job: { data: QueueData }): Promise<void> {
    const data = job.data;

    try {
      if (sending[data.tenantId]) return;
      sending[data.tenantId] = true;

      const { msg, wbot, tenantId } = data;

      if ((!msg || !wbot) || !tenantId) {
        logger.error(
          "Error handling message queue", 
          "wbot not found, message, wbot, tenantId", 
          msg, 
          wbot, 
          tenantId
        );
        sending[data.tenantId] = false;
        return;
      }

      const wbotBaileys = await getWbotBaileys(wbot);

      if (!wbotBaileys) {
        logger.error(
          "Error handling message queue",
          "wbot not found",
          wbot
        );
        sending[data.tenantId] = false;
        return;
      }

      try {
        HandleMessageZPRO(msg, wbotBaileys, tenantId);
      } catch (error) {
        console.log("Error", error);
        logger.error(`Error handling message queue ${JSON.stringify(error)}`);
      } finally {
        sending[data.tenantId] = false;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      sending[data.tenantId] = false;
      logger.error("Error handling message queue", error);
    }
  }
}; 