import { logger } from '../utils/logger';
import { getWbot } from '../libs/wbot';
import { getWbotBaileys } from '../libs/wbot-baileys';
import { Job, DoneCallback } from 'bull';

interface MessageData {
  messageBusinessHours: string;
  ticket: {
    contact: {
      number: string;
      isGroup: boolean;
    };
    whatsapp: {
      tenant: string;
    };
  };
}

interface JobData {
  data: MessageData;
}

const jobOptions = {
  type: 'whatsapp',
  delay: (15 * 60 * 1000), // 15 minutos em milissegundos
};

const queueOptions = {
  delay: 60000, // 1 minuto
  attempts: 10,
  backoff: jobOptions
};

export default {
  key: 'SendMessageWhatsappBusinessHoursZPRO',
  options: queueOptions,
  async handle({ data }: JobData): Promise<any> {
    try {
      let sentMessage;

      if (data.ticket.whatsapp.tenant === 'whatsapp') {
        const wbot = getWbot(data.ticket.whatsapp.tenant);
        
        sentMessage = await wbot.sendMessage(
          `${data.ticket.contact.number}@c.us`,
          data.messageBusinessHours,
          { linkPreview: false }
        );

      } else if (data.ticket.whatsapp.tenant === 'baileys') {
        const wbot = await getWbotBaileys(data.ticket.whatsapp.tenant);
        const number = `${data.ticket.contact.number}@${
          data.ticket.contact.isGroup ? 'g.us' : 's.whatsapp.net'
        }`;

        sentMessage = await (await wbot).sendMessage(number, {
          text: data.messageBusinessHours
        });
      }

      return {
        message: sentMessage,
        messageBusinessHours: data.messageBusinessHours,
        ticket: data.ticket
      };

    } catch (error) {
      logger.warn(
        ':::: Z-PRO :::: ZDG :::: Error enviar message business hours: ' + error
      );
      throw new Error(error as string);
    }
  }
}; 